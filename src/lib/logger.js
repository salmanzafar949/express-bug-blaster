const fs = require('fs');
const chalk = require('chalk');

function logError(errorData, logFilePath) {
    let logs = [];

    if (fs.existsSync(logFilePath)) {
        logs = JSON.parse(fs.readFileSync(logFilePath, 'utf8'));
    }

    logs.push(errorData);
    fs.writeFileSync(logFilePath, JSON.stringify(logs, null, 2), 'utf8');
    console.log(chalk.gray(`[BugBlaster] Logged error to ${logFilePath}`));
}

module.exports = { logError };
