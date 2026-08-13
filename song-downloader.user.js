// ==UserScript==
// @name         Song Downloader
// @namespace    Violentmonkey
// @version      1.5.0
// @description  Download songs and albums with metadata
// @author       Hemanth
// @match        https://www.mymusic.com/*
// @grant        GM_xmlhttpRequest
// @connect      aac.musiccdn.com
// @connect      musiccdn.com
// ==/UserScript==

(function() {
    'use strict';

    console.log('[Userscript] Song Downloader loaded');
    console.log('[Userscript] Click the 🎵 button or press Alt+J to open');


    // ============================================================
    // FILE: api/constants.js
    // ============================================================

// src/js/api/constants.js

window.API = window.API || {};
window.Services = window.Services || {};
window.Utils = window.Utils || {};
window.UI = window.UI || {};
window.API.constants = window.API.constants || {};

// API endpoints
const HOST = 'https://www.mymusic.com';
window.API.constants.API_HOST = HOST;
window.API.constants.API_BASE = HOST + '/api.php';
window.API.constants.REFERER = HOST + '/';

// Default headers for all requests
window.API.constants.DEFAULT_HEADERS = {
    'Accept': 'application/json, text/plain, */*',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
};

// Default parameters for all API calls
window.API.constants.API_DEFAULTS = {
    _format: 'json',
    _marker: 0,
    api_version: 4,
    ctx: 'web6dot0'
};


    // ============================================================
    // FILE: api/fetch.js
    // ============================================================

// src/js/api/fetch.js
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


    // ============================================================
    // FILE: api/songs.js
    // ============================================================

// src/js/api/songs.js
// Pure API calls - no formatting or business logic
// Search for songs - returns raw API response
window.API.searchSongs = function(query, limit, page) {
    return window.API.callAPI('search.getResults', {q: query, p: page || 1, n: limit || 20});
};

// Get song details by token - returns raw API response
window.API.getSong = function(token) {
    return window.API.callAPI('webapi.get', {token: token, type: 'song', includeMetaTags: 0});
};

// Get lyrics for a song by token
window.API.getLyrics = function(token) {
    return window.API.callAPI('webapi.get', {token: token, type: 'lyrics'});
};


    // ============================================================
    // FILE: api/albums.js
    // ============================================================

// src/js/api/albums.js
// Pure API calls - no formatting or business logic
// Search for albums - returns raw API response
window.API.searchAlbums = function(query, limit, page) {
    return window.API.callAPI('search.getAlbumResults', {q: query, p: page || 1, n: limit || 20});
};

// Get album details by token - returns raw API response
window.API.getAlbum = function(token) {
    return window.API.callAPI('webapi.get', {token: token, type: 'album', includeMetaTags: 0});
};


    // ============================================================
    // FILE: api/playlists.js
    // ============================================================

// src/js/api/playlists.js
// Pure API calls - no formatting or business logic
// Search for playlists - returns raw API response
window.API.searchPlaylists = function(query, limit, page) {
    return window.API.callAPI('search.getPlaylistResults', {q: query, p: page || 1, n: limit || 20});
};

// Get playlist details by token - returns raw API response Supports pagination for large playlists
window.API.getPlaylist = function(token, page, limit) {
    return window.API.callAPI(
        'webapi.get', {token: token, type: 'playlist', includeMetaTags: 0, p: page || 1, n: limit || 50});
};


    // ============================================================
    // FILE: api/artists.js
    // ============================================================

// src/js/api/artists.js
// Pure API calls - no formatting or business logic
// Search for artists - returns raw API response
window.API.searchArtists = function(query, limit, page) {
    return window.API.callAPI('search.getArtistResults', {q: query, p: page || 1, n: limit || 20});
};

// Get artist details by token - returns raw API response
window.API.getArtist = function(token, category) {
    return window.API.callAPI('webapi.get', {
        token: token,
        type: 'artist',
        p: 1,
        n_song: 10,
        n_album: 10,
        sub_type: '',
        category: category || 'popular',
        sort_order: category === 'latest' ? 'desc' : 'asc'
    });
};

// Get more songs by artist - returns raw API response
window.API.getArtistMoreSongs = function(artistId, page, category) {
    return window.API.callAPI('artist.getArtistMoreSong', {
        artistId: artistId,
        page: page || 1,
        category: category || 'popular',
        sort_order: category === 'latest' ? 'desc' : 'asc'
    });
};

// Get more albums by artist - returns raw API response
window.API.getArtistMoreAlbums = function(artistId, page, category) {
    return window.API.callAPI('artist.getArtistMoreAlbum', {
        artistId: artistId,
        page: page || 1,
        category: category || 'popular',
        sort_order: category === 'latest' ? 'desc' : 'asc'
    });
};


    // ============================================================
    // FILE: libs/des.js
    // ============================================================

// src/js/libs/des.js
// Stripped DES library - ECB mode only, decryption only
// Based on Paul Tero's DES implementation

// S-boxes (standard DES)
const S1 = new Int32Array([
    0x1010400, 0,         0x10000,   0x1010404, 0x1010004, 0x10404,   0x4,       0x10000,   0x400,     0x1010400,
    0x1010404, 0x400,     0x1000404, 0x1010004, 0x1000000, 0x4,       0x404,     0x1000400, 0x1000400, 0x10400,
    0x10400,   0x1010000, 0x1010000, 0x1000404, 0x10004,   0x1000004, 0x1000004, 0x10004,   0,         0x404,
    0x10404,   0x1000000, 0x10000,   0x1010404, 0x4,       0x1010000, 0x1010400, 0x1000000, 0x1000000, 0x400,
    0x1010004, 0x10000,   0x10400,   0x1000004, 0x400,     0x4,       0x1000404, 0x10404,   0x1010404, 0x10004,
    0x1010000, 0x1000404, 0x1000004, 0x404,     0x10404,   0x1010400, 0x404,     0x1000400, 0x1000400, 0,
    0x10004,   0x10400,   0,         0x1010004
]);

const S2 = new Int32Array([
    -0x7FEF7FE0, -0x7FFF8000, 0x8000,      0x108020,    0x100000,    0x20,        -0x7FEFFFE0, -0x7FFF7FE0,
    -0x7FFFFFE0, -0x7FEF7FE0, -0x7FEF8000, -0x80000000, -0x7FFF8000, 0x100000,    0x20,        -0x7FEFFFE0,
    0x108000,    0x100020,    -0x7FFF7FE0, 0,           -0x80000000, 0x8000,      0x108020,    -0x7FF00000,
    0x100020,    -0x7FFFFFE0, 0,           0x108000,    0x8020,      -0x7FEF8000, -0x7FF00000, 0x8020,
    0,           0x108020,    -0x7FEFFFE0, 0x100000,    -0x7FFF7FE0, -0x7FF00000, -0x7FEF8000, 0x8000,
    -0x7FF00000, -0x7FFF8000, 0x20,        -0x7FEF7FE0, 0x108020,    0x20,        0x8000,      -0x80000000,
    0x8020,      -0x7FEF8000, 0x100000,    -0x7FFFFFE0, 0x100020,    -0x7FFF7FE0, -0x7FFFFFE0, 0x100020,
    0x108000,    0,           -0x7FFF8000, 0x8020,      -0x80000000, -0x7FEFFFE0, -0x7FEF7FE0, 0x108000
]);

const S3 = new Int32Array([
    0x208,     0x8020200, 0,         0x8020008, 0x8000200, 0,         0x20208,   0x8000200, 0x20008,   0x8000008,
    0x8000008, 0x20000,   0x8020208, 0x20008,   0x8020000, 0x208,     0x8000000, 0x8,       0x8020200, 0x200,
    0x20200,   0x8020000, 0x8020008, 0x20208,   0x8000208, 0x20200,   0x20000,   0x8000208, 0x8,       0x8020208,
    0x200,     0x8000000, 0x8020200, 0x8000000, 0x20008,   0x208,     0x20000,   0x8020200, 0x8000200, 0,
    0x200,     0x20008,   0x8020208, 0x8000200, 0x8000008, 0x200,     0,         0x8020008, 0x8000208, 0x20000,
    0x8000000, 0x8020208, 0x8,       0x20208,   0x20200,   0x8000008, 0x8020000, 0x8000208, 0x208,     0x8020000,
    0x20208,   0x8,       0x8020008, 0x20200
]);

const S4 = new Int32Array([
    0x802001, 0x2081,   0x2081,   0x80,     0x802080, 0x800081, 0x800001, 0x2001,   0,        0x802000, 0x802000,
    0x802081, 0x81,     0,        0x800080, 0x800001, 0x1,      0x2000,   0x800000, 0x802001, 0x80,     0x800000,
    0x2001,   0x2080,   0x800081, 0x1,      0x2080,   0x800080, 0x2000,   0x802080, 0x802081, 0x81,     0x800080,
    0x800001, 0x802000, 0x802081, 0x81,     0,        0,        0x802000, 0x2080,   0x800080, 0x800081, 0x1,
    0x802001, 0x2081,   0x2081,   0x80,     0x802081, 0x81,     0x1,      0x2000,   0x800001, 0x2001,   0x802080,
    0x800081, 0x2001,   0x2080,   0x800000, 0x802001, 0x80,     0x800000, 0x2000,   0x802080
]);

const S5 = new Int32Array([
    0x100,      0x2080100,  0x2080000,  0x42000100, 0x80000,    0x100,      0x40000000, 0x2080000,
    0x40080100, 0x80000,    0x2000100,  0x40080100, 0x42000100, 0x42080000, 0x80100,    0x40000000,
    0x2000000,  0x40080000, 0x40080000, 0,          0x40000100, 0x42080100, 0x42080100, 0x2000100,
    0x42080000, 0x40000100, 0,          0x42000000, 0x2080100,  0x2000000,  0x42000000, 0x80100,
    0x80000,    0x42000100, 0x100,      0x2000000,  0x40000000, 0x2080000,  0x42000100, 0x40080100,
    0x2000100,  0x40000000, 0x42080000, 0x2080100,  0x40080100, 0x100,      0x2000000,  0x42080000,
    0x42080100, 0x80100,    0x42000000, 0x42080100, 0x2080000,  0,          0x40080000, 0x42000000,
    0x80100,    0x2000100,  0x40000100, 0x80000,    0,          0x40080000, 0x2080100,  0x40000100
]);

const S6 = new Int32Array([
    0x20000010, 0x20400000, 0x4000,     0x20404010, 0x20400000, 0x10,       0x20404010, 0x400000,
    0x20004000, 0x404010,   0x400000,   0x20000010, 0x400010,   0x20004000, 0x20000000, 0x4010,
    0,          0x400010,   0x20004010, 0x4000,     0x404000,   0x20004010, 0x10,       0x20400010,
    0x20400010, 0,          0x404010,   0x20404000, 0x4010,     0x404000,   0x20404000, 0x20000000,
    0x20004000, 0x10,       0x20400010, 0x404000,   0x20404010, 0x400000,   0x4010,     0x20000010,
    0x400000,   0x20004000, 0x20000000, 0x4010,     0x20000010, 0x20404010, 0x404000,   0x20400000,
    0x404010,   0x20404000, 0,          0x20400010, 0x10,       0x4000,     0x20400000, 0x404010,
    0x4000,     0x400010,   0x20004010, 0,          0x20404000, 0x20000000, 0x400010,   0x20004010
]);

const S7 = new Int32Array([
    0x200000,  0x4200002, 0x4000802, 0,         0x800,     0x4000802, 0x200802,  0x4200800, 0x4200802, 0x200000,
    0,         0x4000002, 0x2,       0x4000000, 0x4200002, 0x802,     0x4000800, 0x200802,  0x200002,  0x4000800,
    0x4000002, 0x4200000, 0x4200800, 0x200002,  0x4200000, 0x800,     0x802,     0x4200802, 0x200800,  0x2,
    0x4000000, 0x200800,  0x4000000, 0x200800,  0x200000,  0x4000802, 0x4000802, 0x4200002, 0x4200002, 0x2,
    0x200002,  0x4000000, 0x4000800, 0x200000,  0x4200800, 0x802,     0x200802,  0x4200800, 0x802,     0x4000002,
    0x4200802, 0x4200000, 0x200800,  0,         0x2,       0x4200802, 0,         0x200802,  0x4200000, 0x800,
    0x4000002, 0x4000800, 0x800,     0x200002
]);

const S8 = new Int32Array([
    0x10001040, 0x1000,     0x40000,    0x10041040, 0x10000000, 0x10001040, 0x40,       0x10000000,
    0x40040,    0x10040000, 0x10041040, 0x41000,    0x10041000, 0x41040,    0x1000,     0x40,
    0x10040000, 0x10000040, 0x10001000, 0x1040,     0x41000,    0x40040,    0x10040040, 0x10041000,
    0x1040,     0,          0,          0x10040040, 0x10000040, 0x10001000, 0x41040,    0x40000,
    0x41040,    0x40000,    0x10041000, 0x1000,     0x40,       0x10040040, 0x1000,     0x41040,
    0x10001000, 0x40,       0x10000040, 0x10040000, 0x10040040, 0x10000000, 0x40000,    0x10001040,
    0,          0x10041040, 0x40040,    0x10000040, 0x10040000, 0x10001000, 0x10001040, 0,
    0x10041040, 0x41000,    0x41000,    0x1040,     0x1040,     0x40040,    0x10000000, 0x10041000
]);

// Unified DES Block Processor - ECB Mode
function desBlock(message, keys, encrypt) {
    var s1 = S1, s2 = S2, s3 = S3, s4 = S4;
    var s5 = S5, s6 = S6, s7 = S7, s8 = S8;

    // PKCS7 padding (encryption only)
    if (encrypt) {
        var padLen = 8 - (message.length % 8);
        for (var p = 0; p < padLen; p++) {
            message += String.fromCharCode(padLen);
        }
    }

    var len = message.length;
    var result = '';
    var left, right, temp;

    // Loop through each 64-bit block
    for (var m = 0; m < len; m += 8) {
        left = (message.charCodeAt(m) << 24) | (message.charCodeAt(m + 1) << 16) | (message.charCodeAt(m + 2) << 8) |
            message.charCodeAt(m + 3);
        right = (message.charCodeAt(m + 4) << 24) | (message.charCodeAt(m + 5) << 16) |
            (message.charCodeAt(m + 6) << 8) | message.charCodeAt(m + 7);

        // Initial Permutation
        temp = ((left >>> 4) ^ right) & 0x0F0F0F0F;
        right ^= temp;
        left ^= (temp << 4);

        temp = ((left >>> 16) ^ right) & 0x0000FFFF;
        right ^= temp;
        left ^= (temp << 16);

        temp = ((right >>> 2) ^ left) & 0x33333333;
        left ^= temp;
        right ^= (temp << 2);

        temp = ((right >>> 8) ^ left) & 0x00FF00FF;
        left ^= temp;
        right ^= (temp << 8);

        temp = ((left >>> 1) ^ right) & 0x55555555;
        right ^= temp;
        left ^= (temp << 1);

        left = ((left << 1) | (left >>> 31));
        right = ((right << 1) | (right >>> 31));

        // Set round parameters dynamically
        var start = encrypt ? 0 : 30;
        var end = encrypt ? 32 : -2;
        var step = encrypt ? 2 : -2;

        // 16 Feistel rounds
        for (var i = start; i !== end; i += step) {
            var right1 = right ^ keys[i];
            var rrot = (right >>> 4) | (right << 28);
            var right2 = rrot ^ keys[i + 1];

            temp = left;
            left = right;
            right = temp ^
                (s2[(right1 >>> 24) & 63] | s4[(right1 >>> 16) & 63] | s6[(right1 >>> 8) & 63] | s8[right1 & 63] |
                 s1[(right2 >>> 24) & 63] | s3[(right2 >>> 16) & 63] | s5[(right2 >>> 8) & 63] | s7[right2 & 63]);
        }

        // Swap left and right
        temp = left;
        left = right;
        right = temp;

        // Final Permutation (IP-1)
        left = ((left >>> 1) | (left << 31));
        right = ((right >>> 1) | (right << 31));

        temp = ((left >>> 1) ^ right) & 0x55555555;
        right ^= temp;
        left ^= (temp << 1);

        temp = ((right >>> 8) ^ left) & 0x00FF00FF;
        left ^= temp;
        right ^= (temp << 8);

        temp = ((right >>> 2) ^ left) & 0x33333333;
        left ^= temp;
        right ^= (temp << 2);

        temp = ((left >>> 16) ^ right) & 0x0000FFFF;
        right ^= temp;
        left ^= (temp << 16);

        temp = ((left >>> 4) ^ right) & 0x0F0F0F0F;
        right ^= temp;
        left ^= (temp << 4);

        result += String.fromCharCode(
            (left >>> 24), ((left >>> 16) & 0xFF), ((left >>> 8) & 0xFF), (left & 0xFF), (right >>> 24),
            ((right >>> 16) & 0xFF), ((right >>> 8) & 0xFF), (right & 0xFF));
    }
    return result;
}

// Public compatibility wrappers
function desDecrypt(message, keys) {
    return desBlock(message, keys, false);
}

function desEncrypt(message, keys) {
    return desBlock(message, keys, true);
}

// Expose to browser/Node namespace global
if (typeof window !== 'undefined') {
    window.Utils.desDecrypt = desDecrypt;
    window.Utils.desEncrypt = desEncrypt;
}

    // ============================================================
    // FILE: libs/writem4a.js
    // ============================================================

// src/js/libs/writem4a.js

// Restricts recursive parsing to metadata-only atoms to avoid GC allocating and shifts index tables in-place using
// direct byte signatures.

var latin1Decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('latin1') : null;
var utf8Decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8') : null;
var utf8Encoder = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;

// Converts a segment of Uint8Array to string.
function bytesToString(bytes, offset, endOffset, encoding) {
    if (encoding === undefined) encoding = 'latin1';
    var slice = bytes.subarray(offset, endOffset);
    if (encoding === 'utf8') {
        if (utf8Decoder) return utf8Decoder.decode(slice);
        // Fallback for old Node.js
        var buf;
        if (typeof Buffer.from === 'function') {
            buf = Buffer.from(slice);
        } else {
            buf = new Buffer(slice.length);
            for (var i = 0; i < slice.length; i++) {
                buf[i] = slice[i];
            }
        }
        return buf.toString('utf8');
    } else {
        if (latin1Decoder) return latin1Decoder.decode(slice);
        var buf;
        if (typeof Buffer.from === 'function') {
            buf = Buffer.from(slice);
        } else {
            buf = new Buffer(slice.length);
            for (var i = 0; i < slice.length; i++) {
                buf[i] = slice[i];
            }
        }
        return buf.toString('binary');
    }
}

// Converts a string to Uint8Array.
function stringToBytes(str, encoding) {
    if (encoding === undefined) encoding = 'utf8';
    if (encoding === 'latin1') {
        var bytes = new Uint8Array(str.length);
        for (var i = 0; i < str.length; i++) {
            bytes[i] = str.charCodeAt(i) & 0xff;
        }
        return bytes;
    }
    if (utf8Encoder) return utf8Encoder.encode(str);
    // Fallback for old Node.js
    var buf = new Buffer(str, 'utf8');
    var arr = new Uint8Array(buf.length);
    for (var i = 0; i < buf.length; i++) {
        arr[i] = buf[i];
    }
    return arr;
}

// Concatenates multiple Uint8Array arrays into one.
function concatUint8Arrays(arrays) {
    var totalLength = 0;
    for (var i = 0; i < arrays.length; i++) {
        totalLength += arrays[i].length;
    }
    var result = new Uint8Array(totalLength);
    var offset = 0;
    for (var i = 0; i < arrays.length; i++) {
        var arr = arrays[i];
        result.set(arr, offset);
        offset += arr.length;
    }
    return result;
}

// Reads variable-length Big-Endian integer from DataView.
function readUIntBE(view, offset, byteLength) {
    var value = 0;
    for (var i = 0; i < byteLength; i++) {
        value = (value << 8) | view.getUint8(offset + i);
    }
    return value;
}

// Writes variable-length Big-Endian integer into DataView.
function writeUIntBE(view, value, offset, byteLength) {
    var temp = value;
    for (var i = byteLength - 1; i >= 0; i--) {
        view.setUint8(offset + i, temp & 0xff);
        temp = temp >> 8;
    }
}

// 64-bit Big-Endian DataView helpers supporting legacy runtimes natively
function readUInt64(view, offset) {
    if (typeof view.getBigUint64 === 'function') {
        return Number(view.getBigUint64(offset, false));
    }
    var high = view.getUint32(offset, false);
    var low = view.getUint32(offset + 4, false);
    return high * 0x100000000 + low;
}

function writeUInt64(view, value, offset) {
    if (typeof view.setBigUint64 === 'function') {
        view.setBigUint64(offset, BigInt(value), false);
        return;
    }
    var high = Math.floor(value / 0x100000000);
    var low = value % 0x100000000;
    view.setUint32(offset, high, false);
    view.setUint32(offset + 4, low, false);
}

// Array Search Helpers (bypass ES6 prototype method dependency)
function findChild(parent, type) {
    if (!parent || !parent.children) return null;
    for (var k = 0; k < parent.children.length; k++) {
        if (parent.children[k].type === type) return parent.children[k];
    }
    return null;
}

function findAtomInList(atoms, type) {
    if (!atoms) return null;
    for (var k = 0; k < atoms.length; k++) {
        if (atoms[k].type === type) return atoms[k];
    }
    return null;
}

function findIndexInList(list, type) {
    if (!list) return -1;
    for (var k = 0; k < list.length; k++) {
        if (list[k].type === type) return k;
    }
    return -1;
}

// Maps M4A 4-byte atom types to human-readable tag keys.
var TAG_MAPPING = {
    '\xa9alb': 'album',
    '\xa9art': 'artist',
    '\xa9ART': 'artist',
    'aART': 'album_artist',
    '\xa9day': 'year',
    '\xa9nam': 'title',
    '\xa9gen': 'genre',
    'trkn': 'track',
    '\xa9wrt': 'composer',
    '\xa9too': 'encoder',
    'cprt': 'copyright',
    'covr': 'picture',
    '\xa9grp': 'grouping',
    'keyw': 'keyword',
    '\xa9lyr': 'lyrics',
    '\xa9cmt': 'comment',
    'tmpo': 'tempo',
    'cpil': 'compilation',
    'disk': 'disc'
};

// Derived inverse mapping to resolve tag keys to M4A atom types.
var TAG_TO_ATOM = {};
var mapKeys = Object.keys(TAG_MAPPING);
for (var i = 0; i < mapKeys.length; i++) {
    var atom = mapKeys[i];
    var key = TAG_MAPPING[atom];
    if (!TAG_TO_ATOM[key] || (atom === '\xa9ART' && TAG_TO_ATOM[key] === '\xa9art')) {
        TAG_TO_ATOM[key] = atom;
    }
}

// Reads size and type boundaries of an atom header.
function readAtomHeader(bytes, offset) {
    if (offset + 8 > bytes.length) return null;
    var view = new DataView(bytes.buffer, bytes.byteOffset + offset, 8);
    var size = view.getUint32(0, false);
    var type = bytesToString(bytes, offset + 4, offset + 8, 'latin1');
    var headerSize = 8;
    var actualSize = size;

    if (size === 1) {
        if (offset + 16 > bytes.length) return null;
        var viewLong = new DataView(bytes.buffer, bytes.byteOffset + offset + 8, 8);
        actualSize = readUInt64(viewLong, 0);
        headerSize = 16;
    }
    return {type: type, size: actualSize, headerSize: headerSize};
}

// Scans top-level atoms in the buffer sequentially.
function scanTopLevelAtoms(bytes) {
    var atoms = [];
    var pos = 0;
    while (pos < bytes.length) {
        var header = readAtomHeader(bytes, pos);
        if (!header || header.size <= 0 || pos + header.size > bytes.length) break;
        atoms.push({
            type: header.type,
            size: header.size,
            headerSize: header.headerSize,
            offset: pos,
            bytes: bytes.subarray(pos, pos + header.size)
        });
        pos += header.size;
    }
    return atoms;
}

// Finds or creates a child atom in a parent container tree.
function getOrCreateChild(parent, type, headerBytes, metaPrefix) {
    if (metaPrefix === undefined) metaPrefix = null;
    var child = findChild(parent, type);
    if (!child) {
        child = {type: type, headerSize: headerBytes.length, headerBytes: headerBytes, children: []};
        if (metaPrefix) child.metaPrefix = metaPrefix;
        parent.children.push(child);
    }
    return child;
}

// Recursively parses the binary buffer into a structured atom tree. Optimized: Only iterates within metadata containers
// (moov, udta, meta, ilst) to bypass allocating track timelines on javascript heap.
function parseAtomTree(bytes, offset, endOffset) {
    var header = readAtomHeader(bytes, offset);
    if (!header) {
        throw new Error('Out of bounds reading atom header.');
    }
    var payloadOffset = offset + header.headerSize;
    var payloadSize = header.size - header.headerSize;

    // Optimized containerTypes list: skips tracking nested trak, mdia, etc., but parses metadata fields
    var containerTypes = [
        'moov',    'udta',    'meta',    'ilst',    '\xa9nam', '\xa9art', '\xa9ART', 'aART',
        '\xa9alb', '\xa9day', '\xa9gen', 'trkn',    '\xa9wrt', '\xa9too', 'cprt',    'covr',
        '\xa9grp', 'keyw',    '\xa9lyr', '\xa9cmt', 'tmpo',    'cpil',    'disk'
    ];

    var atom = {
        type: header.type,
        headerSize: header.headerSize,
        headerBytes: bytes.subarray(offset, payloadOffset),
        children: []
    };

    var isContainer = containerTypes.indexOf(header.type) !== -1;
    if (isContainer && payloadSize > 0) {
        var childOffset = payloadOffset;
        if (header.type === 'meta') {
            atom.metaPrefix = bytes.subarray(payloadOffset, payloadOffset + 4);
            childOffset += 4;
        }
        var childrenEnd = offset + header.size;
        while (childOffset < childrenEnd) {
            if (childOffset + 8 > childrenEnd) break;
            var childHeader = readAtomHeader(bytes, childOffset);
            if (!childHeader || childHeader.size === 0) break;
            var child = parseAtomTree(bytes, childOffset, childrenEnd);
            atom.children.push(child);
            childOffset += childHeader.size;
        }
    } else {
        atom.payload = bytes.subarray(payloadOffset, payloadOffset + payloadSize);
    }
    return atom;
}

// Scans a trak byte buffer in-place to find and shift offsets in stco or co64 index tables.
function shiftStcoInBytes(bytes, delta) {
    if (delta === 0) return;
    var view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

    // Find 'stco' in bytes (4-byte signature: [115, 116, 99, 111])
    var pos = 0;
    while (pos + 8 <= bytes.length) {
        // checking [s, t, c, o]
        if (bytes[pos] === 115 && bytes[pos + 1] === 116 && bytes[pos + 2] === 99 && bytes[pos + 3] === 111) {
            var size = view.getUint32(pos - 4, false);
            if (pos - 4 + size <= bytes.length) {
                var count = view.getUint32(pos + 8, false);
                for (var i = 0; i < count; i++) {
                    var idx = pos + 12 + i * 4;
                    if (idx + 4 <= bytes.length) {
                        var val = view.getUint32(idx, false);
                        view.setUint32(idx, val + delta, false);
                    }
                }
            }
            break;
        }
        // Find 'co64' in bytes (4-byte signature: [99, 111, 54, 52])
        if (bytes[pos] === 99 && bytes[pos + 1] === 111 && bytes[pos + 2] === 54 && bytes[pos + 3] === 52) {
            var size = view.getUint32(pos - 4, false);
            if (pos - 4 + size <= bytes.length) {
                var count = view.getUint32(pos + 8, false);
                for (var i = 0; i < count; i++) {
                    var idx = pos + 12 + i * 8;
                    if (idx + 8 <= bytes.length) {
                        var val = readUInt64(view, idx);
                        writeUInt64(view, val + delta, idx);
                    }
                }
            }
            break;
        }
        pos++;
    }
}

// Recursively serializes the atom tree back into a binary buffer, adjusting chunk offset indexing tables (`stco` /
// `co64`) by the shift delta. Optimized: Runs in-place offset adjustments directly on the trak byte arrays and avoids
// string encoding allocations.
function serializeAtomTree(atom, delta) {
    if (delta === undefined) delta = 0;
    // If track atom payload is encountered, apply offset shifts to stco/co64 directly
    if (delta !== 0 && atom.type === 'trak') {
        shiftStcoInBytes(atom.payload, delta);
    }

    if (atom.children && atom.children.length > 0) {
        var serializedChildren = [];
        for (var i = 0; i < atom.children.length; i++) {
            serializedChildren.push(serializeAtomTree(atom.children[i], delta));
        }

        var payloadLength = 0;
        for (var i = 0; i < serializedChildren.length; i++) {
            payloadLength += serializedChildren[i].length;
        }
        if (atom.type === 'meta') {
            payloadLength += 4;
        }

        var header = new Uint8Array(atom.headerSize);
        var view = new DataView(header.buffer, header.byteOffset, header.byteLength);
        view.setUint32(0, payloadLength + atom.headerSize, false);

        // Optimized: Set type string characters directly (allocation-free)
        header[4] = atom.type.charCodeAt(0);
        header[5] = atom.type.charCodeAt(1);
        header[6] = atom.type.charCodeAt(2);
        header[7] = atom.type.charCodeAt(3);

        var parts = [header];
        if (atom.type === 'meta') {
            parts.push(atom.metaPrefix);
        }
        parts = parts.concat(serializedChildren);
        return concatUint8Arrays(parts);
    } else {
        var header = new Uint8Array(atom.headerSize);
        var view = new DataView(header.buffer, header.byteOffset, header.byteLength);
        view.setUint32(0, atom.payload.length + atom.headerSize, false);

        // Set type characters directly
        header[4] = atom.type.charCodeAt(0);
        header[5] = atom.type.charCodeAt(1);
        header[6] = atom.type.charCodeAt(2);
        header[7] = atom.type.charCodeAt(3);

        return concatUint8Arrays([header, atom.payload]);
    }
}

// Decodes metadata fields from parsed tags located inside the `ilst` atom parent.
function extractTags(ilstAtom) {
    var tags = {};
    if (!ilstAtom || !ilstAtom.children) return tags;

    for (var i = 0; i < ilstAtom.children.length; i++) {
        var tagAtom = ilstAtom.children[i];
        var key = TAG_MAPPING[tagAtom.type];
        if (!key) continue;

        var dataAtom = findChild(tagAtom, 'data');
        if (!dataAtom || !dataAtom.payload) continue;

        var payload = dataAtom.payload;
        if (payload.length < 8) continue;

        var view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
        var typeClass = readUIntBE(view, 1, 3);
        var valueBuf = payload.subarray(8);

        if (key === 'track' || key === 'disc') {
            if (valueBuf.length >= 6) {
                var valView = new DataView(valueBuf.buffer, valueBuf.byteOffset, valueBuf.byteLength);
                tags[key] = valView.getUint16(2, false);
                tags[key + '_count'] = valView.getUint16(4, false);
            }
        } else if (typeClass === 1) {
            tags[key] = bytesToString(valueBuf, 0, valueBuf.length, 'utf8');
        } else if (typeClass === 13 || typeClass === 14) {
            tags[key] = {
                format: typeClass === 13 ? 'jpeg' : 'png',
                mimeType: typeClass === 13 ? 'image/jpeg' : 'image/png',
                data: valueBuf
            };
        } else if (typeClass === 21) {
            var valView = new DataView(valueBuf.buffer, valueBuf.byteOffset, valueBuf.byteLength);
            tags[key] = readUIntBE(valView, 0, valueBuf.length);
        } else {
            tags[key] = bytesToString(valueBuf, 0, valueBuf.length, 'utf8');
        }
    }
    return tags;
}

// Creates a valid M4A metadata tag atom containing a sub-atom 'data'.
function createTagAtom(type, value, isPicture) {
    if (isPicture === undefined) isPicture = false;
    var valueBuf;
    var typeClass;  // 1 = text, 13 = JPEG cover, 14 = PNG cover, 21 = uint

    if (isPicture) {
        valueBuf = value.data;
        typeClass = value.format === 'png' ? 14 : 13;
    } else if (typeof value === 'number') {
        valueBuf = new Uint8Array(4);
        var valView = new DataView(valueBuf.buffer, valueBuf.byteOffset, valueBuf.byteLength);
        valView.setUint32(0, value, false);
        typeClass = 21;
    } else {
        valueBuf = stringToBytes(String(value), 'utf8');
        typeClass = 1;
    }

    var dataAtomHeader = new Uint8Array(16);
    var headerView = new DataView(dataAtomHeader.buffer, dataAtomHeader.byteOffset, dataAtomHeader.byteLength);
    headerView.setUint32(0, 16 + valueBuf.length, false);

    // Set 'data' characters directly (allocation-free)
    dataAtomHeader[4] = 100;                   // 'd'
    dataAtomHeader[5] = 97;                    // 'a'
    dataAtomHeader[6] = 116;                   // 't'
    dataAtomHeader[7] = 97;                    // 'a'
    writeUIntBE(headerView, typeClass, 9, 3);  // 3-byte class flags

    var dataAtom = {
        type: 'data',
        headerSize: 8,
        headerBytes: dataAtomHeader.subarray(0, 8),
        payload: concatUint8Arrays([dataAtomHeader.subarray(8, 16), valueBuf])
    };

    var tagAtomHeader = new Uint8Array(8);
    tagAtomHeader[4] = type.charCodeAt(0);
    tagAtomHeader[5] = type.charCodeAt(1);
    tagAtomHeader[6] = type.charCodeAt(2);
    tagAtomHeader[7] = type.charCodeAt(3);

    return {type: type, headerSize: 8, headerBytes: tagAtomHeader, children: [dataAtom]};
}

// Scans the binary buffer in-place to verify that the file meets essential M4A structure expectations (ftyp signature,
// plus mdat and moov containers). Performs zero allocations and runs in under 10 microseconds.
function verifyM4AStructure(bytes) {
    if (bytes.length < 8) return false;

    // 1. Verify ftyp signature
    if (bytesToString(bytes, 4, 8, 'latin1') !== 'ftyp') return false;

    // 2. Scan top-level atoms for mdat and moov
    var atoms = scanTopLevelAtoms(bytes);
    var hasMdat = false;
    var hasMoov = false;
    for (var i = 0; i < atoms.length; i++) {
        if (atoms[i].type === 'mdat') hasMdat = true;
        if (atoms[i].type === 'moov') hasMoov = true;
    }

    return hasMdat && hasMoov;
}

// Helper to recursively find an atom of a specific type in the tree structure.
function findAtom(atom, type) {
    if (atom.type === type) return atom;
    var children = atom.children || [];
    for (var i = 0; i < children.length; i++) {
        var found = findAtom(children[i], type);
        if (found) return found;
    }
    return null;
}

// Core parsing algorithm operating on a Uint8Array.
function parseM4ABytes(bytes) {
    if (!verifyM4AStructure(bytes)) {
        throw new Error(
            'Unsupported or invalid file structure. Only M4A (.m4a) files with valid audio and metadata containers are supported.');
    }

    var atoms = scanTopLevelAtoms(bytes);
    var moovDescriptor = findAtomInList(atoms, 'moov');
    if (!moovDescriptor) return {};

    var moovAtom = parseAtomTree(bytes, moovDescriptor.offset, moovDescriptor.offset + moovDescriptor.size);

    var tagsResult = {};
    var udta = findChild(moovAtom, 'udta');
    if (udta) {
        var meta = findChild(udta, 'meta');
        if (meta) {
            var ilst = findChild(meta, 'ilst');
            if (ilst) {
                tagsResult = extractTags(ilst);
            }
        }
    }

    // Extract play duration from mvhd if it exists
    var mvhd = findAtom(moovAtom, 'mvhd');
    if (mvhd && mvhd.payload) {
        var payload = mvhd.payload;
        var version = payload[0];
        var timescale = 0;
        var duration = 0;
        if (version === 0 && payload.length >= 20) {
            var view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
            timescale = view.getUint32(12, false);
            duration = view.getUint32(16, false);
        } else if (version === 1 && payload.length >= 32) {
            var view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
            timescale = view.getUint32(20, false);
            duration = readUInt64(view, 24);
        }
        if (timescale > 0) {
            tagsResult.duration = duration / timescale;
        }
    }

    return tagsResult;
}

// Core modifying algorithm operating on a Uint8Array and outputting a new Uint8Array. Supporting zero-copy returns via
// options.returnParts.
function writeM4ABytes(bytes, newTags, options) {
    if (options === undefined) options = {};
    if (!verifyM4AStructure(bytes)) {
        throw new Error(
            'Unsupported or invalid file structure. Only M4A (.m4a) files with valid audio and metadata containers are supported.');
    }

    var atomsList = scanTopLevelAtoms(bytes);
    var moovIndex = findIndexInList(atomsList, 'moov');
    if (moovIndex === -1) {
        throw new Error('Invalid or corrupted M4A file structure.');
    }

    // Parse moov
    var moovDescriptor = atomsList[moovIndex];
    var moovAtom = parseAtomTree(bytes, moovDescriptor.offset, moovDescriptor.offset + moovDescriptor.size);

    // 2. Traverses/constructs the udta -> meta -> ilst path recursively
    var udta = getOrCreateChild(moovAtom, 'udta', stringToBytes('\x00\x00\x00\x08udta', 'latin1'));
    var meta = getOrCreateChild(udta, 'meta', stringToBytes('\x00\x00\x00\x0cmeta', 'latin1'), new Uint8Array(4));
    var ilst = getOrCreateChild(meta, 'ilst', stringToBytes('\x00\x00\x00\x08ilst', 'latin1'));

    // 3. Rebuilds/appends the metadata tag atoms list
    var newKeys = Object.keys(newTags);
    for (var i = 0; i < newKeys.length; i++) {
        var key = newKeys[i];
        var val = newTags[key];
        var atomType = TAG_TO_ATOM[key];
        if (!atomType) continue;

        var isPicture = key === 'picture';
        var newTagAtom = createTagAtom(atomType, val, isPicture);

        var oldIndex = findIndexInList(ilst.children, atomType);
        if (oldIndex !== -1) {
            ilst.children[oldIndex] = newTagAtom;
        } else {
            ilst.children.push(newTagAtom);
        }
    }

    // 4. Calculate change in moov size
    var tempMoovBytes = serializeAtomTree(moovAtom, 0);
    var newMoovSize = tempMoovBytes.length;

    // 5. Calculate precise new mdat offset to retrieve correct shift amount
    var currentNewOffset = 0;
    var oldMdatOffset = 0;
    var newMdatOffset = 0;
    var hasMdat = false;

    for (var i = 0; i < atomsList.length; i++) {
        var atom = atomsList[i];
        if (atom.type === 'mdat') {
            oldMdatOffset = atom.offset;
            newMdatOffset = currentNewOffset;
            hasMdat = true;
        }
        var atomSize = (atom.type === 'moov') ? newMoovSize : atom.size;
        currentNewOffset += atomSize;
    }

    // 6. Shift chunk offsets by the exact delta offset
    var shiftAmount = hasMdat ? (newMdatOffset - oldMdatOffset) : 0;
    var finalMoovBytes = serializeAtomTree(moovAtom, shiftAmount);

    // 7. Concatenate all atoms back preserving original order
    var outputParts = [];
    for (var i = 0; i < atomsList.length; i++) {
        var atom = atomsList[i];
        if (atom.type === 'moov') {
            outputParts.push(finalMoovBytes);
        } else {
            outputParts.push(atom.bytes);
        }
    }

    // Return segments array directly if requested
    if (options.returnParts) {
        return outputParts;
    }

    return concatUint8Arrays(outputParts);
}

// Always expose to window in browser
if (typeof window !== 'undefined') {
    window.Utils.writeM4ABytes = writeM4ABytes;
    window.Utils.parseM4ABytes = parseM4ABytes;
}

    // ============================================================
    // FILE: utils/promise.js
    // ============================================================

// src/js/utils/promise.js

// setImmediate fallback for Node v0.8.x and browser environments
var localSetImmediate = typeof setImmediate === 'function' ? setImmediate : function(fn) {
    setTimeout(fn, 0);
};

function FallbackPromise(executor) {
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

FallbackPromise.prototype.then = function(onFulfilled, onRejected) {
    var self = this;
    return new FallbackPromise(function(resolve, reject) {
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
            localSetImmediate(function() {
                handle(self.value);
            });
        }
    });
};

FallbackPromise.prototype.catch = function(onRejected) {
    return this.then(null, onRejected);
};

FallbackPromise.resolve = function(val) {
    return new FallbackPromise(function(resolve) {
        resolve(val);
    });
};

FallbackPromise.reject = function(reason) {
    return new FallbackPromise(function(resolve, reject) {
        reject(reason);
    });
};

FallbackPromise.all = function(promises) {
    return new FallbackPromise(function(resolve, reject) {
        var results = [];
        var completed = 0;
        if (promises.length === 0) return resolve(results);
        promises.forEach(function(p, i) {
            FallbackPromise.resolve(p).then(function(val) {
                results[i] = val;
                completed++;
                if (completed === promises.length) resolve(results);
            }, reject);
        });
    });
};

// Bind to unified wrapper
window.Utils.Promise = window.Promise || FallbackPromise;


    // ============================================================
    // FILE: utils/ui-loader.js
    // ============================================================

// src/js/utils/ui-loader.js

window.UI._styleRegistry = [];

// Push style block to memory registry with custom scope (default: '#ui-overlay')
window.Utils.registerStyle = function(cssLines, scope) {
    window.UI._styleRegistry.push({lines: cssLines, scope: scope !== undefined ? scope : '#ui-overlay'});
};

// Batch compile, auto-scope, and inject all styles into a single DOM element
window.Utils.injectAllStyles = function() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('songdl-injected-styles')) return;

    var styleEl = document.createElement('style');
    styleEl.id = 'songdl-injected-styles';

    var combinedCSS =
        window.UI._styleRegistry
            .map(function(block) {
                var lines = Array.isArray(block.lines) ? block.lines : [block.lines];
                var scope = block.scope;

                return lines
                    .map(function(line) {
                        var trimmed = line.trim();

                        // Prepend custom scope only if scope is defined and line is a selector
                        if (scope && trimmed.length > 0 &&
                            (trimmed.indexOf('{') !== -1 || trimmed.indexOf(',') === trimmed.length - 1) &&
                            trimmed.indexOf('@') !== 0 && trimmed.indexOf('}') !== 0 && trimmed.indexOf(scope) !== 0 &&
                            trimmed.indexOf('#ui-toggle-btn') !== 0) {
                            // Prepend selector scope
                            return scope + ' ' + line;
                        }
                        return line;
                    })
                    .join('\n');
            })
            .join('\n');

    // Bypasses CSP/unsafe-inline if running inside a Userscript Manager
    if (typeof GM_addStyle !== 'undefined') {
        GM_addStyle(combinedCSS);
    } else {
        styleEl.textContent = combinedCSS;
        document.head.appendChild(styleEl);
    }

    console.log('[StyleLoader] Batched and injected ' + window.UI._styleRegistry.length + ' style blocks');
};

