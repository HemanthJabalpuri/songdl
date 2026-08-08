// src/js/ui/download.js

async function downloadSong(songData) {
    if (!songData) {
        console.error('[Download] No song data provided');
        return;
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
        var decryptedUrl = window.Utils.getDecryptedUrl(songData, window.currentQuality || 96);
        var song = window.Utils.formatters.formatDecryptedSong(songData, decryptedUrl);

        // Use existing download logic
        await window.Services.Download.songFromData(song);

        if (progressDiv) {
            progressDiv.textContent = '✅ Done!';
            progressDiv.style.color = '#1db954';
            setTimeout(function() {
                progressDiv.style.display = 'none';
                progressDiv.style.color = '#28a745';
            }, 3000);
        }
    } catch (error) {
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
    } finally {
        buttons.forEach(function(btn) {
            btn.textContent = '⬇';
            btn.disabled = false;
        });
    }
}


window.downloadSong = downloadSong;