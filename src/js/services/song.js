// src/js/services/song.js
// Song business logic - orchestrates API calls and formatting

window.Services = window.Services || {};

window.Services.Song = {
    // Search for songs and format results
    search: function(query, limit, page) {
        return window.API.searchSongs(query, limit, page).then(function(rawData) {
            return window.Utils.formatters.formatSearchResults(rawData, 'song');
        });
    },

    // Get decrypted song URL and metadata
    getDecrypted: function(token) {
        return window.API.getSong(token).then(function(rawData) {
            var songData = rawData.songs ? rawData.songs[0] : null;
            if (!songData) throw new Error('Song not found');

            var decryptedUrl = window.Utils.getDecryptedUrl(songData, window.currentQuality || 96);
            return window.Utils.formatters.formatDecryptedSong(songData, decryptedUrl);
        });
    },

    // Get lyrics for a song and cache them
    getLyrics: function(token) {
        var cached = window.Cache.get('lyrics:' + token);
        if (cached) {
            return Promise.resolve(cached);
        }

        return window.API.getLyrics(token).then(function(data) {
            var lyricsText = data.lyrics && data.lyrics.lyrics ? data.lyrics.lyrics : 'No lyrics available';
            lyricsText = window.Utils.formatters.formatLyrics(lyricsText);

            window.Cache.set('lyrics:' + token, lyricsText);
            return lyricsText;
        });
    }
};
