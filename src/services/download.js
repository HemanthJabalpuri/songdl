// src/js/services/download.js
// Download business logic
window.Services.Download = {
    // Download a song from pre-fetched data (no API call)
    songFromData: function(songData, filename) {
        console.log('[Services] Downloading song from data:', songData.title);

        var songUrl = songData.url;
        if (!songUrl) return window.Utils.Promise.reject(new Error('No stream URL available'));

        songUrl = window.Utils.formatters.formatUrlWithQuality(songUrl, window.UI.currentQuality || 96);

        // Initiate all requests in parallel
        var audioPromise = window.Utils.fetchResource(songUrl, 'arraybuffer');

        var artPromise =
            songData.image ? window.Utils.fetchAlbumArt(songData.image) : window.Utils.Promise.resolve(null);

        var lyricsPromise = songData.has_lyrics ?
            window.Services.Song.getLyrics(songData.token || songData.id).catch(function(e) {
                console.warn('[Services] Failed to fetch lyrics:', e.message);
                return null;
            }) :
            window.Utils.Promise.resolve(null);

        // Resolve all in parallel
        return window.Utils.Promise.all([audioPromise, artPromise, lyricsPromise]).then(function(results) {
            var audioBuffer = results[0];
            var albumArtData = results[1];
            var lyricsText = results[2];

            var audioBytes = new Uint8Array(audioBuffer);
            if (audioBytes.length === 0) {
                throw new Error('Audio file is empty (0 bytes)');
            }

            // Build metadata and tag M4A
            var metadata = window.Utils.buildMetadata(songData, albumArtData, lyricsText);
            console.log(
                '[Services] Metadata: title="' + songData.title + '", artist="' +
                (songData.artist || songData.all_artists) + '"');

            var dataToDownload = audioBytes;
            if (typeof window.Utils.writeM4ABytes === 'function') {
                try {
                    dataToDownload = window.Utils.writeM4ABytes(audioBytes, metadata);
                    console.log('[Services] Metadata written to M4A');
                } catch (e) {
                    console.warn('[Services] Metadata write failed:', e.message);
                }
            }

            var quality = window.UI.currentQuality || 96;
            var finalFilename = filename || window.Utils.buildFilename(songData, quality);
            console.log('[Services] Filename:', finalFilename);

            return window.Utils.downloadFile(dataToDownload, finalFilename);
        });
    }
};
