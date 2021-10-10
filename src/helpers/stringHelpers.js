/* eslint-disable camelcase */

const APIError = require('./APIError')

// const crypto = require( "crypto" );

/**
 * Takes a string in that describes a JSON object.  If not NULL this will convert it into the JSON object to return.  If null, null is returned.
 * If invalid JSON is found it returns the string exception
 */
exports.convertStringToJsonIfNotNull = function (object_in) {
    let object_out = null
    if (object_in != null && object_in !== undefined && object_in !== '') {
        if (typeof object_in === 'string') {
            try {
                object_out = JSON.parse(object_in)
            } catch (e) {
                throw new APIError({
                    errorCode: 'INVALID_PARAM',
                    objectDetails: {
                        stringIn: object_in,
                    },
                    templateUserMessage:
                        'The JSON string supplied could not be converted into a JSON object',
                    internalDetails: { e },
                })
            }
        } else if (typeof object_in === 'object') {
            // Already an object
            object_out = object_in
        } else {
            throw new Error(`Unexpected type ${typeof object_in}`)
        }
    }
    return object_out
}