// Compile HTML string array into a single markup string
window.Utils.compileHTML = function(htmlLines) {
    return Array.isArray(htmlLines) ? htmlLines.join('\n') : htmlLines;
};

// Compile HTML string array into a single interactive DOM element node
window.Utils.compileHTMLToNode = function(htmlLines) {
    var rawHtml = Array.isArray(htmlLines) ? htmlLines.join('\n') : htmlLines;
    var temp = document.createElement('div');
    temp.innerHTML = rawHtml.trim();
    return temp.firstElementChild;
};

// Render HTML strings or DOM elements or arrays of mixed content to a parent node container
window.Utils.render = function(parent, content) {
    if (!parent) return;
    parent.innerHTML = '';
    
    if (content === undefined || content === null) {
        return;
    }
    
    var items = Array.isArray(content) ? content : [content];
    items.forEach(function(item) {
        if (item === undefined || item === null) return;
        if (item instanceof HTMLElement) {
            parent.appendChild(item);
        } else if (typeof item === 'string') {
            parent.insertAdjacentHTML('beforeend', item);
        }
    });
};

// Bind click events on elements matching selector within parent, handling default/propagation details automatically
window.Utils.bindClick = function(parent, selector, handler) {
    if (!parent) return;
    var elements = selector ? parent.querySelectorAll(selector) : [parent];
    elements.forEach(function(element) {
        element.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            handler(e, element);
        });
    });
};


    // ============================================================
    // FILE: utils/cache.js
    // ============================================================

// src/utils/cache.js

window.Utils.Cache = {
    store: {},

    set: function(key, data) {
        this.store[key] = data;
    },

    get: function(key) {
        return this.store[key] !== undefined ? this.store[key] : null;
    },

    has: function(key) {
        return this.store[key] !== undefined;
    },

    getSearchKey: function(type, query, page, limit) {
        return 'search:' + type + ':' + query + ':' + (page || 1) + ':' + (limit || 20);
    },

    getDetailKey: function(type, token) {
        return 'detail:' + type + ':' + token;
    }
};


    // ============================================================
    // FILE: utils/logger.js
    // ============================================================

// src/js/utils/logger.js
// Centralized Logging Control Interceptor

window.Utils.LOGGING_ENABLED = true;

var originalLog = console.log;
var originalWarn = console.warn;
var originalError = console.error;

console.log = function() {
    if (window.Utils.LOGGING_ENABLED === false) return;
    originalLog.apply(console, arguments);
};

console.warn = function() {
    if (window.Utils.LOGGING_ENABLED === false) return;
    originalWarn.apply(console, arguments);
};

console.error = function() {
    // Errors always render by default, but respect the toggle if wanted
    if (window.Utils.LOGGING_ENABLED === false) return;
    originalError.apply(console, arguments);
};


    // ============================================================
    // FILE: ui/utils.js
    // ============================================================

// src/js/ui/utils.js

