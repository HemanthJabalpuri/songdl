// src/js/ui/player.js

async function playSong(token, songId, songCardElement) {
    console.log('[Player] Playing song:', token, songId);

    // If player already exists, remove it
    if (currentPlayerElement) {
        currentPlayerElement.remove();
        currentPlayerElement = null;
        currentSongCard = null;
    }

    var progressDiv = document.getElementById('play-progress-' + songId);
    
    if (progressDiv) {
        progressDiv.style.display = 'block';
        progressDiv.textContent = '⏳ Decrypting...';
    }

    var buttons = document.querySelectorAll('#song-' + songId + ' .btn-play, #album-song-' + songId + ' .btn-play');
    buttons.forEach(function(btn) {
        btn.textContent = '⏳';
        btn.disabled = true;
    });

    try {
        var decryptedUrl = decryptedUrlCache.get(token);
        
        if (!decryptedUrl) {
            var song = await window.Services.Song.getDecrypted(token);
            decryptedUrl = song.url;
            decryptedUrlCache.set(token, decryptedUrl);
            setTimeout(function() { decryptedUrlCache.delete(token); }, 3600000);
        }

        if (progressDiv) {
            progressDiv.textContent = '✅ Ready!';
            setTimeout(function() {
                progressDiv.style.display = 'none';
            }, 2000);
        }

        var title = 'Song';
        var songElement = document.getElementById('song-' + songId) || document.getElementById('album-song-' + songId);
        if (songElement) {
            var titleEl = songElement.querySelector('.song-title');
            if (titleEl) title = titleEl.textContent;
        }

        if (window.currentAudio) {
            window.currentAudio.pause();
            window.currentAudio = null;
        }

        var audioHtml = `
            <div id="player-container" style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-top: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <strong>Now Playing: ${title}</strong>
                    <button id="player-close-btn" style="background: #dc3545; color: white; border: none; padding: 4px 12px; border-radius: 4px; cursor: pointer;">✕ Close</button>
                </div>
                <audio controls autoplay style="width: 100%;">
                    <source src="${decryptedUrl}" type="audio/mpeg">
                    Your browser does not support the audio element.
                </audio>
            </div>
        `;
        
        var tempDiv = document.createElement('div');
        tempDiv.innerHTML = audioHtml;
        var playerElement = tempDiv.firstElementChild;

        // Insert after the song card
        songCardElement.parentNode.insertBefore(playerElement, songCardElement.nextSibling);

        // Store references
        currentPlayerElement = playerElement;
        currentSongCard = songCardElement;

        window.currentAudio = playerElement.querySelector('audio');
        
        var closeBtn = playerElement.querySelector('#player-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                closePlayer();
            });
        }

    } catch (error) {
        console.error('[Player] Play error:', error);
        alert('Failed to play: ' + error.message);
        if (progressDiv) {
            progressDiv.textContent = '❌ Failed';
            progressDiv.style.color = '#dc3545';
            setTimeout(function() {
                progressDiv.style.display = 'none';
                progressDiv.style.color = '#17a2b8';
            }, 3000);
        }
    } finally {
        buttons.forEach(function(btn) {
            btn.textContent = '▶';
            btn.disabled = false;
        });
    }
}

function closePlayer() {
    console.log('[Player] closePlayer called');
    if (window.currentAudio) {
        window.currentAudio.pause();
        window.currentAudio.currentTime = 0;
        if (window.currentAudio.src) {
            if (window.currentAudio.src.startsWith('blob:')) {
                URL.revokeObjectURL(window.currentAudio.src);
            }
            window.currentAudio.src = '';
            window.currentAudio.load();
        }
        window.currentAudio = null;
    }
    
    if (currentPlayerElement) {
        currentPlayerElement.remove();
        currentPlayerElement = null;
        currentSongCard = null;
    }
}


window.playSong = playSong;
window.closePlayer = closePlayer;