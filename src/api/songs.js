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
