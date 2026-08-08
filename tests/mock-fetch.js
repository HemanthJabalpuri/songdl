const fs = require('fs');
const path = require('path');
const mockServer = require('../mock/mock-server.js');

module.exports = function enableMockFetch() {
    const originalFetch = global.fetch;

    global.fetch = async function(url, options) {
        const urlStr = url.toString();

        if (urlStr.includes('/mock/audio/') || urlStr.includes('/mock/images/')) {
            const relPath =
                urlStr.split('/mock/')[1].replace('images/', 'assets/images/').replace('audio/', 'assets/audio/');
            const fullPath = path.join(__dirname, '..', 'mock', relPath);
            if (fs.existsSync(fullPath)) {
                const buffer = fs.readFileSync(fullPath);
                return {
                    ok: true,
                    status: 200,
                    arrayBuffer: async () =>
                        buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
                    json: async () => JSON.parse(buffer.toString())
                };
            }
        }

        if (urlStr.includes('/proxy')) {
            return new Promise((resolve) => {
                const mockRes = {
                    writeHead: function(status, headers) {
                        this.status = status;
                        this.headers = headers;
                    },
                    end: function(data) {
                        resolve({ok: true, status: this.status || 200, json: async () => JSON.parse(data)});
                    }
                };

                const lowerHeaders = {};
                if (options.headers) {
                    Object.keys(options.headers).forEach(key => {
                        lowerHeaders[key.toLowerCase()] = options.headers[key];
                    });
                }
                const mockReq = {url: '/proxy', method: 'POST', headers: lowerHeaders};
                mockServer.handleRequest(mockReq, mockRes);
            });
        }

        return originalFetch(url, options);
    };
};
