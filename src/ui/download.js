// src/js/ui/download.js

function downloadSong(songData) {
    if (!songData) {
        console.error('[Download] No song data provided');
        return window.Utils.Promise.resolve();
    }

    var token = songData.token || songData.id;
    console.log('[Download] Downloading song:', token);

    var progressDiv = document.getElementById('download-progress-' + token);
    if (progressDiv) {
        progressDiv.style.display = 'block';
        progressDiv.textContent = '⏳ Downloading...';
    }

    var buttons = document.querySelectorAll('[data-token="' + token + '"] .btn-download');
    buttons.forEach(function(btn) {
        btn.textContent = '⏳';
        btn.disabled = true;
    });

    try {
        var decryptedUrl = window.Utils.getDecryptedUrl(songData, window.UI.currentQuality || 96);
        var song = window.Utils.formatters.formatDecryptedSong(songData, decryptedUrl);

        // Use existing download logic
        return window.Services.Download.songFromData(song)
            .then(function() {
                if (progressDiv) {
                    progressDiv.textContent = '✅ Done!';
                    progressDiv.style.color = '#1db954';
                    setTimeout(function() {
                        progressDiv.style.display = 'none';
                        progressDiv.style.color = '#28a745';
                    }, 3000);
                }
            })
            .catch(function(error) {
                console.error('[Download] Error:', error);
                alert('Failed to download: ' + error.message);
                if (progressDiv) {
                    progressDiv.textContent = '❌ Failed';
                    progressDiv.style.color = '#ff4444';
                    setTimeout(function() {
                        progressDiv.style.display = 'none';
                        progressDiv.style.color = '#28a745';
                    }, 3000);
                }
            })
            .then(function() {
                buttons.forEach(function(btn) {
                    btn.textContent = '⬇';
                    btn.disabled = false;
                });
            });

    } catch (error) {
        console.error('[Download] Setup error:', error);
        alert('Failed to initialize download: ' + error.message);
        buttons.forEach(function(btn) {
            btn.textContent = '⬇';
            btn.disabled = false;
        });
        if (progressDiv) {
            progressDiv.style.display = 'none';
        }
        return window.Utils.Promise.resolve();
    }
}

window.UI.downloadSong = downloadSong;