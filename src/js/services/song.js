// src/js/services/song.js
// Song business logic - orchestrates API calls and formatting

window.Services = window.Services || {};

window.Services.Song = {
    // Search for songs and format results
    search: async function(query, limit, page) {
        var rawData = await window.API.searchSongs(query, limit, page);
        return window.Utils.formatters.formatSearchResults(rawData, 'song');
    },

    // Get decrypted song URL and metadata
    getDecrypted: async function(token) {
        var rawData = await window.API.getSong(token);
        var songData = rawData.songs ? rawData.songs[0] : null;
        if (!songData) throw new Error('Song not found');

        var decryptedUrl = window.Utils.getDecryptedUrl(songData, window.currentQuality || 96);
        return window.Utils.formatters.formatDecryptedSong(songData, decryptedUrl);
    },

    // Get lyrics for a song and cache them
    getLyrics: async function(token) {
        var cached = window.Cache.get('lyrics:' + token);
        if (cached) {
            return cached;
        }

        var data = await window.API.getLyrics(token);
        var lyricsText = data.lyrics && data.lyrics.lyrics ? data.lyrics.lyrics : 'No lyrics available';
        lyricsText = window.Utils.formatters.formatLyrics(lyricsText);

        window.Cache.set('lyrics:' + token, lyricsText);
        return lyricsText;
    }
};
