// tests/bootstrap.js
var fs = require('fs');
var path = require('path');



// Promise ES5 Polyfill (with recursive thenable flattening)
function PromisePolyfill(executor) {
    var self = this;
    self.state = 'pending';
    self.value = undefined;
    self.callbacks = [];

    function resolve(val) {
        if (self.state !== 'pending') return;
        if (val && typeof val.then === 'function') {
            val.then(resolve, reject);
            return;
        }
        self.state = 'fulfilled';
        self.value = val;
        self.callbacks.forEach(function(cb) {
            cb.onFulfilled(val);
        });
    }

    function reject(reason) {
        if (self.state !== 'pending') return;
        self.state = 'rejected';
        self.value = reason;
        self.callbacks.forEach(function(cb) {
            cb.onRejected(reason);
        });
    }

    try {
        executor(resolve, reject);
    } catch (e) {
        reject(e);
    }
}

PromisePolyfill.prototype.then = function(onFulfilled, onRejected) {
    var self = this;
    return new PromisePolyfill(function(resolve, reject) {
        function handle(value) {
            try {
                if (self.state === 'fulfilled') {
                    if (typeof onFulfilled === 'function') {
                        resolve(onFulfilled(value));
                    } else {
                        resolve(value);
                    }
                } else if (self.state === 'rejected') {
                    if (typeof onRejected === 'function') {
                        resolve(onRejected(value));
                    } else {
                        reject(value);
                    }
                }
            } catch (e) {
                reject(e);
            }
        }

        if (self.state === 'pending') {
            self.callbacks.push({onFulfilled: handle, onRejected: handle});
        } else {
            setImmediate(function() {
                handle(self.value);
            });
        }
    });
};

PromisePolyfill.prototype.catch = function(onRejected) {
    return this.then(null, onRejected);
};

PromisePolyfill.resolve = function(val) {
    return new PromisePolyfill(function(resolve) {
        resolve(val);
    });
};

PromisePolyfill.reject = function(reason) {
    return new PromisePolyfill(function(resolve, reject) {
        reject(reason);
    });
};

PromisePolyfill.all = function(promises) {
    return new PromisePolyfill(function(resolve, reject) {
        var results = [];
        var completed = 0;
        if (promises.length === 0) return resolve(results);
        promises.forEach(function(p, i) {
            PromisePolyfill.resolve(p).then(function(val) {
                results[i] = val;
                completed++;
                if (completed === promises.length) resolve(results);
            }, reject);
        });
    });
};

global.Promise = global.Promise || PromisePolyfill;



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
    var html = fs.readFileSync(path.join(__dirname, '..', 'src', 'index.html'), 'utf8');
    var regex = /src="(\/js\/[^"]+)"/g;
    var match;
    while ((match = regex.exec(html)) !== null) {
        var scriptPath = match[1];
        if (scriptPath.indexOf('/ui/') !== -1) {
            continue;  // Skip browser-only UI display elements!
        }
        var filePath = path.join(__dirname, '..', 'src', scriptPath);
        var content = fs.readFileSync(filePath, 'utf8');
        try {
            var FunctionConstructor = Function;
            new FunctionConstructor(content)();
        } catch (err) {
            console.error('Syntax validation error inside file: ' + scriptPath);
            throw err;
        }
    }
} catch (e) {
    console.error('Failed to load bootstrap codebase:', e.message);
    process.exit(1);
}
