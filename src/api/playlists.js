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