function escapeHtml(text) {
    if (!text) return '';
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
window.UI.escapeHtml = escapeHtml;



// Get a standard SVG vector placeholder matching the component type
function getDefaultImage(type) {
    var emoji = '🎵';
    if (type === 'artist') {
        emoji = '🎤';
    } else if (type === 'album') {
        emoji = '💿';
    } else if (type === 'playlist') {
        emoji = '🎶';
    }

    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">' +
        '<rect width="200" height="200" fill="#282828"/>' +
        '<text x="50%" y="60%" font-size="80" text-anchor="middle" dominant-baseline="middle">' + emoji +
        '</text></svg>';

    return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
}

// Expose getDefaultImage to utility scope
window.Utils.getDefaultImage = getDefaultImage;

function buildCard(options) {
    var type = options.type;
    var token = options.token;
    var image = options.image;
    if (!image || image.indexOf('placeholder.com') !== -1) {
        image = getDefaultImage(type);
    }
    var title = options.title || '';
    var subtitle = options.subtitle || '';
    var details = options.details || '';
    var buttonText = options.buttonText || '';

    // Map class names to fit existing CSS selectors in ui.css
    var titleClass = type === 'artist' ? 'artist-name' : type + '-title';
    var subtitleClass = type === 'artist' ? 'artist-role' : type + '-subtitle';
    if (type !== 'artist') {
        subtitleClass = type === 'album' ? 'album-artist' : 'playlist-artist';
    }

    /* clang-format off */
    var node = window.Utils.compileHTMLToNode([
        '<div class="' + type + '-card" data-token="' + token + '">',
        '    <img src="' + image + '" alt="' + escapeHtml(title) + '" />',
        '    <div class="' + type + '-info">',
        '        <div class="' + titleClass + '">' + escapeHtml(title) + '</div>',
        '        <div class="' + subtitleClass + '">' + escapeHtml(subtitle) + '</div>',
        details ? '        <div class="' + type + '-details">' + details + '</div>' : '',
        '        <button class="btn-view-' + type + '" data-token="' + token + '">',
        '            ' + buttonText,
        '        </button>',
        '    </div>',
        '</div>'
    ]);
    /* clang-format on */

    window.Utils.bindClick(node, null, function() {
        if (type === 'album') {
            window.UI.viewAlbum(token);
        } else if (type === 'playlist') {
            window.UI.viewPlaylist(token);
        } else if (type === 'artist') {
            window.UI.viewArtist(token);
        }
    });

    return node;
}

// Create HTML representations for album cards
function createAlbumCard(album) {
    var songCount = (album.more_info && album.more_info.song_count) || 0;
    return buildCard({
        type: 'album',
        token: album.token,
        image: album.image,
        title: album.title,
        subtitle: album.subtitle,
        details: songCount + ' songs • ' + escapeHtml(album.language || 'Unknown') + ' • ' + (album.year || 'N/A'),
        buttonText: '📂 View Album'
    });
}

// Create HTML representations for playlist cards
function createPlaylistCard(playlist) {
    var songCount = (playlist.more_info && playlist.more_info.song_count) || playlist.song_count || '0';
    var hasSongsText = playlist.subtitle && (playlist.subtitle.toLowerCase().indexOf('song') !== -1 || playlist.subtitle.toLowerCase().indexOf('track') !== -1);
    var details = hasSongsText ? escapeHtml(playlist.language || 'Unknown') : songCount + ' songs • ' + escapeHtml(playlist.language || 'Unknown');

    return buildCard({
        type: 'playlist',
        token: playlist.token,
        image: playlist.image,
        title: playlist.title,
        subtitle: playlist.subtitle || '',
        details: details,
        buttonText: '📂 View Playlist'
    });
}

// Create HTML representations for artist cards
function createArtistCard(artist) {
    return buildCard({
        type: 'artist',
        token: artist.token,
        image: artist.image,
        title: artist.name,
        subtitle: artist.role || 'Artist',
        buttonText: '🎤 View Artist'
    });
}

// Expose card creators to global window scope
window.UI.createArtistCard = createArtistCard;
window.UI.createAlbumCard = createAlbumCard;
window.UI.createPlaylistCard = createPlaylistCard;

    // ============================================================
    // FILE: utils/decrypt.js
    // ============================================================

// src/js/utils/decrypt.js

var KEY = new Uint32Array([
    36443656,  338827529, 170141697, 338826299, 170272797, 875566612, 170276616, 941097494,
    153487137, 941103620, 154281006, 940128288, 221380890, 688468270, 621941049, 688727305,
    622007300, 151861785, 890309646, 184882698, 874054925, 50799890,  874062625, 117842443,
    805908001, 119942188, 839720978, 102894652, 302780946, 103954180, 302782501, 338829583
]);

// Decrypt media URL
function decryptMediaUrl(encrypted) {
    // Get the DES implementation
    var desDecrypt = window.Utils.desDecrypt;

    if (!desDecrypt) {
        throw new Error('DES decryption library not available');
    }

    var binaryString;
    if (typeof atob === 'function') {
        binaryString = atob(encrypted);
    } else {
        binaryString = new Buffer(encrypted, 'base64').toString('binary');
    }

    var plain = desDecrypt(binaryString, KEY);
    return plain.slice(0, -plain.charCodeAt(plain.length - 1));
}

// Get decrypted URL from song object and format it with quality
function getDecryptedUrl(songData, quality) {
    var encrypted = songData.more_info ? songData.more_info.encrypted_media_url : null;
    if (!encrypted) throw new Error('No encrypted URL found');

    var decryptedUrl = decryptMediaUrl(encrypted);
    if (!decryptedUrl) throw new Error('Decryption failed');

    if (typeof window.Utils !== 'undefined' && window.Utils.formatters &&
        typeof window.Utils.formatters.formatUrlWithQuality === 'function') {
        return window.Utils.formatters.formatUrlWithQuality(decryptedUrl, quality || window.UI.currentQuality || 96);
    }
    return decryptedUrl;
}

// Expose to browser
if (typeof window !== 'undefined') {
    window.Utils.decryptMediaUrl = decryptMediaUrl;
    window.Utils.getDecryptedUrl = getDecryptedUrl;
    window.Utils.DES_KEY = KEY;
}


    // ============================================================
    // FILE: utils/resource.js
    // ============================================================

// src/js/utils/resource.js
// ============ HELPERS ============

function getHeaders() {
    return {
        'Referer': window.API.constants.REFERER,
        'Origin': window.API.constants.API_HOST,
        'User-Agent': window.API.constants.DEFAULT_HEADERS['User-Agent']
    };
}

function handleResponse(response, responseType, url) {
    if (!response.ok) {
        console.error('[Utils Fetch Error] Server returnedStatus:', response.status, 'for:', url);
        throw new Error('HTTP ' + response.status);
    }

    if (responseType === 'arraybuffer') return response.arrayBuffer();
    if (responseType === 'blob') return response.blob();
    return response;
}

function handleGMResponse(response, resolve, reject) {
    if (response.status === 200) {
        resolve(response.response);
    } else {
        reject(new Error('GM returned ' + response.status));
    }
}

// ============ FETCH METHODS ============

function fetchViaDirect(url, responseType) {
    return (window.Utils.fetch || fetch)(url, {headers: getHeaders()}).then(function(response) {
        return handleResponse(response, responseType, url);
    });
}

function fetchViaGM(url, responseType) {
    return new window.Utils.Promise(function(resolve, reject) {
        GM_xmlhttpRequest({
            method: 'GET',
            url: url,
            responseType: responseType === 'arraybuffer' ? 'arraybuffer' : 'blob',
            headers: getHeaders(),
            onload: function(response) {
                handleGMResponse(response, resolve, reject);
            },
            onerror: function(error) {
                reject(new Error('GM failed: ' + (error.error || 'Unknown')));
            },
            ontimeout: function() {
                reject(new Error('GM timeout'));
            }
        });
    });
}

// ============ MAIN FETCH FUNCTION ============

window.Utils.fetchResource = function(url, responseType) {
    responseType = responseType || 'arraybuffer';
    console.log('[Utils] Fetching:', url.substring(0, 60) + '...');

    // Proxy mode: direct fetch (CDN allows CORS)
    if (window.isProxy) {
        return fetchViaDirect(url, responseType);
    }

    // Userscript mode: use GM_xmlhttpRequest
    if (typeof GM_xmlhttpRequest !== 'undefined') {
        console.log('[Utils] Using GM_xmlhttpRequest');
        return fetchViaGM(url, responseType);
    }

    // Fallback: standard fetch
    console.log('[Utils] Using standard fetch');
    return fetchViaDirect(url, responseType);
};

// ============ FETCH ALBUM ART ============

window.Utils.getHighResImageUrl = function(url, isArtist) {
    if (!url) return '';
    return isArtist ? url.replace(/_50x50\.jpg$/, '_150x150.jpg') : url.replace(/\d+x\d+\.jpg$/, '500x500.jpg');
};

function processAlbumArt(buffer) {
    var artBytes = new Uint8Array(buffer);
    console.log('[Utils] Album art loaded:', (artBytes.length / 1024).toFixed(1) + ' KB');
    return {data: artBytes, format: 'jpeg'};
}

window.Utils.fetchAlbumArt = function(url) {
    if (!url) return window.Utils.Promise.resolve(null);
    var highResUrl = window.Utils.getHighResImageUrl(url, false);
    console.log('[Utils] Album art:', highResUrl);

    return window.Utils.fetchResource(highResUrl, 'arraybuffer').then(processAlbumArt).catch(function() {
        console.log('[Utils] High-res failed, trying original...');
        return window.Utils.fetchResource(url, 'arraybuffer').then(processAlbumArt).catch(function() {
            console.warn('[Utils] Album art fetch failed');
            return null;
        });
    });
};


    // ============================================================
    // FILE: utils/formatters.js
    // ============================================================

// src/js/utils/formatters.js

window.Utils.formatters = window.Utils.formatters || {};

// ============ DECODE ============
window.Utils.formatters.decode = function(text) {
    if (!text) return '';
    var current = text.toString();
    var last = '';

    while (current !== last) {
        last = current;
        current = last
            .replace(/&amp;/g, '&')
            .replace(/&#039;/g, '\'')
            .replace(/&#39;/g, '\'')
            .replace(/&apos;/g, '\'')
            .replace(/&quot;/g, '"')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>');
    }
    return current;
};

// ============ EXTRACT TOKEN ============
window.Utils.formatters.extractToken = function(url) {
    if (!url) return '';
    return url.split('/').pop() || '';
};



// ============ HIGH RES ARTIST IMAGE ============
window.Utils.formatters.getHighResArtistImage = function(url) {
    return window.Utils.getHighResImageUrl(url, true);
};

window.Utils.formatters.formatLyrics = function(rawLyrics) {
    return rawLyrics.replace(/<br>/g, '\n');
};

// Replace bitrate in decrypted URL with selected quality Example: https://.../song_96.mp4 -> https://.../song_320.mp4
window.Utils.formatters.formatUrlWithQuality = function(url, quality) {
    if (!url) return url;
    if (!quality) quality = 96;

    // Match pattern like _96.mp4, _160.mp4, _320.mp4
    // Replace with selected quality
    return url.replace(/_(\d+)\.mp4/, '_' + quality + '.mp4');
};

// ============ EXTRACT ARTISTS ============
window.Utils.formatters.extractArtists = function(songData) {
    var artistMap = songData.more_info ? songData.more_info.artistMap : null;

    var primaryArtists = (artistMap && artistMap.primary_artists) ? artistMap.primary_artists : [];
    var featuredArtists = (artistMap && artistMap.featured_artists) ? artistMap.featured_artists : [];

    var primaryNames = primaryArtists.map(function(a) {
        return a.name;
    });
    var featuredNames = featuredArtists.map(function(a) {
        return a.name;
    });
    var allNames = primaryNames.concat(featuredNames);
    var primaryArtist = primaryNames[0] || '';
    var allArtists = allNames.join(', ');

    return {
        primary: primaryArtists,
        featured: featuredArtists,
        primaryNames: primaryNames,
        featuredNames: featuredNames,
        allNames: allNames,
        primaryArtist: primaryArtist,
        allArtists: allArtists
    };
};

// ============ GET ALBUM NAME ============
window.Utils.formatters.getAlbumName = function(songData) {
    var albumName = songData.more_info ? window.Utils.formatters.decode(songData.more_info.album || '') : '';
    if (!albumName) {
        var subtitleParts = window.Utils.formatters.decode(songData.subtitle || '').split(' - ');
        if (subtitleParts.length > 1) {
            albumName = subtitleParts[subtitleParts.length - 1];
        }
    }
    return albumName;
};

// ============ FORMAT SEARCH RESULTS ============
window.Utils.formatters.formatSearchResults = function(data, type) {
    var results = (data.results || []).filter(function(item) {
        return item.type === type;
    });

    if (type === 'song') {
        results = results.map(window.Utils.formatters.formatSong);
    } else if (type === 'album') {
        results = results.map(window.Utils.formatters.formatAlbum);
    } else if (type === 'playlist') {
        results = results.map(window.Utils.formatters.formatPlaylist);
    } else if (type === 'artist') {
        results = results.map(window.Utils.formatters.formatArtistSearch);
    }

    return {total: Number(data.total || 0), start: Number(data.start || 0), results: results};
};

// ============ SONG FORMATTER ============
window.Utils.formatters.formatSong = function(song) {
    return {
        id: song.id,
        token: window.Utils.formatters.extractToken(song.perma_url),
        title: window.Utils.formatters.decode(song.title),
        subtitle: window.Utils.formatters.decode(song.subtitle),
        image: song.image || '',
        language: song.language,
        year: song.year,
        play_count: song.play_count || '0',
        more_info: {
            duration: song.more_info ? song.more_info.duration || 'N/A' : 'N/A',
            encrypted_media_url: song.more_info ? song.more_info.encrypted_media_url || '' : '',
            album: song.more_info ? window.Utils.formatters.decode(song.more_info.album || '') : '',
            album_url: song.more_info ? song.more_info.album_url || '' : '',
            artistMap: song.more_info ? song.more_info.artistMap || null : null,
            copyright_text: song.more_info ? window.Utils.formatters.decode(song.more_info.copyright_text || '') : '',
            has_lyrics: !!(song.more_info && (song.more_info.has_lyrics === 'true' || song.more_info.has_lyrics === true))
        },
        has_stream: song.more_info ? !!song.more_info.encrypted_media_url : false
    };
};

// ============ ALBUM FORMATTER ============
window.Utils.formatters.formatAlbum = function(album) {
    return {
        id: album.id,
        token: window.Utils.formatters.extractToken(album.perma_url),
        title: window.Utils.formatters.decode(album.title),
        subtitle: window.Utils.formatters.decode(album.subtitle),
        image: album.image || '',
        language: album.language,
        year: album.year,
        more_info: {song_count: album.more_info ? album.more_info.song_count || '0' : '0'}
    };
};

// ============ ALBUM DETAIL FORMATTER ============
window.Utils.formatters.formatAlbumDetail = function(data) {
    return {
        id: data.id,
        token: window.Utils.formatters.extractToken(data.perma_url),
        title: window.Utils.formatters.decode(data.title),
        artist: data.subtitle ? window.Utils.formatters.decode(data.subtitle) : '',
        image: data.image || '',
        language: data.language,
        year: data.year,
        song_count: data.list ? data.list.length : 0,
        songs: (data.list || []).map(function(song) {
            return window.Utils.formatters.formatSong(song);
        })
    };
};

// ============ PLAYLIST FORMATTER ============
window.Utils.formatters.formatPlaylist = function(playlist) {
    return {
        id: playlist.id,
        token: window.Utils.formatters.extractToken(playlist.perma_url),
        title: window.Utils.formatters.decode(playlist.title),
        subtitle: window.Utils.formatters.decode(playlist.subtitle || ''),
        image: playlist.image || '',
        language: playlist.more_info ? playlist.more_info.language || '' : '',
        year: '',
        more_info: {song_count: playlist.more_info ? playlist.more_info.song_count || '0' : '0'}
    };
};

// ============ PLAYLIST DETAIL FORMATTER ============
window.Utils.formatters.formatPlaylistDetail = function(data) {
    return {
        id: data.id,
        token: window.Utils.formatters.extractToken(data.perma_url),
        title: window.Utils.formatters.decode(data.title),
        subtitle: data.subtitle ? window.Utils.formatters.decode(data.subtitle) : '',
        image: data.image || '',
        language: data.language || '',
        year: '',
        list_count: parseInt(data.list_count) || 0,
        song_count: parseInt(data.song_count) || parseInt(data.list_count) || data.list ? data.list.length : 0,
        description: window.Utils.formatters.decode(data.header_desc || ''),
        songs: (data.list || []).map(function(song) {
            return window.Utils.formatters.formatSong(song);
        })
    };
};

// ============ ARTIST SEARCH FORMATTER ============
window.Utils.formatters.formatArtistSearch = function(artist) {
    return {
        id: artist.id,
        token: window.Utils.formatters.extractToken(artist.perma_url),
        name: artist.name || '',
        image: window.Utils.formatters.getHighResArtistImage(artist.image) || '',
        role: artist.role || 'Artist',
        type: 'artist'
    };
};

// ============ ARTIST DETAIL FORMATTER ============
window.Utils.formatters.formatArtistDetail = function(data) {
    // Parse bio
    var bioText = '';
    if (data.bio) {
        try {
            var bioArray = JSON.parse(data.bio);
            if (Array.isArray(bioArray) && bioArray.length > 0) {
                bioText = bioArray[0].text || '';
            }
        } catch (e) {
            bioText = data.bio;
        }
    }

    return {
        id: data.artistId,
        token: window.Utils.formatters.extractToken(data.perma_url),
        name: data.name || '',
        image: data.image || '',
        subtitle: data.subtitle || '',
        // fan_count removed (duplicate of subtitle)
        isVerified: data.isVerified || false,
        bio: bioText,  // Already parsed
        // First page songs and albums
        songs: (data.topSongs || []).map(window.Utils.formatters.formatSong),
        albums: (data.topAlbums || []).map(window.Utils.formatters.formatAlbum),
        // Other sections
        dedicatedPlaylists: (data.dedicated_artist_playlist || []).map(window.Utils.formatters.formatPlaylist),
        featuredPlaylists: (data.featured_artist_playlist || []).map(window.Utils.formatters.formatPlaylist),
        singles: (data.singles || []).map(window.Utils.formatters.formatAlbum),
        latestReleases: (data.latest_release || []).map(window.Utils.formatters.formatAlbum),
        // Store artistId for more API calls
        artistId: data.artistId
    };
};



// ============ DURATION FORMATTER ============
window.Utils.formatters.formatDuration = function(seconds) {
    if (isNaN(seconds) || seconds === null || seconds === undefined || seconds <= 0) return 'N/A';
    var secs = parseInt(seconds);
    var mins = Math.floor(secs / 60);
    var remainingSecs = secs % 60;
    return mins + ':' + (remainingSecs < 10 ? '0' + remainingSecs : remainingSecs);
};
window.Utils.formatDuration = window.Utils.formatters.formatDuration;



    // ============================================================
    // FILE: utils/url-helper.js
    // ============================================================

// src/js/utils/url-helper.js
// Parse URL to extract type and token
window.Utils.parseUrl = function(url) {
    if (!url) return {type: null, token: null};

    // Check if it's a valid URL
    if (url.indexOf(window.API.constants.API_HOST) === -1) {
        return {type: null, token: null};
    }

    // Determine type from URL
    var type = null;
    if (url.indexOf('/song/') !== -1) {
        type = 'song';
    } else if (url.indexOf('/album/') !== -1) {
        type = 'album';
    } else if (url.indexOf('/lyrics/') !== -1) {
        type = 'lyrics';
    } else if (url.indexOf('/featured/') !== -1) {
        type = 'playlist';
    } else if (url.indexOf('/artist/') !== -1) {
        type = 'artist';
    } else {
        return {type: null, token: null};
    }

    // Extract token (last part after /)
    var token = window.Utils.formatters.extractToken(url);
    if (!token) {
        return {type: null, token: null};
    }

    return {type: type, token: token};
};


    // ============================================================
    // FILE: utils/download-helper.js
    // ============================================================

// src/js/utils/download-helper.js
// Trigger a file download in the browser
window.Utils.downloadFile = function(data, filename) {
    var blob = new Blob([data], {type: 'audio/mp4'});
    var blobUrl = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();

    setTimeout(function() {
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
    }, 5000);

    return true;
};

// Build a filename from song metadata
window.Utils.buildFilename = function(song, quality) {
    var artists = window.Utils.formatters.extractArtists(song);
    var artist = artists.primaryArtist || song.subtitle || 'Unknown Artist';
    var safeTitle = (song.title || 'song').replace(/[^a-zA-Z0-9\s-]/g, '').trim();
    var safeArtist = artist.replace(/[^a-zA-Z0-9\s-]/g, '').trim();
    var filename = safeTitle + ' - ' + safeArtist;
    if (quality) {
        filename += ' (' + quality + ')';
    }
    return filename + '.m4a';
};


// Build metadata object for M4A
window.Utils.buildMetadata = function(song, albumArt, lyrics) {
    var artists = window.Utils.formatters.extractArtists(song);
    var allArtists = artists.allArtists || song.subtitle || '';

    var album = window.Utils.formatters.getAlbumName(song);
    var copyright = song.more_info ? song.more_info.copyright_text : '';

    var metadata = {
        title: song.title || '',
        artist: allArtists,
        album: album,
        year: song.year || '',
        genre: song.language || '',
        copyright: copyright,
        comment: 'Token: ' + (song.token || ''),
        album_artist: allArtists,
    };

    if (albumArt && albumArt.data && albumArt.data.length > 0) {
        metadata.picture = albumArt;
    }

    if (lyrics) {
        metadata.lyrics = lyrics;
    }

    return metadata;
};


    // ============================================================
    // FILE: services/song.js
    // ============================================================

// src/js/services/song.js
// Song business logic - orchestrates API calls and formatting
window.Services.Song = {
    // Search for songs and format results
    search: function(query, limit, page) {
        return window.API.searchSongs(query, limit, page).then(function(rawData) {
            return window.Utils.formatters.formatSearchResults(rawData, 'song');
        });
    },

    // Get decrypted song URL and metadata
    getDecrypted: function(token) {
        return window.API.getSong(token).then(function(rawData) {
            var songData = rawData.songs ? rawData.songs[0] : null;
            if (!songData) throw new Error('Song not found');

            var formattedSong = window.Utils.formatters.formatSong(songData);
            formattedSong.url = window.Utils.getDecryptedUrl(songData, window.UI.currentQuality || 96);
            return formattedSong;
        });
    },

    // Get lyrics for a song and cache them
    getLyrics: function(token) {
        var cached = window.Utils.Cache.get('lyrics:' + token);
        if (cached) {
            return window.Utils.Promise.resolve(cached);
        }

        return window.API.getLyrics(token).then(function(data) {
            var lyricsText = data.lyrics && data.lyrics.lyrics ? data.lyrics.lyrics : 'No lyrics available';
            lyricsText = window.Utils.formatters.formatLyrics(lyricsText);

            window.Utils.Cache.set('lyrics:' + token, lyricsText);
            return lyricsText;
        });
    }
};


    // ============================================================
    // FILE: services/album.js
    // ============================================================

// src/js/services/album.js
window.Services.Album = {
    // Search for albums and format results
    search: function(query, limit, page) {
        return window.API.searchAlbums(query, limit, page).then(function(rawData) {
            return window.Utils.formatters.formatSearchResults(rawData, 'album');
        });
    },

    // Get album details with formatted songs
    getDetails: function(token) {
        return window.API.getAlbum(token).then(function(rawData) {
            return window.Utils.formatters.formatAlbumDetail(rawData);
        });
    }
};


    // ============================================================
    // FILE: services/download.js
    // ============================================================

// src/js/services/download.js
// Download business logic
window.Services.Download = {
    // Download a song from pre-fetched data (no API call)
    songFromData: function(songData, filename) {
        console.log('[Services] Downloading song from data:', songData.title);

        var songUrl = songData.url;
        if (!songUrl) return window.Utils.Promise.reject(new Error('No stream URL available'));

        songUrl = window.Utils.formatters.formatUrlWithQuality(songUrl, window.UI.currentQuality || 96);

        // Initiate all requests in parallel
        var audioPromise = window.Utils.fetchResource(songUrl, 'arraybuffer');

        var artPromise =
            songData.image ? window.Utils.fetchAlbumArt(songData.image) : window.Utils.Promise.resolve(null);

        var lyricsPromise = (songData.more_info && songData.more_info.has_lyrics) ?
            window.Services.Song.getLyrics(songData.token || songData.id).catch(function(e) {
                console.warn('[Services] Failed to fetch lyrics:', e.message);
                return null;
            }) :
            window.Utils.Promise.resolve(null);

        // Resolve all in parallel
        return window.Utils.Promise.all([audioPromise, artPromise, lyricsPromise]).then(function(results) {
            var audioBuffer = results[0];
            var albumArtData = results[1];
            var lyricsText = results[2];

            var audioBytes = new Uint8Array(audioBuffer);
            if (audioBytes.length === 0) {
                throw new Error('Audio file is empty (0 bytes)');
            }

            // Build metadata and tag M4A
            var metadata = window.Utils.buildMetadata(songData, albumArtData, lyricsText);
            var artists = window.Utils.formatters.extractArtists(songData);
            console.log(
                '[Services] Metadata: title="' + songData.title + '", artist="' +
                (artists.allArtists || songData.subtitle || 'Unknown') + '"');

            var dataToDownload = audioBytes;
            if (typeof window.Utils.writeM4ABytes === 'function') {
                try {
                    dataToDownload = window.Utils.writeM4ABytes(audioBytes, metadata);
                    console.log('[Services] Metadata written to M4A');
                } catch (e) {
                    console.warn('[Services] Metadata write failed:', e.message);
                }
            }

            var quality = window.UI.currentQuality || 96;
            var finalFilename = filename || window.Utils.buildFilename(songData, quality);
            console.log('[Services] Filename:', finalFilename);

            return window.Utils.downloadFile(dataToDownload, finalFilename);
        });
    }
};


    // ============================================================
    // FILE: services/playlist.js
    // ============================================================

// src/js/services/playlist.js
// Playlist business logic - orchestrates API calls and formatting
window.Services.Playlist = {
    // Search for playlists and format results
    search: function(query, limit, page) {
        return window.API.searchPlaylists(query, limit, page).then(function(rawData) {
            return window.Utils.formatters.formatSearchResults(rawData, 'playlist');
        });
    },

    // Get playlist details with formatted songs Supports pagination
    getDetails: function(token, page, limit) {
        return window.API.getPlaylist(token, page, limit).then(function(rawData) {
            return window.Utils.formatters.formatPlaylistDetail(rawData);
        });
    }
};


    // ============================================================
    // FILE: services/artist.js
    // ============================================================

// src/js/services/artist.js
// Artist business logic - orchestrates API calls and formatting
window.Services.Artist = {
    // Search for artists and format results
    search: function(query, limit, page) {
        return window.API.searchArtists(query, limit, page).then(function(rawData) {
            return window.Utils.formatters.formatSearchResults(rawData, 'artist');
        });
    },

    // Get artist details with formatted songs and albums
    getDetails: function(token, category) {
        return window.API.getArtist(token, category).then(function(rawData) {
            return window.Utils.formatters.formatArtistDetail(rawData);
        });
    },

    // Get more songs by artist
    getMoreSongs: function(artistId, page, category) {
        return window.API.getArtistMoreSongs(artistId, page, category).then(function(rawData) {
            var songs = rawData.topSongs && rawData.topSongs.songs ? rawData.topSongs.songs : [];
            return {
                songs: songs.map(window.Utils.formatters.formatSong),
                total: rawData.topSongs ? rawData.topSongs.total || 0 : 0,
                last_page: rawData.topSongs ? rawData.topSongs.last_page !== false : true
            };
        });
    },

    // Get more albums by artist
    getMoreAlbums: function(artistId, page, category) {
        return window.API.getArtistMoreAlbums(artistId, page, category).then(function(rawData) {
            var albums = rawData.topAlbums && rawData.topAlbums.albums ? rawData.topAlbums.albums : [];
            return {
                albums: albums.map(window.Utils.formatters.formatAlbum),
                total: rawData.topAlbums ? rawData.topAlbums.total || 0 : 0,
                last_page: rawData.topAlbums ? rawData.topAlbums.last_page !== false : true
            };
        });
    }
};


    // ============================================================
    // FILE: ui/display/song-card.js
    // ============================================================

// src/js/ui/display/song-card.js

// ============ CREATE SONG CARD ============
function createSongCard(song, index, context) {
    var hasStream = song.has_stream;
    var songId = song.id || song.token || 'song-' + (index || 0);
    var duration = window.Utils.formatDuration(song.duration || (song.more_info && song.more_info.duration));
    var image = song.image || (context && context.image ? context.image : '');
    if (!image || image.indexOf('placeholder.com') !== -1) {
        image = window.Utils.getDefaultImage('song');
    }
    var contextLanguage = context ? context.language : '';
    var contextYear = context ? context.year : '';
    var titlePrefix = (index !== undefined && context) ? (index + 1) + '. ' : '';
    var hasLyrics = !!(song.more_info && song.more_info.has_lyrics);

    // Determine context type
    var isAlbumView = context && context.type === 'album';
    var isPlaylistView = context && context.type === 'playlist';

    // Extract album token and name for more menu
    var albumToken = null;
    var albumName = '';
    if (song.more_info && song.more_info.album_url) {
        albumToken = window.Utils.formatters.extractToken(song.more_info.album_url);
        albumName = song.more_info.album || 'Album';
    }

    // Extract artists from artistMap
    var artists = [];
    if (song.more_info && song.more_info.artistMap && song.more_info.artistMap.primary_artists) {
        artists = song.more_info.artistMap.primary_artists.map(function(artist) {
            return {name: artist.name, token: window.Utils.formatters.extractToken(artist.perma_url)};
        });
    }

    // Show album in menu only if NOT in album view (playlist view should show album)
    var showAlbumInMenu = albumToken && !isAlbumView;
    var hasMoreActions = showAlbumInMenu || artists.length > 0;

    // Context-specific display
    var artistDisplay = song.subtitle || '';
    if (isAlbumView && artistDisplay.indexOf(' - ') !== -1) {
        var parts = artistDisplay.split(' - ');
        artistDisplay = parts[0];
    }

    var playCountStr = '';
    if (song.play_count && song.play_count !== '0' && song.play_count !== 0) {
        playCountStr = parseInt(song.play_count).toLocaleString() + ' plays • ';
    }

    // Album view: compact details (no language/year)
    var detailsHtml;
    if (isAlbumView) {
        detailsHtml = playCountStr + duration;
    } else {
        detailsHtml = escapeHtml(contextLanguage || song.language || 'Unknown') + ' • ' +
            (song.year || contextYear || 'N/A') + ' • ' + playCountStr + duration;
    }

    /* clang-format off */
    var node = window.Utils.compileHTMLToNode([
        '<div class="song-card" data-token="' + (song.token || song.id) + '">',
        '    <img src="' + image + '" alt="' + escapeHtml(song.title) + '" />',
        '    <div class="song-info">',
        '        <div class="song-title">' + titlePrefix + escapeHtml(song.title) + '</div>',
        '        <div class="song-artist">' + escapeHtml(artistDisplay) + '</div>',
        '        <div class="song-details">' + detailsHtml + '</div>',
        '        <div class="song-actions">',
        '            <button class="btn-play" data-token="' + (song.token || song.id) + '" data-songid="' + songId + '"' + (!hasStream ? ' disabled' : '') + '>',
        '                ▶',
        '            </button>',
        '            <button class="btn-download" data-token="' + (song.token || song.id) + '" data-songid="' + songId + '"' + (!hasStream ? ' disabled' : '') + '>',
        '                ⬇',
        '            </button>',
        hasLyrics ? '            <button class="btn-lyrics" data-token="' + song.token + '" data-songid="' + songId + '">📜</button>' : '',
        hasMoreActions ? [
            '            <div class="more-actions-wrapper">',
            '                <button class="btn-more" data-token="' + song.token + '" data-songid="' + songId + '">⋮</button>',
            '                <div class="more-menu" id="more-menu-' + songId + '" style="display: none;">',
            showAlbumInMenu ? '                    <button class="more-item" data-action="album" data-token="' + albumToken + '">💿 ' + escapeHtml(albumName) + '</button>' : '',
            artists.map(function(artist) {
                return '                    <button class="more-item" data-action="artist" data-token="' + artist.token + '">🎤 ' + escapeHtml(artist.name) + '</button>';
            }).join('\n'),
            '                </div>',
            '            </div>'
        ].join('\n') : '',
        '            <div class="play-progress" id="play-progress-' + songId + '">⏳ Decrypting...</div>',
        '            <div class="download-progress" id="download-progress-' + songId + '">⏳ Downloading...</div>',
        !hasStream ? '            <span style="color:#999;font-size:12px;">No stream</span>' : '',
        '        </div>',
        '    </div>',
        '</div>'
    ]);
    /* clang-format on */

    // Attach song data directly to returned Node for queue building inside player.js
    node._songData = song;

    // Play operation
    window.Utils.bindClick(node, '.btn-play', function() {
        window.UI.playSong(song);
    });

    // Download operation
    window.Utils.bindClick(node, '.btn-download', function() {
        window.UI.downloadSong(song);
    });

    // Show Lyrics operation
    window.Utils.bindClick(node, '.btn-lyrics', function() {
        window.UI.showLyrics(song.token, song.id);
    });

    // Toggle More Actions Menu
    window.Utils.bindClick(node, '.btn-more', function() {
        var menu = node.querySelector('#more-menu-' + songId);
        if (menu) {
            document.querySelectorAll('.more-menu').forEach(function(m) {
                if (m !== menu) m.style.display = 'none';
            });
            menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
        }
    });

    // Click Action inside the More Actions Menu
    window.Utils.bindClick(node, '.more-item', function(e, element) {
        var action = element.dataset.action;
        var token = element.dataset.token;
        var menu = node.querySelector('.more-menu');
        if (menu) menu.style.display = 'none';
        if (action === 'album') {
            window.UI.viewAlbum(token);
        } else if (action === 'artist') {
            window.UI.viewArtist(token);
        }
    });

    return node;
}

/* clang-format off */
// Register song-card styling rules
window.Utils.registerStyle([
    '/* Song Cards */',
    '.song-card {',
    '    background: #1a1a1a;',
    '    padding: 15px;',
    '    border-radius: 8px;',
    '    display: flex;',
    '    gap: 15px;',
    '    align-items: center;',
    '    border: 1px solid #222;',
    '    position: relative;',
    '}',
    '.song-card img {',
    '    width: 80px;',
    '    height: 80px;',
    '    border-radius: 4px;',
    '    object-fit: cover;',
    '    background: #222;',
    '}',
    '.song-info {',
    '    flex: 1;',
    '}',
    '.song-title {',
    '    font-size: 18px;',
    '    font-weight: bold;',
    '    color: #fff;',
    '}',
    '.song-artist {',
    '    color: #aaa;',
    '    margin: 5px 0;',
    '}',
    '.song-details {',
    '    color: #666;',
    '    font-size: 14px;',
    '}',
    '.song-actions {',
    '    display: flex;',
    '    gap: 8px;',
    '    margin-top: 8px;',
    '    flex-wrap: wrap;',
    '}',
    '.btn-download {',
    '    padding: 6px 16px;',
    '    background: #1db954;',
    '    color: #111;',
    '    border: none;',
    '    border-radius: 4px;',
    '    font-size: 13px;',
    '    font-weight: bold;',
    '    cursor: pointer;',
    '}',
    '.btn-download:hover {',
    '    background: #1ed760;',
    '}',
    '.btn-download:disabled {',
    '    background: #555;',
    '    cursor: not-allowed;',
    '}',
    '.btn-play {',
    '    padding: 6px 16px;',
    '    background: #007bff;',
    '    color: white;',
    '    border: none;',
    '    border-radius: 4px;',
    '    font-size: 13px;',
    '    cursor: pointer;',
    '}',
    '.btn-play:hover {',
    '    background: #0056b3;',
    '}',
    '.btn-play:disabled {',
    '    background: #555;',
    '    cursor: not-allowed;',
    '}',
    '.download-progress,',
    '.play-progress {',
    '    display: none;',
    '    margin-top: 5px;',
    '    font-size: 12px;',
    '    color: #1db954;',
    '}',
    '.download-progress.active,',
    '.play-progress.active {',
    '    display: block;',
    '}',
    '.btn-lyrics {',
    '    padding: 6px 16px;',
    '    background: #6c757d;',
    '    color: white;',
    '    border: none;',
    '    border-radius: 4px;',
    '    font-size: 13px;',
    '    cursor: pointer;',
    '}',
    '.btn-lyrics:hover {',
    '    background: #5a6268;',
    '}',
    '/* More Actions Button Wrapper */',
    '.more-actions-wrapper {',
    '    position: relative;',
    '    display: inline-block;',
    '}',
    '/* ===== More Button ===== */',
    '.btn-more {',
    '    padding: 6px 12px;',
    '    background: transparent;',
    '    color: #aaa;',
    '    border: none;',
    '    border-radius: 4px;',
    '    font-size: 18px;',
    '    cursor: pointer;',
    '    line-height: 1;',
    '}',
    '.btn-more:hover {',
    '    color: #fff;',
    '    background: #282828;',
    '}',
    '/* ===== More Menu ===== */',
    '.more-menu {',
    '    position: absolute;',
    '    right: 0;',
    '    top: 100%;',
    '    min-width: 160px;',
    '    max-width: 250px;',
    '    background: #1a1a1a;',
    '    border: 1px solid #333;',
    '    border-radius: 8px;',
    '    padding: 4px 0;',
    '    z-index: 100;',
    '    box-shadow: 0 4px 12px rgba(0,0,0,0.5);',
    '    margin-top: 4px;',
    '}',
    '.more-item {',
    '    display: block;',
    '    width: 100%;',
    '    padding: 8px 16px;',
    '    background: transparent;',
    '    color: #ddd;',
    '    border: none;',
    '    text-align: left;',
    '    font-size: 14px;',
    '    cursor: pointer;',
    '    white-space: nowrap;',
    '    overflow: hidden;',
    '    text-overflow: ellipsis;',
    '}',
    '.more-item:hover {',
    '    background: #282828;',
    '    color: #fff;',
    '}'
]);
/* clang-format on */


    // ============================================================
    // FILE: ui/display/display-results.js
    // ============================================================

// src/js/ui/display/display-results.js

// ============ DISPLAY SONGS ============
function displaySongs(songs) {
    var container = document.createElement('div');
    container.className = 'results';

    songs.forEach(function(song, index) {
        var card = createSongCard(song, index);
        if (card) {
            container.appendChild(card);
        }
    });

    window.Utils.render(DOM.results, container);
}

// ============ DISPLAY ALBUMS ============
function displayAlbums(albums) {
    var container = document.createElement('div');
    container.className = 'results';

    albums.forEach(function(album) {
        var card = createAlbumCard(album);
        if (card) {
            container.appendChild(card);
        }
    });

    window.Utils.render(DOM.results, container);
}

// ============ DISPLAY PLAYLISTS ============
function displayPlaylists(playlists) {
    var container = document.createElement('div');
    container.className = 'results';

    playlists.forEach(function(playlist) {
        var card = createPlaylistCard(playlist);
        if (card) {
            container.appendChild(card);
        }
    });

    window.Utils.render(DOM.results, container);
}

// ============ DISPLAY ARTISTS ============
function displayArtists(artists) {
    var container = document.createElement('div');
    container.className = 'results';

    artists.forEach(function(artist) {
        var card = createArtistCard(artist);
        if (card) {
            container.appendChild(card);
        }
    });

    window.Utils.render(DOM.results, container);
}

// ============ DISPLAY SEARCH RESULTS ============
function displaySearchResults(results, type) {
    if (type === 'songs') {
        displaySongs(results);
    } else if (type === 'albums') {
        displayAlbums(results);
    } else if (type === 'playlists') {
        displayPlaylists(results);
    } else if (type === 'artists') {
        displayArtists(results);
    }
}

// ============ EXPOSE ============
window.UI.displaySongs = displaySongs;
window.UI.displayAlbums = displayAlbums;
window.UI.displayPlaylists = displayPlaylists;
window.UI.displayArtists = displayArtists;
window.UI.displaySearchResults = displaySearchResults;


    // ============================================================
    // FILE: ui/display/album-view.js
    // ============================================================

// src/js/ui/display/album-view.js

// Extract rendering logic to a separate function
function renderAlbum(album) {
    window.UI.hideSearchOptions();
    var image = album.image;
    if (!image || image.indexOf('placeholder.com') !== -1) {
        image = window.Utils.getDefaultImage('album');
    }
    var songCountInfo = album.song_count || (album.songs ? album.songs.length : 0);
    /* clang-format off */
    var headerHtml = window.Utils.compileHTML([
        '<div class="album-header">',
        '    <img src="' + image + '" alt="' + escapeHtml(album.title) + '" />',
        '    <div class="album-header-info">',
        '        <h2>' + escapeHtml(album.title) + '</h2>',
        '        <p>' + escapeHtml(album.subtitle || '') + '</p>',
        '        <p>' + songCountInfo + ' songs • ' + escapeHtml(album.language || 'Unknown') + ' • ' + (album.year || 'N/A') + '</p>',
        '        <div class="album-actions">',
        '            <button class="btn-back" id="btn-back-search">← Back</button>',
        '        </div>',
        '    </div>',
        '</div>'
    ]);
    /* clang-format on */

    var headerNode = window.Utils.compileHTMLToNode(headerHtml);
    window.UI.bindBackButton(headerNode, '#btn-back-search');

    var listNode = document.createElement('div');
    listNode.className = 'song-list album-songs-list';

    var albumContext =
        {type: 'album', image: album.image, language: album.language, year: album.year, title: album.title};

    if (album.songs && album.songs.length > 0) {
        album.songs.forEach(function(song, index) {
            var card = createSongCard(song, index, albumContext);
            if (card) {
                listNode.appendChild(card);
            }
        });
    } else {
        listNode.innerHTML = '<div class="no-results">No songs found in this album.</div>';
    }

    window.Utils.render(DOM.results, [headerNode, listNode]);
}

// ============ VIEW ALBUM ============
function viewAlbum(token) {
    console.log('[View] viewAlbum called, isRestoring:', window.UI._isRestoring);

    // Only push if not restoring
    if (!window.UI._isRestoring) {
        window.UI.Nav.push({type: 'album', data: {token: token}});
    }

    var cacheKey = window.Utils.Cache.getDetailKey('album', token);

    // Check cache first
    if (window.Utils.Cache.has(cacheKey)) {
        console.log('[Display] Using cached album:', token);
        var album = window.Utils.Cache.get(cacheKey);
        renderAlbum(album);
        return window.Utils.Promise.resolve();
    }

    DOM.results.innerHTML = '<div class="loading">📂 Loading album...</div>';
    DOM.stats.innerHTML = '';

    return window.Services.Album.getDetails(token)
        .then(function(album) {
            // Store in cache
            window.Utils.Cache.set(cacheKey, album);
            renderAlbum(album);
        })
        .catch(function(error) {
            console.error('[View Album Error] Failed to load or render details:', error);
            DOM.results.innerHTML =
                '<div class="error">❌ Error loading album: ' + escapeHtml(error.message) + '</div>';
        });
}

// ============ EXPOSE ============
window.UI.viewAlbum = viewAlbum;

/* clang-format off */
// Register album card and detail page styling rules
window.Utils.registerStyle([
    '/* Album Cards */',
    '.album-card {',
    '    background: #1a1a1a;',
    '    padding: 15px;',
    '    border-radius: 8px;',
    '    display: flex;',
    '    gap: 15px;',
    '    align-items: center;',
    '    cursor: pointer;',
    '    border: 1px solid #222;',
    '}',
    '.album-card:hover {',
    '    background: #222;',
    '}',
    '.album-card img {',
    '    width: 100px;',
    '    height: 100px;',
    '    border-radius: 4px;',
    '    object-fit: cover;',
    '    background: #222;',
    '}',
    '.album-info {',
    '    flex: 1;',
    '}',
    '.album-title {',
    '    font-size: 18px;',
    '    font-weight: bold;',
    '    color: #fff;',
    '}',
    '.album-artist {',
    '    color: #aaa;',
    '    margin: 5px 0;',
    '}',
    '.album-details {',
    '    color: #666;',
    '    font-size: 14px;',
    '}',
    '.btn-view-album {',
    '    margin-top: 8px;',
    '    padding: 6px 16px;',
    '    background: #6c757d;',
    '    color: white;',
    '    border: none;',
    '    border-radius: 4px;',
    '    font-size: 13px;',
    '    cursor: pointer;',
    '}',
    '.btn-view-album:hover {',
    '    background: #5a6268;',
    '}',
    '/* Album Detail View Banner */',
    '.album-header {',
    '    background: #1a1a1a;',
    '    padding: 20px;',
    '    border-radius: 8px;',
    '    display: flex;',
    '    gap: 20px;',
    '    margin-bottom: 20px;',
    '    border: 1px solid #222;',
    '}',
    '.album-header img {',
    '    width: 200px;',
    '    height: 200px;',
    '    border-radius: 4px;',
    '    object-fit: cover;',
    '    background: #222;',
    '}',
    '.album-header-info {',
    '    flex: 1;',
    '}',
    '.album-header-info h2 {',
    '    margin-bottom: 5px;',
    '    color: #fff;',
    '}',
    '.album-header-info p {',
    '    color: #aaa;',
    '    margin: 5px 0;',
    '}',
    '.album-actions {',
    '    margin-top: 15px;',
    '    display: flex;',
    '    gap: 10px;',
    '    flex-wrap: wrap;',
    '}',
    '/* Song List in Album Details */',
    '.song-list {',
    '    display: grid;',
    '    gap: 8px;',
    '}',
    '.song-item {',
    '    background: #1a1a1a;',
    '    padding: 12px 15px;',
    '    border-radius: 4px;',
    '    display: flex;',
    '    align-items: center;',
    '    gap: 15px;',
    '    border: 1px solid #222;',
    '}',
    '.song-item .song-title {',
    '    flex: 2;',
    '    font-weight: 500;',
    '    font-size: 15px;',
    '    color: #fff;',
    '}',
    '.song-item .song-artist {',
    '    flex: 2;',
    '    color: #aaa;',
    '    font-size: 14px;',
    '}',
    '.song-item .song-duration {',
    '    color: #666;',
    '    font-size: 13px;',
    '    min-width: 50px;',
    '}',
    '/* Responsive */',
    '@media (max-width: 600px) {',
    '    .album-header {',
    '        flex-direction: column;',
    '        align-items: center;',
    '        text-align: center;',
    '    }',
    '    .album-header img {',
    '        width: 150px;',
    '        height: 150px;',
    '    }',
    '    .song-item {',
    '        flex-wrap: wrap;',
    '    }',
    '    .song-item .song-title {',
    '        flex: 1 1 100%;',
    '    }',
    '    .song-item .song-artist {',
    '        flex: 1 1 100%;',
    '    }',
    '}'
]);
/* clang-format on */


    // ============================================================
    // FILE: ui/display/playlist-view.js
    // ============================================================

// src/js/ui/display/playlist-view.js

// ============ LOAD MORE PLAYLIST ============
function loadMorePlaylist() {
    if (window.UI._playlistState.isLoading) return window.Utils.Promise.resolve();
    window.UI._playlistState.isLoading = true;

    var btn = document.getElementById('playlist-load-more-btn');
    if (btn) {
        btn.textContent = 'Loading...';
        btn.disabled = true;
    }

    var nextPage = window.UI._playlistState.currentPage + 1;
    var cacheKey = window.Utils.Cache.getDetailKey('playlist', window.UI._playlistState.token) + ':' + nextPage + ':' +
        window.UI._playlistState.limit;

    var promise;

    // Check cache first
    if (window.Utils.Cache.has(cacheKey)) {
        console.log('[Display] Using cached playlist page:', nextPage);
        promise = window.Utils.Promise.resolve(window.Utils.Cache.get(cacheKey));
    } else {
        promise =
            window.Services.Playlist.getDetails(window.UI._playlistState.token, nextPage, window.UI._playlistState.limit)
                .then(function(data) {
                    window.Utils.Cache.set(cacheKey, data);
                    return data;
                });
    }

    return promise
        .then(function(data) {
            // Append songs
            if (data.songs && data.songs.length > 0) {
                var resultsDiv = document.getElementById('results');

                // Remove load more button
                var oldBtn = document.getElementById('playlist-load-more-btn');
                if (oldBtn) oldBtn.remove();

                // Calculate starting index for this page (global)
                var startIndex = (nextPage - 1) * window.UI._playlistState.limit;

                // Append new songs with correct global numbering
                var targetList = resultsDiv ? (resultsDiv.querySelector('.playlist-songs-list') || resultsDiv) : null;
                data.songs.forEach(function(song, idx) {
                    var globalIndex = startIndex + idx;
                    var songCard = createSongCard(song, globalIndex, data);
                    if (songCard && targetList) {
                        targetList.appendChild(songCard);
                    }
                });

                // Update state
                window.UI._playlistState.currentPage = nextPage;
                window.UI._playlistLoadedPages.push(cacheKey);

                // Update active stack data using helper
                window.UI.Nav.updateCurrent({loadedPages: window.UI._playlistLoadedPages.slice()});

                // Show load more button again
                showPlaylistLoadMoreButton();
            } else {
                var endMsg = document.createElement('div');
                endMsg.className = 'end-of-results';
                endMsg.id = 'playlist-load-more-btn';
                endMsg.textContent = '🏁 End of playlist';
                document.getElementById('results').appendChild(endMsg);
            }
        })
        .catch(function(error) {
            console.error('[Display] Load more playlist error:', error);
            var btn = document.getElementById('playlist-load-more-btn');
            if (btn) {
                btn.textContent = 'Retry';
                btn.disabled = false;
            }
        })
        .then(function() {
            window.UI._playlistState.isLoading = false;
        });
}

// ============ SHOW PLAYLIST LOAD MORE BUTTON ============
function showPlaylistLoadMoreButton() {
    var resultsDiv = document.getElementById('results');
    if (!resultsDiv) return;

    // Remove existing load more button
    var existingBtn = document.getElementById('playlist-load-more-btn');
    if (existingBtn) existingBtn.remove();

    // Check if more results exist
    var hasMore = false;
    if (window.UI._playlistState.total > 0) {
        var loadedCount = window.UI._playlistLoadedPages.length * window.UI._playlistState.limit;
        hasMore = loadedCount < window.UI._playlistState.total;
    } else {
        var lastKey = window.UI._playlistLoadedPages[window.UI._playlistLoadedPages.length - 1];
        var lastData = window.Utils.Cache.get(lastKey);
        if (lastData && lastData.songs) {
            hasMore = lastData.songs.length >= window.UI._playlistState.limit;
        }
    }

    if (!hasMore) {
        var endMsg = document.createElement('div');
        endMsg.className = 'end-of-results';
        endMsg.id = 'playlist-load-more-btn';
        endMsg.textContent = '🏁 End of playlist';
        resultsDiv.appendChild(endMsg);
        return;
    }

    var btn = document.createElement('button');
    btn.id = 'playlist-load-more-btn';
    btn.className = 'btn-load-more';
    btn.textContent = 'Load ' + window.UI._playlistState.limit + ' More Songs';
    btn.addEventListener('click', function() {
        loadMorePlaylist();
    });
    resultsDiv.appendChild(btn);
}

// ============ RENDER PLAYLIST ============
function renderPlaylist(playlist) {
    window.UI.hideSearchOptions();
    var image = playlist.image;
    if (!image || image.indexOf('placeholder.com') !== -1) {
        image = window.Utils.getDefaultImage('playlist');
    }
    var playlistCountInfo = playlist.list_count || playlist.song_count || 0;
    /* clang-format off */
    var headerHtml = window.Utils.compileHTML([
        '<div class="playlist-header">',
        '    <img src="' + image + '" alt="' + escapeHtml(playlist.title) + '" />',
        '    <div class="playlist-header-info">',
        '        <h2>' + escapeHtml(playlist.title) + '</h2>',
        '        <p>' + escapeHtml(playlist.subtitle || '') + '</p>',
        '        <p>' + playlistCountInfo + ' songs • ' + escapeHtml(playlist.language || 'Unknown') + '</p>',
        playlist.description ? '        <p class="playlist-description">' + escapeHtml(playlist.description) + '</p>' : '',
        '        <div class="playlist-actions">',
        '            <button class="btn-back" id="btn-back-search">← Back</button>',
        '        </div>',
        '    </div>',
        '</div>'
    ]);
    /* clang-format on */

    var headerNode = window.Utils.compileHTMLToNode(headerHtml);
    window.UI.bindBackButton(headerNode, '#btn-back-search');

    var listNode = document.createElement('div');
    listNode.className = 'song-list playlist-songs-list';

    var playlistContext = {
        type: 'playlist',
        image: playlist.image,
        language: playlist.language,
        year: playlist.year,
        title: playlist.title
    };

    if (playlist.songs && playlist.songs.length > 0) {
        playlist.songs.forEach(function(song, index) {
            var card = createSongCard(song, index, playlistContext);
            if (card) {
                listNode.appendChild(card);
            }
        });
    } else {
        listNode.innerHTML = '<div class="no-results">No songs found in this playlist.</div>';
    }

    window.Utils.render(DOM.results, [headerNode, listNode]);
}

function viewPlaylist(token) {
    console.log('[View] viewPlaylist called, isRestoring:', window.UI._isRestoring);

    // Only push if not restoring
    if (!window.UI._isRestoring) {
        window.UI.Nav.push({type: 'playlist', data: {token: token, page: 1, loadedPages: []}});
    }

    // Reset playlist state
    window.UI._playlistState.token = token;
    window.UI._playlistState.currentPage = 1;
    window.UI._playlistState.limit = 50;
    window.UI._playlistState.total = 0;
    window.UI._playlistState.isLoading = false;
    window.UI._playlistLoadedPages = [];

    var page = window.UI._playlistState.currentPage;
    var limit = window.UI._playlistState.limit;
    var cacheKey = 'playlist:' + token + ':' + page + ':' + limit;

    DOM.results.innerHTML = '<div class="loading">📂 Loading playlist...</div>';
    DOM.stats.innerHTML = '';

    // Check cache first
    if (window.Utils.Cache.has(cacheKey)) {
        console.log('[Display] Using cached playlist page 1:', token);
        var playlist = window.Utils.Cache.get(cacheKey);
        window.UI._playlistState.total = parseInt(playlist.list_count) || parseInt(playlist.song_count) || 0;
        window.UI._playlistLoadedPages.push(cacheKey);

        // Update stack entry with the first page
        var currentStack = window.UI.Nav.getStack();
        for (var i = currentStack.length - 1; i >= 0; i--) {
            if (currentStack[i].type === 'playlist') {
                currentStack[i].data.loadedPages = window.UI._playlistLoadedPages.slice();
                console.log('[Nav] Updated playlist stack with first page');
                break;
            }
        }

        window.UI.renderPlaylist(playlist);
        window.UI.showPlaylistLoadMoreButton();
        return window.Utils.Promise.resolve();
    }

    return window.Services.Playlist.getDetails(token, page, limit)
        .then(function(playlist) {
            // Store in cache
            window.Utils.Cache.set(cacheKey, playlist);
            window.UI._playlistState.total = parseInt(playlist.list_count) || parseInt(playlist.song_count) || 0;
            window.UI._playlistLoadedPages.push(cacheKey);

            // Update stack entry with the first page
            var currentStack = window.UI.Nav.getStack();
            for (var i = currentStack.length - 1; i >= 0; i--) {
                if (currentStack[i].type === 'playlist') {
                    currentStack[i].data.loadedPages = window.UI._playlistLoadedPages.slice();
                    console.log('[Nav] Updated playlist stack with first page');
                    break;
                }
            }

            window.UI.renderPlaylist(playlist);
            window.UI.showPlaylistLoadMoreButton();
        })
        .catch(function(error) {
            console.error('[View Playlist Error] Failed to load or render details:', error);
            DOM.results.innerHTML =
                '<div class="error">❌ Error loading playlist: ' + escapeHtml(error.message) + '</div>';
        });
}

// ============ EXPOSE ============
window.UI.viewPlaylist = viewPlaylist;
window.UI.loadMorePlaylist = loadMorePlaylist;
window.UI.renderPlaylist = renderPlaylist;
window.UI.showPlaylistLoadMoreButton = showPlaylistLoadMoreButton;

/* clang-format off */
// Register playlist card and detail page styling rules
window.Utils.registerStyle([
    '/* Playlist Cards */',
    '.playlist-card {',
    '    background: #1a1a1a;',
    '    padding: 15px;',
    '    border-radius: 8px;',
    '    display: flex;',
    '    gap: 15px;',
    '    align-items: center;',
    '    cursor: pointer;',
    '    border: 1px solid #222;',
    '}',
    '.playlist-card:hover {',
    '    background: #222;',
    '}',
    '.playlist-card img {',
    '    width: 100px;',
    '    height: 100px;',
    '    border-radius: 4px;',
    '    object-fit: cover;',
    '    background: #222;',
    '}',
    '.playlist-info {',
    '    flex: 1;',
    '}',
    '.playlist-title {',
    '    font-size: 18px;',
    '    font-weight: bold;',
    '    color: #fff;',
    '}',
    '.playlist-artist {',
    '    color: #aaa;',
    '    margin: 5px 0;',
    '}',
    '.playlist-details {',
    '    color: #666;',
    '    font-size: 14px;',
    '}',
    '.btn-view-playlist {',
    '    margin-top: 8px;',
    '    padding: 6px 16px;',
    '    background: #6c757d;',
    '    color: white;',
    '    border: none;',
    '    border-radius: 4px;',
    '    font-size: 13px;',
    '    cursor: pointer;',
    '}',
    '.btn-view-playlist:hover {',
    '    background: #5a6268;',
    '}',
    '/* Playlist Header */',
    '.playlist-header {',
    '    background: #1a1a1a;',
    '    padding: 20px;',
    '    border-radius: 8px;',
    '    display: flex;',
    '    gap: 20px;',
    '    margin-bottom: 20px;',
    '    border: 1px solid #222;',
    '}',
    '.playlist-header img {',
    '    width: 200px;',
    '    height: 200px;',
    '    border-radius: 4px;',
    '    object-fit: cover;',
    '    background: #222;',
    '}',
    '.playlist-header-info {',
    '    flex: 1;',
    '}',
    '.playlist-header-info h2 {',
    '    margin-bottom: 5px;',
    '    color: #fff;',
    '}',
    '.playlist-header-info p {',
    '    color: #aaa;',
    '    margin: 5px 0;',
    '}',
    '.playlist-description {',
    '    color: #888 !important;',
    '    font-style: italic;',
    '    margin-top: 10px !important;',
    '}',
    '.playlist-actions {',
    '    margin-top: 15px;',
    '    display: flex;',
    '    gap: 10px;',
    '    flex-wrap: wrap;',
    '}',
    '/* Responsive */',
    '@media (max-width: 600px) {',
    '    .playlist-header {',
    '        flex-direction: column;',
    '        align-items: center;',
    '        text-align: center;',
    '    }',
    '    .playlist-header img {',
    '        width: 150px;',
    '        height: 150px;',
    '    }',
    '}'
]);
/* clang-format on */


    // ============================================================
    // FILE: ui/display/artist-view.js
    // ============================================================

// src/js/ui/display/artist-view.js

window.UI._artistState = {
    token: '',
    artistId: '',
    category: 'popular',  // 'popular' | 'latest'
    songPage: 1,
    albumPage: 1,
    limit: 10,
    isLoadingSongs: false,
    isLoadingAlbums: false
};
window.UI._artistSongPages = [];
window.UI._artistAlbumPages = [];

// ============ RENDER HEADER ============
function renderHeaderNode(artist) {
    // Parse bio if it's a JSON string
    var bioText = '';
    if (artist.bio) {
        try {
            var bioArray = JSON.parse(artist.bio);
            if (Array.isArray(bioArray) && bioArray.length > 0) {
                bioText = bioArray[0].text || '';
            }
        } catch (e) {
            bioText = artist.bio;
        }
    }

    var image = artist.image;
    if (!image || image.indexOf('placeholder.com') !== -1) {
        image = window.Utils.getDefaultImage('artist');
    }

    var bioTagHtml = '';
    if (bioText) {
        bioTagHtml = '<p class="artist-bio">' + escapeHtml(bioText.substring(0, 200)) +
            (bioText.length > 200 ? '...' : '') + '</p>\n';
    }

    var checkedIcon = artist.isVerified ? '✅' : '';

    /* clang-format off */
    var headerNode = window.Utils.compileHTMLToNode([
        '<div class="artist-header">',
        '    <img src="' + image + '" alt="' + artist.name + '" />',
        '    <div class="artist-header-info">',
        '        <h2>' + escapeHtml(artist.name) + ' ' + checkedIcon + '</h2>',
        '        <p>' + escapeHtml(artist.subtitle || '') + '</p>',
        '        ' + bioTagHtml + '        <div class="artist-actions">',
        '            <button class="btn-back" id="btn-back">← Back</button>',
        '        </div>',
        '    </div>',
        '</div>'
    ]);

    var tabsNode = window.Utils.compileHTMLToNode([
        '<div class="artist-tabs">',
        '    <button class="artist-tab active" data-category="popular">🔥 Popular</button>',
        '    <button class="artist-tab" data-category="latest">🕐 Latest</button>',
        '</div>'
    ]);
    /* clang-format on */

    window.UI.bindBackButton(headerNode, '#btn-back');

    window.Utils.bindClick(tabsNode, '.artist-tab', function(e, tab) {
        var category = tab.dataset.category;
        window.UI.switchArtistCategory(category);
    });

    return [headerNode, tabsNode];
}

// ============ RENDER FOOTER (Static Sections) ============
function renderFooterNode(artist) {
    var container = document.createElement('div');
    container.className = 'artist-sections-wrapper';

    if (artist.dedicatedPlaylists && artist.dedicatedPlaylists.length > 0) {
        var section = window.Utils.compileHTMLToNode([
            '<div class="artist-playlists-section" id="artist-dedicated-playlists">',
            '    <h3>Dedicated Playlists</h3>',
            '    <div class="playlist-list"></div>',
            '</div>'
        ]);
        var list = section.querySelector('.playlist-list');
        artist.dedicatedPlaylists.forEach(function(playlist) {
            var card = createPlaylistCard(playlist);
            if (card && list) list.appendChild(card);
        });
        container.appendChild(section);
    }

    if (artist.featuredPlaylists && artist.featuredPlaylists.length > 0) {
        var section = window.Utils.compileHTMLToNode([
            '<div class="artist-playlists-section" id="artist-featured-playlists">',
            '    <h3>Featured In</h3>',
            '    <div class="playlist-list"></div>',
            '</div>'
        ]);
        var list = section.querySelector('.playlist-list');
        artist.featuredPlaylists.forEach(function(playlist) {
            var card = createPlaylistCard(playlist);
            if (card && list) list.appendChild(card);
        });
        container.appendChild(section);
    }

    if (artist.singles && artist.singles.length > 0) {
        var section = window.Utils.compileHTMLToNode([
            '<div class="artist-albums-section" id="artist-singles">',
            '    <h3>Singles</h3>',
            '    <div class="album-list"></div>',
            '</div>'
        ]);
        var list = section.querySelector('.album-list');
        artist.singles.forEach(function(single) {
            var card = createAlbumCard(single);
            if (card && list) list.appendChild(card);
        });
        container.appendChild(section);
    }

    if (artist.latestReleases && artist.latestReleases.length > 0) {
        var section = window.Utils.compileHTMLToNode([
            '<div class="artist-albums-section" id="artist-latest-releases">',
            '    <h3>Latest Releases</h3>',
            '    <div class="album-list"></div>',
            '</div>'
        ]);
        var list = section.querySelector('.album-list');
        artist.latestReleases.forEach(function(release) {
            var card = createAlbumCard(release);
            if (card && list) list.appendChild(card);
        });
        container.appendChild(section);
    }

    return container;
}

// ============ RENDER DYNAMIC SONGS SECTION ============
function renderSongsSectionNode(songs, category, totalSongs) {
    var songHeaderCount = songs ? songs.length : 0;
    var node = window.Utils.compileHTMLToNode([
        '<div class="artist-songs-section" id="artist-dynamic-songs" data-category="' + category + '">',
        '    <h3>Top Songs (' + songHeaderCount + ')</h3>',
        '    <div class="song-list"></div>',
        '    <div id="artist-songs-load-more"></div>',
        '</div>'
    ]);

    var listDiv = node.querySelector('.song-list');

    if (songs && songs.length > 0) {
        var artistContext = {type: 'artist', image: '', language: '', year: '', title: window.UI._artistState.token};
        songs.forEach(function(song, index) {
            var card = createSongCard(song, index, artistContext);
            if (card && listDiv) listDiv.appendChild(card);
        });
    } else {
        if (listDiv) listDiv.innerHTML = '<div class="no-results">No songs found</div>';
    }

    return node;
}

// ============ RENDER DYNAMIC ALBUMS SECTION ============
function renderAlbumsSectionNode(albums, category, totalAlbums) {
    var albumHeaderCount = albums ? albums.length : 0;
    var node = window.Utils.compileHTMLToNode([
        '<div class="artist-albums-section" id="artist-dynamic-albums" data-category="' + category + '">',
        '    <h3>Top Albums (' + albumHeaderCount + ')</h3>',
        '    <div class="album-list"></div>',
        '    <div id="artist-albums-load-more"></div>',
        '</div>'
    ]);

    var listDiv = node.querySelector('.album-list');

    if (albums && albums.length > 0) {
        albums.forEach(function(album) {
            var card = createAlbumCard(album);
            if (card && listDiv) listDiv.appendChild(card);
        });
    } else {
        if (listDiv) listDiv.innerHTML = '<div class="no-results">No albums found</div>';
    }

    return node;
}

// ============ SET ACTIVE TAB ============
function setActiveTab(category) {
    var tabs = document.querySelectorAll('.artist-tab');
    tabs.forEach(function(tab) {
        tab.classList.toggle('active', tab.dataset.category === category);
    });
}

// ============ RENDER ARTIST ============
function renderArtist(artist) {
    window.UI.hideSearchOptions();
    // 1. Build full Node blocks in correct order
    var headerNodes = renderHeaderNode(artist); // Returns [headerNode, tabsNode]
    var songsNode = renderSongsSectionNode(artist.songs, window.UI._artistState.category || 'popular', artist.totalSongs);
    var albumsNode = renderAlbumsSectionNode(artist.albums, window.UI._artistState.category || 'popular', artist.totalAlbums);
    var footerNode = renderFooterNode(artist);  // Static sections wrapper node at the bottom

    var nodes = [];
    nodes.push(headerNodes[0]);
    nodes.push(headerNodes[1]);
    nodes.push(songsNode);
    nodes.push(albumsNode);
    nodes.push(footerNode);

    window.Utils.render(DOM.results, nodes);
    DOM.stats.innerHTML = '';

    // 2. Show load more buttons
    showArtistSongsLoadMore();
    showArtistAlbumsLoadMore();

    // 3. Set active tab
    setActiveTab(window.UI._artistState.category || 'popular');
}

// ============ VIEW ARTIST ============
function viewArtist(token, category) {
    console.log('[DEBUG] viewArtist called with:', {token: token, category: category});

    // If category is undefined, try to get it from the navigation stack
    if (!category) {
        var stack = window.UI.Nav.getStack();
        for (var i = stack.length - 1; i >= 0; i--) {
            if (stack[i].type === 'artist') {
                category = stack[i].data.category || 'popular';
                console.log('[DEBUG] Found category from stack:', category);
                break;
            }
        }
        // If still no category, default to 'popular'
        if (!category) {
            category = 'popular';
            console.log('[DEBUG] Using default category: popular');
        }
    }

    console.log('[View] viewArtist called, isRestoring:', window.UI._isRestoring);
    category = category || 'popular';

    if (!window.UI._isRestoring) {
        window.UI.Nav.push({type: 'artist', data: {token: token, category: category}});
    }

    // Reset state with the category
    window.UI._artistState.token = token;
    window.UI._artistState.category = category;
    window.UI._artistState.songPage = 1;
    window.UI._artistState.albumPage = 1;
    window.UI._artistState.isLoadingSongs = false;
    window.UI._artistState.isLoadingAlbums = false;

    window.UI._artistSongPages = [];
    window.UI._artistAlbumPages = [];

    DOM.results.innerHTML = '<div class="loading">🎤 Loading artist...</div>';
    DOM.stats.innerHTML = '';

    var cacheKey = 'artist:' + token + ':' + category;
    console.log('[DEBUG] Looking for cache key:', cacheKey);
    if (window.Utils.Cache.has(cacheKey)) {
        console.log('[DEBUG] Cache FOUND for key:', cacheKey);
        var artist = window.Utils.Cache.get(cacheKey);
        window.UI._artistState.artistId = artist.artistId || artist.id;
        renderArtist(artist);
        return window.Utils.Promise.resolve();
    } else {
        console.log('[DEBUG] Cache MISS for key:', cacheKey);
    }

    return window.Services.Artist.getDetails(token, category)
        .then(function(artist) {
            window.Utils.Cache.set(cacheKey, artist);
            window.UI._artistState.artistId = artist.artistId || artist.id;
            renderArtist(artist);
        })
        .catch(function(error) {
            console.error('[View Artist Error] Failed to load or render details:', error);
            DOM.results.innerHTML =
                '<div class="error">❌ Error loading artist: ' + escapeHtml(error.message) + '</div>';
        });
}

// ============ SWITCH ARTIST CATEGORY ============
function switchArtistCategory(category) {
    console.log('[Artist] Switching category:', category);

    // 1. Update state
    window.UI._artistState.category = category;
    window.UI._artistState.songPage = 1;
    window.UI._artistState.albumPage = 1;
    window.UI._artistSongPages = [];
    window.UI._artistAlbumPages = [];

    // 2. Update navigation stack entry with the new category
    var currentStack = window.UI.Nav.getStack();
    for (var i = currentStack.length - 1; i >= 0; i--) {
        if (currentStack[i].type === 'artist') {
            currentStack[i].data.category = category;
            console.log('[Nav] Updated artist stack category to:', category);
            break;
        }
    }

    // 3. Set active tab (visual)
    setActiveTab(category);

    // 4. Check cache for this category
    var token = window.UI._artistState.token;
    var fullCacheKey = 'artist:' + token + ':' + category;
    var artistData = window.Utils.Cache.get(fullCacheKey);

    if (artistData) {
        console.log('[Display] Using cached artist data for category:', category);
        updateDynamicParts(artistData.songs, artistData.albums, category);
        return window.Utils.Promise.resolve();
    }

    // 5. Fetch from API
    var songsContainer = document.getElementById('artist-dynamic-songs');
    var albumsContainer = document.getElementById('artist-dynamic-albums');
    if (songsContainer) songsContainer.innerHTML = '<div class="loading">🎤 Loading songs...</div>';
    if (albumsContainer) albumsContainer.innerHTML = '<div class="loading">🎤 Loading albums...</div>';

    return window.Services.Artist.getDetails(token, category)
        .then(function(artist) {
            window.Utils.Cache.set(fullCacheKey, artist);
            updateDynamicParts(artist.songs, artist.albums, category);
            window.UI._artistState.totalSongs = artist.totalSongs || 0;
            window.UI._artistState.totalAlbums = artist.totalAlbums || 0;
        })
        .catch(function(error) {
            if (songsContainer)
                songsContainer.innerHTML =
                    '<div class="error">❌ Error loading songs: ' + escapeHtml(error.message) + '</div>';
            if (albumsContainer)
                albumsContainer.innerHTML =
                    '<div class="error">❌ Error loading albums: ' + escapeHtml(error.message) + '</div>';
        });
}

// ============ UPDATE DYNAMIC PARTS ============
function updateDynamicParts(songs, albums, category) {
    console.log('[Artist] updateDynamicParts called');
    console.log('[Artist] songs count:', songs ? songs.length : 0);
    console.log('[Artist] albums count:', albums ? albums.length : 0);
    console.log('[Artist] category:', category);

    // 1. Update songs section (using ID)
    var songsContainer = document.getElementById('artist-dynamic-songs');
    if (songsContainer && songsContainer.parentNode) {
        var newSongsNode = renderSongsSectionNode(songs, category);
        songsContainer.parentNode.replaceChild(newSongsNode, songsContainer);
    }

    // 2. Update albums section (using ID)
    var albumsContainer = document.getElementById('artist-dynamic-albums');
    console.log('[Artist] albumsContainer found:', albumsContainer ? 'YES' : 'NO');
    if (albumsContainer && albumsContainer.parentNode) {
        var newAlbumsNode = renderAlbumsSectionNode(albums, category);
        albumsContainer.parentNode.replaceChild(newAlbumsNode, albumsContainer);
    }

    // 3. Attach _songData to new cards
    var cards = DOM.results.querySelectorAll('.song-card');
    var allSongs = songs || [];
    cards.forEach(function(card, index) {
        if (allSongs[index]) {
            card._songData = allSongs[index];
        }
    });

    // 5. Show load more buttons
    showArtistSongsLoadMore();
    showArtistAlbumsLoadMore();
}

// ============ SHOW ARTIST SONGS LOAD MORE ============
function showArtistSongsLoadMore() {
    var container = document.getElementById('artist-songs-load-more');
    if (!container) return;

    var totalSongs = 0;
    var loadedCount = (window.UI._artistSongPages.length + 1) * window.UI._artistState.limit;

    var hasMore = false;
    if (totalSongs > 0) {
        hasMore = loadedCount < totalSongs;
    } else {
        var songsContainer = document.querySelector('.artist-songs-section .song-list');
        var currentCount = songsContainer ? songsContainer.querySelectorAll('.song-card').length : 0;
        if (window.UI._artistSongPages.length === 0) {
            hasMore = currentCount >= window.UI._artistState.limit;
        } else {
            var lastPageKey = window.UI._artistSongPages[window.UI._artistSongPages.length - 1];
            var lastData = lastPageKey ? window.Utils.Cache.get(lastPageKey) : null;
            hasMore = lastData && lastData.songs && lastData.songs.length >= window.UI._artistState.limit;
        }
    }

    if (!hasMore) {
        container.innerHTML = '<div class="end-of-results">🏁 End of songs</div>';
        return;
    }

    /* clang-format off */
    container.innerHTML = window.Utils.compileHTML([
        '<button class="btn-load-more" id="artist-songs-load-more-btn">',
        '    Load ' + window.UI._artistState.limit + ' More Songs',
        '</button>'
    ]);
    /* clang-format on */

    var btn = document.getElementById('artist-songs-load-more-btn');
    if (btn) {
        btn.addEventListener('click', function() {
            loadMoreArtistSongs();
        });
    }
}

// ============ LOAD MORE ARTIST SONGS ============
function loadMoreArtistSongs() {
    if (window.UI._artistState.isLoadingSongs) return window.Utils.Promise.resolve();
    window.UI._artistState.isLoadingSongs = true;

    var btn = document.getElementById('artist-songs-load-more-btn');
    if (btn) {
        btn.textContent = 'Loading...';
        btn.disabled = true;
    }

    var nextPage = window.UI._artistState.songPage + 1;
    var artistId = window.UI._artistState.artistId;
    var category = window.UI._artistState.category;

    // ============ CHECK CACHE ============
    var cacheKey = 'artist:' + artistId + ':' + category + ':songs:page:' + nextPage;
    if (window.Utils.Cache.has(cacheKey)) {
        console.log('[Artist] Using cached songs page:', nextPage);
        var cachedData = window.Utils.Cache.get(cacheKey);
        var songs = cachedData.songs || [];
        var total = cachedData.total || 0;

        // Append songs
        if (songs.length > 0) {
            appendArtistSongs(songs, nextPage, total, cacheKey);
        } else {
            var container = document.getElementById('artist-songs-load-more');
            if (container) {
                container.innerHTML = '<div class="end-of-results">🏁 End of songs</div>';
            }
        }
        window.UI._artistState.isLoadingSongs = false;
        if (btn) {
            btn.textContent = 'Load ' + window.UI._artistState.limit + ' More Songs';
            btn.disabled = false;
        }
        return window.Utils.Promise.resolve();
    }

    return window.Services.Artist.getMoreSongs(artistId, nextPage, category)
        .then(function(result) {
            var songs = result.songs || [];
            var total = result.total || 0;

            // ============ STORE IN CACHE ============
            window.Utils.Cache.set(cacheKey, {songs: songs, total: total});

            // Append songs
            if (songs.length > 0) {
                appendArtistSongs(songs, nextPage, total, cacheKey);
            } else {
                var container = document.getElementById('artist-songs-load-more');
                if (container) {
                    container.innerHTML = '<div class="end-of-results">🏁 End of songs</div>';
                }
            }
        })
        .catch(function(error) {
            console.error('[Artist] Load more songs error:', error);
            var container = document.getElementById('artist-songs-load-more');
            if (container) {
                container.innerHTML = '<button class="btn-load-more" id="artist-songs-load-more-btn">Retry</button>';
                var newBtn = document.getElementById('artist-songs-load-more-btn');
                if (newBtn) {
                    newBtn.addEventListener('click', function() {
                        loadMoreArtistSongs();
                    });
                }
            }
        })
        .then(function() {
            window.UI._artistState.isLoadingSongs = false;
            if (btn) {
                btn.textContent = 'Load ' + window.UI._artistState.limit + ' More Songs';
                btn.disabled = false;
            }
        });
}

// ============ APPEND ARTIST SONGS ============
function appendArtistSongs(songs, page, total, cacheKey) {
    var songsContainer = document.querySelector('.artist-songs-section .song-list');
    if (!songsContainer) return;

    var artistContext = {type: 'artist', image: '', language: '', year: '', title: window.UI._artistState.token};

    // Get current card count BEFORE appending
    var cardsBefore = songsContainer.querySelectorAll('.song-card').length;

    songs.forEach(function(song, idx) {
        var globalIndex = cardsBefore + idx;
        var songCard = createSongCard(song, globalIndex, artistContext);
        if (songCard) {
            songsContainer.appendChild(songCard);
        }
    });

    // Update state
    window.UI._artistState.songPage = page;
    window.UI._artistSongPages.push(cacheKey || ('artist_songs_' + window.UI._artistState.artistId + '_' + page));

    // Update active stack data using helper
    window.UI.Nav.updateCurrent({loadedSongPages: window.UI._artistSongPages.slice()});

    // Update load more button
    showArtistSongsLoadMore();

    // Update stats
    var h3 = document.querySelector('.artist-songs-section h3');
    if (h3) {
        var currentCount = songsContainer.querySelectorAll('.song-card').length;
        h3.textContent = 'Top Songs (' + currentCount + ')';
    }
}

// ============ SHOW ARTIST ALBUMS LOAD MORE ============
function showArtistAlbumsLoadMore() {
    var container = document.getElementById('artist-albums-load-more');
    if (!container) return;

    var totalAlbums = window.UI._artistState.totalAlbums || 0;
    var loadedCount = (window.UI._artistAlbumPages.length + 1) * window.UI._artistState.limit;

    var hasMore = false;
    if (totalAlbums > 0) {
        hasMore = loadedCount < totalAlbums;
    } else {
        var albumsContainer = document.getElementById('artist-dynamic-albums');
        var albumList = albumsContainer ? albumsContainer.querySelector('.album-list') : null;
        var currentCount = albumList ? albumList.querySelectorAll('.album-card').length : 0;
        if (window.UI._artistAlbumPages.length === 0) {
            hasMore = currentCount >= window.UI._artistState.limit;
        } else {
            var lastPageKey = window.UI._artistAlbumPages[window.UI._artistAlbumPages.length - 1];
            var lastData = lastPageKey ? window.Utils.Cache.get(lastPageKey) : null;
            hasMore = lastData && lastData.albums && lastData.albums.length >= window.UI._artistState.limit;
        }
    }

    if (!hasMore) {
        container.innerHTML = '<div class="end-of-results">🏁 End of albums</div>';
        return;
    }

    /* clang-format off */
    container.innerHTML = window.Utils.compileHTML([
        '<button class="btn-load-more" id="artist-albums-load-more-btn">',
        '    Load ' + window.UI._artistState.limit + ' More Albums',
        '</button>'
    ]);
    /* clang-format on */

    var btn = document.getElementById('artist-albums-load-more-btn');
    if (btn) {
        btn.addEventListener('click', function() {
            loadMoreArtistAlbums();
        });
    }
}

// ============ LOAD MORE ARTIST ALBUMS ============
function loadMoreArtistAlbums() {
    if (window.UI._artistState.isLoadingAlbums) return window.Utils.Promise.resolve();
    window.UI._artistState.isLoadingAlbums = true;

    var btn = document.getElementById('artist-albums-load-more-btn');
    if (btn) {
        btn.textContent = 'Loading...';
        btn.disabled = true;
    }

    var nextPage = window.UI._artistState.albumPage + 1;
    var artistId = window.UI._artistState.artistId;
    var category = window.UI._artistState.category;

    // ============ CHECK CACHE ============
    var cacheKey = 'artist:' + artistId + ':' + category + ':albums:page:' + nextPage;
    if (window.Utils.Cache.has(cacheKey)) {
        console.log('[Artist] Using cached albums page:', nextPage);
        var cachedData = window.Utils.Cache.get(cacheKey);
        var albums = cachedData.albums || [];
        var total = cachedData.total || 0;

        if (albums.length > 0) {
            appendArtistAlbums(albums, nextPage, total, cacheKey);
        } else {
            var container = document.getElementById('artist-albums-load-more');
            if (container) {
                container.innerHTML = '<div class="end-of-results">🏁 End of albums</div>';
            }
        }
        window.UI._artistState.isLoadingAlbums = false;
        if (btn) {
            btn.textContent = 'Load ' + window.UI._artistState.limit + ' More Albums';
            btn.disabled = false;
        }
        return window.Utils.Promise.resolve();
    }

    return window.Services.Artist.getMoreAlbums(artistId, nextPage, category)
        .then(function(result) {
            var albums = result.albums || [];
            var total = result.total || 0;

            // ============ STORE IN CACHE ============
            window.Utils.Cache.set(cacheKey, {albums: albums, total: total});

            if (albums.length > 0) {
                appendArtistAlbums(albums, nextPage, total, cacheKey);
            } else {
                var container = document.getElementById('artist-albums-load-more');
                if (container) {
                    container.innerHTML = '<div class="end-of-results">🏁 End of albums</div>';
                }
            }
        })
        .catch(function(error) {
            console.error('[Artist] Load more albums error:', error);
            var container = document.getElementById('artist-albums-load-more');
            if (container) {
                container.innerHTML = '<button class="btn-load-more" id="artist-albums-load-more-btn">Retry</button>';
                var newBtn = document.getElementById('artist-albums-load-more-btn');
                if (newBtn) {
                    newBtn.addEventListener('click', function() {
                        loadMoreArtistAlbums();
                    });
                }
            }
        })
        .then(function() {
            window.UI._artistState.isLoadingAlbums = false;
            if (btn) {
                btn.textContent = 'Load ' + window.UI._artistState.limit + ' More Albums';
                btn.disabled = false;
            }
        });
}

function appendArtistAlbums(albums, page, total, cacheKey) {
    var albumsContainer = document.getElementById('artist-dynamic-albums');
    if (!albumsContainer) return;

    var albumList = albumsContainer.querySelector('.album-list');
    if (!albumList) return;

    albums.forEach(function(album) {
        var albumCard = createAlbumCard(album);
        if (albumCard && albumList) {
            albumList.appendChild(albumCard);
        }
    });

    // Update state
    window.UI._artistState.albumPage = page;
    window.UI._artistAlbumPages.push(cacheKey || ('artist_albums_' + window.UI._artistState.artistId + '_' + page));

    // Update active stack data using helper
    window.UI.Nav.updateCurrent({loadedAlbumPages: window.UI._artistAlbumPages.slice()});

    // Update load more button
    showArtistAlbumsLoadMore();

    // Update stats
    var h3 = albumsContainer.querySelector('h3');
    if (h3) {
        var currentCount = albumList.querySelectorAll('.album-card').length;
        h3.textContent = 'Top Albums (' + currentCount + ')';
    }
}

// ============ RESTORE ARTIST ============
function restoreArtist(data) {
    console.log('[Restore] Artist:', data);
    var category = data.category || 'popular';
    var token = data.token;
    var loadedSongPages = data.loadedSongPages || [];
    var loadedAlbumPages = data.loadedAlbumPages || [];

    window.UI._isRestoring = true;

    // First, load structural view (page 1)
    return viewArtist(token, category)
        .then(function() {
            // Append paged songs
            loadedSongPages.forEach(function(pageKey) {
                if (window.Utils.Cache.has(pageKey)) {
                    var cachedVal = window.Utils.Cache.get(pageKey);
                    var pageNum = parseInt(pageKey.split(':').pop()) || 2;
                    var songs = cachedVal.songs || [];
                    var total = cachedVal.total || 0;
                    appendArtistSongs(songs, pageNum, total, pageKey);
                }
            });

            // Append paged albums
            loadedAlbumPages.forEach(function(pageKey) {
                if (window.Utils.Cache.has(pageKey)) {
                    var cachedVal = window.Utils.Cache.get(pageKey);
                    var pageNum = parseInt(pageKey.split(':').pop()) || 2;
                    var albums = cachedVal.albums || [];
                    var total = cachedVal.total || 0;
                    appendArtistAlbums(albums, pageNum, total, pageKey);
                }
            });
        })
        .then(function() {
            window.UI._isRestoring = false;
        });
}

// ============ EXPOSE ============
window.UI.viewArtist = viewArtist;
window.UI.loadMoreArtistSongs = loadMoreArtistSongs;
window.UI.loadMoreArtistAlbums = loadMoreArtistAlbums;
window.UI.renderArtist = renderArtist;
window.UI.restoreArtist = restoreArtist;
window.UI.switchArtistCategory = switchArtistCategory;

/* clang-format off */
// Register artist card and detail page styling rules
window.Utils.registerStyle([
    '/* ===== Artist Header ===== */',
    '.artist-header {',
    '    background: #1a1a1a;',
    '    padding: 20px;',
    '    border-radius: 8px;',
    '    display: flex;',
    '    gap: 20px;',
    '    margin-bottom: 20px;',
    '    border: 1px solid #222;',
    '}',
    '.artist-header img {',
    '    width: 150px;',
    '    height: 150px;',
    '    border-radius: 50%;',
    '    object-fit: cover;',
    '    background: #222;',
    '}',
    '.artist-header-info {',
    '    flex: 1;',
    '}',
    '.artist-header-info h2 {',
    '    margin-bottom: 5px;',
    '    color: #fff;',
    '    font-size: 24px;',
    '}',
    '.artist-header-info p {',
    '    color: #aaa;',
    '    margin: 5px 0;',
    '}',
    '.artist-bio {',
    '    color: #888 !important;',
    '    font-size: 14px;',
    '    margin-top: 10px !important;',
    '    line-height: 1.6;',
    '}',
    '.artist-actions {',
    '    margin-top: 15px;',
    '    display: flex;',
    '    gap: 10px;',
    '    flex-wrap: wrap;',
    '}',
    '/* ===== Artist Tabs ===== */',
    '.artist-tabs {',
    '    display: flex;',
    '    gap: 10px;',
    '    margin-bottom: 20px;',
    '    border-bottom: 1px solid #333;',
    '    padding-bottom: 10px;',
    '}',
    '.artist-tab {',
    '    padding: 8px 16px;',
    '    background: transparent;',
    '    color: #888;',
    '    border: none;',
    '    border-radius: 4px;',
    '    font-size: 14px;',
    '    cursor: pointer;',
    '    transition: all 0.2s;',
    '}',
    '.artist-tab:hover {',
    '    color: #fff;',
    '    background: #282828;',
    '}',
    '.artist-tab.active {',
    '    color: #1db954;',
    '    background: rgba(29, 185, 84, 0.1);',
    '    font-weight: bold;',
    '}',
    '/* ===== Artist Sections ===== */',
    '.artist-songs-section,',
    '.artist-albums-section,',
    '.artist-playlists-section {',
    '    margin-top: 20px;',
    '}',
    '.artist-songs-section h3,',
    '.artist-albums-section h3,',
    '.artist-playlists-section h3 {',
    '    color: #fff;',
    '    font-size: 18px;',
    '    margin-bottom: 12px;',
    '    padding-bottom: 8px;',
    '    border-bottom: 1px solid #333;',
    '}',
    '/* ===== Artist Cards (Search Results) ===== */',
    '.artist-card {',
    '    background: #1a1a1a;',
    '    padding: 15px;',
    '    border-radius: 8px;',
    '    display: flex;',
    '    gap: 15px;',
    '    align-items: center;',
    '    cursor: pointer;',
    '    border: 1px solid #222;',
    '}',
    '.artist-card:hover {',
    '    background: #222;',
    '}',
    '.artist-card img {',
    '    width: 80px;',
    '    height: 80px;',
    '    border-radius: 50%;',
    '    object-fit: cover;',
    '    background: #222;',
    '}',
    '.artist-info {',
    '    flex: 1;',
    '}',
    '.artist-name {',
    '    font-size: 18px;',
    '    font-weight: bold;',
    '    color: #fff;',
    '}',
    '.artist-role {',
    '    color: #aaa;',
    '    margin: 5px 0;',
    '}',
    '.btn-view-artist {',
    '    margin-top: 8px;',
    '    padding: 6px 16px;',
    '    background: #6c757d;',
    '    color: white;',
    '    border: none;',
    '    border-radius: 4px;',
    '    font-size: 13px;',
    '    cursor: pointer;',
    '}',
    '.btn-view-artist:hover {',
    '    background: #5a6268;',
    '}',
    '/* ===== Responsive ===== */',
    '@media (max-width: 600px) {',
    '    .artist-header {',
    '        flex-direction: column;',
    '        align-items: center;',
    '        text-align: center;',
    '    }',
    '    .artist-header img {',
    '        width: 120px;',
    '        height: 120px;',
    '    }',
    '    .artist-tabs {',
    '        flex-wrap: wrap;',
    '        justify-content: center;',
    '    }',
    '    .artist-tab {',
    '        flex: 1;',
    '        text-align: center;',
    '        padding: 8px 12px;',
    '        font-size: 13px;',
    '    }',
    '}'
]);
/* clang-format on */


    // ============================================================
    // FILE: ui/display/lyrics.js
    // ============================================================

// src/js/ui/display/lyrics.js

// ============ FETCH AND DISPLAY LYRICS ============
function showLyrics(token) {
    console.log('[Display] Fetching lyrics for token:', token);

    window.Services.Song.getLyrics(token)
        .then(function(lyricsText) {
            displayLyricsOverlay(lyricsText);
        })
        .catch(function(error) {
            console.error('[Display] Lyrics fetch error:', error);
            alert('Failed to fetch lyrics: ' + error.message);
        });
}

// ============ DISPLAY LYRICS OVERLAY ============
function displayLyricsOverlay(lyricsText) {
    // Create overlay
    var overlay = document.createElement('div');
    overlay.id = 'lyrics-overlay';
    overlay.className = 'lyrics-overlay';

    /* clang-format off */
    overlay.innerHTML = window.Utils.compileHTML([
        '<div class="lyrics-card">',
        '    <div class="lyrics-header">',
        '        <h2>📜 Lyrics</h2>',
        '        <button id="lyrics-close-btn">✕</button>',
        '    </div>',
        '    <div id="lyrics-content">' + escapeHtml(lyricsText),
        '    </div>',
        '</div>'
    ]);
    /* clang-format on */

    var closeBtn = overlay.querySelector('#lyrics-close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeLyricsOverlay();
        });
    }

    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            e.preventDefault();
            e.stopPropagation();
            closeLyricsOverlay();
        }
    });

    document.body.appendChild(overlay);
}

