// ui/js/services/song.js
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
        
        var encrypted = songData.more_info ? songData.more_info.encrypted_media_url : null;
        if (!encrypted) throw new Error('No encrypted URL found');
        
        if (typeof window.decryptMediaUrl !== 'function') {
            throw new Error('decryptMediaUrl not available');
        }
        
        var decryptedUrl = window.decryptMediaUrl(encrypted);
        if (!decryptedUrl) throw new Error('Decryption failed');

        decryptedUrl = window.Utils.formatters.formatUrlWithQuality(decryptedUrl, window.currentQuality || 96);

        return window.Utils.formatters.formatDecryptedSong(songData, decryptedUrl);
    }
};

console.log('[Services] Song loaded');
