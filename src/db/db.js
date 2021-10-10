const mongodb = require('mongodb').MongoClient
const { ObjectId } = require('mongodb')
const { mongodbUrl, mongodbName } = require('../config')
const log = require('../helpers/log')

/**
 * The idea is that to export an instance
 * of this class Mongo across the entire
 * app - this way we have one connection
 * and that connection is kept alive.
 */
class Mongo {
    constructor() {
        this.itSelf = null
        this.objectId = ObjectId
    }

    /**
     * This should be invoked at an entry point.
     * Preferably in app.js
     */
    async connect(isTest = false) {
        if (this.itSelf === null) {
            try {
                const db = await mongodb.connect(mongodbUrl, {
                    useUnifiedTopology: true,
                    useNewUrlParser: true,
                })

                if (isTest === false) {
                    log.notify(true, null, 'Successfully connected to MongoDB')
                }
                this.itSelf = db.db(mongodbName)
            } catch (err) {
                log.notify(
                    true,
                    {
                        err,
                        info: [
                            'This is related to mongodb connect() function',
                        ].join(' '),
                    },
                    err.message,
                    err.name,
                    err.code
                )
                return { err }
            }
        }
        return null
    }

    createCollection(collectionName) {
        try {
            return this.itSelf.collection(collectionName)
        } catch (err) {
            console.log(
                true,
                {
                    err,
                    info: [
                        'This is regarding getting the collection of',
                        collectionName,
                        'from MongoDB. Connection error most likely.',
                    ].join(' '),
                },
                err.message,
                err.name,
                err.code
            )
        }
        return null
    }
}

module.exports = new Mongo()
