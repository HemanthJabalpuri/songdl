// src/js/ui/display/artist-view.js

window._artistState = {
    token: '',
    artistId: '',
    category: 'popular',  // 'popular' | 'latest'
    songPage: 1,
    albumPage: 1,
    limit: 10,
    isLoadingSongs: false,
    isLoadingAlbums: false
};
window._artistSongPages = [];
window._artistAlbumPages = [];

// ============ RENDER HEADER ============
function renderHeader(artist) {
    // Parse bio if it's a JSON string
    var bioText = '';
    if (artist.bio) {
        try {
            var bioArray = JSON.parse(artist.bio);
            if (Array.isArray(bioArray) && bioArray.length > 0) {
                bioText = bioArray[0].text || '';
            }
        } catch (e) {
            bioText = artist.bio;
        }
    }

    var image = artist.image;
    if (!image || image.includes('placeholder.com')) {
        image = window.Utils.getDefaultImage('artist');
    }

    var html = `
        <div class="artist-header">
            <img src="${image}" alt="${artist.name}" />
            <div class="artist-header-info">
                <h2>${escapeHtml(artist.name)} ${artist.isVerified ? '✅' : ''}</h2>
                <p>${escapeHtml(artist.subtitle || '')}</p>
                ${
        bioText ?
            `<p class="artist-bio">${escapeHtml(bioText.substring(0, 200))}${bioText.length > 200 ? '...' : ''}</p>` :
            ''}
                <div class="artist-actions">
                    <button class="btn-back" id="btn-back">← Back</button>
                </div>
            </div>
        </div>
        <div class="artist-tabs">
            <button class="artist-tab active" data-category="popular">🔥 Popular</button>
            <button class="artist-tab" data-category="latest">🕐 Latest</button>
        </div>
    `;
    return html;
}

// ============ RENDER FOOTER (Static Sections) ============
function renderFooter(artist) {
    var html = '';

    if (artist.dedicatedPlaylists && artist.dedicatedPlaylists.length > 0) {
        html += `
            <div class="artist-playlists-section" id="artist-dedicated-playlists">
                <h3>Dedicated Playlists</h3>
                <div class="playlist-list">
                    ${
            artist.dedicatedPlaylists
                .map(function(playlist) {
                    return createPlaylistCard(playlist);
                })
                .join('')}
                </div>
            </div>
        `;
    }

    if (artist.featuredPlaylists && artist.featuredPlaylists.length > 0) {
        html += `
            <div class="artist-playlists-section" id="artist-featured-playlists">
                <h3>Featured In</h3>
                <div class="playlist-list">
                    ${
            artist.featuredPlaylists
                .map(function(playlist) {
                    return createPlaylistCard(playlist);
                })
                .join('')}
                </div>
            </div>
        `;
    }

    if (artist.singles && artist.singles.length > 0) {
        html += `
            <div class="artist-albums-section" id="artist-singles">
                <h3>Singles</h3>
                <div class="album-list">
                    ${
            artist.singles
                .map(function(single) {
                    return createAlbumCard(single);
                })
                .join('')}
                </div>
            </div>
        `;
    }

    if (artist.latestReleases && artist.latestReleases.length > 0) {
        html += `
            <div class="artist-albums-section" id="artist-latest-releases">
                <h3>Latest Releases</h3>
                <div class="album-list">
                    ${
            artist.latestReleases
                .map(function(release) {
                    return createAlbumCard(release);
                })
                .join('')}
                </div>
            </div>
        `;
    }

    return html;
}

// ============ RENDER DYNAMIC SONGS SECTION ============
function renderSongsSectionHTML(songs, category, totalSongs) {
    var html = `
        <div class="artist-songs-section" id="artist-dynamic-songs" data-category="${category}">
            <h3>Top Songs (${songs ? songs.length : 0})</h3>
            <div class="song-list">
    `;

    if (songs && songs.length > 0) {
        var artistContext = {type: 'artist', image: '', language: '', year: '', title: window._artistState.token};
        songs.forEach(function(song, index) {
            html += createSongCard(song, index, artistContext);
        });
    } else {
        html += `<div class="no-results">No songs found</div>`;
    }

    html += `
            </div>
            <div id="artist-songs-load-more"></div>
        </div>
    `;

    return html;
}