function closeLyricsOverlay() {
    var overlay = document.getElementById('lyrics-overlay');
    if (overlay) {
        overlay.remove();
        console.log('[Display] Lyrics overlay closed');
    }
}

// ============ EXPOSE ============
window.UI.showLyrics = showLyrics;
window.UI.closeLyricsOverlay = closeLyricsOverlay;

/* clang-format off */
// Register lyrics styling rules
window.Utils.registerStyle([
    '/* ===== Lyrics Overlay ===== */',
    '.lyrics-overlay {',
    '    position: fixed;',
    '    top: 0;',
    '    left: 0;',
    '    right: 0;',
    '    bottom: 0;',
    '    background: rgba(0, 0, 0, 0.95);',
    '    color: #fff;',
    '    z-index: 2147483647;',
    '    display: flex;',
    '    flex-direction: column;',
    '    align-items: center;',
    '    justify-content: center;',
    '    padding: 20px;',
    '    font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif;',
    '}',
    '.lyrics-card {',
    '    max-width: 600px;',
    '    width: 100%;',
    '    max-height: 80vh;',
    '    background: #1a1a1a;',
    '    border-radius: 12px;',
    '    padding: 24px;',
    '    border: 1px solid #333;',
    '    display: flex;',
    '    flex-direction: column;',
    '}',
    '.lyrics-header {',
    '    display: flex;',
    '    justify-content: space-between;',
    '    align-items: center;',
    '    margin-bottom: 16px;',
    '}',
    '.lyrics-header h2 {',
    '    color: #1db954;',
    '    margin: 0;',
    '    font-size: 20px;',
    '}',
    '#lyrics-close-btn {',
    '    background: #333;',
    '    color: #fff;',
    '    border: none;',
    '    border-radius: 50%;',
    '    width: 36px;',
    '    height: 36px;',
    '    font-size: 18px;',
    '    cursor: pointer;',
    '    display: flex;',
    '    align-items: center;',
    '    justify-content: center;',
    '    transition: background 0.2s;',
    '}',
    '#lyrics-close-btn:hover {',
    '    background: #444;',
    '}',
    '#lyrics-content {',
    '    overflow-y: auto;',
    '    max-height: 60vh;',
    '    color: #ddd;',
    '    font-size: 15px;',
    '    line-height: 1.8;',
    '    white-space: pre-wrap;',
    '    padding-right: 8px;',
    '}'
], '');
/* clang-format on */


    // ============================================================
    // FILE: ui/display/navigation.js
    // ============================================================

