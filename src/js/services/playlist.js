// src/js/services/playlist.js
// Playlist business logic - orchestrates API calls and formatting

window.Services = window.Services || {};

window.Services.Playlist = {
    // Search for playlists and format results
    search: function(query, limit, page) {
        return window.API.searchPlaylists(query, limit, page).then(function(rawData) {
            return window.Utils.formatters.formatSearchResults(rawData, 'playlist');
        });
    },

    // Get playlist details with formatted songs Supports pagination
    getDetails: function(token, page, limit) {
        return window.API.getPlaylist(token, page, limit).then(function(rawData) {
            return window.Utils.formatters.formatPlaylistDetail(rawData);
        });
    }
};
