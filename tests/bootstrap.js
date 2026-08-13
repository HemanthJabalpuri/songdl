// tests/bootstrap.js
var fs = require('fs');
var path = require('path');



global.isProxy = true;
global.document = undefined;
global.window = global;
global.require = require;



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
    var scripts = require(path.join(__dirname, '..', 'src', 'app-scripts.js')).scripts;
    scripts.forEach(function(scriptPath) {
        if (scriptPath.indexOf('ui/') === 0) {
            return; // Skip browser-only UI display elements!
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
    });

    // 4. Intercept calls to mock URLs and delegate them to mock-server
    var originalFetch = window.Utils.fetch;
    window.Utils.fetch = function(url, options) {
        options = options || {};
        var urlStr = url.toString();

        if (urlStr.indexOf('/mock/audio/') !== -1 || urlStr.indexOf('/mock/images/') !== -1) {
            return new window.Utils.Promise(function(resolve) {
                var relPath = urlStr.split('/mock/')[1].replace('images/', 'assets/images/').replace('audio/', 'assets/audio/');
                var fullPath = path.join(__dirname, '..', 'mock', relPath);
                if (fs.existsSync(fullPath)) {
                    var buffer = fs.readFileSync(fullPath);
                    resolve({
                        ok: true,
                        status: 200,
                        json: function() { return window.Utils.Promise.resolve(JSON.parse(buffer.toString('utf8'))); },
                        arrayBuffer: function() {
                            var ab = new ArrayBuffer(buffer.length);
                            var view = new Uint8Array(ab);
                            for (var i = 0; i < buffer.length; i++) { view[i] = buffer[i]; }
                            return window.Utils.Promise.resolve(ab);
                        }
                    });
                } else {
                    resolve({
                        ok: false,
                        status: 404,
                        json: function() { return window.Utils.Promise.reject(new Error('File not found')); },
                        arrayBuffer: function() { return window.Utils.Promise.reject(new Error('File not found')); }
                    });
                }
            });
        }

        if (urlStr.indexOf('/proxy') !== -1 || urlStr.indexOf('/mock/') !== -1) {
            return new window.Utils.Promise(function(resolve) {
                var mockRes = {
                    writeHead: function(status) { this.status = status; },
                    setHeader: function() {},
                    end: function(body) {
                        var buf = typeof body === 'string' ? new Buffer(body) : body;
                        resolve({
                            ok: (this.status || 200) >= 200 && (this.status || 200) < 300,
                            status: this.status || 200,
                            json: function() { return window.Utils.Promise.resolve(JSON.parse(buf.toString('utf8'))); },
                            arrayBuffer: function() {
                                var ab = new ArrayBuffer(buf.length);
                                var view = new Uint8Array(ab);
                                for (var i = 0; i < buf.length; i++) { view[i] = buf[i]; }
                                return window.Utils.Promise.resolve(ab);
                            }
                        });
                    }
                };
                require('../mock/mock-server.js').handleRequest({
                    url: urlStr,
                    method: options.method || 'GET',
                    headers: { 'x-proxy-url': urlStr }
                }, mockRes);
            });
        }
        return originalFetch(url, options);
    };

} catch (e) {
    console.error('Failed to load bootstrap codebase:', e.message);
    process.exit(1);
}
