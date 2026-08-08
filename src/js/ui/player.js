// src/js/ui/player.js

async function playSong(songData) {
    if (!songData) {
        console.error('[Player] No song data provided');
        return;
    }

    var token = songData.token || songData.id;
    var title = songData.title || 'Song';

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

        var audioHtml = `
            <div id="player-container" style="background: #1a1a1a; padding: 15px; border-radius: 8px; border: 1px solid #333; margin-top: 15px; color: #fff;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <strong>Now Playing: ${displayTitle}</strong>
                    <button id="player-close-btn" style="background: #dc3545; color: white; border: none; padding: 4px 12px; border-radius: 4px; cursor: pointer;">✕ Close</button>
                </div>
                <audio autoplay style="display: none;">
                    <source src="${decryptedUrl}" type="audio/mpeg">
                    Your browser does not support the audio element.
                </audio>
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
                    <button id="player-play-pause-btn" style="background: none; border: none; font-size: 20px; color: #1db954; cursor: pointer; padding: 0; line-height: 1;">⏸</button>
                    <span id="player-current-time" style="font-size: 12px; font-variant-numeric: tabular-nums; min-width: 35px; text-align: right;">0:00</span>
                    <input type="range" id="player-seek-slider" min="0" max="100" value="0" style="flex-grow: 1; height: 4px; border-radius: 2px; background: #555; accent-color: #1db954; -webkit-appearance: none; appearance: none; cursor: pointer; outline: none; margin: 0;">
                    <span id="player-duration" style="font-size: 12px; font-variant-numeric: tabular-nums; min-width: 35px;">0:00</span>
                    <div style="display: flex; align-items: center; gap: 6px; margin-left: 5px;">
                        <span id="player-volume-icon" style="font-size: 14px; cursor: pointer;">🔊</span>
                        <input type="range" id="player-volume-slider" min="0" max="100" value="100" style="width: 60px; height: 4px; border-radius: 2px; background: #555; accent-color: #1db954; -webkit-appearance: none; appearance: none; cursor: pointer; outline: none; margin: 0;">
                    </div>
                </div>
            </div>
        `;

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

        var playPauseBtn = playerElement.querySelector('#player-play-pause-btn');
        var seekSlider = playerElement.querySelector('#player-seek-slider');
        var currentTimeSpan = playerElement.querySelector('#player-current-time');
        var durationSpan = playerElement.querySelector('#player-duration');
        var volumeSlider = playerElement.querySelector('#player-volume-slider');
        var volumeIcon = playerElement.querySelector('#player-volume-icon');

        // Play/Pause toggle
        playPauseBtn.addEventListener('click', function() {
            if (audio.paused) {
                audio.play();
                playPauseBtn.textContent = '⏸';
            } else {
                audio.pause();
                playPauseBtn.textContent = '▶';
            }
        });

        var isSeeking = false;

        // Time updates
        audio.addEventListener('timeupdate', function() {
            if (isSeeking) return;
            var current = audio.currentTime;
            var duration = audio.duration || 0;
            if (duration) {
                seekSlider.value = (current / duration) * 100;
            }
            currentTimeSpan.textContent = formatPlayerTime(current);
        });

        // Load duration
        audio.addEventListener('loadedmetadata', function() {
            durationSpan.textContent = formatPlayerTime(audio.duration);
        });

        // Seek input drag
        seekSlider.addEventListener('input', function() {
            isSeeking = true;
            var duration = audio.duration || 0;
            if (duration) {
                var current = (seekSlider.value / 100) * duration;
                currentTimeSpan.textContent = formatPlayerTime(current);
            }
        });

        // Seek drag release
        seekSlider.addEventListener('change', function() {
            var duration = audio.duration || 0;
            if (duration) {
                audio.currentTime = (seekSlider.value / 100) * duration;
            }
            isSeeking = false;
        });

        // Volume slider drag
        volumeSlider.addEventListener('input', function() {
            var vol = volumeSlider.value / 100;
            audio.volume = vol;
            if (vol === 0) {
                volumeIcon.textContent = '🔇';
            } else if (vol < 0.5) {
                volumeIcon.textContent = '🔉';
            } else {
                volumeIcon.textContent = '🔊';
            }
        });

        // Volume icon click toggle mute
        var preMuteVolume = 100;
        volumeIcon.addEventListener('click', function() {
            if (audio.volume > 0) {
                preMuteVolume = volumeSlider.value;
                audio.volume = 0;
                volumeSlider.value = 0;
                volumeIcon.textContent = '🔇';
            } else {
                audio.volume = preMuteVolume / 100;
                volumeSlider.value = preMuteVolume;
                if (preMuteVolume < 50) {
                    volumeIcon.textContent = '🔉';
                } else {
                    volumeIcon.textContent = '🔊';
                }
            }
        });

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


// Parse time numbers to mm:ss format
function formatPlayerTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    var secs = Math.floor(seconds);
    var mins = Math.floor(secs / 60);
    var remainingSecs = secs % 60;
    return mins + ':' + remainingSecs.toString().padStart(2, '0');
}

window.playSong = playSong;
window.closePlayer = closePlayer;