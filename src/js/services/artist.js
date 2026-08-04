// src/js/services/artist.js
// Artist business logic - orchestrates API calls and formatting

window.Services = window.Services || {};

window.Services.Artist = {
    /**
     * Search for artists and format results
     */
    search: async function(query, limit, page) {
        var rawData = await window.API.searchArtists(query, limit, page);
        return window.Utils.formatters.formatSearchResults(rawData, 'artist');
    },
    
    /**
     * Get artist details with formatted songs and albums
     * @param {string} token - Artist token from perma_url
     * @param {string} category - 'popular' or 'latest'
     */
    getDetails: async function(token, category) {
        var rawData = await window.API.getArtist(token, category);
        return window.Utils.formatters.formatArtistDetail(rawData);
    },
    
    /**
     * Get more songs by artist
     * @param {string} artistId - Artist ID (not token)
     * @param {number} page - Page number
     * @param {string} category - 'popular' or 'latest'
     */
    getMoreSongs: async function(artistId, page, category) {
        var rawData = await window.API.getArtistMoreSongs(artistId, page, category);
        // rawData.topSongs.songs contains the songs array
        var songs = rawData.topSongs && rawData.topSongs.songs ? rawData.topSongs.songs : [];
        return {
            songs: songs.map(window.Utils.formatters.formatSong),
            total: rawData.topSongs ? rawData.topSongs.total || 0 : 0,
            last_page: rawData.topSongs ? rawData.topSongs.last_page !== false : true
        };
    },
    
    /**
     * Get more albums by artist
     * @param {string} artistId - Artist ID (not token)
     * @param {number} page - Page number
     * @param {string} category - 'popular' or 'latest'
     */
    getMoreAlbums: async function(artistId, page, category) {
        var rawData = await window.API.getArtistMoreAlbums(artistId, page, category);
        // rawData.topAlbums.albums contains the albums array
        var albums = rawData.topAlbums && rawData.topAlbums.albums ? rawData.topAlbums.albums : [];
        return {
            albums: albums.map(window.Utils.formatters.formatAlbum),
            total: rawData.topAlbums ? rawData.topAlbums.total || 0 : 0,
            last_page: rawData.topAlbums ? rawData.topAlbums.last_page !== false : true
        };
    }
};

console.log('[Services] Artist loaded');
