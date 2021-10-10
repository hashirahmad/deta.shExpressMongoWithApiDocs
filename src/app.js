/* eslint-disable camelcase */
/*
 * @Author: Hashir Ahmad
 * @Date: 2021-05-12 17:25:32
 * @Last Modified by: Hashir Ahmad
 * @Last Modified time: 2021-10-10 07:48:08
 */
// eslint-disable-next-line import/no-extraneous-dependencies, node/no-unpublished-require
const express = require('express')

const app = express()
const port = process.env.PORT || 5000
const path = require('path')
const helmet = require('helmet')

const log = require('./helpers/log')
const restify = require('./helpers/restifyHelpers')
const env = require('./helpers/Environment')
const mongo = require('./db/db')

class App {
    constructor() {
        this.app = app
        this.port = port
        this.mongo = null
        this.init()
    }

    async init() {
        app.use(express.json())
        app.use(express.urlencoded({ extended: true }))

        /** Host documentation */
        app.use(express.static(path.join(__dirname, 'static_files')))

        /**
         * Helmet can help protect your app from some well-known web vulnerabilities by setting HTTP headers appropriately.
         *
         * Helmet is actually just a collection of smaller middleware functions that set security-related HTTP response headers:
         *
         * csp sets the Content-Security-Policy header to help prevent cross-site scripting attacks and other cross-site injections.
         * hidePoweredBy removes the X-Powered-By header.
         * hsts sets Strict-Transport-Security header that enforces secure (HTTP over SSL/TLS) connections to the server.
         * ieNoOpen sets X-Download-Options for IE8+.
         * noCache sets Cache-Control and Pragma headers to disable client-side caching.
         * noSniff sets X-Content-Type-Options to prevent browsers from MIME-sniffing a response away from the declared content-type.
         * frameguard sets the X-Frame-Options header to provide clickjacking protection.
         * xssFilter sets X-XSS-Protection to disable the buggy Cross-site scripting (XSS) filter in web browsers.
         */
        this.app.use(helmet())

        this.forceHTTPS()
        this.timestamp()
        this.requiredAPIs()
        log.notify(true, { env: env.getEnvName() }, 'Hello World is listening')

        await mongo.connect()

        // this.startListening()
    }

    startListening() {
        this.app.listen(this.port, () => {
            log.notify(
                false,
                null,
                `Hello World is listening at port ${this.port}`
            )
        })
    }

    /**
     * We DO NOT want http requests so we will
     * force the users to use https requests
     * instead.
     */
    forceHTTPS() {
        this.app.use((req, res, next) => {
            if (env.isProduction()) {
                if (req.headers['x-forwarded-proto'] !== 'https') {
                    /** the statement for performing our redirection */
                    return res.redirect(`https://${req.headers.host}${req.url}`)
                }
                return next()
            }
            return next()
        })
    }

    /**
     * This is used to calculate the duration of the request.
     * Useful for some benchmarks or when particular API takes
     * longer than normal.
     */
    timestamp() {
        this.app.use((req, res, next) => {
            // eslint-disable-next-line no-underscore-dangle
            req._date = new Date()
            next()
        })
    }

    /**
     * Required for K8s.
     */
    requiredAPIs() {
        this.app.get('/', (req, res) => res.redirect('docs'))
        this.app.get('/healthz', (req, res) => res.status(200).send('ok'))
        this.app.get('/robots.txt', (req, res) => {
            res.status(200).send('User-agent: *\nDisallow: /')
        })
    }

    // eslint-disable-next-line class-methods-use-this
    withSafetyNet(fn) {
        return (req, res, next, ...args) => {
            const handleError = (e) => {
                if (!e.errorCode) {
                    /**
                     * If an exception is not a API Exception
                     * then it should be reported to keybase.
                     */
                    log.notify(
                        !env.isLocal(),
                        {
                            err: e,
                            path: req.path,
                            params: req.params,
                            query: req.query,
                            body: req.body,
                            method: req.method,
                        },
                        'A non APIError happened.',
                        'Look right into it.'
                    )
                }
                const errorCode = e.errorCode || 'EMBARRASSING_ERR'
                const { objectDetails } = e
                const templateUserMessage =
                    e.templateUserMessage ||
                    'Uh oh . . . an unknown error occurred'
                const { internal_details } = e
                return restify.fail(
                    req,
                    res,
                    next,
                    errorCode,
                    objectDetails,
                    templateUserMessage,
                    internal_details,
                    e
                )
            }
            try {
                const r = fn(req, res, next, ...args)
                // Check a promise was returned.
                if (r && r.catch) {
                    r.catch((e) => handleError(e))
                }
            } catch (e) {
                handleError(e)
            }
        }
    }

    get(url, ...methods) {
        const wrappedMethods = methods.map((method) =>
            this.withSafetyNet(method)
        )
        this.app.get(url, ...wrappedMethods)
    }

    post(url, ...methods) {
        const wrappedMethods = methods.map((method) =>
            this.withSafetyNet(method)
        )
        this.app.post(url, ...wrappedMethods)
    }
}

module.exports = new App()

/** Includes all APIs */
require('./allAPIs')
