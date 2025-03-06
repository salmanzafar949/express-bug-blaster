const stackTrace = require('stack-trace');
const chalk = require('chalk');
const { analyzeError } = require('./lib/errorAnalyzer');
const { logError } = require('./lib/logger');

function bugBlaster(options = {}) {
    const {
        logToFile = true,
        defaultResponse = 'Something went wrong. We’re looking into it!',
        onError,
    } = options;

    return function (req, res, next) {
        const handleError = async (err) => {
            const trace = stackTrace.parse(err);
            const explanation = await analyzeError(err, trace, req);

            const bugReport = `
${chalk.red('🐞 [BugBlaster] Error Detected:')} ${err.message}
${chalk.yellow('Where:')} ${explanation.location}
${chalk.cyan('Why:')} ${explanation.reason}
${chalk.green('Tip:')} ${explanation.tip}
      `;

            console.log(bugReport);

            if (logToFile) {
                logError({
                    message: err.message,
                    location: explanation.location,
                    timestamp: new Date().toISOString(),
                    path: req.path,
                });
            }

            if (!res.headersSent) {
                if (onError) {
                    onError(err, req, res);
                } else {
                    res.status(500).json({
                        error: defaultResponse,
                        details: process.env.NODE_ENV === 'development' ? err.message : undefined,
                    });
                }
            }
        };

        try {
            Promise.resolve(next()).catch((asyncErr) => {
                handleError(asyncErr);
            });
        } catch (err) {
            handleError(err);
        }

        const handleRejection = (reason) => {
            handleError(new Error(`Unhandled Rejection: ${reason}`));
        };
        process.on('unhandledRejection', handleRejection);
        res.on('finish', () => {
            process.off('unhandledRejection', handleRejection);
        });
    };
}

process.on('uncaughtException', async (err) => {
    const trace = stackTrace.parse(err);
    const explanation = await analyzeError(err, trace);
    console.error(chalk.red('[BugBlaster] Uncaught Exception:'), err.message);
    console.error(chalk.yellow('Where:'), explanation.location);
    console.error(chalk.cyan('Why:'), explanation.reason);
    console.error(chalk.green('Tip:'), explanation.tip);
});

module.exports = bugBlaster;