// ============ RENDER DYNAMIC ALBUMS SECTION ============
function renderAlbumsSectionHTML(albums, category, totalAlbums) {
    var html = `
        <div class="artist-albums-section" id="artist-dynamic-albums" data-category="${category}">
            <h3>Top Albums (${albums ? albums.length : 0})</h3>
            <div class="album-list">
    `;

    if (albums && albums.length > 0) {
        albums.forEach(function(album) {
            html += createAlbumCard(album);
        });
    } else {
        html += `<div class="no-results">No albums found</div>`;
    }

    html += `
            </div>
            <div id="artist-albums-load-more"></div>
        </div>
    `;

    return html;
}

// ============ SET ACTIVE TAB ============
function setActiveTab(category) {
    var tabs = document.querySelectorAll('.artist-tab');
    tabs.forEach(function(tab) {
        tab.classList.toggle('active', tab.dataset.category === category);
    });
}

// ============ RENDER ARTIST ============
function renderArtist(artist) {
    // 1. Build full HTML with correct order
    var headerHtml = renderHeader(artist);
    var songsHtml = renderSongsSectionHTML(artist.songs, window._artistState.category || 'popular', artist.totalSongs);
    var albumsHtml =
        renderAlbumsSectionHTML(artist.albums, window._artistState.category || 'popular', artist.totalAlbums);
    var footerHtml = renderFooter(artist);  // Static sections at the bottom

    var fullHtml = headerHtml + songsHtml + albumsHtml + footerHtml;
    DOM.results.innerHTML = fullHtml;
    DOM.stats.innerHTML = '';

    // 2. Attach _songData to song cards
    var cards = DOM.results.querySelectorAll('.song-card');
    var allSongs = artist.songs || [];
    cards.forEach(function(card, index) {
        if (allSongs[index]) {
            card._songData = allSongs[index];
        }
    });

    // 3. Show load more buttons
    showArtistSongsLoadMore();
    showArtistAlbumsLoadMore();

    // 4. Set active tab
    setActiveTab(window._artistState.category || 'popular');
}

// ============ VIEW ARTIST ============
async function viewArtist(token, category) {
    console.log('[DEBUG] viewArtist called with:', {token, category});

    // If category is undefined, try to get it from the navigation stack
    if (!category) {
        var stack = window.Nav.getStack();
        for (var i = stack.length - 1; i >= 0; i--) {
            if (stack[i].type === 'artist') {
                category = stack[i].data.category || 'popular';
                console.log('[DEBUG] Found category from stack:', category);
                break;
            }
        }
        // If still no category, default to 'popular'
        if (!category) {
            category = 'popular';
            console.log('[DEBUG] Using default category: popular');
        }
    }

    console.log('[View] viewArtist called, isRestoring:', window._isRestoring);
    category = category || 'popular';

    if (!window._isRestoring) {
        window.Nav.push({type: 'artist', data: {token: token, category: category}});
    }

    // Reset state with the category
    window._artistState.token = token;
    window._artistState.category = category;
    window._artistState.songPage = 1;
    window._artistState.albumPage = 1;
    window._artistState.isLoadingSongs = false;
    window._artistState.isLoadingAlbums = false;

    window._artistSongPages = [];
    window._artistAlbumPages = [];

    DOM.results.innerHTML = '<div class="loading">🎤 Loading artist...</div>';
    DOM.stats.innerHTML = '';

    var cacheKey = 'artist:' + token + ':' + category;
    console.log('[DEBUG] Looking for cache key:', cacheKey);
    if (window.Cache.has(cacheKey)) {
        console.log('[DEBUG] Cache FOUND for key:', cacheKey);
        var artist = window.Cache.get(cacheKey);
        window._artistState.artistId = artist.artistId || artist.id;
        renderArtist(artist);
        return;
    } else {
        console.log('[DEBUG] Cache MISS for key:', cacheKey);
    }

    try {
        var artist = await window.Services.Artist.getDetails(token, category);
        window.Cache.set(cacheKey, artist);
        window._artistState.artistId = artist.artistId || artist.id;
        renderArtist(artist);
    } catch (error) {
        console.error('[View Artist Error] Failed to load or render details:', error);
        DOM.results.innerHTML = `<div class="error">❌ Error loading artist: ${error.message}</div>`;
    }
}

