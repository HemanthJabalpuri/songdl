// src/js/api/playlists.js
// Pure API calls - no formatting or business logic

window.API = window.API || {};

/**
 * Search for playlists - returns raw API response
 */
window.API.searchPlaylists = async function(query, limit, page) {
    return await window.API.callAPI('search.getPlaylistResults', {
        q: query,
        p: page || 1,
        n: limit || 20
    });
};

/**
 * Get playlist details by token - returns raw API response
 */
window.API.getPlaylist = async function(token, page, limit) {
    return await window.API.callAPI('webapi.get', {
        token: token,
        type: 'playlist',
        includeMetaTags: 0,
        p: page || 1,
        n: limit || 50
    });
};

console.log('[API] Playlists loaded');
