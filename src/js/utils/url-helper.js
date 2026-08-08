// src/js/utils/url-helper.js

window.Utils = window.Utils || {};

// Parse URL to extract type and token
window.Utils.parseUrl = function(url) {
    if (!url) return {type: null, token: null};

    // Check if it's a valid URL
    if (!url.includes(window.API.constants.API_HOST)) {
        return {type: null, token: null};
    }

    // Determine type from URL
    var type = null;
    if (url.includes('/song/')) {
        type = 'song';
    } else if (url.includes('/album/')) {
        type = 'album';
    } else if (url.includes('/lyrics/')) {
        type = 'lyrics';
    } else if (url.includes('/featured/')) {
        type = 'playlist';
    } else if (url.includes('/artist/')) {
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
