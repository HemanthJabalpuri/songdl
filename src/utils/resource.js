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
