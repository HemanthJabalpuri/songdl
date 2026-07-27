// ui/js/display.js

// ============ CREATE SONG CARD ============
function createSongCard(song, index, albumContext) {
    var hasStream = song.has_stream;
    var songId = song.id || song.token || 'song-' + (index || 0);
    var playCount = song.play_count ? parseInt(song.play_count).toLocaleString() : '0';
    var duration = formatDuration(song.duration || song.more_info?.duration);
    var image = song.image || (albumContext ? albumContext.image : 'https://via.placeholder.com/80');
    var albumLanguage = albumContext ? albumContext.language : '';
    var albumYear = albumContext ? albumContext.year : '';
    
    // For album view, show index number
    var titlePrefix = (index !== undefined && albumContext) ? (index + 1) + '. ' : '';
    
    var html = `
        <div class="song-card" id="song-${songId}">
            <img src="${image}" alt="${escapeHtml(song.title)}" />
            <div class="song-info">
                <div class="song-title">${titlePrefix}${escapeHtml(song.title)}</div>
                <div class="song-artist">${escapeHtml(song.subtitle)}</div>
                <div class="song-details">
                    ${escapeHtml(albumLanguage || song.language || 'Unknown')} • 
                    ${song.year || albumYear || 'N/A'} • 
                    ${playCount} plays • 
                    ${duration}
                </div>
                <div class="song-actions">
                    <button class="btn-play" data-token="${song.token}" data-songid="${songId}" 
                        ${!hasStream ? 'disabled' : ''}>
                        ▶ Play
                    </button>
                    <button class="btn-download" data-token="${song.token}" data-songid="${songId}" 
                        ${!hasStream ? 'disabled' : ''}>
                        ⬇ Download
                    </button>
                    ${song.has_lyrics ? `<button class="btn-lyrics" data-token="${song.token}" data-songid="${songId}">📜</button>` : ''}
                    <div class="play-progress" id="play-progress-${songId}">⏳ Decrypting stream...</div>
                    <div class="download-progress" id="download-progress-${songId}">⏳ Downloading with metadata...</div>
                    ${!hasStream ? '<span style="color:#999;font-size:12px;">No stream available</span>' : ''}
                </div>
            </div>
        </div>
    `;
    
    return html;
}

// ============ ATTACH SONG EVENTS ============
function attachSongEvents(container) {
    var playBtns = container.querySelectorAll('.btn-play');
    var downloadBtns = container.querySelectorAll('.btn-download');
    
    playBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            var token = this.dataset.token;
            var songId = this.dataset.songid;
            if (token && songId && typeof window.playSong === 'function') {
                // Find the song card
                var songCard = document.getElementById('song-' + songId);
                window.playSong(token, songId, songCard);
            }
        });
    });

    downloadBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            var token = this.dataset.token;
            var songId = this.dataset.songid;
            if (token && songId && typeof window.downloadSong === 'function') {
                window.downloadSong(token, songId);
            }
        });
    });

    // Lyrics buttons
    var lyricsBtns = container.querySelectorAll('.btn-lyrics');
    lyricsBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            var token = this.dataset.token;
            var songId = this.dataset.songid;
            if (token && typeof window.showLyrics === 'function') {
                window.showLyrics(token, songId);
            }
        });
    });
}

// ============ CREATE ALBUM CARD ============
function createAlbumCard(album) {
    var songCount = album.more_info?.song_count || 0;
    
    var html = `
        <div class="album-card" data-token="${album.token}">
            <img src="${album.image || 'https://via.placeholder.com/100'}" alt="${album.title}" />
            <div class="album-info">
                <div class="album-title">${escapeHtml(album.title)}</div>
                <div class="album-artist">${escapeHtml(album.subtitle)}</div>
                <div class="album-details">
                    ${songCount} songs • 
                    ${escapeHtml(album.language || 'Unknown')} • 
                    ${album.year || 'N/A'}
                </div>
                <button class="btn-view-album" data-token="${album.token}">
                    📂 View Album
                </button>
            </div>
        </div>
    `;
    
    return html;
}

// ============ ATTACH ALBUM EVENTS ============
function attachAlbumEvents(container) {
    // Album card click (open album)
    container.querySelectorAll('.album-card').forEach(function(card) {
        card.addEventListener('click', function() {
            var token = this.dataset.token;
            if (token && typeof window.viewAlbum === 'function') {
                window.viewAlbum(token);
            }
        });
    });
    
    // View album button click
    container.querySelectorAll('.btn-view-album').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            var token = this.dataset.token;
            if (token && typeof window.viewAlbum === 'function') {
                window.viewAlbum(token);
            }
        });
    });
}

// ============ DISPLAY SONGS ============
function displaySongs(songs) {
    var html = '<div class="results">';
    
    songs.forEach(function(song, index) {
        html += createSongCard(song, index);
    });
    
    html += '</div>';
    DOM.results.innerHTML = html;
    
    // Attach events to the results container
    attachSongEvents(DOM.results);
}