// src/js/ui/display/navigation.js

// ============ RESTORE SEARCH ============
function restoreSearch(data) {
    console.log('[Restore] Search:', data);

    var searchType = data.type || 'songs';
    var query = data.query;
    var loadedPages = data.loadedPages || [];

    // Get first page from cache
    var firstPageKey = window.Utils.Cache.getSearchKey(searchType, query, 1, 20);

    if (!window.Utils.Cache.has(firstPageKey)) {
        console.log('[Restore] No cache for search, falling back to search');
        window.UI.search();
        return;
    }

    // Collect all results from all loaded pages
    var allResults = [];
    if (loadedPages.length > 0) {
        loadedPages.forEach(function(pageKey) {
            var pageData = window.Utils.Cache.get(pageKey);
            if (pageData && pageData.results) {
                allResults = allResults.concat(pageData.results);
            }
        });
    } else {
        var data = window.Utils.Cache.get(firstPageKey);
        allResults = data.results || [];
        loadedPages = [firstPageKey];
    }

    if (allResults.length === 0) {
        console.log('[Restore] No results found, falling back to search');
        window.UI.search();
        return;
    }

    // Restore state
    window.UI._searchState.type = searchType;
    window.UI._searchState.query = query;
    window.UI._searchState.currentPage = loadedPages.length;
    window.UI._searchLoadedPages = loadedPages.slice();
    window.UI.currentSearchType = searchType;
    window.UI.setCategoryHighlight(searchType);

    // Display results
    displaySearchResults(allResults, searchType);
    showLoadMoreButton('search');

    var statsDiv = document.getElementById('stats');
    if (statsDiv) statsDiv.innerHTML = 'Found ' + allResults.length + ' ' + searchType + ' (cached)';

    console.log('[Restore] Search restored with', allResults.length, 'results');
}