// ============ SWITCH ARTIST CATEGORY ============
async function switchArtistCategory(category) {
    console.log('[Artist] Switching category:', category);

    // 1. Update state
    window._artistState.category = category;
    window._artistState.songPage = 1;
    window._artistState.albumPage = 1;
    window._artistSongPages = [];
    window._artistAlbumPages = [];

    // 2. Update navigation stack entry with the new category
    var currentStack = window.Nav.getStack();
    for (var i = currentStack.length - 1; i >= 0; i--) {
        if (currentStack[i].type === 'artist') {
            currentStack[i].data.category = category;
            console.log('[Nav] Updated artist stack category to:', category);
            break;
        }
    }

    // 3. Set active tab (visual)
    setActiveTab(category);

    // 4. Check cache for this category
    var token = window._artistState.token;
    var fullCacheKey = 'artist:' + token + ':' + category;
    var artistData = window.Cache.get(fullCacheKey);

    if (artistData) {
        console.log('[Display] Using cached artist data for category:', category);
        updateDynamicParts(artistData.songs, artistData.albums, category);
        return;
    }

    // 5. Fetch from API
    var songsContainer = document.getElementById('artist-dynamic-songs');
    var albumsContainer = document.getElementById('artist-dynamic-albums');
    if (songsContainer) songsContainer.innerHTML = '<div class="loading">🎤 Loading songs...</div>';
    if (albumsContainer) albumsContainer.innerHTML = '<div class="loading">🎤 Loading albums...</div>';

    try {
        var artist = await window.Services.Artist.getDetails(token, category);
        window.Cache.set(fullCacheKey, artist);

        updateDynamicParts(artist.songs, artist.albums, category);

        window._artistState.totalSongs = artist.totalSongs || 0;
        window._artistState.totalAlbums = artist.totalAlbums || 0;

    } catch (error) {
        if (songsContainer)
            songsContainer.innerHTML = `<div class="error">❌ Error loading songs: ${error.message}</div>`;
        if (albumsContainer)
            albumsContainer.innerHTML = `<div class="error">❌ Error loading albums: ${error.message}</div>`;
    }
}

// ============ UPDATE DYNAMIC PARTS ============
function updateDynamicParts(songs, albums, category) {
    console.log('[Artist] updateDynamicParts called');
    console.log('[Artist] songs count:', songs ? songs.length : 0);
    console.log('[Artist] albums count:', albums ? albums.length : 0);
    console.log('[Artist] category:', category);

    // 1. Update songs section (using ID)
    var songsContainer = document.getElementById('artist-dynamic-songs');
    if (songsContainer) {
        var songsHtml = renderSongsSectionHTML(songs, category);
        songsContainer.outerHTML = songsHtml;
    }

    // 2. Update albums section (using ID)
    var albumsContainer = document.getElementById('artist-dynamic-albums');
    console.log('[Artist] albumsContainer found:', albumsContainer ? 'YES' : 'NO');
    if (albumsContainer) {
        var albumsHtml = renderAlbumsSectionHTML(albums, category);
        albumsContainer.outerHTML = albumsHtml;
    }

    // 3. Attach _songData to new cards
    var cards = DOM.results.querySelectorAll('.song-card');
    var allSongs = songs || [];
    cards.forEach(function(card, index) {
        if (allSongs[index]) {
            card._songData = allSongs[index];
        }
    });



    // 5. Show load more buttons
    showArtistSongsLoadMore();
    showArtistAlbumsLoadMore();
}

