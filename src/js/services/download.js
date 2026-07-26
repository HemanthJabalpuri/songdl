// ui/js/services/download.js
// Download business logic

window.Services = window.Services || {};

window.Services.Download = {
    // Download a song with metadata
    song: async function(token, filename) {
        console.log('[Services] Downloading song:', token);
        
        // 1. Get decrypted song data
        var song = await window.Services.Song.getDecrypted(token);
        if (!song.url) throw new Error('No stream URL available');
        
        console.log('[Services] Song:', song.title, '-', song.artist);
        
        // 2. Fetch audio
        var audioBuffer = await window.Utils.fetchResource(song.url, 'arraybuffer');
        var audioBytes = new Uint8Array(audioBuffer);
        console.log('[Services] Audio fetched:', (audioBytes.length / 1024 / 1024).toFixed(2) + ' MB');
        
        if (audioBytes.length === 0) {
            throw new Error('Audio file is empty (0 bytes)');
        }
        
        // 3. Fetch album art
        var albumArtData = null;
        if (song.image) {
            albumArtData = await window.Utils.fetchAlbumArt(song.image);
            if (albumArtData) {
                console.log('[Services] Album art ready for metadata');
            }
        }

// Fetch lyrics if available
var lyricsText = null;
if (song.has_lyrics) {
    try {
        var lyricsData = await window.API.getLyrics(token);
        if (lyricsData && lyricsData.lyrics && lyricsData.lyrics.lyrics) {
            lyricsText = lyricsData.lyrics.lyrics;
   lyricsText = window.Utils.formatters.formatLyrics(lyricsText);
            console.log('[Services] Lyrics fetched');
        }
    } catch (e) {
        console.warn('[Services] Failed to fetch lyrics:', e.message);
    }
}
        // 4. Build metadata
        var metadata = window.Utils.buildMetadata(song, albumArtData, lyricsText);
        console.log('[Services] Metadata: title="' + song.title + '", artist="' + song.artist + '"');
        
        // 5. Write metadata to M4A
        var dataToDownload = audioBytes;
        if (typeof window.writeM4ABytes === 'function') {
            try {
                dataToDownload = window.writeM4ABytes(audioBytes, metadata);
                console.log('[Services] Metadata written to M4A');
            } catch (e) {
                console.warn('[Services] Metadata write failed:', e.message);
                dataToDownload = audioBytes;
            }
        }
        
        // 6. Generate filename
        var quality = window.currentQuality || 96;
        var finalFilename = filename || window.Utils.buildFilename(song, quality);

        console.log('[Services] Filename:', finalFilename);

        // 7. Trigger download
        return window.Utils.downloadFile(dataToDownload, finalFilename);
    },
    
    // Download all songs in an album
    album: async function(albumToken) {
        var album = await window.Services.Album.getDetails(albumToken);
        console.log('[Services] Downloading album:', album.title, 
                   '(' + album.songs.length + ' songs)');
        
        var results = [];
        for (var i = 0; i < album.songs.length; i++) {
            var song = album.songs[i];
            try {
                var filename = (i + 1).toString().padStart(2, '0') + '. ' + song.title + '.m4a';
                await window.Services.Download.song(song.token, filename);
                results.push({ song: song.title, success: true });
            } catch (error) {
                console.error('[Services] Failed to download:', song.title, error.message);
                results.push({ song: song.title, success: false, error: error.message });
            }
        }
        return results;
    }
};

console.log('[Services] Download loaded');
