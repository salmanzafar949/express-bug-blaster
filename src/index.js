const stackTrace = require('stack-trace');
const chalk = require('chalk');
const { analyzeError } = require('./lib/errorAnalyzer');
const { logError } = require('./lib/logger');
const notifyChannels = require("./lib/notifyChannels");

/**
 * Creates an Express error-handling middleware with enhanced debugging features
 * @param {Object} [options] - Configuration options for BugBlaster
 * @param {boolean} [options.logToFile=true] - Whether to log errors to a file
 * @param {string} [options.logFilePath='./bugblaster-logs.json'] - Path to the log file
 * @param {string} [options.defaultResponse='Something went wrong...'] - Default response sent to clients
 * @param {(err: Error, req: import('express').Request, res: import('express').Response) => void} [options.onError] - Custom error handler
 * @param {channels[]} [options.channels=[]] - Array of notification channels (default: [])
 * @returns {(err: Error, req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) => void} Express error middleware
 */
function bugBlaster(options = {}) {
    let {
        logToFile,
        logFilePath,
        defaultResponse,
        onError,
        channels
    } = options;

    logToFile = logToFile ?? true
    defaultResponse = defaultResponse ?? 'Something went wrong. We’re looking into it!'
    logFilePath = logFilePath ?? process.cwd() + '/bug-blaster-logs.json' // Default to user’s project root
    channels = Array.isArray(channels) ? channels : []

    // Error-handling middleware
    return function (err, req, res, next) {
        if (!err) return next(); // Proceed if no error

        // Log that BugBlaster received the error (for debugging)
        console.log(chalk.blue('[BugBlaster] Error received:', err.message));

        // Process the error asynchronously
        analyzeError(err, stackTrace.parse(err), req)
            .then((explanation) => {
                const bugReport = `
${chalk.red('🐞 [BugBlaster] Error Detected:')} ${err.message}
${chalk.yellow('Where:')} ${explanation.location}
${chalk.cyan('Why:')} ${explanation.reason}
${chalk.green('Tip:')} ${explanation.tip}
${chalk.blue('Location:')} ${explanation.location}
${chalk.magenta('Trace:')} ${explanation.trace}
        `;
                console.log(bugReport);
                const logEntry = {
                    message: err.message,
                    location: explanation.location,
                    tip: explanation.tip,
                    path: req.path,
                    trace: explanation.trace,
                    reason: explanation.reason,
                    timestamp: new Date().toISOString(),
                }

                if (channels.length)
                    notifyChannels(err, logEntry, channels);
                if (logToFile)
                    logError(logEntry, logFilePath);

                if (!res.headersSent) {
                    if (typeof onError === 'function') {
                        onError(err, req, res);
                    } else {
                        res.status(500).json({
                            error: defaultResponse,
                            details: process.env.NODE_ENV === 'development' ? err.message : undefined,
                        });
                    }
                }
            })
            .catch((analyzeErr) => {
                console.error(chalk.red('[BugBlaster] Failed to analyze error:'), analyzeErr.message);
                if (!res.headersSent) {
                    res.status(500).json({ error: defaultResponse });
                }
            });
    };
}

// Global uncaught exception handler
process.on('uncaughtException', async (err) => {
    const trace = stackTrace.parse(err);
    const explanation = await analyzeError(err, trace);
    console.error(chalk.red('[BugBlaster] Uncaught Exception:'), err.message);
    console.error(chalk.yellow('Where:'), explanation.location);
    console.error(chalk.cyan('Why:'), explanation.reason);
    console.error(chalk.green('Tip:'), explanation.tip);
});

module.exports = bugBlaster;
