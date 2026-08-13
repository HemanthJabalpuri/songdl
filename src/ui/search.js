// src/js/ui/search.js

// Handle searches where the query is a parsed URL target
function handleUrlSearch(parsed) {
    var resultsDiv = document.getElementById('results');
    var statsDiv = document.getElementById('stats');
    var playerDiv = document.getElementById('player');

    // Clear previous results
    resultsDiv.innerHTML = '<div class="loading">🔍 Loading...</div>';
    if (statsDiv) statsDiv.innerHTML = '';
    if (playerDiv) playerDiv.innerHTML = '';

    var promise;
    if (parsed.type === 'song' || parsed.type === 'lyrics') {
        promise = window.API.getSong(parsed.token).then(function(songData) {
            var song = songData.songs ? songData.songs[0] : null;
            if (song) {
                var formattedSong = window.Utils.formatters.formatSong(song);
                if (statsDiv) statsDiv.innerHTML = 'Found 1 song';
                displaySongs([formattedSong]);
            } else {
                resultsDiv.innerHTML = '<div class="no-results">😕 Song not found</div>';
            }
        });
    } else if (parsed.type === 'album') {
        promise = window.API.getAlbum(parsed.token).then(function(albumData) {
            if (albumData && albumData.id) {
                if (statsDiv) statsDiv.innerHTML = 'Found 1 album';
                window.UI.viewAlbum(parsed.token);
            } else {
                resultsDiv.innerHTML = '<div class="no-results">😕 Album not found</div>';
            }
        });
    } else if (parsed.type === 'playlist') {
        promise = window.API.getPlaylist(parsed.token).then(function(playlistData) {
            if (playlistData && playlistData.id) {
                if (statsDiv) statsDiv.innerHTML = 'Found 1 playlist';
                window.UI.viewPlaylist(parsed.token);
            } else {
                resultsDiv.innerHTML = '<div class="no-results">😕 Playlist not found</div>';
            }
        });
    } else if (parsed.type === 'artist') {
        promise = window.API.getArtist(parsed.token).then(function(artistData) {
            if (artistData && artistData.artistId) {
                if (statsDiv) statsDiv.innerHTML = 'Found 1 artist';
                window.UI.viewArtist(parsed.token);
            } else {
                resultsDiv.innerHTML = '<div class="no-results">😕 Artist not found</div>';
            }
        });
    } else {
        promise = window.Utils.Promise.resolve();
    }

    return promise.catch(function(error) {
        console.error('[Search] URL fetch error:', error);
        resultsDiv.innerHTML = '<div class="error">❌ Failed to load: ' + escapeHtml(error.message) + '</div>';
    });
}

// Handle searches where the query is plain search text
function handleTextSearch(query) {
    var resultsDiv = document.getElementById('results');
    var statsDiv = document.getElementById('stats');
    var playerDiv = document.getElementById('player');

    var searchType = window.UI.currentSearchType || 'songs';

    // Reset search state for new search
    window.UI._searchState.type = searchType;
    window.UI._searchState.query = query;
    window.UI.currentQuery = query;
    window.UI._searchState.currentPage = 1;
    window.UI._searchState.limit = 20;
    window.UI._searchState.total = 0;
    window.UI._searchState.isLoading = false;
    window.UI._searchLoadedPages = [];

    var page = window.UI._searchState.currentPage;
    var limit = window.UI._searchState.limit;
    var cacheKey = window.Utils.Cache.getSearchKey(searchType, query, page, limit);

    console.log('[Search] Searching for:', query, 'Type:', searchType);

    resultsDiv.innerHTML = '<div class="loading">🔍 Searching</div>';
    if (statsDiv) statsDiv.innerHTML = '';
    if (playerDiv) playerDiv.innerHTML = '';

    // Check cache for page 1
    if (window.Utils.Cache.has(cacheKey)) {
        window.UI.Nav.clear();
        window.UI.Nav.push({
            type: 'search',
            data: {
                type: searchType,
                query: query,
                page: 1,
                loadedPages: window.UI._searchLoadedPages ? window.UI._searchLoadedPages.slice() : []
            }
        });
        console.log('[Search] Using cached results for page 1');
        var data = window.Utils.Cache.get(cacheKey);
        window.UI._searchState.total = data.total || 0;
        window.UI._searchLoadedPages.push(cacheKey);

        if (data.results && data.results.length > 0) {
            if (statsDiv) statsDiv.innerHTML = 'Found ' + data.results.length + ' ' + searchType + ' (cached)';
            displaySearchResults(data.results, searchType);
            showLoadMoreButton('search');
        } else {
            resultsDiv.innerHTML = '<div class="no-results">😕 No results found. Try a different search term.</div>';
        }
        return window.Utils.Promise.resolve();
    }

    var servicePromise;
    if (searchType === 'songs') {
        servicePromise = window.Services.Song.search(query, limit, page);
    } else if (searchType === 'albums') {
        servicePromise = window.Services.Album.search(query, limit, page);
    } else if (searchType === 'playlists') {
        servicePromise = window.Services.Playlist.search(query, limit, page);
    } else if (searchType === 'artists') {
        servicePromise = window.Services.Artist.search(query, limit, page);
    } else {
        servicePromise = window.Services.Song.search(query, limit, page);
    }

    return servicePromise
        .then(function(data) {
            // Store in cache
            window.Utils.Cache.set(cacheKey, data);
            window.UI._searchState.total = data.total || 0;
            window.UI._searchLoadedPages.push(cacheKey);

            window.UI.Nav.clear();
            window.UI.Nav.push({
                type: 'search',
                data: {
                    type: searchType,
                    query: query,
                    page: window.UI._searchState.currentPage || 1,
                    loadedPages: window.UI._searchLoadedPages ? window.UI._searchLoadedPages.slice() : []
                }
            });

            if (data.results && data.results.length > 0) {
                if (statsDiv) statsDiv.innerHTML = 'Found ' + data.results.length + ' ' + searchType;
                displaySearchResults(data.results, searchType);
                showLoadMoreButton('search');
            } else {
                resultsDiv.innerHTML =
                    '<div class="no-results">😕 No results found. Try a different search term.</div>';
            }
        })
        .catch(function(error) {
            console.error('[Search] Error:', error);
            resultsDiv.innerHTML = '<div class="error">❌ Error: ' + escapeHtml(error.message) + '</div>';
            if (statsDiv) statsDiv.innerHTML = '';
        });
}

