// tests/bootstrap.js
var fs = require('fs');
var path = require('path');



global.isProxy = true;
global.document = undefined;
global.window = global;
global.require = require;

window.Cache = {
    store: {},
    get: function(key) {
        return this.store[key];
    },
    set: function(key, val) {
        this.store[key] = val;
    }
};

window.Utils = window.Utils || {};
window.Utils.formatDuration = function(seconds) {
    if (isNaN(seconds) || seconds === null || seconds === undefined || seconds <= 0) return 'N/A';
    var secs = parseInt(seconds);
    var mins = Math.floor(secs / 60);
    var remainingSecs = secs % 60;
    return mins + ':' + (remainingSecs < 10 ? '0' + remainingSecs : remainingSecs);
};

// 2. Test runner polyfill supporting Promises for Node v0.11.8
global.test = function(description, fn) {
    try {
        var res = fn();
        if (res && typeof res.then === 'function') {
            res.then(function() {
                   console.log('  ✔ ' + description);
               })
                .catch(function(e) {
                    console.error('  ✖ ' + description);
                    console.error(e.stack || e);
                    process.exitCode = 1;
                });
        } else {
            console.log('  ✔ ' + description);
        }
    } catch (e) {
        console.error('  ✖ ' + description);
        console.error(e.stack || e);
        process.exitCode = 1;
    }
};

// 3. Dynamically evaluate non-UI split scripts individually
try {
    var scripts = require(path.join(__dirname, '..', 'src', 'js', 'app-scripts.js')).scripts;
    scripts.forEach(function(scriptPath) {
        if (scriptPath.indexOf('ui/') === 0) {
            return; // Skip browser-only UI display elements!
        }
        var filePath = path.join(__dirname, '..', 'src', 'js', scriptPath);
        var content = fs.readFileSync(filePath, 'utf8');
        try {
            var FunctionConstructor = Function;
            new FunctionConstructor(content)();
        } catch (err) {
            console.error('Syntax validation error inside file: ' + scriptPath);
            throw err;
        }
    });
} catch (e) {
    console.error('Failed to load bootstrap codebase:', e.message);
    process.exit(1);
}
