// tests/node-fetch.js
// Polyfill fetch globally in Node environments lacking native fetch support

if (typeof global !== 'undefined' && typeof global.fetch !== 'function') {
    global.fetch = function(url, options) {
        options = options || {};
        var urlStr = url.toString();

        function makeResponse(status, buffer) {
            return {
                ok: status >= 200 && status < 300,
                status: status,
                json: function() {
                    return window.Utils.Promise.resolve(JSON.parse(buffer.toString('utf8')));
                },
                arrayBuffer: function() {
                    var ab = new ArrayBuffer(buffer.length);
                    var view = new Uint8Array(ab);
                    for (var i = 0; i < buffer.length; i++) {
                        view[i] = buffer[i];
                    }
                    return window.Utils.Promise.resolve(ab);
                }
            };
        }

        var httpModule = urlStr.indexOf('https:') === 0 ? require('https') : require('http');
        return new window.Utils.Promise(function(resolve, reject) {
            var parsed = require('url').parse(urlStr);
            var reqOptions = {
                hostname: parsed.hostname,
                port: parsed.port,
                path: parsed.path,
                method: options.method || 'GET',
                headers: options.headers || {},
                rejectUnauthorized: false
            };
            var req = httpModule.request(reqOptions, function(res) {
                var chunks = [];
                res.on('data', function(chunk) {
                    chunks.push(chunk);
                });
                res.on('end', function() {
                    resolve(makeResponse(res.statusCode, Buffer.concat(chunks)));
                });
            });
            req.on('error', reject);
            if (options.body) {
                req.write(options.body);
            }
            req.end();
        });
    };
}