// ============ SHOW ARTIST SONGS LOAD MORE ============
function showArtistSongsLoadMore() {
    var container = document.getElementById('artist-songs-load-more');
    if (!container) return;

    var totalSongs = 0;
    var loadedCount = (window._artistSongPages.length + 1) * window._artistState.limit;

    var hasMore = false;
    if (totalSongs > 0) {
        hasMore = loadedCount < totalSongs;
    } else {
        var songsContainer = document.querySelector('.artist-songs-section .song-list');
        var currentCount = songsContainer ? songsContainer.querySelectorAll('.song-card').length : 0;
        if (window._artistSongPages.length === 0) {
            hasMore = currentCount >= window._artistState.limit;
        } else {
            var lastPageKey = window._artistSongPages[window._artistSongPages.length - 1];
            var lastData = lastPageKey ? window.Cache.get(lastPageKey) : null;
            hasMore = lastData && lastData.songs && lastData.songs.length >= window._artistState.limit;
        }
    }

    if (!hasMore) {
        container.innerHTML = '<div class="end-of-results">🏁 End of songs</div>';
        return;
    }

    container.innerHTML = `
        <button class="btn-load-more" id="artist-songs-load-more-btn">
            Load ${window._artistState.limit} More Songs
        </button>
    `;

    var btn = document.getElementById('artist-songs-load-more-btn');
    if (btn) {
        btn.addEventListener('click', function() {
            loadMoreArtistSongs();
        });
    }
}

// ============ LOAD MORE ARTIST SONGS ============
async function loadMoreArtistSongs() {
    if (window._artistState.isLoadingSongs) return;
    window._artistState.isLoadingSongs = true;

    var btn = document.getElementById('artist-songs-load-more-btn');
    if (btn) {
        btn.textContent = 'Loading...';
        btn.disabled = true;
    }

    var nextPage = window._artistState.songPage + 1;
    var artistId = window._artistState.artistId;
    var category = window._artistState.category;

    // ============ CHECK CACHE ============
    var cacheKey = 'artist:' + artistId + ':' + category + ':songs:page:' + nextPage;
    if (window.Cache.has(cacheKey)) {
        console.log('[Artist] Using cached songs page:', nextPage);
        var cachedData = window.Cache.get(cacheKey);
        var songs = cachedData.songs || [];
        var total = cachedData.total || 0;

        // Append songs
        if (songs.length > 0) {
            appendArtistSongs(songs, nextPage, total, cacheKey);
        } else {
            var container = document.getElementById('artist-songs-load-more');
            if (container) {
                container.innerHTML = '<div class="end-of-results">🏁 End of songs</div>';
            }
        }
        window._artistState.isLoadingSongs = false;
        if (btn) {
            btn.textContent = 'Load ' + window._artistState.limit + ' More Songs';
            btn.disabled = false;
        }
        return;
    }

    try {
        var result = await window.Services.Artist.getMoreSongs(artistId, nextPage, category);
        var songs = result.songs || [];
        var total = result.total || 0;

        // ============ STORE IN CACHE ============
        window.Cache.set(cacheKey, {songs: songs, total: total});



        // Append songs
        if (songs.length > 0) {
            appendArtistSongs(songs, nextPage, total, cacheKey);
        } else {
            var container = document.getElementById('artist-songs-load-more');
            if (container) {
                container.innerHTML = '<div class="end-of-results">🏁 End of songs</div>';
            }
        }
    } catch (error) {
        console.error('[Artist] Load more songs error:', error);
        var container = document.getElementById('artist-songs-load-more');
        if (container) {
            container.innerHTML = '<button class="btn-load-more" id="artist-songs-load-more-btn">Retry</button>';
            var newBtn = document.getElementById('artist-songs-load-more-btn');
            if (newBtn) {
                newBtn.addEventListener('click', function() {
                    loadMoreArtistSongs();
                });
            }
        }
    } finally {
        window._artistState.isLoadingSongs = false;
        if (btn) {
            btn.textContent = 'Load ' + window._artistState.limit + ' More Songs';
            btn.disabled = false;
        }
    }
}

