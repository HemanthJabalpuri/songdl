// src/js/ui/player.js

// Play a song and initialize the audio element
function playSong(songData) {
    if (!songData) {
        console.error('[Player] No song data provided');
        return;
    }

    var token = songData.token || songData.id;
    console.log('[Player] Playing song:', token);

    // If player already exists, remove it
    if (currentPlayerElement) {
        currentPlayerElement.remove();
        currentPlayerElement = null;
        currentSongCard = null;
    }

    var progressDiv = document.getElementById('play-progress-' + token);

    if (progressDiv) {
        progressDiv.style.display = 'block';
        progressDiv.textContent = '⏳ Decrypting...';
    }

    var buttons = document.querySelectorAll('[data-token="' + token + '"] .btn-play');
    buttons.forEach(function(btn) {
        btn.textContent = '⏳';
        btn.disabled = true;
    });

    try {
        var decryptedUrl = window.Cache.get('decrypt:' + token);

        if (!decryptedUrl) {
            decryptedUrl = window.Utils.getDecryptedUrl(songData, window.currentQuality || 96);
            window.Cache.set('decrypt:' + token, decryptedUrl);
        }

        if (progressDiv) {
            progressDiv.textContent = '✅ Ready!';
            setTimeout(function() {
                progressDiv.style.display = 'none';
            }, 2000);
        }

        // Get title from songData if available
        var displayTitle = songData.title || 'Song';

        // Find the song card to insert player below it
        var songCard = document.querySelector('[data-token="' + token + '"]');
        if (!songCard) {
            // Fallback: try to find by id
            songCard = document.getElementById('song-' + token) || document.getElementById('album-song-' + token);
        }

        if (songCard) {
            var titleEl = songCard.querySelector('.song-title');
            if (titleEl) displayTitle = titleEl.textContent || displayTitle;
        }

        if (window.currentAudio) {
            window.currentAudio.pause();
            window.currentAudio = null;
        }

        var audioHtml =
            '<div id="player-container" style="background: #1a1a1a; padding: 15px; border-radius: 8px; border: 1px solid #333; margin-top: 15px; color: #fff;">\n' +
            '    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">\n' +
            '        <strong>Now Playing: ' + displayTitle + '</strong>\n' +
            '        <button id="player-close-btn" style="background: #dc3545; color: white; border: none; padding: 4px 12px; border-radius: 4px; cursor: pointer;">✕ Close</button>\n' +
            '    </div>\n' +
            '    <audio controls autoplay style="width: 100%;">\n' +
            '        <source src="' + decryptedUrl + '" type="audio/mpeg">\n' +
            '        Your browser does not support the audio element.\n' +
            '    </audio>\n' +
            '</div>';

        var tempDiv = document.createElement('div');
        tempDiv.innerHTML = audioHtml;
        var playerElement = tempDiv.firstElementChild;

        // Insert after the song card - make sure it's a sibling
        if (songCard && songCard.parentNode) {
            // Insert as next sibling of the song card
            songCard.parentNode.insertBefore(playerElement, songCard.nextSibling);

            // Add a margin to separate from the card
            playerElement.style.marginTop = '10px';
        } else {
            // Fallback: append to results
            var resultsDiv = document.getElementById('results');
            if (resultsDiv) {
                resultsDiv.appendChild(playerElement);
            }
        }

        // Store references
        currentPlayerElement = playerElement;
        currentSongCard = songCard;

        var audio = playerElement.querySelector('audio');
        window.currentAudio = audio;

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

// Close the active audio player and release elements
function closePlayer() {
    console.log('[Player] closePlayer called');
    if (window.currentAudio) {
        window.currentAudio.pause();
        window.currentAudio.currentTime = 0;
        if (window.currentAudio.src) {
            if (window.currentAudio.src.indexOf('blob:') === 0) {
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