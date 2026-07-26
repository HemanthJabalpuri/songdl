// ui/js/download.js

async function downloadSong(token, songId) {
    console.log('[Download] Downloading song:', token, songId);
    
    var progressDiv = document.getElementById('download-progress-' + songId);
    if (progressDiv) {
        progressDiv.style.display = 'block';
        progressDiv.textContent = '⏳ Downloading...';
    }

    var buttons = document.querySelectorAll('#song-' + songId + ' .btn-download');
    buttons.forEach(function(btn) {
        btn.textContent = '⏳';
        btn.disabled = true;
    });

    try {
        await window.Services.Download.song(token);

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