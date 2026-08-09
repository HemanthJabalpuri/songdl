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