// ============ RESTORE PLAYLIST ============
function restorePlaylist(data) {
    console.log('[Restore] Playlist:', data);

    var token = data.token;
    var loadedPages = data.loadedPages || [];

    // Get first page from cache
    var firstPageKey = 'playlist:' + token + ':' + 1 + ':' + 50;

    if (!window.Utils.Cache.has(firstPageKey)) {
        console.log('[Restore] No cache for playlist, falling back to viewPlaylist');
        window.UI._isRestoring = false;  // Temporarily allow push
        window.UI.viewPlaylist(token);
        window.UI._isRestoring = true;
        return;
    }

    // Collect all songs from all loaded pages
    var allSongs = [];
    var playlistData = null;

    if (loadedPages.length > 0) {
        loadedPages.forEach(function(pageKey) {
            var pageData = window.Utils.Cache.get(pageKey);
            if (pageData && pageData.songs) {
                if (!playlistData) playlistData = pageData;
                allSongs = allSongs.concat(pageData.songs);
            }
        });
    } else {
        var data = window.Utils.Cache.get(firstPageKey);
        playlistData = data;
        allSongs = data.songs || [];
        loadedPages = [firstPageKey];
    }

    if (allSongs.length === 0) {
        console.log('[Restore] No songs found, falling back to viewPlaylist');
        window.UI._isRestoring = false;
        window.UI.viewPlaylist(token);
        window.UI._isRestoring = true;
        return;
    }

    // Restore state
    if (playlistData) {
        playlistData.songs = allSongs;
    }
    window.UI._playlistState.token = token;
    window.UI._playlistState.currentPage = loadedPages.length;
    window.UI._playlistLoadedPages = loadedPages.slice();

    // Display playlist
    window.UI.renderPlaylist(playlistData);
    window.UI.showPlaylistLoadMoreButton();

    console.log('[Restore] Playlist restored with', allSongs.length, 'songs');
}

