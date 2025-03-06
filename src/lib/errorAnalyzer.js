const fs = require('fs');

async function analyzeError(error, stackTrace, req = {}) {
    const message = error.message || 'Unknown error';
    const trace = stackTrace[0] || {};
    const file = trace.getFileName() || 'unknown file';
    const line = trace.getLineNumber() || 'unknown line';
    const method = trace.getFunctionName() || 'anonymous function';
    const location = `${file}:${line} (in ${method})`;

    let explanation = {
        reason: 'An unexpected issue occurred.',
        tip: `Inspect the code at ${location} for potential issues.`,
        location,
    };

    let codeLine = '';
    try {
        if (fs.existsSync(file)) {
            const fileContent = fs.readFileSync(file, 'utf8').split('\n');
            codeLine = fileContent[line - 1]?.trim() || 'Code not available';
            explanation.location += ` - Code: "${codeLine}"`;
        }
    } catch (e) {
        console.warn('[BugBlaster] Couldn’t read file:', e.message);
    }

    const lowerMessage = message.toLowerCase();

    if (message.includes('undefined') || message.includes('null')) {
        const parts = message.split(' of ');
        if (parts.length > 1) {
            const problematicValue = parts[1].split(' ')[0];
            const action = parts[0].replace(/^.*?\s/, '').trim();
            explanation.reason = `Attempted to ${action} on ${problematicValue}.`;
            explanation.tip = `Ensure the value isn’t ${problematicValue}. Add a check like \`if (value) { ... }\`.`;
            if (codeLine && !codeLine.includes('if (')) {
                explanation.tip += ` The code "${codeLine}" lacks a safety check.`;
            }
        }
    } else if (message.includes('is not a function')) {
        const funcMatch = message.match(/(.+?) is not a function/);
        const funcName = funcMatch ? funcMatch[1] : 'a function';
        explanation.reason = `'${funcName}' was called but isn’t a function.`;
        explanation.tip = `Verify '${funcName}' is defined correctly.`;
        if (codeLine && codeLine.includes(funcName)) {
            explanation.tip += ` In "${codeLine}", check if '${funcName}' is imported or assigned.`;
        }
    } else if (message.includes('is not defined')) {
        const varMatch = message.match(/(.+?) is not defined/);
        const varName = varMatch ? varMatch[1] : 'a variable';
        explanation.reason = `'${varName}' isn’t defined in this scope.`;
        explanation.tip = `Define '${varName}' before use or check for typos.`;
        if (codeLine && !codeLine.includes(`let ${varName}`) && !codeLine.includes(`const ${varName}`)) {
            explanation.tip += ` "${codeLine}" uses '${varName}' without declaration.`;
        }
    } else if (message.includes('Unhandled Rejection') || (codeLine && codeLine.includes('await'))) {
        explanation.reason = 'An asynchronous operation likely failed or wasn’t handled.';
        explanation.tip = `Add error handling (e.g., try/catch or .catch()).`;
        if (codeLine && codeLine.includes('await') && !codeLine.includes('try')) {
            explanation.tip += ` "${codeLine}" uses await without try/catch.`;
        }
    }

    if (req.method && req.path) {
        explanation.location += ` [${req.method} ${req.path}]`;
        if (!req.body && lowerMessage.includes('undefined')) {
            explanation.tip += ' This might be due to missing body-parser middleware.';
        }
    }

    return explanation;
}

module.exports = { analyzeError };
