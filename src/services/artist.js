// src/js/services/artist.js
// Artist business logic - orchestrates API calls and formatting
window.Services.Artist = {
    // Search for artists and format results
    search: function(query, limit, page) {
        return window.API.searchArtists(query, limit, page).then(function(rawData) {
            return window.Utils.formatters.formatSearchResults(rawData, 'artist');
        });
    },

    // Get artist details with formatted songs and albums
    getDetails: function(token, category) {
        return window.API.getArtist(token, category).then(function(rawData) {
            return window.Utils.formatters.formatArtistDetail(rawData);
        });
    },

    // Get more songs by artist
    getMoreSongs: function(artistId, page, category) {
        return window.API.getArtistMoreSongs(artistId, page, category).then(function(rawData) {
            var songs = rawData.topSongs && rawData.topSongs.songs ? rawData.topSongs.songs : [];
            return {
                songs: songs.map(window.Utils.formatters.formatSong),
                total: rawData.topSongs ? rawData.topSongs.total || 0 : 0,
                last_page: rawData.topSongs ? rawData.topSongs.last_page !== false : true
            };
        });
    },

    // Get more albums by artist
    getMoreAlbums: function(artistId, page, category) {
        return window.API.getArtistMoreAlbums(artistId, page, category).then(function(rawData) {
            var albums = rawData.topAlbums && rawData.topAlbums.albums ? rawData.topAlbums.albums : [];
            return {
                albums: albums.map(window.Utils.formatters.formatAlbum),
                total: rawData.topAlbums ? rawData.topAlbums.total || 0 : 0,
                last_page: rawData.topAlbums ? rawData.topAlbums.last_page !== false : true
            };
        });
    }
};