// ============ APPEND ARTIST SONGS ============
function appendArtistSongs(songs, page, total, cacheKey) {
    var songsContainer = document.querySelector('.artist-songs-section .song-list');
    if (!songsContainer) return;

    var artistContext = {type: 'artist', image: '', language: '', year: '', title: window._artistState.token};

    // Get current card count BEFORE appending
    var cardsBefore = songsContainer.querySelectorAll('.song-card').length;

    songs.forEach(function(song, idx) {
        var globalIndex = cardsBefore + idx;
        var songCard = createSongCard(song, globalIndex, artistContext);
        songsContainer.insertAdjacentHTML('beforeend', songCard);
    });

    // Attach _songData to new cards
    var allCards = songsContainer.querySelectorAll('.song-card');
    var existingCardsCount = allCards.length - songs.length;
    songs.forEach(function(song, idx) {
        var globalIndex = existingCardsCount + idx;
        var card = allCards[globalIndex];
        if (card) {
            card._songData = song;
        }
    });

    // Update state
    window._artistState.songPage = page;
    window._artistSongPages.push(cacheKey || ('artist_songs_' + window._artistState.artistId + '_' + page));

    // Update active stack data using helper
    window.Nav.updateCurrent({loadedSongPages: window._artistSongPages.slice()});

    // Update load more button
    showArtistSongsLoadMore();

    // Update stats
    var h3 = document.querySelector('.artist-songs-section h3');
    if (h3) {
        var currentCount = songsContainer.querySelectorAll('.song-card').length;
        h3.textContent = 'Top Songs (' + currentCount + ')';
    }
}

// ============ SHOW ARTIST ALBUMS LOAD MORE ============
function showArtistAlbumsLoadMore() {
    var container = document.getElementById('artist-albums-load-more');
    if (!container) return;

    var totalAlbums = window._artistState.totalAlbums || 0;
    var loadedCount = (window._artistAlbumPages.length + 1) * window._artistState.limit;

    var hasMore = false;
    if (totalAlbums > 0) {
        hasMore = loadedCount < totalAlbums;
    } else {
        var albumsContainer = document.getElementById('artist-dynamic-albums');
        var albumList = albumsContainer ? albumsContainer.querySelector('.album-list') : null;
        var currentCount = albumList ? albumList.querySelectorAll('.album-card').length : 0;
        if (window._artistAlbumPages.length === 0) {
            hasMore = currentCount >= window._artistState.limit;
        } else {
            var lastPageKey = window._artistAlbumPages[window._artistAlbumPages.length - 1];
            var lastData = lastPageKey ? window.Cache.get(lastPageKey) : null;
            hasMore = lastData && lastData.albums && lastData.albums.length >= window._artistState.limit;
        }
    }

    if (!hasMore) {
        container.innerHTML = '<div class="end-of-results">🏁 End of albums</div>';
        return;
    }

    container.innerHTML = `
        <button class="btn-load-more" id="artist-albums-load-more-btn">
            Load ${window._artistState.limit} More Albums
        </button>
    `;

    var btn = document.getElementById('artist-albums-load-more-btn');
    if (btn) {
        btn.addEventListener('click', function() {
            loadMoreArtistAlbums();
        });
    }
}

