// src/js/api/fetch.js

window.API = window.API || {};

// ============ LOW-LEVEL FETCH ============
window.API._fetchAPI = function(url, options) {
    options = options || {};

    // Proxy mode (local development)
    if (window.isProxy) {
        console.log('[API] Using proxy for:', url.substring(0, 60) + '...');
        var proxyEndpoint =
            (typeof window !== 'undefined' && window.location) ? '/proxy' : 'http://localhost:3000/proxy';
        return fetch(proxyEndpoint, {
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
    return fetch(url, options).then(function(res) {
        if (!res.ok) {
            console.error('[API Fetch Error] Direct HTTP failed with status:', res.status, 'for:', url);
            throw new Error('HTTP ' + res.status);
        }
        return res.json();
    });
};

// ============ API CALL WRAPPER ============
window.API.callAPI = function(call, extraParams) {
    var params = Object.assign({}, window.API.constants.API_DEFAULTS, {__call: call}, extraParams || {});

    var url = new URL(window.API.constants.API_BASE);
    Object.keys(params).forEach(function(key) {
        url.searchParams.append(key, params[key]);
    });

    return window.API._fetchAPI(url.toString(), {headers: window.API.constants.DEFAULT_HEADERS});
};
