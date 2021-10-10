const handlebarsHelpers = require('./handlebarsHelpers')

module.exports = class APIError extends Error {
    constructor({
        errorCode,
        objectDetails,
        templateUserMessage,
        internalDetails,
    }) {
        const handlebars = handlebarsHelpers.setup()
        super(templateUserMessage)
        this.isBusinessError = true
        this.errorCode = errorCode
        this.objectDetails = objectDetails
        // Compile in any parameters
        if (!objectDetails) {
            // eslint-disable-next-line no-param-reassign
            objectDetails = {}
        }
        if (templateUserMessage) {
            const handlebarsMessage = handlebars.compile(templateUserMessage)
            this.templateUserMessage = handlebarsMessage(objectDetails)
        }
        this.internal_details = internalDetails
    }
}
