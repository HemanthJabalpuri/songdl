var fs = require('fs');
var path = require('path');
var mockServer = require('../mock/mock-server.js');
var Promise = global.Promise;

module.exports = function enableMockFetch() {
    var originalFetch = global.fetch;

    global.fetch = function(url, options) {
        var urlStr = url.toString();

        if (urlStr.indexOf('/mock/audio/') !== -1 || urlStr.indexOf('/mock/images/') !== -1) {
            var relPath =
                urlStr.split('/mock/')[1].replace('images/', 'assets/images/').replace('audio/', 'assets/audio/');
            var fullPath = path.join(__dirname, '..', 'mock', relPath);
            if (fs.existsSync(fullPath)) {
                var buffer = fs.readFileSync(fullPath);
                return Promise.resolve({
                    ok: true,
                    status: 200,
                    arrayBuffer: function() {
                        var ab = new ArrayBuffer(buffer.length);
                        var view = new Uint8Array(ab);
                        for (var i = 0; i < buffer.length; i++) {
                            view[i] = buffer[i];
                        }
                        return Promise.resolve(ab);
                    },
                    json: function() {
                        return Promise.resolve(JSON.parse(buffer.toString('utf8')));
                    }
                });
            }
        }

        if (urlStr.indexOf('/proxy') !== -1) {
            return new Promise(function(resolve) {
                var mockRes = {
                    writeHead: function(status, headers) {
                        this.status = status;
                        this.headers = headers;
                    },
                    end: function(data) {
                        resolve({
                            ok: true,
                            status: this.status || 200,
                            json: function() {
                                return Promise.resolve(JSON.parse(data));
                            }
                        });
                    }
                };

                var lowerHeaders = {};
                if (options.headers) {
                    Object.keys(options.headers).forEach(function(key) {
                        lowerHeaders[key.toLowerCase()] = options.headers[key];
                    });
                }
                var mockReq = {url: '/proxy', method: 'POST', headers: lowerHeaders};
                mockServer.handleRequest(mockReq, mockRes);
            });
        }

        return originalFetch(url, options);
    };
};
