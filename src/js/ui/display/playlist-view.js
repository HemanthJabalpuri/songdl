// src/js/ui/display/playlist-view.js

// ============ LOAD MORE PLAYLIST ============
function loadMorePlaylist() {
    if (window._playlistState.isLoading) return window.Utils.Promise.resolve();
    window._playlistState.isLoading = true;

    var btn = document.getElementById('playlist-load-more-btn');
    if (btn) {
        btn.textContent = 'Loading...';
        btn.disabled = true;
    }

    var nextPage = window._playlistState.currentPage + 1;
    var cacheKey = window.Cache.getDetailKey('playlist', window._playlistState.token) + ':' + nextPage + ':' +
        window._playlistState.limit;

    var promise;

    // Check cache first
    if (window.Cache.has(cacheKey)) {
        console.log('[Display] Using cached playlist page:', nextPage);
        promise = window.Utils.Promise.resolve(window.Cache.get(cacheKey));
    } else {
        promise =
            window.Services.Playlist.getDetails(window._playlistState.token, nextPage, window._playlistState.limit)
                .then(function(data) {
                    window.Cache.set(cacheKey, data);
                    return data;
                });
    }

    return promise
        .then(function(data) {
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

                // Update active stack data using helper
                window.Nav.updateCurrent({loadedPages: window._playlistLoadedPages.slice()});

                // Attach song data to new cards
                var cards = resultsDiv.querySelectorAll('.song-card');
                cards.forEach(function(card, idx) {
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
        })
        .catch(function(error) {
            console.error('[Display] Load more playlist error:', error);
            var btn = document.getElementById('playlist-load-more-btn');
            if (btn) {
                btn.textContent = 'Retry';
                btn.disabled = false;
            }
        })
        .then(function() {
            window._playlistState.isLoading = false;
        });
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
        var lastKey = window._playlistLoadedPages[window._playlistLoadedPages.length - 1];
        var lastData = window.Cache.get(lastKey);
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

// ============ RENDER PLAYLIST ============
function renderPlaylist(playlist) {
    var image = playlist.image;
    if (!image || image.indexOf('placeholder.com') !== -1) {
        image = window.Utils.getDefaultImage('playlist');
    }
    var playlistCountInfo = playlist.list_count || playlist.song_count || 0;
    var html = '\n        <div class="playlist-header">\n' +
        '            <img src="' + image + '" alt="' + escapeHtml(playlist.title) + '" />\n' +
        '            <div class="playlist-header-info">\n' +
        '                <h2>' + escapeHtml(playlist.title) + '</h2>\n' +
        '                <p>' + escapeHtml(playlist.subtitle || '') + '</p>\n' +
        '                <p>' + playlistCountInfo + ' songs • ' + escapeHtml(playlist.language || 'Unknown') +
        '</p>\n' +
        (playlist.description ?
             '                <p class="playlist-description">' + escapeHtml(playlist.description) + '</p>\n' :
             '') +
        '                <div class="playlist-actions">\n' +
        '                    <button class="btn-back" id="btn-back-search">← Back</button>\n' +
        '                </div>\n' +
        '            </div>\n' +
        '        </div>\n' +
        '        <div class="song-list playlist-songs-list">\n    ';

    var playlistContext = {
        type: 'playlist',
        image: playlist.image,
        language: playlist.language,
        year: playlist.year,
        title: playlist.title
    };

    if (playlist.songs && playlist.songs.length > 0) {
        // For page 1, index starts at 0, so it's correct
        playlist.songs.forEach(function(song, index) {
            html += createSongCard(song, index, playlistContext);
        });
    } else {
        html += '<div class="no-results">No songs found in this playlist.</div>';
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
}

function viewPlaylist(token) {
    console.log('[View] viewPlaylist called, isRestoring:', window._isRestoring);

    // Only push if not restoring
    if (!window._isRestoring) {
        window.Nav.push({type: 'playlist', data: {token: token, page: 1, loadedPages: []}});
    }

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
        window._playlistState.total = parseInt(playlist.list_count) || parseInt(playlist.song_count) || 0;
        window._playlistLoadedPages.push(cacheKey);

        // Update stack entry with the first page
        var currentStack = window.Nav.getStack();
        for (var i = currentStack.length - 1; i >= 0; i--) {
            if (currentStack[i].type === 'playlist') {
                currentStack[i].data.loadedPages = window._playlistLoadedPages.slice();
                console.log('[Nav] Updated playlist stack with first page');
                break;
            }
        }

        renderPlaylist(playlist);
        showPlaylistLoadMoreButton();
        return window.Utils.Promise.resolve();
    }

    return window.Services.Playlist.getDetails(token, page, limit)
        .then(function(playlist) {
            // Store in cache
            window.Cache.set(cacheKey, playlist);
            window._playlistState.total = parseInt(playlist.list_count) || parseInt(playlist.song_count) || 0;
            window._playlistLoadedPages.push(cacheKey);

            // Update stack entry with the first page
            var currentStack = window.Nav.getStack();
            for (var i = currentStack.length - 1; i >= 0; i--) {
                if (currentStack[i].type === 'playlist') {
                    currentStack[i].data.loadedPages = window._playlistLoadedPages.slice();
                    console.log('[Nav] Updated playlist stack with first page');
                    break;
                }
            }

            renderPlaylist(playlist);
            showPlaylistLoadMoreButton();
        })
        .catch(function(error) {
            console.error('[View Playlist Error] Failed to load or render details:', error);
            DOM.results.innerHTML =
                '<div class="error">❌ Error loading playlist: ' + escapeHtml(error.message) + '</div>';
        });
}

// ============ EXPOSE ============
window.viewPlaylist = viewPlaylist;
window.loadMorePlaylist = loadMorePlaylist;
window.renderPlaylist = renderPlaylist;
window.showPlaylistLoadMoreButton = showPlaylistLoadMoreButton;
