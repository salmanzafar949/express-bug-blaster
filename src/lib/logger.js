const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

function logError(errorData) {
    const logFile = path.join(__dirname, '../bugblaster-logs.json');
    let logs = [];

    if (fs.existsSync(logFile)) {
        logs = JSON.parse(fs.readFileSync(logFile, 'utf8'));
    }

    logs.push(errorData);
    fs.writeFileSync(logFile, JSON.stringify(logs, null, 2), 'utf8');
    console.log(chalk.gray(`[BugBlaster] Logged error to ${logFile}`));
}

module.exports = { logError };