// ============ RESTORE ALBUM ============
function restoreAlbum(data) {
    console.log('[Restore] Album:', data);
    window.UI.viewAlbum(data.token);
}

// ============ RESTORE VIEW ============
function restoreView(view) {
    console.log('[Restore] Restoring:', view.type, 'Data:', view.data);

    window.UI._isRestoring = true;

    var promise;
    switch (view.type) {
        case 'search':
            restoreSearch(view.data);
            promise = window.Utils.Promise.resolve();
            break;
        case 'playlist':
            restorePlaylist(view.data);
            promise = window.Utils.Promise.resolve();
            break;
        case 'album':
            restoreAlbum(view.data);
            promise = window.Utils.Promise.resolve();
            break;
        case 'artist':
            promise = window.UI.restoreArtist(view.data);
            break;
        default:
            window.UI.search();
            promise = window.Utils.Promise.resolve();
    }

    return promise.then(function() {
        window.UI._isRestoring = false;
        console.log('[Restore] Done, isRestoring:', window.UI._isRestoring);
    });
}

// Bind standard back button behavior to a selector within a parent Node
function bindBackButton(parentNode, selector) {
    window.Utils.bindClick(parentNode, selector || '.btn-back, #btn-back-search, #btn-back', function() {
        var current = window.UI.Nav.pop();
        var prev = window.UI.Nav.peek();
        if (prev) {
            restoreView(prev);
        } else {
            var results = document.getElementById('results');
            var stats = document.getElementById('stats');
            if (results) results.innerHTML = '';
            if (stats) stats.innerHTML = '';
            if (DOM.searchInput) {
                DOM.searchInput.value = '';
                DOM.searchInput.focus();
            }
        }
    });
}
window.UI.bindBackButton = bindBackButton;


    // ============================================================
    // FILE: ui/search.js
    // ============================================================

// src/js/ui/search.js

// Handle searches where the query is a parsed URL target
function handleUrlSearch(parsed) {
    var resultsDiv = document.getElementById('results');
    var statsDiv = document.getElementById('stats');
    var playerDiv = document.getElementById('player');

    // Clear previous results
    resultsDiv.innerHTML = '<div class="loading">🔍 Loading...</div>';
    if (statsDiv) statsDiv.innerHTML = '';
    if (playerDiv) playerDiv.innerHTML = '';

    var promise;
    if (parsed.type === 'song' || parsed.type === 'lyrics') {
        promise = window.API.getSong(parsed.token).then(function(songData) {
            var song = songData.songs ? songData.songs[0] : null;
            if (song) {
                var formattedSong = window.Utils.formatters.formatSong(song);
                if (statsDiv) statsDiv.innerHTML = 'Found 1 song';
                displaySongs([formattedSong]);
            } else {
                resultsDiv.innerHTML = '<div class="no-results">😕 Song not found</div>';
            }
        });
    } else if (parsed.type === 'album') {
        promise = window.API.getAlbum(parsed.token).then(function(albumData) {
            if (albumData && albumData.id) {
                if (statsDiv) statsDiv.innerHTML = 'Found 1 album';
                window.UI.viewAlbum(parsed.token);
            } else {
                resultsDiv.innerHTML = '<div class="no-results">😕 Album not found</div>';
            }
        });
    } else if (parsed.type === 'playlist') {
        promise = window.API.getPlaylist(parsed.token).then(function(playlistData) {
            if (playlistData && playlistData.id) {
                if (statsDiv) statsDiv.innerHTML = 'Found 1 playlist';
                window.UI.viewPlaylist(parsed.token);
            } else {
                resultsDiv.innerHTML = '<div class="no-results">😕 Playlist not found</div>';
            }
        });
    } else if (parsed.type === 'artist') {
        promise = window.API.getArtist(parsed.token).then(function(artistData) {
            if (artistData && artistData.artistId) {
                if (statsDiv) statsDiv.innerHTML = 'Found 1 artist';
                window.UI.viewArtist(parsed.token);
            } else {
                resultsDiv.innerHTML = '<div class="no-results">😕 Artist not found</div>';
            }
        });
    } else {
        promise = window.Utils.Promise.resolve();
    }

    return promise.catch(function(error) {
        console.error('[Search] URL fetch error:', error);
        resultsDiv.innerHTML = '<div class="error">❌ Failed to load: ' + escapeHtml(error.message) + '</div>';
    });
}

// Handle searches where the query is plain search text
function handleTextSearch(query) {
    var resultsDiv = document.getElementById('results');
    var statsDiv = document.getElementById('stats');
    var playerDiv = document.getElementById('player');

    var searchType = window.UI.currentSearchType || 'songs';

    // Reset search state for new search
    window.UI._searchState.type = searchType;
    window.UI._searchState.query = query;
    window.UI.currentQuery = query;
    window.UI._searchState.currentPage = 1;
    window.UI._searchState.limit = 20;
    window.UI._searchState.total = 0;
    window.UI._searchState.isLoading = false;
    window.UI._searchLoadedPages = [];

    var page = window.UI._searchState.currentPage;
    var limit = window.UI._searchState.limit;
    var cacheKey = window.Utils.Cache.getSearchKey(searchType, query, page, limit);

    console.log('[Search] Searching for:', query, 'Type:', searchType);

    resultsDiv.innerHTML = '<div class="loading">🔍 Searching</div>';
    if (statsDiv) statsDiv.innerHTML = '';
    if (playerDiv) playerDiv.innerHTML = '';

    // Check cache for page 1
    if (window.Utils.Cache.has(cacheKey)) {
        window.UI.Nav.clear();
        window.UI.Nav.push({
            type: 'search',
            data: {
                type: searchType,
                query: query,
                page: 1,
                loadedPages: window.UI._searchLoadedPages ? window.UI._searchLoadedPages.slice() : []
            }
        });
        console.log('[Search] Using cached results for page 1');
        var data = window.Utils.Cache.get(cacheKey);
        window.UI._searchState.total = data.total || 0;
        window.UI._searchLoadedPages.push(cacheKey);

        if (data.results && data.results.length > 0) {
            if (statsDiv) statsDiv.innerHTML = 'Found ' + data.results.length + ' ' + searchType + ' (cached)';
            displaySearchResults(data.results, searchType);
            showLoadMoreButton('search');
        } else {
            resultsDiv.innerHTML = '<div class="no-results">😕 No results found. Try a different search term.</div>';
        }
        return window.Utils.Promise.resolve();
    }

    var servicePromise;
    if (searchType === 'songs') {
        servicePromise = window.Services.Song.search(query, limit, page);
    } else if (searchType === 'albums') {
        servicePromise = window.Services.Album.search(query, limit, page);
    } else if (searchType === 'playlists') {
        servicePromise = window.Services.Playlist.search(query, limit, page);
    } else if (searchType === 'artists') {
        servicePromise = window.Services.Artist.search(query, limit, page);
    } else {
        servicePromise = window.Services.Song.search(query, limit, page);
    }

    return servicePromise
        .then(function(data) {
            // Store in cache
            window.Utils.Cache.set(cacheKey, data);
            window.UI._searchState.total = data.total || 0;
            window.UI._searchLoadedPages.push(cacheKey);

            window.UI.Nav.clear();
            window.UI.Nav.push({
                type: 'search',
                data: {
                    type: searchType,
                    query: query,
                    page: window.UI._searchState.currentPage || 1,
                    loadedPages: window.UI._searchLoadedPages ? window.UI._searchLoadedPages.slice() : []
                }
            });

            if (data.results && data.results.length > 0) {
                if (statsDiv) statsDiv.innerHTML = 'Found ' + data.results.length + ' ' + searchType;
                displaySearchResults(data.results, searchType);
                showLoadMoreButton('search');
            } else {
                resultsDiv.innerHTML =
                    '<div class="no-results">😕 No results found. Try a different search term.</div>';
            }
        })
        .catch(function(error) {
            console.error('[Search] Error:', error);
            resultsDiv.innerHTML = '<div class="error">❌ Error: ' + escapeHtml(error.message) + '</div>';
            if (statsDiv) statsDiv.innerHTML = '';
        });
}

// Coordinate search input queries
function search() {
    var searchInput = document.getElementById('searchInput');
    var resultsDiv = document.getElementById('results');

    if (!searchInput || !resultsDiv) {
        console.error('[Search] Required DOM elements not found');
        return window.Utils.Promise.resolve();
    }

    var query = searchInput.value.trim();
    if (!query) {
        alert('Please enter a search term');
        return window.Utils.Promise.resolve();
    }

    var parsed = window.Utils.parseUrl(query);
    if (parsed && parsed.token) {
        return handleUrlSearch(parsed);
    } else {
        return handleTextSearch(query);
    }
}

// ============ LOAD MORE SEARCH ============
function loadMoreSearch() {
    if (window.UI._searchState.isLoading) return window.Utils.Promise.resolve();
    window.UI._searchState.isLoading = true;

    var btn = document.getElementById('load-more-btn');
    if (btn) {
        btn.textContent = 'Loading...';
        btn.disabled = true;
    }

    var nextPage = window.UI._searchState.currentPage + 1;
    var cacheKey = window.Utils.Cache.getSearchKey(
        window.UI._searchState.type, window.UI._searchState.query, nextPage, window.UI._searchState.limit);

    var type = window.UI._searchState.type;
    var promise;

    // Check cache first
    if (window.Utils.Cache.has(cacheKey)) {
        console.log('[Search] Using cached page:', nextPage);
        promise = window.Utils.Promise.resolve(window.Utils.Cache.get(cacheKey));
    } else {
        if (type === 'songs') {
            promise = window.Services.Song.search(window.UI._searchState.query, window.UI._searchState.limit, nextPage);
        } else if (type === 'albums') {
            promise = window.Services.Album.search(window.UI._searchState.query, window.UI._searchState.limit, nextPage);
        } else if (type === 'playlists') {
            promise = window.Services.Playlist.search(window.UI._searchState.query, window.UI._searchState.limit, nextPage);
        } else if (type === 'artists') {
            promise = window.Services.Artist.search(window.UI._searchState.query, window.UI._searchState.limit, nextPage);
        }
        promise = promise.then(function(data) {
            window.Utils.Cache.set(cacheKey, data);
            return data;
        });
    }

    return promise
        .then(function(data) {
            // Append results
            if (data.results && data.results.length > 0) {
                var resultsDiv = document.getElementById('results');

                // Remove load more button
                var oldBtn = document.getElementById('load-more-btn');
                if (oldBtn) oldBtn.remove();

                // Append new results
                if (type === 'songs') {
                    data.results.forEach(function(song) {
                        resultsDiv.insertAdjacentHTML('beforeend', createSongCard(song));
                    });
                } else if (type === 'albums') {
                    data.results.forEach(function(album) {
                        resultsDiv.insertAdjacentHTML('beforeend', createAlbumCard(album));
                    });
                } else if (type === 'playlists') {
                    data.results.forEach(function(playlist) {
                        resultsDiv.insertAdjacentHTML('beforeend', createPlaylistCard(playlist));
                    });
                } else if (type === 'artists') {
                    data.results.forEach(function(artist) {
                        resultsDiv.insertAdjacentHTML('beforeend', createArtistCard(artist));
                    });
                }
                // Update state
                window.UI._searchState.currentPage = nextPage;
                window.UI._searchLoadedPages.push(cacheKey);

                // Persist loaded pages state so back-button recalls pagination
                window.UI.Nav.updateCurrent({loadedPages: window.UI._searchLoadedPages.slice()});

                // Show load more button again
                showLoadMoreButton('search');
            } else {
                // No more results
                var endMsg = document.createElement('div');
                endMsg.className = 'end-of-results';
                endMsg.id = 'load-more-btn';
                endMsg.textContent = '🏁 End of results';
                document.getElementById('results').appendChild(endMsg);
            }
        })
        .catch(function(error) {
            console.error('[Search] Load more error:', error);
            var btn = document.getElementById('load-more-btn');
            if (btn) {
                btn.textContent = 'Retry';
                btn.disabled = false;
            }
        })
        .then(function() {
            window.UI._searchState.isLoading = false;
        });
}

// ============ SHOW LOAD MORE BUTTON ============
function showLoadMoreButton(source) {
    var resultsDiv = document.getElementById('results');
    if (!resultsDiv) return;

    // Remove existing load more button
    var existingBtn = document.getElementById('load-more-btn');
    if (existingBtn) existingBtn.remove();

    // Check if more results exist
    var hasMore = false;
    if (window.UI._searchState.total > 0) {
        var loadedCount = window.UI._searchLoadedPages.length * window.UI._searchState.limit;
        hasMore = loadedCount < window.UI._searchState.total;
    } else {
        // If total unknown, assume more if we have results
        var lastData = window.Utils.Cache.get(window.UI._searchLoadedPages[window.UI._searchLoadedPages.length - 1]);
        if (lastData && lastData.results) {
            hasMore = lastData.results.length >= window.UI._searchState.limit;
        }
    }

    if (!hasMore) {
        var endMsg = document.createElement('div');
        endMsg.className = 'end-of-results';
        endMsg.id = 'load-more-btn';
        endMsg.textContent = '🏁 End of results';
        resultsDiv.appendChild(endMsg);
        return;
    }

    var btn = document.createElement('button');
    btn.id = 'load-more-btn';
    btn.className = 'btn-load-more';
    btn.textContent = 'Load ' + window.UI._searchState.limit + ' More';
    btn.dataset.source = source || 'search';
    btn.addEventListener('click', function() {
        loadMoreSearch();
    });
    resultsDiv.appendChild(btn);
}

/* Search Options Pills Container Toggle Helpers */
window.UI.showSearchOptions = function() {
    var opts = document.getElementById('search-options');
    if (opts) opts.style.display = 'flex';
};

window.UI.hideSearchOptions = function() {
    var opts = document.getElementById('search-options');
    if (opts) opts.style.display = 'none';
};

window.UI.search = search;
window.UI.loadMoreSearch = loadMoreSearch;

/* clang-format off */
// Register search styling rules
window.Utils.registerStyle([
    '/* Search Options Pills */',
    '.search-options {',
    '    display: flex;',
    '    gap: 8px;',
    '    margin-bottom: 20px;',
    '}',
    '.search-option {',
    '    padding: 6px 16px;',
    '    background: #282828;',
    '    color: #888;',
    '    border: none;',
    '    border-radius: 20px;',
    '    font-size: 13px;',
    '    cursor: pointer;',
    '    transition: all 0.2s;',
    '}',
    '.search-option:hover {',
    '    background: #333;',
    '}',
    '.search-option.active {',
    '    background: #1db954;',
    '    color: #111;',
    '    font-weight: bold;',
    '}',
    '/* Disabled search-option */',
    '.search-option.disabled {',
    '    opacity: 0.4;',
    '    cursor: not-allowed;',
    '    pointer-events: none;',
    '}',
    '/* Search Box */',
    '.search-box {',
    '    display: flex;',
    '    gap: 10px;',
    '    margin-bottom: 20px;',
    '}',
    '.search-box input {',
    '    flex: 1;',
    '    padding: 12px;',
    '    border: 2px solid #333;',
    '    border-radius: 8px;',
    '    background: #222;',
    '    color: #fff;',
    '    font-size: 16px;',
    '    outline: none;',
    '}',
    '.search-box input:focus {',
    '    border-color: #1db954;',
    '}',
    '.search-box input::placeholder {',
    '    color: #666;',
    '}',
    '.btn-search {',
    '    padding: 12px 24px;',
    '    background: #1db954;',
    '    color: #111;',
    '    border: none;',
    '    border-radius: 8px;',
    '    font-size: 16px;',
    '    font-weight: bold;',
    '    cursor: pointer;',
    '}',
    '.btn-search:hover {',
    '    background: #1ed760;',
    '}',
    '/* Stats */',
    '.stats {',
    '    margin: 10px 0 20px 0;',
    '    color: #888;',
    '    font-size: 14px;',
    '}'
]);
/* clang-format on */

    // ============================================================
    // FILE: ui/player.js
    // ============================================================

// src/js/ui/player.js

// Global player variables and queue manager
var currentPlayerElement = null;
var currentSongCard = null;
window.UI.currentAudio = null;
window.UI.playerQueue = [];
window.UI.currentQueueIndex = -1;

