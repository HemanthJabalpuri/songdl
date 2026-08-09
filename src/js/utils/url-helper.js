// src/js/utils/url-helper.js

window.Utils = window.Utils || {};

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
