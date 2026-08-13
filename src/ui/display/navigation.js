// src/js/ui/display/navigation.js

// ============ RESTORE SEARCH ============
function restoreSearch(data) {
    console.log('[Restore] Search:', data);

    var searchType = data.type || 'songs';
    var query = data.query;
    var loadedPages = data.loadedPages || [];

    // Get first page from cache
    var firstPageKey = window.Utils.Cache.getSearchKey(searchType, query, 1, 20);

    if (!window.Utils.Cache.has(firstPageKey)) {
        console.log('[Restore] No cache for search, falling back to search');
        window.UI.search();
        return;
    }

    // Collect all results from all loaded pages
    var allResults = [];
    if (loadedPages.length > 0) {
        loadedPages.forEach(function(pageKey) {
            var pageData = window.Utils.Cache.get(pageKey);
            if (pageData && pageData.results) {
                allResults = allResults.concat(pageData.results);
            }
        });
    } else {
        var data = window.Utils.Cache.get(firstPageKey);
        allResults = data.results || [];
        loadedPages = [firstPageKey];
    }

    if (allResults.length === 0) {
        console.log('[Restore] No results found, falling back to search');
        window.UI.search();
        return;
    }

    // Restore state
    window.UI._searchState.type = searchType;
    window.UI._searchState.query = query;
    window.UI._searchState.currentPage = loadedPages.length;
    window.UI._searchLoadedPages = loadedPages.slice();
    window.UI.currentSearchType = searchType;
    window.UI.setCategoryHighlight(searchType);

    // Display results
    displaySearchResults(allResults, searchType);
    showLoadMoreButton('search');

    var statsDiv = document.getElementById('stats');
    if (statsDiv) statsDiv.innerHTML = 'Found ' + allResults.length + ' ' + searchType + ' (cached)';

    console.log('[Restore] Search restored with', allResults.length, 'results');
}

// ============ RESTORE PLAYLIST ============
function restorePlaylist(data) {
    console.log('[Restore] Playlist:', data);

    var token = data.token;
    var loadedPages = data.loadedPages || [];

    // Get first page from cache
    var firstPageKey = 'playlist:' + token + ':' + 1 + ':' + 50;

    if (!window.Utils.Cache.has(firstPageKey)) {
        console.log('[Restore] No cache for playlist, falling back to viewPlaylist');
        window.UI._isRestoring = false;  // Temporarily allow push
        window.UI.viewPlaylist(token);
        window.UI._isRestoring = true;
        return;
    }

    // Collect all songs from all loaded pages
    var allSongs = [];
    var playlistData = null;

    if (loadedPages.length > 0) {
        loadedPages.forEach(function(pageKey) {
            var pageData = window.Utils.Cache.get(pageKey);
            if (pageData && pageData.songs) {
                if (!playlistData) playlistData = pageData;
                allSongs = allSongs.concat(pageData.songs);
            }
        });
    } else {
        var data = window.Utils.Cache.get(firstPageKey);
        playlistData = data;
        allSongs = data.songs || [];
        loadedPages = [firstPageKey];
    }

    if (allSongs.length === 0) {
        console.log('[Restore] No songs found, falling back to viewPlaylist');
        window.UI._isRestoring = false;
        window.UI.viewPlaylist(token);
        window.UI._isRestoring = true;
        return;
    }

    // Restore state
    if (playlistData) {
        playlistData.songs = allSongs;
    }
    window.UI._playlistState.token = token;
    window.UI._playlistState.currentPage = loadedPages.length;
    window.UI._playlistLoadedPages = loadedPages.slice();

    // Display playlist
    window.UI.renderPlaylist(playlistData);
    window.UI.showPlaylistLoadMoreButton();

    console.log('[Restore] Playlist restored with', allSongs.length, 'songs');
}

// ============ RESTORE ALBUM ============
function restoreAlbum(data) {
    console.log('[Restore] Album:', data);
    window.UI.viewAlbum(data.token);
}

// ============ RESTORE VIEW ============
function restoreView(view) {
    console.log('[Restore] Restoring:', view.type, 'Data:', view.data);

    window.UI._isRestoring = true;

    var promise;
    switch (view.type) {
        case 'search':
            restoreSearch(view.data);
            promise = window.Utils.Promise.resolve();
            break;
        case 'playlist':
            restorePlaylist(view.data);
            promise = window.Utils.Promise.resolve();
            break;
        case 'album':
            restoreAlbum(view.data);
            promise = window.Utils.Promise.resolve();
            break;
        case 'artist':
            promise = window.UI.restoreArtist(view.data);
            break;
        default:
            window.UI.search();
            promise = window.Utils.Promise.resolve();
    }

    return promise.then(function() {
        window.UI._isRestoring = false;
        console.log('[Restore] Done, isRestoring:', window.UI._isRestoring);
    });
}

// Bind standard back button behavior to a selector within a parent Node
function bindBackButton(parentNode, selector) {
    window.Utils.bindClick(parentNode, selector || '.btn-back, #btn-back-search, #btn-back', function() {
        var current = window.UI.Nav.pop();
        var prev = window.UI.Nav.peek();
        if (prev) {
            restoreView(prev);
        } else {
            var results = document.getElementById('results');
            var stats = document.getElementById('stats');
            if (results) results.innerHTML = '';
            if (stats) stats.innerHTML = '';
            if (DOM.searchInput) {
                DOM.searchInput.value = '';
                DOM.searchInput.focus();
            }
        }
    });
}
window.UI.bindBackButton = bindBackButton;
