// ui/js/search.js

async function search() {
    var searchInput = document.getElementById('searchInput');
    var resultsDiv = document.getElementById('results');
    var statsDiv = document.getElementById('stats');
    var playerDiv = document.getElementById('player');
    
    if (!searchInput || !resultsDiv) {
        console.error('[Search] Required DOM elements not found');
        return;
    }
    
    var query = searchInput.value.trim();
    if (!query) {
        alert('Please enter a search term');
        return;
    }

    // Check if it's a valid URL
    var parsed = window.Utils.parseUrl(query);
    if (parsed && parsed.token) {
        // Clear previous results
        resultsDiv.innerHTML = '<div class="loading">🔍 Loading...</div>';
        if (statsDiv) statsDiv.innerHTML = '';
        if (playerDiv) playerDiv.innerHTML = '';
    
        try {
            if (parsed.type === 'song' || parsed.type === 'lyrics') {
                // Switch to Songs tab if needed
                if (window.currentSearchType !== 'songs') {
                    switchTab('songs');
                }
            
                // Get song details
                var songData = await window.API.getSong(parsed.token);
                var song = songData.songs ? songData.songs[0] : null;
            
                if (song) {
                    var formattedSong = window.Utils.formatters.formatSong(song);
                    if (statsDiv) statsDiv.innerHTML = 'Found 1 song';
                    displaySongs([formattedSong]);
                } else {
                    resultsDiv.innerHTML = '<div class="no-results">😕 Song not found</div>';
                }
            
            } else if (parsed.type === 'album') {
                // Switch to Albums tab if needed
                if (window.currentSearchType !== 'albums') {
                    switchTab('albums');
                }
            
                // Get album details
                var albumData = await window.API.getAlbum(parsed.token);
            
                if (albumData && albumData.id) {
                    if (statsDiv) statsDiv.innerHTML = 'Found 1 album';
                    viewAlbum(parsed.token);
                } else {
                    resultsDiv.innerHTML = '<div class="no-results">😕 Album not found</div>';
                }

            } else if (parsed.type === 'playlist') {
                // Switch to Playlists tab if needed
                if (window.currentSearchType !== 'playlists') {
                    switchTab('playlists');
                }
    
                // Get playlist details
                var playlistData = await window.API.getPlaylist(parsed.token);
    
                if (playlistData && playlistData.id) {
                    if (statsDiv) statsDiv.innerHTML = 'Found 1 playlist';
                    viewPlaylist(parsed.token);
                } else {
                    resultsDiv.innerHTML = '<div class="no-results">😕 Playlist not found</div>';
                }
            }
        } catch (error) {
            console.error('[Search] URL fetch error:', error);
            resultsDiv.innerHTML = '<div class="error">❌ Failed to load: ' + error.message + '</div>';
        }

        return; // Exit after handling URL
    }

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
        // Clear navigation stack and push search view
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
        return;
    }

    try {
        var data;
        if (searchType === 'songs') {
            data = await window.Services.Song.search(query, limit, page);
        } else if (searchType === 'albums') {
            data = await window.Services.Album.search(query, limit, page);
        } else if (searchType === 'playlists') {
            data = await window.Services.Playlist.search(query, limit, page);
        } else {
            data = await window.Services.Song.search(query, limit, page);
        }

        // Store in cache
        window.Cache.set(cacheKey, data);
        window._searchState.total = data.total || 0;
        window._searchLoadedPages.push(cacheKey);

        // Clear navigation stack and push search view
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
            resultsDiv.innerHTML = '<div class="no-results">😕 No results found. Try a different search term.</div>';
        }
    } catch (error) {
        console.error('[Search] Error:', error);
        resultsDiv.innerHTML = '<div class="error">❌ Error: ' + error.message + '</div>';
        if (statsDiv) statsDiv.innerHTML = '';
    }
}

// ============ DISPLAY SEARCH RESULTS ============
function displaySearchResults(results, type) {
    if (type === 'songs') {
        displaySongs(results);
    } else if (type === 'albums') {
        displayAlbums(results);
    } else if (type === 'playlists') {
        displayPlaylists(results);
    }
}

// ============ LOAD MORE SEARCH ============
async function loadMoreSearch() {
    if (window._searchState.isLoading) return;
    window._searchState.isLoading = true;

    var btn = document.getElementById('load-more-btn');
    if (btn) {
        btn.textContent = 'Loading...';
        btn.disabled = true;
    }

    var nextPage = window._searchState.currentPage + 1;
    var cacheKey = window.Cache.getSearchKey(
        window._searchState.type,
        window._searchState.query,
        nextPage,
        window._searchState.limit
    );

    try {
        var data;
        var type = window._searchState.type;

        // Check cache first
        if (window.Cache.has(cacheKey)) {
            console.log('[Search] Using cached page:', nextPage);
            data = window.Cache.get(cacheKey);
        } else {
            if (type === 'songs') {
                data = await window.Services.Song.search(
                    window._searchState.query,
                    window._searchState.limit,
                    nextPage
                );
            } else if (type === 'albums') {
                data = await window.Services.Album.search(
                    window._searchState.query,
                    window._searchState.limit,
                    nextPage
                );
            } else if (type === 'playlists') {
                data = await window.Services.Playlist.search(
                    window._searchState.query,
                    window._searchState.limit,
                    nextPage
                );
            }
            window.Cache.set(cacheKey, data);
        }

        // Append results
        if (data.results && data.results.length > 0) {
            // Get existing results container
            var resultsDiv = document.getElementById('results');
            var existingCards = resultsDiv.querySelectorAll('.song-card, .album-card, .playlist-card');
            
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
            }

            // Update state
            window._searchState.currentPage = nextPage;
            window._searchLoadedPages.push(cacheKey);

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
    } catch (error) {
        console.error('[Search] Load more error:', error);
        var btn = document.getElementById('load-more-btn');
        if (btn) {
            btn.textContent = 'Retry';
            btn.disabled = false;
        }
    } finally {
        window._searchState.isLoading = false;
    }
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