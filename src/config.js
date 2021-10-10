const env = require('./helpers/Environment')

module.exports = {
    signatureHeaderEnabled: !env.isLocal(),
    // signatureHeaderEnabled: true,
    signatureHeaderDebug: env.isLocal(),
    mongodbUrl: String(process.env.MONGODB_URL),
    mongodbName: String(process.env.DB_COLLECTION),
}