// Coordinate search input queries
function search() {
    var searchInput = document.getElementById('searchInput');
    var resultsDiv = document.getElementById('results');

    if (!searchInput || !resultsDiv) {
        console.error('[Search] Required DOM elements not found');
        return window.Utils.Promise.resolve();
    }

    var query = searchInput.value.trim();
    if (!query) {
        alert('Please enter a search term');
        return window.Utils.Promise.resolve();
    }

    var parsed = window.Utils.parseUrl(query);
    if (parsed && parsed.token) {
        return handleUrlSearch(parsed);
    } else {
        return handleTextSearch(query);
    }
}

// ============ LOAD MORE SEARCH ============
function loadMoreSearch() {
    if (window.UI._searchState.isLoading) return window.Utils.Promise.resolve();
    window.UI._searchState.isLoading = true;

    var btn = document.getElementById('load-more-btn');
    if (btn) {
        btn.textContent = 'Loading...';
        btn.disabled = true;
    }

    var nextPage = window.UI._searchState.currentPage + 1;
    var cacheKey = window.Utils.Cache.getSearchKey(
        window.UI._searchState.type, window.UI._searchState.query, nextPage, window.UI._searchState.limit);

    var type = window.UI._searchState.type;
    var promise;

    // Check cache first
    if (window.Utils.Cache.has(cacheKey)) {
        console.log('[Search] Using cached page:', nextPage);
        promise = window.Utils.Promise.resolve(window.Utils.Cache.get(cacheKey));
    } else {
        if (type === 'songs') {
            promise = window.Services.Song.search(window.UI._searchState.query, window.UI._searchState.limit, nextPage);
        } else if (type === 'albums') {
            promise = window.Services.Album.search(window.UI._searchState.query, window.UI._searchState.limit, nextPage);
        } else if (type === 'playlists') {
            promise = window.Services.Playlist.search(window.UI._searchState.query, window.UI._searchState.limit, nextPage);
        } else if (type === 'artists') {
            promise = window.Services.Artist.search(window.UI._searchState.query, window.UI._searchState.limit, nextPage);
        }
        promise = promise.then(function(data) {
            window.Utils.Cache.set(cacheKey, data);
            return data;
        });
    }

    return promise
        .then(function(data) {
            // Append results
            if (data.results && data.results.length > 0) {
                var resultsDiv = document.getElementById('results');

                // Remove load more button
                var oldBtn = document.getElementById('load-more-btn');
                if (oldBtn) oldBtn.remove();

                // Append new results
                if (type === 'songs') {
                    data.results.forEach(function(song) {
                        resultsDiv.insertAdjacentHTML('beforeend', createSongCard(song));
                    });
                } else if (type === 'albums') {
                    data.results.forEach(function(album) {
                        resultsDiv.insertAdjacentHTML('beforeend', createAlbumCard(album));
                    });
                } else if (type === 'playlists') {
                    data.results.forEach(function(playlist) {
                        resultsDiv.insertAdjacentHTML('beforeend', createPlaylistCard(playlist));
                    });
                } else if (type === 'artists') {
                    data.results.forEach(function(artist) {
                        resultsDiv.insertAdjacentHTML('beforeend', createArtistCard(artist));
                    });
                }
                // Update state
                window.UI._searchState.currentPage = nextPage;
                window.UI._searchLoadedPages.push(cacheKey);

                // Persist loaded pages state so back-button recalls pagination
                window.UI.Nav.updateCurrent({loadedPages: window.UI._searchLoadedPages.slice()});

                // Show load more button again
                showLoadMoreButton('search');
            } else {
                // No more results
                var endMsg = document.createElement('div');
                endMsg.className = 'end-of-results';
                endMsg.id = 'load-more-btn';
                endMsg.textContent = '🏁 End of results';
                document.getElementById('results').appendChild(endMsg);
            }
        })
        .catch(function(error) {
            console.error('[Search] Load more error:', error);
            var btn = document.getElementById('load-more-btn');
            if (btn) {
                btn.textContent = 'Retry';
                btn.disabled = false;
            }
        })
        .then(function() {
            window.UI._searchState.isLoading = false;
        });
}

