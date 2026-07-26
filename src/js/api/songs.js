// src/js/api/songs.js
// Pure API calls - no formatting or business logic

window.API = window.API || {};

/**
 * Search for songs - returns raw API response
 */
window.API.searchSongs = async function(query, limit, page) {
    return await window.API.callAPI('search.getResults', {
        q: query,
        p: page || 1,
        n: limit || 20
    });
};

/**
 * Get song details by token - returns raw API response
 */
window.API.getSong = async function(token) {
    return await window.API.callAPI('webapi.get', {
        token: token,
        type: 'song',
        includeMetaTags: 0
    });
};

/**
 * Get lyrics for a song by token
 */
window.API.getLyrics = async function(token) {
    return await window.API.callAPI('webapi.get', {
        token: token,
        type: 'lyrics'
    });
};

console.log('[API] Songs loaded');