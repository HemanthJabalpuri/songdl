// src/js/services/download.js
// Download business logic

window.Services = window.Services || {};

window.Services.Download = {
    // Download a song from pre-fetched data (no API call)
    songFromData: function(songData, filename) {
        console.log('[Services] Downloading song from data:', songData.title);

        var songUrl = songData.url;
        if (!songUrl) return Promise.reject(new Error('No stream URL available'));

        songUrl = window.Utils.formatters.formatUrlWithQuality(songUrl, window.currentQuality || 96);

        var audioBytes = null;
        var albumArtData = null;
        var lyricsText = null;

        // 1. Fetch audio
        return window.Utils.fetchResource(songUrl, 'arraybuffer')
            .then(function(audioBuffer) {
                audioBytes = new Uint8Array(audioBuffer);
                console.log('[Services] Audio fetched:', (audioBytes.length / 1024 / 1024).toFixed(2) + ' MB');

                if (audioBytes.length === 0) {
                    throw new Error('Audio file is empty (0 bytes)');
                }

                // 2. Fetch album art
                if (songData.image) {
                    return window.Utils.fetchAlbumArt(songData.image).then(function(artData) {
                        albumArtData = artData;
                        if (albumArtData) {
                            console.log('[Services] Album art ready for metadata');
                        }
                    });
                }
            })
            .then(function() {
                // 3. Fetch lyrics if available
                if (songData.has_lyrics) {
                    var token = songData.token || songData.id;
                    return window.Services.Song.getLyrics(token)
                        .then(function(text) {
                            lyricsText = text;
                        })
                        .catch(function(e) {
                            console.warn('[Services] Failed to fetch lyrics:', e.message);
                        });
                }
            })
            .then(function() {
                // 4. Build metadata
                var metadata = window.Utils.buildMetadata(songData, albumArtData, lyricsText);
                console.log(
                    '[Services] Metadata: title="' + songData.title + '", artist="' +
                    (songData.artist || songData.all_artists) + '"');

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
                var finalFilename = filename || window.Utils.buildFilename(songData, quality);
                console.log('[Services] Filename:', finalFilename);

                // 7. Trigger download
                return window.Utils.downloadFile(dataToDownload, finalFilename);
            });
    }
};