// ============ SHOW LOAD MORE BUTTON ============
function showLoadMoreButton(source) {
    var resultsDiv = document.getElementById('results');
    if (!resultsDiv) return;

    // Remove existing load more button
    var existingBtn = document.getElementById('load-more-btn');
    if (existingBtn) existingBtn.remove();

    // Check if more results exist
    var hasMore = false;
    if (window.UI._searchState.total > 0) {
        var loadedCount = window.UI._searchLoadedPages.length * window.UI._searchState.limit;
        hasMore = loadedCount < window.UI._searchState.total;
    } else {
        // If total unknown, assume more if we have results
        var lastData = window.Utils.Cache.get(window.UI._searchLoadedPages[window.UI._searchLoadedPages.length - 1]);
        if (lastData && lastData.results) {
            hasMore = lastData.results.length >= window.UI._searchState.limit;
        }
    }

    if (!hasMore) {
        var endMsg = document.createElement('div');
        endMsg.className = 'end-of-results';
        endMsg.id = 'load-more-btn';
        endMsg.textContent = '🏁 End of results';
        resultsDiv.appendChild(endMsg);
        return;
    }

    var btn = document.createElement('button');
    btn.id = 'load-more-btn';
    btn.className = 'btn-load-more';
    btn.textContent = 'Load ' + window.UI._searchState.limit + ' More';
    btn.dataset.source = source || 'search';
    btn.addEventListener('click', function() {
        loadMoreSearch();
    });
    resultsDiv.appendChild(btn);
}

/* Search Options Pills Container Toggle Helpers */
window.UI.showSearchOptions = function() {
    var opts = document.getElementById('search-options');
    if (opts) opts.style.display = 'flex';
};

window.UI.hideSearchOptions = function() {
    var opts = document.getElementById('search-options');
    if (opts) opts.style.display = 'none';
};

window.UI.search = search;
window.UI.loadMoreSearch = loadMoreSearch;

/* clang-format off */
// Register search styling rules
window.Utils.registerStyle([
    '/* Search Options Pills */',
    '.search-options {',
    '    display: flex;',
    '    gap: 8px;',
    '    margin-bottom: 20px;',
    '}',
    '.search-option {',
    '    padding: 6px 16px;',
    '    background: #282828;',
    '    color: #888;',
    '    border: none;',
    '    border-radius: 20px;',
    '    font-size: 13px;',
    '    cursor: pointer;',
    '    transition: all 0.2s;',
    '}',
    '.search-option:hover {',
    '    background: #333;',
    '}',
    '.search-option.active {',
    '    background: #1db954;',
    '    color: #111;',
    '    font-weight: bold;',
    '}',
    '/* Disabled search-option */',
    '.search-option.disabled {',
    '    opacity: 0.4;',
    '    cursor: not-allowed;',
    '    pointer-events: none;',
    '}',
    '/* Search Box */',
    '.search-box {',
    '    display: flex;',
    '    gap: 10px;',
    '    margin-bottom: 20px;',
    '}',
    '.search-box input {',
    '    flex: 1;',
    '    padding: 12px;',
    '    border: 2px solid #333;',
    '    border-radius: 8px;',
    '    background: #222;',
    '    color: #fff;',
    '    font-size: 16px;',
    '    outline: none;',
    '}',
    '.search-box input:focus {',
    '    border-color: #1db954;',
    '}',
    '.search-box input::placeholder {',
    '    color: #666;',
    '}',
    '.btn-search {',
    '    padding: 12px 24px;',
    '    background: #1db954;',
    '    color: #111;',
    '    border: none;',
    '    border-radius: 8px;',
    '    font-size: 16px;',
    '    font-weight: bold;',
    '    cursor: pointer;',
    '}',
    '.btn-search:hover {',
    '    background: #1ed760;',
    '}',
    '/* Stats */',
    '.stats {',
    '    margin: 10px 0 20px 0;',
    '    color: #888;',
    '    font-size: 14px;',
    '}'
]);
/* clang-format on */