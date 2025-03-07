const axios = require('axios')
const chalk = require('chalk');

// Function to notify channels via webhooks
function notifyChannels(err, logEntry, channels) {
    const message = {
        slack: {
            text: `🐞 *Error Detected*: ${err.message}\n*Where*: ${logEntry.location}\n*When*: ${logEntry.timestamp}\n*Path*: ${logEntry.path}`,
        },
        teams: {
            "@type": "MessageCard",
            "@context": "http://schema.org/extensions",
            "summary": "BugBlaster detected error in app",
            "title": "🐞 Error Detected",
            "sections": [{
                "facts": [
                    { "name": "Message", "value": err.message },
                    { "name": "Reason", "value": err.reason },
                    { "name": "Location", "value": logEntry.location },
                    { "name": "Trace", "value": logEntry.trace },
                    { "name": "Path", "value": logEntry.path },
                    { "name": "Timestamp", "value": logEntry.timestamp },
                ],
            }],
        },
        discord: {
            content: `🐞 **Error Detected**: ${err.message}\n**Where**: ${logEntry.location}\n**When**: ${logEntry.timestamp}\n**Path**: ${logEntry.path}`,
        },
    };
    for (const [platform, url] of Object.entries(channels)) {
        if (message[platform] && url) {
            axios.post(url, message[platform]).catch((notifyErr) => {
                console.error(chalk.yellow(`[BugBlaster] Failed to notify ${platform}:`), notifyErr.message);
            })
        }
    }
}
module.exports = notifyChannels;
