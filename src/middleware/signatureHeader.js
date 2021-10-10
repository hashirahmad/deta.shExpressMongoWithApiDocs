const crypto = require('crypto')
const NodeCache = require('node-cache')
const env = require('../helpers/Environment')
const restify = require('../helpers/restifyHelpers')
const config = require('../config')
const APIError = require('../helpers/APIError')

const cache = new NodeCache({
    stdTTL: 30 * 60, // Default time cache elements survive for (30 mins)
    checkperiod: 120,
})

function informHelpfully(header, message) {
    const headers = {
        'x-auth-timestam': header['x-auth-timestamp'],
        'x-auth-version': header['x-auth-version'],
        'x-auth-nonce': header['x-auth-nonce'],
        'x-auth-signature': header['x-auth-signature'],
    }
    throw new APIError({
        errorCode: 'SIGNATURE_HEADER_INVALID',
        objectDetails: {
            headers,
        },
        templateUserMessage: message,
    })
}

/**
 * Middleware to verify a request signature header
 */
exports.verifySignatureHeaderGeneric = function (
    req,
    res,
    next,
    apiKey,
    apiSecret,
    systemname
) {
    // if it's staging, disable the signature verification
    if (!config.signatureHeaderEnabled) {
        next()
        return
    }
    // check if headers exist

    if (config.signatureHeaderDebug) {
        console.log(req.headers)
        console.log(req.body)
        console.log(req.path)
    }

    if (
        /**
         * `x-auth` is not set in generation of
         * security headers for some strange reason.
         * Commented out for this reason.
         */
        // req.headers['x-auth'] == null ||
        req.headers['x-auth-version'] == null ||
        req.headers['x-auth-nonce'] == null ||
        req.headers['x-auth-signature'] == null ||
        req.headers['x-auth-timestamp'] == null
    ) {
        informHelpfully(req.headers, `${systemname} signature headers missing`)
    }

    // check if the auth version is correct one. You can bump it here
    if (Number(req.headers['x-auth-version']) < 2) {
        console.error('incorrect signature API Auth Version')
        informHelpfully(req.headers, 'incorrect signature API Auth Version')
    }

    const currentTimestamp = new Date().getTime()
    const requestTimestamp = req.headers['x-auth-timestamp']

    const maxAgeOfMsgInSeconds = 5
    if (currentTimestamp - requestTimestamp > maxAgeOfMsgInSeconds * 1000) {
        console.error('signature x-auth-timestamp request is too old')
        informHelpfully(req.headers, 'request is too old')
    }
    if (requestTimestamp - maxAgeOfMsgInSeconds * 1000 > currentTimestamp) {
        console.error('time on the other server is not synced')
        informHelpfully(
            req.headers,
            'future time given in request so not allowed'
        )
    }

    // store in memcache the nonces, and throw if an nonce was found in memcache
    const nonce = req.headers['x-auth-nonce']
    let nounceReused = false
    cache.get(nonce, (err, data) => {
        if (data == null && !err) {
            console.error(`nonce was not found in the memory: ${err}`)
            const fromIp = restify.getIP(req)
            cache.set(nonce, fromIp)
            return
        }
        // nonce was found. return error
        nounceReused = true
        informHelpfully(req.headers, 'nonce reuse is not permitted')
    })

    if (!nounceReused) {
        // compute signature...
        const msgInternal = requestTimestamp + nonce + JSON.stringify(req.body)
        const msgAll = apiKey + msgInternal + apiSecret
        const signature = crypto
            .createHash('sha256')
            .update(msgAll)
            .digest('hex')
        const passedSignature = req.headers['x-auth-signature']

        if (config.signatureHeaderDebug) {
            console.log('computed signature on the server', signature)
            console.log('passed signature ', passedSignature)
        }

        if (passedSignature !== signature) {
            console.error('signatures are different')
            informHelpfully(req.headers, 'wrong signature detected')
        }

        // all was good, continue
        next()
    }
}

exports.generateAnySignatureHeader = function (dataIn, apiKey, apiSecret) {
    const currentTimestamp = new Date().getTime()
    const nonce = Math.floor(Math.random() * 1000000000)
    let dataString = dataIn
    if (typeof dataIn === 'object') {
        dataString = JSON.stringify(dataIn)
    }
    const stringToHash =
        apiKey + currentTimestamp + nonce + dataString + apiSecret
    const signature = crypto
        .createHash('sha256')
        .update(stringToHash)
        .digest('hex')
    if (config.signatureHeaderDebug) {
        if (env.isLocal()) {
            console.log(`api_key       :${apiKey}`)
            console.log(`api_secret    :${apiSecret}`)
            console.log(`data          :${dataString}`)
            console.log(`string_to_hash:${stringToHash}`)
            console.log(`signature     :${signature}`)
        }
    }
    const header = {}
    header['x-auth-timestamp'] = currentTimestamp
    header['x-auth-version'] = 2
    header['x-auth-nonce'] = nonce
    header['x-auth-signature'] = signature

    return header
}
