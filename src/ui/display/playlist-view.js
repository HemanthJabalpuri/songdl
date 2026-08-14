// src/js/ui/display/playlist-view.js

// ============ LOAD MORE PLAYLIST ============
function loadMorePlaylist() {
    if (window.UI._playlistState.isLoading) return window.Utils.Promise.resolve();
    window.UI._playlistState.isLoading = true;

    var btn = document.getElementById('playlist-load-more-btn');
    if (btn) {
        btn.textContent = 'Loading...';
        btn.disabled = true;
    }

    var nextPage = window.UI._playlistState.currentPage + 1;
    var cacheKey = window.Utils.Cache.getDetailKey('playlist', window.UI._playlistState.token) + ':' + nextPage + ':' +
        window.UI._playlistState.limit;

    var promise;

    // Check cache first
    if (window.Utils.Cache.has(cacheKey)) {
        console.log('[Display] Using cached playlist page:', nextPage);
        promise = window.Utils.Promise.resolve(window.Utils.Cache.get(cacheKey));
    } else {
        promise =
            window.Services.Playlist.getDetails(window.UI._playlistState.token, nextPage, window.UI._playlistState.limit)
                .then(function(data) {
                    window.Utils.Cache.set(cacheKey, data);
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
                var startIndex = (nextPage - 1) * window.UI._playlistState.limit;

                // Append new songs with correct global numbering
                var targetList = resultsDiv ? (resultsDiv.querySelector('.playlist-songs-list') || resultsDiv) : null;
                data.songs.forEach(function(song, idx) {
                    var globalIndex = startIndex + idx;
                    var songCard = createSongCard(song, globalIndex, data);
                    if (songCard && targetList) {
                        targetList.appendChild(songCard);
                    }
                });

                // Update state
                window.UI._playlistState.currentPage = nextPage;
                window.UI._playlistLoadedPages.push(cacheKey);

                // Update active stack data using helper
                window.UI.Nav.updateCurrent({loadedPages: window.UI._playlistLoadedPages.slice()});

                // Show load more button again
                showPlaylistLoadMoreButton();
            } else {
                var endMsg = document.createElement('div');
                endMsg.className = 'end-of-results';
                endMsg.id = 'playlist-load-more-btn';
                endMsg.textContent = 'End of playlist';
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
            window.UI._playlistState.isLoading = false;
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
    if (window.UI._playlistState.total > 0) {
        var loadedCount = window.UI._playlistLoadedPages.length * window.UI._playlistState.limit;
        hasMore = loadedCount < window.UI._playlistState.total;
    } else {
        var lastKey = window.UI._playlistLoadedPages[window.UI._playlistLoadedPages.length - 1];
        var lastData = window.Utils.Cache.get(lastKey);
        if (lastData && lastData.songs) {
            hasMore = lastData.songs.length >= window.UI._playlistState.limit;
        }
    }

    if (!hasMore) {
        var endMsg = document.createElement('div');
        endMsg.className = 'end-of-results';
        endMsg.id = 'playlist-load-more-btn';
        endMsg.textContent = 'End of playlist';
        resultsDiv.appendChild(endMsg);
        return;
    }

    var btn = document.createElement('button');
    btn.id = 'playlist-load-more-btn';
    btn.className = 'btn-load-more';
    btn.textContent = 'Load ' + window.UI._playlistState.limit + ' More Songs';
    btn.addEventListener('click', function() {
        loadMorePlaylist();
    });
    resultsDiv.appendChild(btn);
}

// ============ RENDER PLAYLIST ============
function renderPlaylist(playlist) {
    window.UI.hideSearchOptions();
    var image = playlist.image;
    if (!image || image.indexOf('placeholder.com') !== -1) {
        image = window.Utils.getDefaultImage('playlist');
    }
    var playlistCountInfo = playlist.list_count || playlist.song_count || 0;
    /* clang-format off */
    var headerHtml = window.Utils.compileHTML([
        '<div class="playlist-header">',
        '    <img src="' + image + '" alt="' + escapeHtml(playlist.title) + '" />',
        '    <div class="playlist-header-info">',
        '        <h2>' + escapeHtml(playlist.title) + '</h2>',
        '        <p>' + escapeHtml(playlist.subtitle || '') + '</p>',
        '        <p>' + playlistCountInfo + ' songs | ' + escapeHtml(playlist.language || 'Unknown') + '</p>',
        playlist.description ? '        <p class="playlist-description">' + escapeHtml(playlist.description) + '</p>' : '',
        '        <div class="playlist-actions">',
        '            <button class="btn-back" id="btn-back-search">' + window.UI.icons.back + 'Back</button>',
        '        </div>',
        '    </div>',
        '</div>'
    ]);
    /* clang-format on */

    var headerNode = window.Utils.compileHTMLToNode(headerHtml);
    window.UI.bindBackButton(headerNode, '#btn-back-search');

    var listNode = document.createElement('div');
    listNode.className = 'song-list playlist-songs-list';

    var playlistContext = {
        type: 'playlist',
        image: playlist.image,
        language: playlist.language,
        year: playlist.year,
        title: playlist.title
    };

    if (playlist.songs && playlist.songs.length > 0) {
        playlist.songs.forEach(function(song, index) {
            var card = createSongCard(song, index, playlistContext);
            if (card) {
                listNode.appendChild(card);
            }
        });
    } else {
        listNode.innerHTML = '<div class="no-results">No songs found in this playlist.</div>';
    }

    window.Utils.render(DOM.results, [headerNode, listNode]);
}

function viewPlaylist(token) {
    console.log('[View] viewPlaylist called, isRestoring:', window.UI._isRestoring);

    // Only push if not restoring
    if (!window.UI._isRestoring) {
        window.UI.Nav.push({type: 'playlist', data: {token: token, page: 1, loadedPages: []}});
    }

    // Reset playlist state
    window.UI._playlistState.token = token;
    window.UI._playlistState.currentPage = 1;
    window.UI._playlistState.limit = 50;
    window.UI._playlistState.total = 0;
    window.UI._playlistState.isLoading = false;
    window.UI._playlistLoadedPages = [];

    var page = window.UI._playlistState.currentPage;
    var limit = window.UI._playlistState.limit;
    var cacheKey = 'playlist:' + token + ':' + page + ':' + limit;

    DOM.results.innerHTML = '<div class="loading">' + window.UI.icons.spinnerLarge + 'Loading playlist...</div>';
    DOM.stats.innerHTML = '';

    // Check cache first
    if (window.Utils.Cache.has(cacheKey)) {
        console.log('[Display] Using cached playlist page 1:', token);
        var playlist = window.Utils.Cache.get(cacheKey);
        window.UI._playlistState.total = parseInt(playlist.list_count) || parseInt(playlist.song_count) || 0;
        window.UI._playlistLoadedPages.push(cacheKey);

        // Update stack entry with the first page
        var currentStack = window.UI.Nav.getStack();
        for (var i = currentStack.length - 1; i >= 0; i--) {
            if (currentStack[i].type === 'playlist') {
                currentStack[i].data.loadedPages = window.UI._playlistLoadedPages.slice();
                console.log('[Nav] Updated playlist stack with first page');
                break;
            }
        }

        window.UI.renderPlaylist(playlist);
        window.UI.showPlaylistLoadMoreButton();
        return window.Utils.Promise.resolve();
    }

    return window.Services.Playlist.getDetails(token, page, limit)
        .then(function(playlist) {
            // Store in cache
            window.Utils.Cache.set(cacheKey, playlist);
            window.UI._playlistState.total = parseInt(playlist.list_count) || parseInt(playlist.song_count) || 0;
            window.UI._playlistLoadedPages.push(cacheKey);

            // Update stack entry with the first page
            var currentStack = window.UI.Nav.getStack();
            for (var i = currentStack.length - 1; i >= 0; i--) {
                if (currentStack[i].type === 'playlist') {
                    currentStack[i].data.loadedPages = window.UI._playlistLoadedPages.slice();
                    console.log('[Nav] Updated playlist stack with first page');
                    break;
                }
            }

            window.UI.renderPlaylist(playlist);
            window.UI.showPlaylistLoadMoreButton();
        })
        .catch(function(error) {
            console.error('[View Playlist Error] Failed to load or render details:', error);
            DOM.results.innerHTML =
                '<div class="error">Error loading playlist: ' + escapeHtml(error.message) + '</div>';
        });
}

// ============ EXPOSE ============
window.UI.viewPlaylist = viewPlaylist;
window.UI.loadMorePlaylist = loadMorePlaylist;
window.UI.renderPlaylist = renderPlaylist;
window.UI.showPlaylistLoadMoreButton = showPlaylistLoadMoreButton;

/* clang-format off */
// Register playlist card and detail page styling rules
window.Utils.registerStyle([
    '/* Playlist Cards */',
    '.playlist-card {',
    '    background: #1a1a1a;',
    '    padding: 15px;',
    '    border-radius: 8px;',
    '    display: flex;',
    '    gap: 15px;',
    '    align-items: center;',
    '    cursor: pointer;',
    '    border: 1px solid #222;',
    '}',
    '.playlist-card:hover {',
    '    background: #222;',
    '}',
    '.playlist-card img {',
    '    width: 100px;',
    '    height: 100px;',
    '    border-radius: 4px;',
    '    object-fit: cover;',
    '    background: #222;',
    '}',
    '.playlist-info {',
    '    flex: 1;',
    '}',
    '.playlist-title {',
    '    font-size: 18px;',
    '    font-weight: bold;',
    '    color: #fff;',
    '}',
    '.playlist-artist {',
    '    color: #aaa;',
    '    margin: 5px 0;',
    '}',
    '.playlist-details {',
    '    color: #666;',
    '    font-size: 14px;',
    '}',
    '.btn-view-playlist {',
    '    margin-top: 8px;',
    '    padding: 6px 16px;',
    '    background: #6c757d;',
    '    color: white;',
    '    border: none;',
    '    border-radius: 4px;',
    '    font-size: 13px;',
    '    cursor: pointer;',
    '}',
    '.btn-view-playlist:hover {',
    '    background: #5a6268;',
    '}',
    '/* Playlist Header */',
    '.playlist-header {',
    '    background: #1a1a1a;',
    '    padding: 20px;',
    '    border-radius: 8px;',
    '    display: flex;',
    '    gap: 20px;',
    '    margin-bottom: 20px;',
    '    border: 1px solid #222;',
    '}',
    '.playlist-header img {',
    '    width: 200px;',
    '    height: 200px;',
    '    border-radius: 4px;',
    '    object-fit: cover;',
    '    background: #222;',
    '}',
    '.playlist-header-info {',
    '    flex: 1;',
    '}',
    '.playlist-header-info h2 {',
    '    margin-bottom: 5px;',
    '    color: #fff;',
    '}',
    '.playlist-header-info p {',
    '    color: #aaa;',
    '    margin: 5px 0;',
    '}',
    '.playlist-description {',
    '    color: #888 !important;',
    '    font-style: italic;',
    '    margin-top: 10px !important;',
    '}',
    '.playlist-actions {',
    '    margin-top: 15px;',
    '    display: flex;',
    '    gap: 10px;',
    '    flex-wrap: wrap;',
    '}',
    '/* Responsive */',
    '@media (max-width: 600px) {',
    '    .playlist-header {',
    '        flex-direction: column;',
    '        align-items: center;',
    '        text-align: center;',
    '    }',
    '    .playlist-header img {',
    '        width: 150px;',
    '        height: 150px;',
    '    }',
    '}'
]);
/* clang-format on */
