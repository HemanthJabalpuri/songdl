// src/js/api/fetch.js

window.API = window.API || {};

// ============ ISOMORPHIC FETCH FALLBACK ============
var isomorphicFetch = function(url, options) {
    if (typeof fetch === 'function') {
        return fetch(url, options);
    }

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

    // In-process Mock Server delegation for offline testing
    if (global.isProxy && (urlStr.indexOf('/proxy') !== -1 || urlStr.indexOf('/mock/') !== -1)) {
        return new window.Utils.Promise(function(resolve, reject) {
            var mockReq = {url: urlStr, method: options.method || 'GET', headers: options.headers || {}};
            var mockRes = {
                writeHead: function(status) {
                    this.status = status;
                },
                setHeader: function() {},
                end: function(body) {
                    var buf = typeof body === 'string' ? new Buffer(body) : body;
                    resolve(makeResponse(this.status || 200, buf));
                }
            };
            var mockServer;
            try {
                mockServer = require('./mock/mock-server.js');
            } catch (e) {
                mockServer = require('../mock/mock-server.js');
            }
            mockServer.handleRequest(mockReq, mockRes);
        });
    }

    // Native Node HTTP/HTTPS request loader
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

window.Utils = window.Utils || {};
window.Utils.fetch = isomorphicFetch;

// ============ LOW-LEVEL FETCH ============
window.API._fetchAPI = function(url, options) {
    options = options || {};

    // Proxy mode (local development)
    if (window.isProxy) {
        console.log('[API] Using proxy for:', url.substring(0, 60) + '...');
        var proxyEndpoint =
            (typeof window !== 'undefined' && window.location) ? '/proxy' : 'http://localhost:3000/proxy';
        return isomorphicFetch(proxyEndpoint, {
                   method: 'POST',
                   headers: {
                       'X-Proxy-URL': url,
                       'X-Proxy-User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                       'X-Proxy-Cookie':
                           'DL=english; L=english; mm_latlong=19.0760%2C72.8777; geo=19.0760%2C72.8777%2CIN%2CMaharashtra%2CMumbai%2C400001'
                   }
               })
            .then(function(res) {
                if (!res.ok) {
                    console.error('[API Fetch Error] Server returnedStatus:', res.status, 'for:', url);
                    throw new Error('Proxy returned ' + res.status);
                }
                return res.json();
            });
    }

    // Direct fetch (userscript or browser)
    console.log('[API] Direct fetch for:', url.substring(0, 60) + '...');
    return isomorphicFetch(url, options).then(function(res) {
        if (!res.ok) {
            console.error('[API Fetch Error] Direct HTTP failed with status:', res.status, 'for:', url);
            throw new Error('HTTP ' + res.status);
        }
        return res.json();
    });
};

// ============ API CALL WRAPPER ============
window.API.callAPI = function(call, extraParams) {
    var defaults = window.API.constants.API_DEFAULTS;
    var params = {__call: call};
    Object.keys(defaults).forEach(function(k) {
        params[k] = defaults[k];
    });
    if (extraParams) {
        Object.keys(extraParams).forEach(function(k) {
            params[k] = extraParams[k];
        });
    }

    var url = window.API.constants.API_BASE;
    var qParts = [];
    Object.keys(params).forEach(function(key) {
        qParts.push(encodeURIComponent(key) + '=' + encodeURIComponent(params[key]));
    });
    var finalUrl = url + (url.indexOf('?') === -1 ? '?' : '&') + qParts.join('&');

    return window.API._fetchAPI(finalUrl, {headers: window.API.constants.DEFAULT_HEADERS});
};
