const fs = require('fs');

async function analyzeError(error, stackTrace, req = {}) {

    const message = error.message || 'Unknown error';

    // Construct a dynamic location from the stack trace
    const trace = stackTrace[0] || {};
    let location = trace.getFileName()
        ? `${trace.getFileName()}:${trace.getLineNumber()} (in ${trace.getFunctionName() || 'anonymous'})`
        : 'Unknown location';

    // Get code context from file system if possible
    let codeLine = '';
    if (trace.getFileName()) {
        try {
            if (fs.existsSync(trace.getFileName())) {
                const fileContent = fs.readFileSync(trace.getFileName(), 'utf8').split('\n');
                codeLine = fileContent[trace.getLineNumber() - 1]?.trim() || 'Code not available';
                location += ` - Code: "${codeLine}"`;
            }
        } catch (e) {
            console.warn('[BugBlaster] Couldn’t read file:', e.message);
        }
    }

    // Base explanation (generic fallback)
    let explanation = {
        reason: 'An error occurred in the application.',
        tip: `Review the code at ${location} and check for potential issues.`,
        location,
        trace: "Full stack:"
    };

    // Fallback: Use stack trace and message dynamically
    explanation.reason = `Error: "${message}" occurred at ${location}.`;
    explanation.tip = 'Check the stack trace for more context. Add logging or debugging to narrow down the issue.';
    if (codeLine) {
        explanation.tip += ` The code "${codeLine}" may provide a clue.`;
    }
    if (stackTrace.length > 1) {
        explanation.trace += ` ${stackTrace.map(s => s.getFileName() + ':' + s.getLineNumber()).join(' -> ')}`;
    }

    // Add request context if available
    if (req.method && req.path) {
        explanation.location += ` [${req.method} ${req.path}]`;
    }

    return explanation;
}

module.exports = { analyzeError };
