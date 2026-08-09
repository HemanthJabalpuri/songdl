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
        if (window.currentSearchType !== 'songs') {
            switchTab('songs');
        }
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
        if (window.currentSearchType !== 'albums') {
            switchTab('albums');
        }
        promise = window.API.getAlbum(parsed.token).then(function(albumData) {
            if (albumData && albumData.id) {
                if (statsDiv) statsDiv.innerHTML = 'Found 1 album';
                viewAlbum(parsed.token);
            } else {
                resultsDiv.innerHTML = '<div class="no-results">😕 Album not found</div>';
            }
        });
    } else if (parsed.type === 'playlist') {
        if (window.currentSearchType !== 'playlists') {
            switchTab('playlists');
        }
        promise = window.API.getPlaylist(parsed.token).then(function(playlistData) {
            if (playlistData && playlistData.id) {
                if (statsDiv) statsDiv.innerHTML = 'Found 1 playlist';
                viewPlaylist(parsed.token);
            } else {
                resultsDiv.innerHTML = '<div class="no-results">😕 Playlist not found</div>';
            }
        });
    } else if (parsed.type === 'artist') {
        if (window.currentSearchType !== 'artists') {
            switchTab('artists');
        }
        promise = window.API.getArtist(parsed.token).then(function(artistData) {
            if (artistData && artistData.artistId) {
                if (statsDiv) statsDiv.innerHTML = 'Found 1 artist';
                viewArtist(parsed.token);
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

    var searchType = window.currentSearchType || 'songs';

    // Reset search state for new search
    window._searchState.type = searchType;
    window._searchState.query = query;
    window._searchState.currentPage = 1;
    window._searchState.limit = 20;
    window._searchState.total = 0;
    window._searchState.isLoading = false;
    window._searchLoadedPages = [];

    var page = window._searchState.currentPage;
    var limit = window._searchState.limit;
    var cacheKey = window.Cache.getSearchKey(searchType, query, page, limit);

    console.log('[Search] Searching for:', query, 'Type:', searchType);

    resultsDiv.innerHTML = '<div class="loading">🔍 Searching</div>';
    if (statsDiv) statsDiv.innerHTML = '';
    if (playerDiv) playerDiv.innerHTML = '';

    // Check cache for page 1
    if (window.Cache.has(cacheKey)) {
        window.Nav.clear();
        window.Nav.push({
            type: 'search',
            data: {
                type: searchType,
                query: query,
                page: 1,
                loadedPages: window._searchLoadedPages ? window._searchLoadedPages.slice() : []
            }
        });
        console.log('[Search] Using cached results for page 1');
        var data = window.Cache.get(cacheKey);
        window._searchState.total = data.total || 0;
        window._searchLoadedPages.push(cacheKey);

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
            window.Cache.set(cacheKey, data);
            window._searchState.total = data.total || 0;
            window._searchLoadedPages.push(cacheKey);

            window.Nav.clear();
            window.Nav.push({
                type: 'search',
                data: {
                    type: searchType,
                    query: query,
                    page: window._searchState.currentPage || 1,
                    loadedPages: window._searchLoadedPages ? window._searchLoadedPages.slice() : []
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
    if (window._searchState.isLoading) return window.Utils.Promise.resolve();
    window._searchState.isLoading = true;

    var btn = document.getElementById('load-more-btn');
    if (btn) {
        btn.textContent = 'Loading...';
        btn.disabled = true;
    }

    var nextPage = window._searchState.currentPage + 1;
    var cacheKey = window.Cache.getSearchKey(
        window._searchState.type, window._searchState.query, nextPage, window._searchState.limit);

    var type = window._searchState.type;
    var promise;

    // Check cache first
    if (window.Cache.has(cacheKey)) {
        console.log('[Search] Using cached page:', nextPage);
        promise = window.Utils.Promise.resolve(window.Cache.get(cacheKey));
    } else {
        if (type === 'songs') {
            promise = window.Services.Song.search(window._searchState.query, window._searchState.limit, nextPage);
        } else if (type === 'albums') {
            promise = window.Services.Album.search(window._searchState.query, window._searchState.limit, nextPage);
        } else if (type === 'playlists') {
            promise = window.Services.Playlist.search(window._searchState.query, window._searchState.limit, nextPage);
        } else if (type === 'artists') {
            promise = window.Services.Artist.search(window._searchState.query, window._searchState.limit, nextPage);
        }
        promise = promise.then(function(data) {
            window.Cache.set(cacheKey, data);
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
                window._searchState.currentPage = nextPage;
                window._searchLoadedPages.push(cacheKey);

                // Persist loaded pages state so back-button recalls pagination
                window.Nav.updateCurrent({loadedPages: window._searchLoadedPages.slice()});

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
            window._searchState.isLoading = false;
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
    if (window._searchState.total > 0) {
        var loadedCount = window._searchLoadedPages.length * window._searchState.limit;
        hasMore = loadedCount < window._searchState.total;
    } else {
        // If total unknown, assume more if we have results
        var lastData = window.Cache.get(window._searchLoadedPages[window._searchLoadedPages.length - 1]);
        if (lastData && lastData.results) {
            hasMore = lastData.results.length >= window._searchState.limit;
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
    btn.textContent = 'Load ' + window._searchState.limit + ' More';
    btn.dataset.source = source || 'search';
    btn.addEventListener('click', function() {
        loadMoreSearch();
    });
    resultsDiv.appendChild(btn);
}

window.search = search;
window.loadMoreSearch = loadMoreSearch;