const handlebars = require('handlebars')
/**
 * This is a centralized place to           register all helper
 * functions regarding handlebar helpers.
 */
exports.setup = function () {
    /**
     * All functions to go here
     */

    /**
     * Converts epoch date to useful human readable date
     * epoch 1590751549 to 29/05/2020, 12:25:49
     */
    handlebars.registerHelper('epochToFullDate', function (epoch) {
        return new Date(epoch * 1000).toLocaleString()
    })

    /**
     * After registering all we return
     * the handlebars object.
     */
    return handlebars
}
