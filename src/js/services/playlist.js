// src/js/services/playlist.js
// Playlist business logic - orchestrates API calls and formatting

window.Services = window.Services || {};

window.Services.Playlist = {
    // Search for playlists and format results
    search: async function(query, limit, page) {
        var rawData = await window.API.searchPlaylists(query, limit, page);
        return window.Utils.formatters.formatSearchResults(rawData, 'playlist');
    },

    // Get playlist details with formatted songs Supports pagination
    getDetails: async function(token, page, limit) {
        var rawData = await window.API.getPlaylist(token, page, limit);
        return window.Utils.formatters.formatPlaylistDetail(rawData);
    }
};
