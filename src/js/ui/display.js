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
        <div class="song-card" data-token="${song.token || song.id}">
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
                    <button class="btn-play" data-token="${song.token || song.id}" data-songid="${songId}" 
                        ${!hasStream ? 'disabled' : ''}>
                        ▶ Play
                    </button>
                    <button class="btn-download" data-token="${song.token || song.id}" data-songid="${songId}" 
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
            var songCard = this.closest('.song-card');
            var songData = songCard ? songCard._songData : null;
            if (songData && typeof window.playSong === 'function') {
                window.playSong(songData);
            }
        });
    });
    
    downloadBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            var songCard = this.closest('.song-card');
            var songData = songCard ? songCard._songData : null;
            if (songData && typeof window.downloadSong === 'function') {
                window.downloadSong(songData);
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

// ============ CREATE PLAYLIST CARD ============
function createPlaylistCard(playlist) {
    var songCount = playlist.more_info?.song_count || playlist.song_count || '0';
    
    var html = `
        <div class="playlist-card" data-token="${playlist.token}">
            <img src="${playlist.image || 'https://via.placeholder.com/100'}" alt="${playlist.title}" />
            <div class="playlist-info">
                <div class="playlist-title">${escapeHtml(playlist.title)}</div>
                <div class="playlist-artist">${escapeHtml(playlist.subtitle || '')}</div>
                <div class="playlist-details">
                    ${songCount} songs • 
                    ${escapeHtml(playlist.language || 'Unknown')}
                </div>
                <button class="btn-view-playlist" data-token="${playlist.token}">
                    📂 View Playlist
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

// ============ ATTACH PLAYLIST EVENTS ============
function attachPlaylistEvents(container) {
    // Playlist card click (open playlist)
    container.querySelectorAll('.playlist-card').forEach(function(card) {
        card.addEventListener('click', function() {
            var token = this.dataset.token;
            if (token && typeof window.viewPlaylist === 'function') {
                window.viewPlaylist(token);
            }
        });
    });
    
    // View playlist button click
    container.querySelectorAll('.btn-view-playlist').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            var token = this.dataset.token;
            if (token && typeof window.viewPlaylist === 'function') {
                window.viewPlaylist(token);
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
    
    // Attach song data to cards
    var cards = DOM.results.querySelectorAll('.song-card');
    cards.forEach(function(card, index) {
        if (songs[index]) {
            card._songData = songs[index];
        }
    });
    
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

// ============ DISPLAY PLAYLISTS ============
function displayPlaylists(playlists) {
    var html = '<div class="results">';
    
    playlists.forEach(function(playlist) {
        html += createPlaylistCard(playlist);
    });
    
    html += '</div>';
    DOM.results.innerHTML = html;
    
    // Attach events to the results container
    attachPlaylistEvents(DOM.results);
}

// Extract rendering logic to a separate function
function renderAlbum(album) {
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
            html += createSongCard(song, index, album);
        });
    } else {
        html += `<div class="no-results">No songs found in this album.</div>`;
    }

    html += '</div>';
    DOM.results.innerHTML = html;
    
    // Attach song data to cards
    var cards = DOM.results.querySelectorAll('.song-card');
    if (album.songs && album.songs.length > 0) {
        cards.forEach(function(card, index) {
            if (album.songs[index]) {
                card._songData = album.songs[index];
            }
        });
    }
    
    // Attach events
    attachSongEvents(DOM.results);
    
    // Back button with cache support
    var backBtn = document.getElementById('btn-back-search');
    if (backBtn) {
        backBtn.addEventListener('click', function() {
            // Check if we have cached search results
            if (window._lastSearch) {
                var last = window._lastSearch;
                var searchKey = window.Cache.getSearchKey(last.type, last.query, last.page, last.limit);
                
                if (window.Cache.has(searchKey)) {
                    console.log('[Display] Restoring search from cache');
                    var data = window.Cache.get(searchKey);
                    // Restore results
                    if (last.type === 'songs') {
                        displaySongs(data.results);
                    } else if (last.type === 'albums') {
                        displayAlbums(data.results);
                    } else if (last.type === 'playlists') {
                        displayPlaylists(data.results);
                    }
                    var statsDiv = document.getElementById('stats');
                    if (statsDiv) statsDiv.innerHTML = 'Found ' + data.results.length + ' ' + last.type + ' (cached)';
                    return;
                }
            }
            
            // Fallback: call search
            if (typeof window.search === 'function') {
                window.search();
            }
        });
    }
}

// ============ VIEW ALBUM ============
async function viewAlbum(token) {
    var cacheKey = window.Cache.getDetailKey('album', token);
    
    // Check cache first
    if (window.Cache.has(cacheKey)) {
        console.log('[Display] Using cached album:', token);
        var album = window.Cache.get(cacheKey);
        renderAlbum(album);
        return;
    }
    
    DOM.results.innerHTML = '<div class="loading">📂 Loading album...</div>';
    DOM.stats.innerHTML = '';

    try {
        var album = await window.Services.Album.getDetails(token);
        
        // Store in cache
        window.Cache.set(cacheKey, album);
        renderAlbum(album);
        
    } catch (error) {
        DOM.results.innerHTML = `<div class="error">❌ Error loading album: ${error.message}</div>`;
    }
}

// ============ LOAD MORE PLAYLIST ============
async function loadMorePlaylist() {
    if (window._playlistState.isLoading) return;
    window._playlistState.isLoading = true;

    var btn = document.getElementById('playlist-load-more-btn');
    if (btn) {
        btn.textContent = 'Loading...';
        btn.disabled = true;
    }

    var nextPage = window._playlistState.currentPage + 1;
    var cacheKey = window.Cache.getDetailKey('playlist', window._playlistState.token) + ':' + nextPage + ':' + window._playlistState.limit;

    try {
        var data;
        
        // Check cache first
        if (window.Cache.has(cacheKey)) {
            console.log('[Display] Using cached playlist page:', nextPage);
            data = window.Cache.get(cacheKey);
        } else {
            data = await window.Services.Playlist.getDetails(
                window._playlistState.token,
                nextPage,
                window._playlistState.limit
            );
            window.Cache.set(cacheKey, data);
        }

        // Append songs
        if (data.songs && data.songs.length > 0) {
            var resultsDiv = document.getElementById('results');
            
            // Remove load more button
            var oldBtn = document.getElementById('playlist-load-more-btn');
            if (oldBtn) oldBtn.remove();

            // Calculate starting index for this page (global)
            var startIndex = (nextPage - 1) * window._playlistState.limit;

            // Append new songs with correct global numbering
            data.songs.forEach(function(song, idx) {
                var globalIndex = startIndex + idx;
                var songCard = createSongCard(song, globalIndex, data);
                resultsDiv.insertAdjacentHTML('beforeend', songCard);
            });

            // Update state
            window._playlistState.currentPage = nextPage;
            window._playlistLoadedPages.push(cacheKey);

            // Attach events to new cards
            attachSongEvents(resultsDiv);
            
            // Attach song data to new cards
            var cards = resultsDiv.querySelectorAll('.song-card');
            cards.forEach(function(card, idx) {
                var globalIdx = startIndex + idx;
                if (idx >= startIndex && data.songs[idx - startIndex]) {
                    card._songData = data.songs[idx - startIndex];
                }
            });

            // Show load more button again
            showPlaylistLoadMoreButton();
        } else {
            var endMsg = document.createElement('div');
            endMsg.className = 'end-of-results';
            endMsg.id = 'playlist-load-more-btn';
            endMsg.textContent = '🏁 End of playlist';
            document.getElementById('results').appendChild(endMsg);
        }
    } catch (error) {
        console.error('[Display] Load more playlist error:', error);
        var btn = document.getElementById('playlist-load-more-btn');
        if (btn) {
            btn.textContent = 'Retry';
            btn.disabled = false;
        }
    } finally {
        window._playlistState.isLoading = false;
    }
}

// ============ SHOW PLAYLIST LOAD MORE BUTTON ============
function showPlaylistLoadMoreButton() {
    var resultsDiv = document.getElementById('results');
    if (!resultsDiv) return;
    
    // Remove existing load more button
    var existingBtn = document.getElementById('playlist-load-more-btn');
    if (existingBtn) existingBtn.remove();
    
    // Check if more results exist
    var hasMore = false;
    if (window._playlistState.total > 0) {
        var loadedCount = window._playlistLoadedPages.length * window._playlistState.limit;
        hasMore = loadedCount < window._playlistState.total;
    } else {
        var lastData = window.Cache.get(window._playlistLoadedPages[window._playlistLoadedPages.length - 1]);
        if (lastData && lastData.songs) {
            hasMore = lastData.songs.length >= window._playlistState.limit;
        }
    }
    
    if (!hasMore) {
        var endMsg = document.createElement('div');
        endMsg.className = 'end-of-results';
        endMsg.id = 'playlist-load-more-btn';
        endMsg.textContent = '🏁 End of playlist';
        resultsDiv.appendChild(endMsg);
        return;
    }
    
    var btn = document.createElement('button');
    btn.id = 'playlist-load-more-btn';
    btn.className = 'btn-load-more';
    btn.textContent = 'Load ' + window._playlistState.limit + ' More Songs';
    btn.addEventListener('click', function() {
        loadMorePlaylist();
    });
    resultsDiv.appendChild(btn);
}

// Extract rendering logic to a separate function
// ============ RENDER PLAYLIST ============
function renderPlaylist(playlist) {
    var html = `
        <div class="playlist-header">
            <img src="${playlist.image || 'https://via.placeholder.com/200'}" alt="${playlist.title}" />
            <div class="playlist-header-info">
                <h2>${escapeHtml(playlist.title)}</h2>
                <p>${escapeHtml(playlist.subtitle || '')}</p>
                <p>${playlist.list_count || playlist.song_count || 0} songs • ${escapeHtml(playlist.language || 'Unknown')}</p>
                ${playlist.description ? `<p class="playlist-description">${escapeHtml(playlist.description)}</p>` : ''}
                <div class="playlist-actions">
                    <button class="btn-back" id="btn-back-search">← Back to Search</button>
                </div>
            </div>
        </div>
        <div class="song-list">
    `;

    if (playlist.songs && playlist.songs.length > 0) {
        // For page 1, index starts at 0, so it's correct
        playlist.songs.forEach(function(song, index) {
            html += createSongCard(song, index, playlist);
        });
    } else {
        html += `<div class="no-results">No songs found in this playlist.</div>`;
    }

    html += '</div>';
    DOM.results.innerHTML = html;
    
    // Attach song data to cards
    var cards = DOM.results.querySelectorAll('.song-card');
    if (playlist.songs && playlist.songs.length > 0) {
        cards.forEach(function(card, index) {
            if (playlist.songs[index]) {
                card._songData = playlist.songs[index];
            }
        });
    }
    
    // Attach events
    attachSongEvents(DOM.results);
    
    // Back button with cache support
    var backBtn = document.getElementById('btn-back-search');
    if (backBtn) {
        backBtn.addEventListener('click', function() {
            // Check if we have cached search results
            if (window._searchLoadedPages && window._searchLoadedPages.length > 0) {
                console.log('[Display] Restoring search from cache');
                var allResults = [];
                var searchType = window._searchState.type || 'songs';
                window._searchLoadedPages.forEach(function(pageKey) {
                    var pageData = window.Cache.get(pageKey);
                    if (pageData && pageData.results) {
                        allResults = allResults.concat(pageData.results);
                    }
                });
                
                if (allResults.length > 0) {
                    displaySearchResults(allResults, searchType);
                    showLoadMoreButton('search');
                    var statsDiv = document.getElementById('stats');
                    if (statsDiv) statsDiv.innerHTML = 'Found ' + allResults.length + ' ' + searchType + ' (cached)';
                    return;
                }
            }
            
            // Fallback: call search
            if (typeof window.search === 'function') {
                window.search();
            }
        });
    }
}

// ============ VIEW PLAYLIST ============
async function viewPlaylist(token) {
    // Reset playlist state
    window._playlistState.token = token;
    window._playlistState.currentPage = 1;
    window._playlistState.limit = 50;
    window._playlistState.total = 0;
    window._playlistState.isLoading = false;
    window._playlistLoadedPages = [];

    var page = window._playlistState.currentPage;
    var limit = window._playlistState.limit;
    var cacheKey = 'playlist:' + token + ':' + page + ':' + limit;

    DOM.results.innerHTML = '<div class="loading">📂 Loading playlist...</div>';
    DOM.stats.innerHTML = '';

    // Check cache first
    if (window.Cache.has(cacheKey)) {
        console.log('[Display] Using cached playlist page 1:', token);
        var playlist = window.Cache.get(cacheKey);
        // list_count is at top level
        window._playlistState.total = parseInt(playlist.list_count) || parseInt(playlist.song_count) || 0;
        window._playlistLoadedPages.push(cacheKey);
        renderPlaylist(playlist);
        showPlaylistLoadMoreButton();
        return;
    }

    try {
        var playlist = await window.Services.Playlist.getDetails(token, page, limit);
        
        // Store in cache
        window.Cache.set(cacheKey, playlist);
        window._playlistState.total = parseInt(playlist.list_count) || parseInt(playlist.song_count) || 0;
        window._playlistLoadedPages.push(cacheKey);
        
        renderPlaylist(playlist);
        showPlaylistLoadMoreButton();
        
    } catch (error) {
        DOM.results.innerHTML = `<div class="error">❌ Error loading playlist: ${error.message}</div>`;
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
    
    // Check cache first
    if (window.lyricsCache && window.lyricsCache[token]) {
        console.log('[Display] Using cached lyrics for:', token);
        var cachedLyrics = window.lyricsCache[token];
        displayLyricsOverlay(cachedLyrics);
        return;
    }
    
    try {
        var data = await window.API.getLyrics(token);
        var lyricsText = data.lyrics && data.lyrics.lyrics ? data.lyrics.lyrics : 'No lyrics available';
        
        // Format lyrics (replace <br> with newlines)
        lyricsText = window.Utils.formatters.formatLyrics(lyricsText);
        
        // Store in cache
        if (!window.lyricsCache) {
            window.lyricsCache = {};
        }
        window.lyricsCache[token] = lyricsText;
        console.log('[Display] Lyrics cached for:', token);
        
        // Display lyrics overlay
        displayLyricsOverlay(lyricsText);
        
    } catch (error) {
        console.error('[Display] Lyrics fetch error:', error);
        alert('Failed to fetch lyrics: ' + error.message);
    }
}

// ============ DISPLAY LYRICS OVERLAY ============
function displayLyricsOverlay(lyricsText) {
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
    
    // ESC key to close (using a single listener)
    var escHandler = function(e) {
        if (e.key === 'Escape') {
            var overlayEl = document.getElementById('lyrics-overlay');
            if (overlayEl) {
                closeLyricsOverlay();
                document.removeEventListener('keydown', escHandler);
            }
        }
    };
    document.addEventListener('keydown', escHandler);
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
window.displayPlaylists = displayPlaylists;
window.viewAlbum = viewAlbum;
window.viewPlaylist = viewPlaylist;
window.loadMorePlaylist = loadMorePlaylist;
window.renderPlaylist = renderPlaylist;
window.showPlaylistLoadMoreButton = showPlaylistLoadMoreButton;
window.showLyrics = showLyrics;
window.closeLyricsOverlay = closeLyricsOverlay;