// Play a song and initialize the audio element
function playSong(songData) {
    if (!songData) {
        console.error('[Player] No song data provided');
        return;
    }

    var token = songData.token || songData.id;
    console.log('[Player] Playing song:', token);

    // If player already exists, remove it
    if (currentPlayerElement) {
        currentPlayerElement.remove();
        currentPlayerElement = null;
        currentSongCard = null;
    }

    var progressDiv = document.getElementById('play-progress-' + token);

    if (progressDiv) {
        progressDiv.style.display = 'block';
        progressDiv.textContent = '⏳ Decrypting...';
    }

    var buttons = document.querySelectorAll('[data-token="' + token + '"] .btn-play');
    buttons.forEach(function(btn) {
        btn.textContent = '⏳';
        btn.disabled = true;
    });

    try {
        var decryptedUrl = window.Utils.Cache.get('decrypt:' + token);

        if (!decryptedUrl) {
            decryptedUrl = window.Utils.getDecryptedUrl(songData, window.UI.currentQuality || 96);
            window.Utils.Cache.set('decrypt:' + token, decryptedUrl);
        }

        if (progressDiv) {
            progressDiv.textContent = '✅ Ready!';
            setTimeout(function() {
                progressDiv.style.display = 'none';
            }, 2000);
        }

        // Get title from songData if available
        var displayTitle = songData.title || 'Song';

        // Find the song card to insert player below it
        var songCard = document.querySelector('[data-token="' + token + '"]');
        if (!songCard) {
            // Fallback: try to find by id
            songCard = document.getElementById('song-' + token) || document.getElementById('album-song-' + token);
        }

        if (songCard) {
            var titleEl = songCard.querySelector('.song-title');
            if (titleEl) displayTitle = titleEl.textContent || displayTitle;
        }

        // ============ BUILD QUEUE CONTEXT ============
        if (songCard) {
            var container = songCard.closest('.song-list, .results');
            var cards = container ? container.querySelectorAll('.song-card') : [songCard];

            var newQueue = [];
            var activeIndex = -1;

            cards.forEach(function(card) {
                if (card._songData) {
                    newQueue.push(card._songData);
                    if (card._songData.token === token) {
                        activeIndex = newQueue.length - 1;
                    }
                }
            });

            if (newQueue.length > 0 && activeIndex !== -1) {
                window.UI.playerQueue = newQueue;
                window.UI.currentQueueIndex = activeIndex;
                console.log('[Queue] Loaded queue of ' + newQueue.length + ' tracks. Playing index ' + activeIndex);
            }
        }

        // Visual highlighting of the playing card
        document.querySelectorAll('.song-card.playing').forEach(function(card) {
            card.classList.remove('playing');
        });
        if (songCard) {
            songCard.classList.add('playing');
        }

        if (window.UI.currentAudio) {
            window.UI.currentAudio.pause();
            window.UI.currentAudio = null;
        }

        /* clang-format off */
        var audioHtml = window.Utils.compileHTML([
            '<div id="player-container" style="background: #1a1a1a; padding: 15px; border-radius: 8px; border: 1px solid #333; margin-top: 15px; color: #fff;">',
            '    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">',
            '        <strong>Now Playing: ' + displayTitle + '</strong>',
            '        <button id="player-close-btn" style="background: #dc3545; color: white; border: none; padding: 4px 12px; border-radius: 4px; cursor: pointer;">✕ Close</button>',
            '    </div>',
            '    <audio controls autoplay style="width: 100%;">',
            '        <source src="' + decryptedUrl + '" type="audio/mpeg">',
            '        Your browser does not support the audio element.',
            '    </audio>',
            '</div>'
        ]);
        /* clang-format on */

        var tempDiv = document.createElement('div');
        tempDiv.innerHTML = audioHtml;
        var playerElement = tempDiv.firstElementChild;

        // Insert after the song card - make sure it's a sibling
        if (songCard && songCard.parentNode) {
            // Insert as next sibling of the song card
            songCard.parentNode.insertBefore(playerElement, songCard.nextSibling);

            // Add a margin to separate from the card
            playerElement.style.marginTop = '10px';
        } else {
            // Fallback: append to results
            var resultsDiv = document.getElementById('results');
            if (resultsDiv) {
                resultsDiv.appendChild(playerElement);
            }
        }

        // Store references
        currentPlayerElement = playerElement;
        currentSongCard = songCard;

        var audio = playerElement.querySelector('audio');
        window.UI.currentAudio = audio;

        // Bindended event for sequential playing
        audio.addEventListener('ended', function() {
            playNextInQueue();
        });

        var closeBtn = playerElement.querySelector('#player-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                closePlayer();
            });
        }

    } catch (error) {
        console.error('[Player] Play error:', error);
        alert('Failed to play: ' + error.message);
        if (progressDiv) {
            progressDiv.textContent = '❌ Failed';
            progressDiv.style.color = '#dc3545';
            setTimeout(function() {
                progressDiv.style.display = 'none';
                progressDiv.style.color = '#17a2b8';
            }, 3000);
        }
    } finally {
        buttons.forEach(function(btn) {
            btn.textContent = '▶';
            btn.disabled = false;
        });
    }
}

// Play next song in the queue
function playNextInQueue() {
    if (!window.UI.playerQueue || window.UI.playerQueue.length === 0) return;
    var nextIndex = window.UI.currentQueueIndex + 1;
    if (nextIndex < window.UI.playerQueue.length) {
        window.UI.currentQueueIndex = nextIndex;
        console.log('[Queue] Playing next track index ' + nextIndex + ': ' + window.UI.playerQueue[nextIndex].title);
        playSong(window.UI.playerQueue[nextIndex]);
    } else {
        console.log('[Queue] End of queue reached');
        closePlayer();
    }
}

// Close the active audio player and release elements
function closePlayer() {
    console.log('[Player] closePlayer called');
    if (window.UI.currentAudio) {
        window.UI.currentAudio.pause();
        window.UI.currentAudio.currentTime = 0;
        if (window.UI.currentAudio.src) {
            if (window.UI.currentAudio.src.indexOf('blob:') === 0) {
                URL.revokeObjectURL(window.UI.currentAudio.src);
            }
            window.UI.currentAudio.src = '';
            window.UI.currentAudio.load();
        }
        window.UI.currentAudio = null;
    }

    if (currentPlayerElement) {
        currentPlayerElement.remove();
        currentPlayerElement = null;
        currentSongCard = null;
    }

    // Clear active playing highlights
    document.querySelectorAll('.song-card.playing').forEach(function(card) {
        card.classList.remove('playing');
    });
}

window.UI.playSong = playSong;
window.UI.closePlayer = closePlayer;

/* clang-format off */
// Register player styling rules
window.Utils.registerStyle([
    '/* Player Container */',
    '#player-container {',
    '    background: #1a1a1a;',
    '    padding: 15px;',
    '    border-radius: 8px;',
    '    border: 1px solid #333;',
    '}',
    '/* Playing Active Highlights */',
    '.song-card.playing {',
    '    border: 1px solid #1db954;',
    '    background: rgba(29, 185, 84, 0.05);',
    '}',
    '/* Audio player tag */',
    'audio {',
    '    width: 100%;',
    '    margin-top: 20px;',
    '    border-radius: 8px;',
    '}'
]);
/* clang-format on */

    // ============================================================
    // FILE: ui/download.js
    // ============================================================

// src/js/ui/download.js

function downloadSong(songData) {
    if (!songData) {
        console.error('[Download] No song data provided');
        return window.Utils.Promise.resolve();
    }

    var token = songData.token || songData.id;
    console.log('[Download] Downloading song:', token);

    var progressDiv = document.getElementById('download-progress-' + token);
    if (progressDiv) {
        progressDiv.style.display = 'block';
        progressDiv.textContent = '⏳ Downloading...';
    }

    var buttons = document.querySelectorAll('[data-token="' + token + '"] .btn-download');
    buttons.forEach(function(btn) {
        btn.textContent = '⏳';
        btn.disabled = true;
    });

    try {
        songData.url = window.Utils.getDecryptedUrl(songData, window.UI.currentQuality || 96);

        // Use existing download logic
        return window.Services.Download.songFromData(songData)
            .then(function() {
                if (progressDiv) {
                    progressDiv.textContent = '✅ Done!';
                    progressDiv.style.color = '#1db954';
                    setTimeout(function() {
                        progressDiv.style.display = 'none';
                        progressDiv.style.color = '#28a745';
                    }, 3000);
                }
            })
            .catch(function(error) {
                console.error('[Download] Error:', error);
                alert('Failed to download: ' + error.message);
                if (progressDiv) {
                    progressDiv.textContent = '❌ Failed';
                    progressDiv.style.color = '#ff4444';
                    setTimeout(function() {
                        progressDiv.style.display = 'none';
                        progressDiv.style.color = '#28a745';
                    }, 3000);
                }
            })
            .then(function() {
                buttons.forEach(function(btn) {
                    btn.textContent = '⬇';
                    btn.disabled = false;
                });
            });

    } catch (error) {
        console.error('[Download] Setup error:', error);
        alert('Failed to initialize download: ' + error.message);
        buttons.forEach(function(btn) {
            btn.textContent = '⬇';
            btn.disabled = false;
        });
        if (progressDiv) {
            progressDiv.style.display = 'none';
        }
        return window.Utils.Promise.resolve();
    }
}

window.UI.downloadSong = downloadSong;

    // ============================================================
    // FILE: ui/core.js
    // ============================================================

// src/js/ui/core.js

// STATE
window.UI.currentAudio = null;
window.UI.currentSearchType = 'songs';
window.UI.currentQuery = '';
window.UI.currentQuality = 96;
// ============ CACHE ============

// ============ PAGINATION STATE ============
// For search results
window.UI._searchState = {
    type: 'songs',
    query: '',
    currentPage: 1,
    limit: 20,
    total: 0,
    isLoading: false
};
window.UI._searchLoadedPages = [];

// For playlist details
window.UI._playlistState = {
    token: '',
    currentPage: 1,
    limit: 50,
    total: 0,
    isLoading: false
};
window.UI._playlistLoadedPages = [];

// ============ NAVIGATION ============
window.UI._navStack = [];
window.UI._isRestoring = false;

window.UI.Nav = {
    push: function(view) {
        window.UI._navStack.push(view);
        console.log(
            '[Nav] PUSH:', view.type, 'Stack:',
            window.UI._navStack
                .map(function(v) {
                    return v.type;
                })
                .join(' → '));
    },
    pop: function() {
        var view = window.UI._navStack.pop();
        console.log(
            '[Nav] POP:', view ? view.type : 'none', 'Stack:',
            window.UI._navStack
                .map(function(v) {
                    return v.type;
                })
                .join(' → '));
        return view;
    },
    clear: function() {
        window.UI._navStack = [];
        console.log('[Nav] CLEAR');
    },
    peek: function() {
        return window.UI._navStack[window.UI._navStack.length - 1];
    },
    getStack: function() {
        return window.UI._navStack;
    },
    updateCurrent: function(dataUpdates) {
        var current = this.peek();
        if (current && current.data) {
            Object.assign(current.data, dataUpdates);
            console.log('[Nav] Updated active stack view data:', current.type, dataUpdates);
        }
    }
};

var isOpen = false;
var isInitialized = false;
var isToggling = false;
var currentPlayerElement = null;
var currentSongCard = null;

// DOM references
var DOM = {
    searchInput: null,
    results: null,
    stats: null,
    tabs: null,
    overlay: null,
    toggleBtn: null,
    closeBtn: null,
};

// Prefill search query if current tab URL matches a platform item
function detectAndPrefillUrl() {
    var searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    var parsed = window.Utils.parseUrl(window.location.href);
    if (parsed && parsed.token) {
        searchInput.value = window.location.href;
        console.log('[UI] Prefilled URL from page:', window.location.href);
    }
}

// Close overlay Dialog panel
function closeUI() {
    console.log('[UI] closeUI called');

    if (!DOM.overlay) return;
    if (!isOpen) return;

    // Close player first
    if (typeof window.UI.closePlayer === 'function') {
        window.UI.closePlayer();
    }

    DOM.overlay.classList.remove('active');
    if (DOM.toggleBtn) DOM.toggleBtn.textContent = '🎵';

    isOpen = false;
    console.log('[UI] Closed');
}

// Expose variables
window.UI.DOM = DOM;
window.UI.closeUI = closeUI;


    // ============================================================
    // FILE: ui/builder.js
    // ============================================================

// src/js/ui/builder.js

function createUI() {
    console.log('[UI] Creating UI...');

    if (isInitialized) {
        console.log('[UI] Already initialized');
        return;
    }

    if (typeof window.Utils.injectAllStyles === 'function') {
        window.Utils.injectAllStyles();
    }

    var overlay = document.createElement('div');
    overlay.id = 'ui-overlay';
    /* clang-format off */
    overlay.innerHTML = window.Utils.compileHTML([
        '<div class="container">',
        '    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;gap:10px;flex-wrap:wrap;">',
        '        <h1 style="margin:0;font-size:24px;white-space:nowrap;">🎵 Song Downloader</h1>',
        '        <div style="display:flex;align-items:center;gap:6px;font-size:13px;color:#888;flex-shrink:0;margin-left:auto;">',
        '            <span>Quality:</span>',
        '            <select id="quality-select" style="background:#222;color:#fff;border:1px solid #444;border-radius:4px;padding:4px 8px;font-size:13px;cursor:pointer;">',
        '                <option value="12">12</option>',
        '                <option value="48">48</option>',
        '                <option value="96" selected>96</option>',
        '                <option value="160">160</option>',
        '                <option value="320">320</option>',
        '            </select>',
        '            <span style="font-size:11px;color:#666;">kbps</span>',
        '        </div>',
        '    </div>',
        '    <div class="search-box">',
        '        <input type="text" id="searchInput" placeholder="Search for songs or albums..." autofocus />',
        '        <button class="btn-search" id="searchBtn">Search</button>',
        '    </div>',
        '    <div class="search-options" id="search-options" style="display: none;">',
        '        <button class="search-option active" data-type="songs">Songs</button>',
        '        <button class="search-option" data-type="albums">Albums</button>',
        '        <button class="search-option" data-type="playlists">Playlists</button>',
        '        <button class="search-option" data-type="artists">Artists</button>',
        '    </div>',
        '    <div id="stats" class="stats"></div>',
        '    <div id="results"></div>',
        '</div>'
    ]);
    /* clang-format on */

    document.body.appendChild(overlay);

    var toggleBtn = document.createElement('button');
    toggleBtn.id = 'ui-toggle-btn';
    toggleBtn.textContent = '🎵';
    toggleBtn.title = 'Open Song Downloader (Alt+J)';
    document.body.appendChild(toggleBtn);

    isInitialized = true;

    // Populate DOM references synchronously
    DOM.searchInput = document.getElementById('searchInput');
    DOM.results = document.getElementById('results');
    DOM.stats = document.getElementById('stats');
    DOM.tabs = document.querySelectorAll('.search-option');
    DOM.overlay = document.getElementById('ui-overlay');
    DOM.toggleBtn = document.getElementById('ui-toggle-btn');
    DOM.closeBtn = document.getElementById('ui-close-btn');

    // Bind search option clicks locally
    var optsNode = overlay.querySelector('.search-options');
    if (optsNode) {
        window.Utils.bindClick(optsNode, '.search-option', function(e, btn) {
            var selectedType = btn.dataset.type;
            window.UI.setCategoryHighlight(selectedType);
            window.UI.currentSearchType = selectedType;

            // Reset current results view for the new category
            var results = document.getElementById('results');
            var stats = document.getElementById('stats');
            if (results) results.innerHTML = '';
            if (stats) stats.innerHTML = '';

            // Auto-trigger search if input isn't empty
            if (DOM.searchInput && DOM.searchInput.value.trim() !== '') {
                window.UI.search();
            }
        });
    }

    setupEventListeners();
    setupAppEventListeners();
    console.log('[UI] UI ready');
};

function toggleUI() {
    if (isToggling) return;
    isToggling = true;

    if (isOpen) {
        closeUI();
    } else {
        openUI();
    }

    setTimeout(function() {
        isToggling = false;
    }, 300);
}

function openUI() {
    if (!DOM.overlay) return;
    if (isOpen) return;

    DOM.overlay.classList.add('active');

    // Prefill URL from current page if available
    detectAndPrefillUrl();

    if (DOM.toggleBtn) DOM.toggleBtn.textContent = '✕';
    if (DOM.searchInput) {
        setTimeout(function() {
            DOM.searchInput.focus();
        }, 100);
    }

    isOpen = true;
    console.log('[UI] Opened');
}

window.UI.setCategoryHighlight = function(type) {
    var optsNode = document.getElementById('search-options');
    if (optsNode) {
        optsNode.querySelectorAll('.search-option').forEach(function(btn) {
            btn.classList.toggle('active', btn.dataset.type === type);
        });
    }
};

window.UI.createUI = createUI;
window.UI.toggleUI = toggleUI;
window.UI.openUI = openUI;

/* clang-format off */
// Register core frames and layouts styles
window.Utils.registerStyle([
    '/* ===== Floating Toggle Button ===== */',
    '#ui-toggle-btn {',
    '    position: fixed;',
    '    bottom: 20px;',
    '    right: 20px;',
    '    z-index: 2147483647;',
    '    background: #1db954;',
    '    color: white;',
    '    border: none;',
    '    border-radius: 50%;',
    '    width: 56px;',
    '    height: 56px;',
    '    font-size: 24px;',
    '    cursor: pointer;',
    '    box-shadow: 0 4px 12px rgba(0,0,0,0.3);',
    '    display: flex;',
    '    align-items: center;',
    '    justify-content: center;',
    '    transition: transform 0.2s;',
    '    touch-action: manipulation;',
    '}',
    '#ui-toggle-btn:hover {',
    '    transform: scale(1.1);',
    '}',
    '#ui-toggle-btn:active {',
    '    transform: scale(0.95);',
    '}',
    '/* ===== Fullscreen Overlay ===== */',
    '#ui-overlay {',
    '    position: fixed;',
    '    top: 0;',
    '    left: 0;',
    '    right: 0;',
    '    bottom: 0;',
    '    z-index: 2147483646;',
    '    background: #111;',
    '    color: #fff;',
    '    font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif;',
    '    display: none;',
    '    flex-direction: column;',
    '    overflow-y: auto;',
    '    padding: 20px;',
    '}',
    '#ui-overlay.active {',
    '    display: flex;',
    '}',
    '/* ===== Overlay Content ===== */',
    '.container {',
    '    max-width: 900px;',
    '    margin: 0 auto;',
    '    width: 100%;',
    '}',
    'h1 {',
    '    color: #1db954;',
    '    font-size: 24px;',
    '    margin-bottom: 20px;',
    '    display: flex;',
    '    align-items: center;',
    '    gap: 12px;',
    '}',
    '/* Loading & Error */',
    '.loading {',
    '    text-align: center;',
    '    padding: 40px;',
    '    color: #888;',
    '}',
    '.error {',
    '    color: #ff4444;',
    '    padding: 20px;',
    '    background: #2a1a1a;',
    '    border-radius: 8px;',
    '    border: 1px solid #661111;',
    '}',
    '.no-results {',
    '    text-align: center;',
    '    padding: 40px;',
    '    color: #666;',
    '}',
    '/* ===== Load More Button ===== */',
    '.btn-load-more {',
    '    display: block;',
    '    width: 100%;',
    '    padding: 12px 20px;',
    '    margin-top: 15px;',
    '    background: #282828;',
    '    color: #fff;',
    '    border: 1px solid #444;',
    '    border-radius: 8px;',
    '    font-size: 14px;',
    '    font-weight: 500;',
    '    cursor: pointer;',
    '    transition: all 0.2s;',
    '    text-align: center;',
    '}',
    '.btn-load-more:hover {',
    '    background: #333;',
    '    border-color: #1db954;',
    '}',
    '.btn-load-more:disabled {',
    '    opacity: 0.5;',
    '    cursor: not-allowed;',
    '}',
    '.btn-load-more:disabled:hover {',
    '    background: #282828;',
    '    border-color: #444;',
    '}',
    '/* ===== End of Results ===== */',
    '.end-of-results {',
    '    display: block;',
    '    width: 100%;',
    '    padding: 12px 20px;',
    '    margin-top: 15px;',
    '    color: #666;',
    '    font-size: 14px;',
    '    text-align: center;',
    '    border-top: 1px solid #333;',
    '}',
    '/* ===== Back Button ===== */',
    '.btn-back {',
    '    padding: 8px 20px;',
    '    background: #6c757d;',
    '    color: white;',
    '    border: none;',
    '    border-radius: 4px;',
    '    cursor: pointer;',
    '}',
    '.btn-back:hover {',
    '    background: #5a6268;',
    '}',
    '/* Unified grid layout for card elements in detail views */',
    '.results,',
    '.album-list,',
    '.playlist-list,',
    '.album-songs-list,',
    '.playlist-songs-list,',
    '.artist-songs-section .song-list {',
    '    display: grid;',
    '    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));',
    '    gap: 15px;',
    '}',
    '/* ===== Responsive ===== */',
    '@media (max-width: 600px) {',
    '    .search-options {',
    '        flex-wrap: wrap;',
    '    }',
    '    .search-option {',
    '        flex: 1;',
    '        text-align: center;',
    '        padding: 8px 12px;',
    '        font-size: 13px;',
    '    }',
    '}'
]);
/* clang-format on */


    // ============================================================
    // FILE: ui/handlers.js
    // ============================================================

// src/js/ui/handlers.js

// ============================================================
// APP EVENT LISTENERS
// ============================================================
function setupAppEventListeners() {
    if (DOM.searchInput) {
        DOM.searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                window.UI.search();
            }
        });
        DOM.searchInput.addEventListener('focus', function() {
            window.UI.showSearchOptions();
        });
        DOM.searchInput.focus();
        console.log('[UI] App event listeners attached');
    }

    if (typeof window.API !== 'undefined') {
        console.log('[UI] API loaded');
    }
}

// ============================================================
// UI EVENT LISTENERS
// ============================================================
function setupEventListeners() {
    console.log('[UI] Setting up event listeners...');

    // Toggle button
    window.Utils.bindClick(DOM.toggleBtn, null, function() {
        toggleUI();
    });

    // Close button
    window.Utils.bindClick(DOM.closeBtn, null, function() {
        closeUI();
    });

    // Search button
    window.Utils.bindClick(document, '#searchBtn', function() {
        window.UI.search();
    });

    // Quality dropdown
    var qualitySelect = document.getElementById('quality-select');
    if (qualitySelect) {
        qualitySelect.addEventListener('change', function() {
            window.UI.currentQuality = parseInt(this.value);
            console.log('[UI] Quality changed to:', window.UI.currentQuality, 'kbps');
        });
    }

    // Global document click listener for closing menus on outside click
    document.addEventListener('click', function(e) {
        var target = e.target;
        if (!target.closest('.btn-more') && !target.closest('.more-menu')) {
            document.querySelectorAll('.more-menu').forEach(function(m) {
                m.style.display = 'none';
            });
        }
        if (!target.closest('#searchInput') && !target.closest('#search-options')) {
            window.UI.hideSearchOptions();
        }
    });

    console.log('[UI] Event listeners setup complete');
}

// Debug helper
window.UI.__UI_DEBUG = {
    isOpen: function() {
        return isOpen;
    },
    toggle: toggleUI,
    open: openUI,
    close: closeUI
};

// Start the application UI initialization immediately in browser context
if (typeof window.UI.createUI === 'function' && typeof document !== 'undefined') {
    window.UI.createUI();
}

console.log('[UI] Click the 🎵 button in the bottom-right corner to toggle');

})();
