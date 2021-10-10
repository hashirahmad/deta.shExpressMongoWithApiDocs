const axios = require('axios')
const env = require('./Environment')

// Original code from api project
function sendAlertToKeybase({ err: data, logs }) {
    const webhookbot =
        'https://bots.keybase.io/webhookbot/v3M_GLKnIXsIICb_3RXlqTmunZ0'

    const stack = (data && data.err && data.err.stack) || 'No stack'
    // eslint-disable-next-line no-param-reassign
    if (data) delete data.err

    const array = [
        `**${env.getEnvName()}**`,
        ...logs,
        `**ERROR STACK**`,
        '```',
        stack,
        JSON.stringify(
            {
                data,
            },
            null,
            4
        ),
        '```',
    ].join('\n')

    axios.post(webhookbot, array).catch((error) => {
        console.error(error)
    })
}

exports.notify = function (keybase, data, ...logs) {
    const date = new Date().toLocaleString()

    console.log(`              ${date}            \n`)

    for (let i = 0; i < logs.length; i += 1) {
        console.log(`#${i + 1}`, logs[i])
    }

    if (data) console.error('\nError is:\n', JSON.stringify(data, null, 4))

    console.log('\n______________________________\n')

    if (keybase && !env.isLocal()) {
        sendAlertToKeybase({ err: data, logs })
    }
}
