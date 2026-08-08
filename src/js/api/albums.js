// src/js/api/albums.js
// Pure API calls - no formatting or business logic

window.API = window.API || {};

// Search for albums - returns raw API response
window.API.searchAlbums = async function(query, limit, page) {
    return await window.API.callAPI('search.getAlbumResults', {q: query, p: page || 1, n: limit || 20});
};

// Get album details by token - returns raw API response
window.API.getAlbum = async function(token) {
    return await window.API.callAPI('webapi.get', {token: token, type: 'album', includeMetaTags: 0});
};
