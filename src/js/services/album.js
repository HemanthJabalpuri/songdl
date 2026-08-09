// src/js/services/album.js

window.Services = window.Services || {};

window.Services.Album = {
    // Search for albums and format results
    search: function(query, limit, page) {
        return window.API.searchAlbums(query, limit, page).then(function(rawData) {
            return window.Utils.formatters.formatSearchResults(rawData, 'album');
        });
    },

    // Get album details with formatted songs
    getDetails: function(token) {
        return window.API.getAlbum(token).then(function(rawData) {
            return window.Utils.formatters.formatAlbumDetail(rawData);
        });
    }
};
