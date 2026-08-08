const fs = require('fs');
const path = require('path');

global.isProxy = true;
global.document = undefined;
global.window = global;

let combinedCode = '';
try {
    const html = fs.readFileSync(path.join(__dirname, '..', 'src', 'index.html'), 'utf8');
    const regex = /src="(\/js\/[^"]+)"/g;
    let match;
    while ((match = regex.exec(html)) !== null) {
        const filePath = path.join(__dirname, '..', 'src', match[1]);
        const content = fs.readFileSync(filePath, 'utf8');
        combinedCode += '\n// FILE: ' + match[1] + '\n' + content + '\n';
    }
    const FunctionConstructor = Function;
    new FunctionConstructor(combinedCode)();
} catch (e) {
    console.error('Failed to load bootstrap codebase:', e.message);
    process.exit(1);
}