// ============ DISPLAY ALBUMS ============
function displayAlbums(albums) {
    var html = '<div class="results">';
    
    albums.forEach(function(album) {
        html += createAlbumCard(album);
    });
    
    html += '</div>';
    DOM.results.innerHTML = html;
    
    // Attach events to the results container
    attachAlbumEvents(DOM.results);
}

// ============ VIEW ALBUM ============
async function viewAlbum(token) {
    DOM.results.innerHTML = '<div class="loading">📂 Loading album...</div>';
    DOM.stats.innerHTML = '';

    try {
        var album = await window.Services.Album.getDetails(token);

        var html = `
            <div class="album-header">
                <img src="${album.image || 'https://via.placeholder.com/200'}" alt="${album.title}" />
                <div class="album-header-info">
                    <h2>${escapeHtml(album.title)}</h2>
                    <p>${escapeHtml(album.subtitle || '')}</p>
                    <p>${album.song_count || album.songs?.length || 0} songs • ${escapeHtml(album.language || 'Unknown')} • ${album.year || 'N/A'}</p>
                    <div class="album-actions">
                        <button class="btn-back" id="btn-back-search">← Back to Search</button>
                    </div>
                </div>
            </div>
            <div class="song-list">
        `;

        if (album.songs && album.songs.length > 0) {
            album.songs.forEach(function(song, index) {
                // Pass album context for album view
                html += createSongCard(song, index, album);
            });
        } else {
            html += `<div class="no-results">No songs found in this album.</div>`;
        }

        html += '</div>';
        DOM.results.innerHTML = html;
        
        // Attach events to the results container
        attachSongEvents(DOM.results);
        
        // Back button
        var backBtn = document.getElementById('btn-back-search');
        if (backBtn) {
            backBtn.addEventListener('click', function() {
                if (typeof window.search === 'function') {
                    window.search();
                }
            });
        }
        
    } catch (error) {
        DOM.results.innerHTML = `<div class="error">❌ Error loading album: ${error.message}</div>`;
    }
}

// ============ SHOW LYRICS ============
async function showLyrics(token, songId) {
    console.log('[Display] Fetching lyrics for:', token);
    
    // Check if lyrics overlay already exists
    var existingOverlay = document.getElementById('lyrics-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }
    
    try {
        var data = await window.API.getLyrics(token);
        var lyricsText = data.lyrics && data.lyrics.lyrics ? data.lyrics.lyrics : 'No lyrics available';
        
        // Format lyrics (replace <br> with newlines)
        lyricsText = window.Utils.formatters.formatLyrics(lyricsText);
        
        // Create overlay
        var overlay = document.createElement('div');
        overlay.id = 'lyrics-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 2147483647;
            background: rgba(17, 17, 17, 0.95);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;
        
        overlay.innerHTML = `
            <div style="
                max-width: 600px;
                width: 100%;
                max-height: 80vh;
                background: #1a1a1a;
                border-radius: 12px;
                padding: 24px;
                border: 1px solid #333;
                display: flex;
                flex-direction: column;
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <h2 style="color: #1db954; margin: 0; font-size: 20px;">📜 Lyrics</h2>
                    <button id="lyrics-close-btn" style="
                        background: #333;
                        color: #fff;
                        border: none;
                        border-radius: 50%;
                        width: 36px;
                        height: 36px;
                        font-size: 18px;
                        cursor: pointer;
                    ">✕</button>
                </div>
                <div id="lyrics-content" style="
                    overflow-y: auto;
                    max-height: 60vh;
                    color: #ddd;
                    font-size: 15px;
                    line-height: 1.8;
                    white-space: pre-wrap;
                    padding-right: 8px;
                ">
${lyricsText}
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Close button event listener
        var closeBtn = document.getElementById('lyrics-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                closeLyricsOverlay();
            });
        }
        
        // Click outside to close
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                closeLyricsOverlay();
            }
        });
        
        // ESC key to close
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                var overlayEl = document.getElementById('lyrics-overlay');
                if (overlayEl) {
                    closeLyricsOverlay();
                }
            }
        });
        
    } catch (error) {
        console.error('[Display] Lyrics fetch error:', error);
        alert('Failed to fetch lyrics: ' + error.message);
    }
}

function closeLyricsOverlay() {
    var overlay = document.getElementById('lyrics-overlay');
    if (overlay) {
        overlay.remove();
        console.log('[Display] Lyrics overlay closed');
    }
}

// ============ EXPOSE ============
window.displaySongs = displaySongs;
window.displayAlbums = displayAlbums;
window.viewAlbum = viewAlbum;
window.showLyrics = showLyrics;
window.closeLyricsOverlay = closeLyricsOverlay;
