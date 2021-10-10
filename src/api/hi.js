/*
 * @Author: Hashir Ahmad
 * @Date: 2021-05-14 07:10:09
 * @Last Modified by: Hashir Ahmad
 * @Last Modified time: 2021-10-10 07:48:02
 */
/**
 * @api {post} /api/hi Hi.
 * @apiVersion 1.0.0
 * @apiName check
 * @apiGroup Hello World
 * @apiPermission none
 *
 * @apiDescription Just a test API for hello world.
 *     
 * @apiParam {string}		alphaNumericString		Will only allow alpha numeric string
 * @apiParam {boolean}		asBoolean		        Will only allow boolean values
 * @apiParam {string}		asEmail		            Will only allow a valid email string
 * @apiParam {float}		asFloat		            Will only allow floating number
 * @apiParam {string}		asJSON          		Will only allow a stringified JSON
 * @apiParam {string}		asMobile		        Will only allow a valid mobile number string
 * @apiParam {string}		asNumber        		Will only allow a whole number
 * @apiParam {string}		asPassword		        Will only allow a password string
 * @apiParam {string}		asURL           		Will only allow valid URL string
 *
 * @apiSuccess {string}   status        ok

@apiSuccessExample {json} Success
{
}
@apiErrorExample {json} NO_USER
{
    error: 'NO_USER',
    details: { email },
    userMessage: `No user with '${email}'`,
}
*/
const app = require('../app')
const restify = require('../helpers/restifyHelpers')

module.exports = (url) => {
    app.post(url, async (req, res, next) => {
        /** Get all params */
        const alphaNumericString = restify.getAsStringAlphanumeric(
            req,
            'alphaNumericString',
            ''
        )
        const asBoolean = restify.getAsBoolean(req, 'asBoolean', '')
        const asEmail = restify.getAsEmail(req, 'asEmail', '')
        const asFloat = restify.getAsFloat(req, 'asFloat', 9.9)
        const asJSON = restify.getAsJson(req, 'asJSON', '')
        const asMobile = restify.getAsMobile(req, 'asMobile', '')
        const asNumber = restify.getAsNumber(req, 'asNumber', '')
        const asPassword = restify.getAsPassword(req, 'asPassword', '')
        const asURL = restify.getAsURL(req, 'asURL', '')
        return restify.ok(req, res, next, {
            alphaNumericString,
            asBoolean,
            asEmail,
            asFloat,
            asJSON,
            asMobile,
            asNumber,
            asPassword,
            asURL,
            superSecretEnvVariable: String(process.env.SUPER_SECRET_WORD),
        })
    })
}