// ============ LOAD MORE ARTIST ALBUMS ============
async function loadMoreArtistAlbums() {
    if (window._artistState.isLoadingAlbums) return;
    window._artistState.isLoadingAlbums = true;

    var btn = document.getElementById('artist-albums-load-more-btn');
    if (btn) {
        btn.textContent = 'Loading...';
        btn.disabled = true;
    }

    var nextPage = window._artistState.albumPage + 1;
    var artistId = window._artistState.artistId;
    var category = window._artistState.category;

    // ============ CHECK CACHE ============
    var cacheKey = 'artist:' + artistId + ':' + category + ':albums:page:' + nextPage;
    if (window.Cache.has(cacheKey)) {
        console.log('[Artist] Using cached albums page:', nextPage);
        var cachedData = window.Cache.get(cacheKey);
        var albums = cachedData.albums || [];
        var total = cachedData.total || 0;

        if (albums.length > 0) {
            appendArtistAlbums(albums, nextPage, total, cacheKey);
        } else {
            var container = document.getElementById('artist-albums-load-more');
            if (container) {
                container.innerHTML = '<div class="end-of-results">🏁 End of albums</div>';
            }
        }
        window._artistState.isLoadingAlbums = false;
        if (btn) {
            btn.textContent = 'Load ' + window._artistState.limit + ' More Albums';
            btn.disabled = false;
        }
        return;
    }

    try {
        var result = await window.Services.Artist.getMoreAlbums(artistId, nextPage, category);
        var albums = result.albums || [];
        var total = result.total || 0;

        // ============ STORE IN CACHE ============
        window.Cache.set(cacheKey, {albums: albums, total: total});



        if (albums.length > 0) {
            appendArtistAlbums(albums, nextPage, total);
        } else {
            var container = document.getElementById('artist-albums-load-more');
            if (container) {
                container.innerHTML = '<div class="end-of-results">🏁 End of albums</div>';
            }
        }
    } catch (error) {
        console.error('[Artist] Load more albums error:', error);
        var container = document.getElementById('artist-albums-load-more');
        if (container) {
            container.innerHTML = '<button class="btn-load-more" id="artist-albums-load-more-btn">Retry</button>';
            var newBtn = document.getElementById('artist-albums-load-more-btn');
            if (newBtn) {
                newBtn.addEventListener('click', function() {
                    loadMoreArtistAlbums();
                });
            }
        }
    } finally {
        window._artistState.isLoadingAlbums = false;
        if (btn) {
            btn.textContent = 'Load ' + window._artistState.limit + ' More Albums';
            btn.disabled = false;
        }
    }
}

function appendArtistAlbums(albums, page, total, cacheKey) {
    var albumsContainer = document.getElementById('artist-dynamic-albums');
    if (!albumsContainer) return;

    var albumList = albumsContainer.querySelector('.album-list');
    if (!albumList) return;

    albums.forEach(function(album) {
        var albumCard = createAlbumCard(album);
        albumList.insertAdjacentHTML('beforeend', albumCard);
    });

    // Update state
    window._artistState.albumPage = page;
    window._artistAlbumPages.push(cacheKey || ('artist_albums_' + window._artistState.artistId + '_' + page));

    // Update active stack data using helper
    window.Nav.updateCurrent({loadedAlbumPages: window._artistAlbumPages.slice()});

    // Update load more button
    showArtistAlbumsLoadMore();

    // Update stats
    var h3 = albumsContainer.querySelector('h3');
    if (h3) {
        var currentCount = albumList.querySelectorAll('.album-card').length;
        h3.textContent = 'Top Albums (' + currentCount + ')';
    }
}

// ============ RESTORE ARTIST ============
async function restoreArtist(data) {
    console.log('[Restore] Artist:', data);
    var category = data.category || 'popular';
    var token = data.token;
    var loadedSongPages = data.loadedSongPages || [];
    var loadedAlbumPages = data.loadedAlbumPages || [];

    window._isRestoring = true;

    // First, load structural view (page 1)
    await viewArtist(token, category);

    // Append paged songs
    for (var i = 0; i < loadedSongPages.length; i++) {
        var pageKey = loadedSongPages[i];
        if (window.Cache.has(pageKey)) {
            var cachedVal = window.Cache.get(pageKey);
            var pageNum = parseInt(pageKey.split(':').pop()) || 2;
            var songs = cachedVal.songs || [];
            var total = cachedVal.total || 0;
            appendArtistSongs(songs, pageNum, total, pageKey);
        }
    }

    // Append paged albums
    for (var j = 0; j < loadedAlbumPages.length; j++) {
        var pageKey = loadedAlbumPages[j];
        if (window.Cache.has(pageKey)) {
            var cachedVal = window.Cache.get(pageKey);
            var pageNum = parseInt(pageKey.split(':').pop()) || 2;
            var albums = cachedVal.albums || [];
            var total = cachedVal.total || 0;
            appendArtistAlbums(albums, pageNum, total, pageKey);
        }
    }

    window._isRestoring = false;
}

// ============ EXPOSE ============
window.viewArtist = viewArtist;
window.loadMoreArtistSongs = loadMoreArtistSongs;
window.loadMoreArtistAlbums = loadMoreArtistAlbums;
window.renderArtist = renderArtist;
