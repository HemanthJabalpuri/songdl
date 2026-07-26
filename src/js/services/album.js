// ui/js/services/album.js

window.Services = window.Services || {};

window.Services.Album = {
    // Search for albums and format results
    search: async function(query, limit, page) {
        var rawData = await window.API.searchAlbums(query, limit, page);
        return window.Utils.formatters.formatSearchResults(rawData, 'album');
    },
    
    // Get album details with formatted songs
    getDetails: async function(token) {
        var rawData = await window.API.getAlbum(token);
        return window.Utils.formatters.formatAlbumDetail(rawData);
    }
};

console.log('[Services] Album loaded');