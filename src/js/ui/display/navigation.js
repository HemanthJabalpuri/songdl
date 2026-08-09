// src/js/ui/display/navigation.js

// ============ RESTORE SEARCH ============
function restoreSearch(data) {
    console.log('[Restore] Search:', data);

    var searchType = data.type || 'songs';
    var query = data.query;
    var loadedPages = data.loadedPages || [];

    // Get first page from cache
    var firstPageKey = window.Cache.getSearchKey(searchType, query, 1, 20);

    if (!window.Cache.has(firstPageKey)) {
        console.log('[Restore] No cache for search, falling back to search');
        if (typeof window.search === 'function') {
            window.search();
        }
        return;
    }

    // Collect all results from all loaded pages
    var allResults = [];
    if (loadedPages.length > 0) {
        loadedPages.forEach(function(pageKey) {
            var pageData = window.Cache.get(pageKey);
            if (pageData && pageData.results) {
                allResults = allResults.concat(pageData.results);
            }
        });
    } else {
        var data = window.Cache.get(firstPageKey);
        allResults = data.results || [];
        loadedPages = [firstPageKey];
    }

    if (allResults.length === 0) {
        console.log('[Restore] No results found, falling back to search');
        if (typeof window.search === 'function') {
            window.search();
        }
        return;
    }

    // Restore state
    window._searchState.type = searchType;
    window._searchState.query = query;
    window._searchState.currentPage = loadedPages.length;
    window._searchLoadedPages = loadedPages.slice();

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

    if (!window.Cache.has(firstPageKey)) {
        console.log('[Restore] No cache for playlist, falling back to viewPlaylist');
        window._isRestoring = false;  // Temporarily allow push
        viewPlaylist(token);
        window._isRestoring = true;
        return;
    }

    // Collect all songs from all loaded pages
    var allSongs = [];
    var playlistData = null;

    if (loadedPages.length > 0) {
        loadedPages.forEach(function(pageKey) {
            var pageData = window.Cache.get(pageKey);
            if (pageData && pageData.songs) {
                if (!playlistData) playlistData = pageData;
                allSongs = allSongs.concat(pageData.songs);
            }
        });
    } else {
        var data = window.Cache.get(firstPageKey);
        playlistData = data;
        allSongs = data.songs || [];
        loadedPages = [firstPageKey];
    }

    if (allSongs.length === 0) {
        console.log('[Restore] No songs found, falling back to viewPlaylist');
        window._isRestoring = false;
        viewPlaylist(token);
        window._isRestoring = true;
        return;
    }

    // Restore state
    if (playlistData) {
        playlistData.songs = allSongs;
    }
    window._playlistState.token = token;
    window._playlistState.currentPage = loadedPages.length;
    window._playlistLoadedPages = loadedPages.slice();

    // Display playlist
    renderPlaylist(playlistData);
    showPlaylistLoadMoreButton();

    console.log('[Restore] Playlist restored with', allSongs.length, 'songs');
}

// ============ RESTORE ALBUM ============
function restoreAlbum(data) {
    console.log('[Restore] Album:', data);
    viewAlbum(data.token);
}

// ============ RESTORE VIEW ============
function restoreView(view) {
    console.log('[Restore] Restoring:', view.type, 'Data:', view.data);

    window._isRestoring = true;

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
            promise = restoreArtist(view.data);
            break;
        default:
            console.log('[Restore] Unknown type:', view.type);
            if (typeof window.search === 'function') {
                window.search();
            }
            promise = window.Utils.Promise.resolve();
    }

    return promise.then(function() {
        window._isRestoring = false;
        console.log('[Restore] Done, isRestoring:', window._isRestoring);
    });
}
