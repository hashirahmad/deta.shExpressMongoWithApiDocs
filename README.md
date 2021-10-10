# README

Basically, this is a boilerplate of:

- MongoDB
- Express.js `app`
- ESLint and Prettier integrated
- API Docs generation
- Basic sanitization of `parameters` for APIs

for `deta.sh`. *Although, pretty sure, it will also work for other platforms too*.

## Demo

Something like this: [helloworld](https://helloworld.hashir.pro)

## Deta.sh

Get to know what [Deta.sh](https://www.deta.sh/) **really** is.

In short, a better Heroku.

## API Docs building

This boilerplate uses [`apidoc`](https://www.npmjs.com/package/apidoc) to generate necessary docs for your micro service API. So get to know the basics.

In short, `/src/templates/apidocs_template` should not be **touched**. Same advice goes for `/src/static_files`.

### How to generate?

```bash
npm run dev
```

would generate the `docs` and you can then do local development.

## MongoDB

In the `.env` file:

- set the `MONGODB_URL` your connection string.
- set the `DB_COLLECTION` your collection name i.e. `helloworld` etc.

### `/src/db/db.js`

```js
    try {
        const db = await mongodb.connect(mongodbUrl, {
            useUnifiedTopology: true,
            useNewUrlParser: true,
        })

        if (isTest === false) {
            log.notify(true, null, 'Successfully connected to MongoDB')
        }
        this.itSelf = db.db(mongodbName)
        this.myCollection = this.createCollection(whateverNameOfYourCollection)
    } catch (err) {
        log.notify(
            . . .
    }
```

Here **replace** the following line

```js
this.myCollection = this.createCollection(whateverNameOfYourCollection)
```

with your own collection name.

## Please note

- `index.js` ~ this should not be touched or you risk breaking **deta.sh** deployment.
- `/src/app.js` ~ this is your main `app` and do whatever tweaks and changes needed.
