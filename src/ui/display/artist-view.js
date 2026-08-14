// src/js/ui/display/artist-view.js

window.UI._artistState = {
    token: '',
    artistId: '',
    category: 'popular',  // 'popular' | 'latest'
    songPage: 1,
    albumPage: 1,
    limit: 10,
    isLoadingSongs: false,
    isLoadingAlbums: false
};
window.UI._artistSongPages = [];
window.UI._artistAlbumPages = [];

// ============ RENDER HEADER ============
function renderHeaderNode(artist) {
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
    if (!image || image.indexOf('placeholder.com') !== -1) {
        image = window.Utils.getDefaultImage('artist');
    }

    var bioTagHtml = '';
    if (bioText) {
        bioTagHtml = '<p class="artist-bio">' + escapeHtml(bioText.substring(0, 200)) +
            (bioText.length > 200 ? '...' : '') + '</p>\n';
    }

    var checkedIcon = artist.isVerified ? window.UI.icons.verified : '';

    /* clang-format off */
    var headerNode = window.Utils.compileHTMLToNode([
        '<div class="artist-header">',
        '    <img src="' + image + '" alt="' + artist.name + '" />',
        '    <div class="artist-header-info">',
        '        <h2>' + escapeHtml(artist.name) + ' ' + checkedIcon + '</h2>',
        '        <p>' + escapeHtml(artist.subtitle || '') + '</p>',
        '        ' + bioTagHtml + '        <div class="artist-actions">',
        '            <button class="btn-back" id="btn-back">' + window.UI.icons.back + 'Back</button>',
        '        </div>',
        '    </div>',
        '</div>'
    ]);

    var tabsNode = window.Utils.compileHTMLToNode([
        '<div class="artist-tabs">',
        '    <button class="artist-tab active" data-category="popular">Popular</button>',
        '    <button class="artist-tab" data-category="latest">Latest</button>',
        '</div>'
    ]);
    /* clang-format on */

    window.UI.bindBackButton(headerNode, '#btn-back');

    window.Utils.bindClick(tabsNode, '.artist-tab', function(e, tab) {
        var category = tab.dataset.category;
        window.UI.switchArtistCategory(category);
    });

    return [headerNode, tabsNode];
}

// ============ RENDER FOOTER (Static Sections) ============
function renderFooterNode(artist) {
    var container = document.createElement('div');
    container.className = 'artist-sections-wrapper';

    if (artist.dedicatedPlaylists && artist.dedicatedPlaylists.length > 0) {
        var section = window.Utils.compileHTMLToNode([
            '<div class="artist-playlists-section" id="artist-dedicated-playlists">',
            '    <h3>Dedicated Playlists</h3>',
            '    <div class="playlist-list"></div>',
            '</div>'
        ]);
        var list = section.querySelector('.playlist-list');
        artist.dedicatedPlaylists.forEach(function(playlist) {
            var card = createPlaylistCard(playlist);
            if (card && list) list.appendChild(card);
        });
        container.appendChild(section);
    }

    if (artist.featuredPlaylists && artist.featuredPlaylists.length > 0) {
        var section = window.Utils.compileHTMLToNode([
            '<div class="artist-playlists-section" id="artist-featured-playlists">',
            '    <h3>Featured In</h3>',
            '    <div class="playlist-list"></div>',
            '</div>'
        ]);
        var list = section.querySelector('.playlist-list');
        artist.featuredPlaylists.forEach(function(playlist) {
            var card = createPlaylistCard(playlist);
            if (card && list) list.appendChild(card);
        });
        container.appendChild(section);
    }

    if (artist.singles && artist.singles.length > 0) {
        var section = window.Utils.compileHTMLToNode([
            '<div class="artist-albums-section" id="artist-singles">',
            '    <h3>Singles</h3>',
            '    <div class="album-list"></div>',
            '</div>'
        ]);
        var list = section.querySelector('.album-list');
        artist.singles.forEach(function(single) {
            var card = createAlbumCard(single);
            if (card && list) list.appendChild(card);
        });
        container.appendChild(section);
    }

    if (artist.latestReleases && artist.latestReleases.length > 0) {
        var section = window.Utils.compileHTMLToNode([
            '<div class="artist-albums-section" id="artist-latest-releases">',
            '    <h3>Latest Releases</h3>',
            '    <div class="album-list"></div>',
            '</div>'
        ]);
        var list = section.querySelector('.album-list');
        artist.latestReleases.forEach(function(release) {
            var card = createAlbumCard(release);
            if (card && list) list.appendChild(card);
        });
        container.appendChild(section);
    }

    return container;
}

// ============ RENDER DYNAMIC SONGS SECTION ============
function renderSongsSectionNode(songs, category, totalSongs) {
    var songHeaderCount = songs ? songs.length : 0;
    var node = window.Utils.compileHTMLToNode([
        '<div class="artist-songs-section" id="artist-dynamic-songs" data-category="' + category + '">',
        '    <h3>Top Songs (' + songHeaderCount + ')</h3>',
        '    <div class="song-list"></div>',
        '    <div id="artist-songs-load-more"></div>',
        '</div>'
    ]);

    var listDiv = node.querySelector('.song-list');

    if (songs && songs.length > 0) {
        var artistContext = {type: 'artist', image: '', language: '', year: '', title: window.UI._artistState.token};
        songs.forEach(function(song, index) {
            var card = createSongCard(song, index, artistContext);
            if (card && listDiv) listDiv.appendChild(card);
        });
    } else {
        if (listDiv) listDiv.innerHTML = '<div class="no-results">No songs found</div>';
    }

    return node;
}

// ============ RENDER DYNAMIC ALBUMS SECTION ============
function renderAlbumsSectionNode(albums, category, totalAlbums) {
    var albumHeaderCount = albums ? albums.length : 0;
    var node = window.Utils.compileHTMLToNode([
        '<div class="artist-albums-section" id="artist-dynamic-albums" data-category="' + category + '">',
        '    <h3>Top Albums (' + albumHeaderCount + ')</h3>',
        '    <div class="album-list"></div>',
        '    <div id="artist-albums-load-more"></div>',
        '</div>'
    ]);

    var listDiv = node.querySelector('.album-list');

    if (albums && albums.length > 0) {
        albums.forEach(function(album) {
            var card = createAlbumCard(album);
            if (card && listDiv) listDiv.appendChild(card);
        });
    } else {
        if (listDiv) listDiv.innerHTML = '<div class="no-results">No albums found</div>';
    }

    return node;
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
    window.UI.hideSearchOptions();
    // 1. Build full Node blocks in correct order
    var headerNodes = renderHeaderNode(artist); // Returns [headerNode, tabsNode]
    var songsNode = renderSongsSectionNode(artist.songs, window.UI._artistState.category || 'popular', artist.totalSongs);
    var albumsNode = renderAlbumsSectionNode(artist.albums, window.UI._artistState.category || 'popular', artist.totalAlbums);
    var footerNode = renderFooterNode(artist);  // Static sections wrapper node at the bottom

    var nodes = [];
    nodes.push(headerNodes[0]);
    nodes.push(headerNodes[1]);
    nodes.push(songsNode);
    nodes.push(albumsNode);
    nodes.push(footerNode);

    window.Utils.render(DOM.results, nodes);
    DOM.stats.innerHTML = '';

    // 2. Show load more buttons
    showArtistSongsLoadMore();
    showArtistAlbumsLoadMore();

    // 3. Set active tab
    setActiveTab(window.UI._artistState.category || 'popular');
}

// ============ VIEW ARTIST ============
function viewArtist(token, category) {
    console.log('[DEBUG] viewArtist called with:', {token: token, category: category});

    // If category is undefined, try to get it from the navigation stack
    if (!category) {
        var stack = window.UI.Nav.getStack();
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

    console.log('[View] viewArtist called, isRestoring:', window.UI._isRestoring);
    category = category || 'popular';

    if (!window.UI._isRestoring) {
        window.UI.Nav.push({type: 'artist', data: {token: token, category: category}});
    }

    // Reset state with the category
    window.UI._artistState.token = token;
    window.UI._artistState.category = category;
    window.UI._artistState.songPage = 1;
    window.UI._artistState.albumPage = 1;
    window.UI._artistState.isLoadingSongs = false;
    window.UI._artistState.isLoadingAlbums = false;

    window.UI._artistSongPages = [];
    window.UI._artistAlbumPages = [];

    DOM.results.innerHTML = '<div class="loading">' + window.UI.icons.spinnerLarge + 'Loading artist...</div>';
    DOM.stats.innerHTML = '';

    var cacheKey = 'artist:' + token + ':' + category;
    console.log('[DEBUG] Looking for cache key:', cacheKey);
    if (window.Utils.Cache.has(cacheKey)) {
        console.log('[DEBUG] Cache FOUND for key:', cacheKey);
        var artist = window.Utils.Cache.get(cacheKey);
        window.UI._artistState.artistId = artist.artistId || artist.id;
        renderArtist(artist);
        return window.Utils.Promise.resolve();
    } else {
        console.log('[DEBUG] Cache MISS for key:', cacheKey);
    }

    return window.Services.Artist.getDetails(token, category)
        .then(function(artist) {
            window.Utils.Cache.set(cacheKey, artist);
            window.UI._artistState.artistId = artist.artistId || artist.id;
            renderArtist(artist);
        })
        .catch(function(error) {
            console.error('[View Artist Error] Failed to load or render details:', error);
            DOM.results.innerHTML =
                '<div class="error">Error loading artist: ' + escapeHtml(error.message) + '</div>';
        });
}

// ============ SWITCH ARTIST CATEGORY ============
function switchArtistCategory(category) {
    console.log('[Artist] Switching category:', category);

    // 1. Update state
    window.UI._artistState.category = category;
    window.UI._artistState.songPage = 1;
    window.UI._artistState.albumPage = 1;
    window.UI._artistSongPages = [];
    window.UI._artistAlbumPages = [];

    // 2. Update navigation stack entry with the new category
    var currentStack = window.UI.Nav.getStack();
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
    var token = window.UI._artistState.token;
    var fullCacheKey = 'artist:' + token + ':' + category;
    var artistData = window.Utils.Cache.get(fullCacheKey);

    if (artistData) {
        console.log('[Display] Using cached artist data for category:', category);
        updateDynamicParts(artistData.songs, artistData.albums, category);
        return window.Utils.Promise.resolve();
    }

    // 5. Fetch from API
    var songsContainer = document.getElementById('artist-dynamic-songs');
    var albumsContainer = document.getElementById('artist-dynamic-albums');
    if (songsContainer) songsContainer.innerHTML = '<div class="loading">' + window.UI.icons.spinnerLarge + 'Loading songs...</div>';
    if (albumsContainer) albumsContainer.innerHTML = '<div class="loading">' + window.UI.icons.spinnerLarge + 'Loading albums...</div>';

    return window.Services.Artist.getDetails(token, category)
        .then(function(artist) {
            window.Utils.Cache.set(fullCacheKey, artist);
            updateDynamicParts(artist.songs, artist.albums, category);
            window.UI._artistState.totalSongs = artist.totalSongs || 0;
            window.UI._artistState.totalAlbums = artist.totalAlbums || 0;
        })
        .catch(function(error) {
            if (songsContainer)
                songsContainer.innerHTML =
                    '<div class="error">Error loading songs: ' + escapeHtml(error.message) + '</div>';
            if (albumsContainer)
                albumsContainer.innerHTML =
                    '<div class="error">Error loading albums: ' + escapeHtml(error.message) + '</div>';
        });
}

// ============ UPDATE DYNAMIC PARTS ============
function updateDynamicParts(songs, albums, category) {
    console.log('[Artist] updateDynamicParts called');
    console.log('[Artist] songs count:', songs ? songs.length : 0);
    console.log('[Artist] albums count:', albums ? albums.length : 0);
    console.log('[Artist] category:', category);

    // 1. Update songs section (using ID)
    var songsContainer = document.getElementById('artist-dynamic-songs');
    if (songsContainer && songsContainer.parentNode) {
        var newSongsNode = renderSongsSectionNode(songs, category);
        songsContainer.parentNode.replaceChild(newSongsNode, songsContainer);
    }

    // 2. Update albums section (using ID)
    var albumsContainer = document.getElementById('artist-dynamic-albums');
    console.log('[Artist] albumsContainer found:', albumsContainer ? 'YES' : 'NO');
    if (albumsContainer && albumsContainer.parentNode) {
        var newAlbumsNode = renderAlbumsSectionNode(albums, category);
        albumsContainer.parentNode.replaceChild(newAlbumsNode, albumsContainer);
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
    var loadedCount = (window.UI._artistSongPages.length + 1) * window.UI._artistState.limit;

    var hasMore = false;
    if (totalSongs > 0) {
        hasMore = loadedCount < totalSongs;
    } else {
        var songsContainer = document.querySelector('.artist-songs-section .song-list');
        var currentCount = songsContainer ? songsContainer.querySelectorAll('.song-card').length : 0;
        if (window.UI._artistSongPages.length === 0) {
            hasMore = currentCount >= window.UI._artistState.limit;
        } else {
            var lastPageKey = window.UI._artistSongPages[window.UI._artistSongPages.length - 1];
            var lastData = lastPageKey ? window.Utils.Cache.get(lastPageKey) : null;
            hasMore = lastData && lastData.songs && lastData.songs.length >= window.UI._artistState.limit;
        }
    }

    if (!hasMore) {
        container.innerHTML = '<div class="end-of-results">End of songs</div>';
        return;
    }

    /* clang-format off */
    container.innerHTML = window.Utils.compileHTML([
        '<button class="btn-load-more" id="artist-songs-load-more-btn">',
        '    Load ' + window.UI._artistState.limit + ' More Songs',
        '</button>'
    ]);
    /* clang-format on */

    var btn = document.getElementById('artist-songs-load-more-btn');
    if (btn) {
        btn.addEventListener('click', function() {
            loadMoreArtistSongs();
        });
    }
}

// ============ LOAD MORE ARTIST SONGS ============
function loadMoreArtistSongs() {
    if (window.UI._artistState.isLoadingSongs) return window.Utils.Promise.resolve();
    window.UI._artistState.isLoadingSongs = true;

    var btn = document.getElementById('artist-songs-load-more-btn');
    if (btn) {
        btn.textContent = 'Loading...';
        btn.disabled = true;
    }

    var nextPage = window.UI._artistState.songPage + 1;
    var artistId = window.UI._artistState.artistId;
    var category = window.UI._artistState.category;

    // ============ CHECK CACHE ============
    var cacheKey = 'artist:' + artistId + ':' + category + ':songs:page:' + nextPage;
    if (window.Utils.Cache.has(cacheKey)) {
        console.log('[Artist] Using cached songs page:', nextPage);
        var cachedData = window.Utils.Cache.get(cacheKey);
        var songs = cachedData.songs || [];
        var total = cachedData.total || 0;

        // Append songs
        if (songs.length > 0) {
            appendArtistSongs(songs, nextPage, total, cacheKey);
        } else {
            var container = document.getElementById('artist-songs-load-more');
            if (container) {
                container.innerHTML = '<div class="end-of-results">End of songs</div>';
            }
        }
        window.UI._artistState.isLoadingSongs = false;
        if (btn) {
            btn.textContent = 'Load ' + window.UI._artistState.limit + ' More Songs';
            btn.disabled = false;
        }
        return window.Utils.Promise.resolve();
    }

    return window.Services.Artist.getMoreSongs(artistId, nextPage, category)
        .then(function(result) {
            var songs = result.songs || [];
            var total = result.total || 0;

            // ============ STORE IN CACHE ============
            window.Utils.Cache.set(cacheKey, {songs: songs, total: total});

            // Append songs
            if (songs.length > 0) {
                appendArtistSongs(songs, nextPage, total, cacheKey);
            } else {
                var container = document.getElementById('artist-songs-load-more');
                if (container) {
                    container.innerHTML = '<div class="end-of-results">End of songs</div>';
                }
            }
        })
        .catch(function(error) {
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
        })
        .then(function() {
            window.UI._artistState.isLoadingSongs = false;
            if (btn) {
                btn.textContent = 'Load ' + window.UI._artistState.limit + ' More Songs';
                btn.disabled = false;
            }
        });
}

// ============ APPEND ARTIST SONGS ============
function appendArtistSongs(songs, page, total, cacheKey) {
    var songsContainer = document.querySelector('.artist-songs-section .song-list');
    if (!songsContainer) return;

    var artistContext = {type: 'artist', image: '', language: '', year: '', title: window.UI._artistState.token};

    // Get current card count BEFORE appending
    var cardsBefore = songsContainer.querySelectorAll('.song-card').length;

    songs.forEach(function(song, idx) {
        var globalIndex = cardsBefore + idx;
        var songCard = createSongCard(song, globalIndex, artistContext);
        if (songCard) {
            songsContainer.appendChild(songCard);
        }
    });

    // Update state
    window.UI._artistState.songPage = page;
    window.UI._artistSongPages.push(cacheKey || ('artist_songs_' + window.UI._artistState.artistId + '_' + page));

    // Update active stack data using helper
    window.UI.Nav.updateCurrent({loadedSongPages: window.UI._artistSongPages.slice()});

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

    var totalAlbums = window.UI._artistState.totalAlbums || 0;
    var loadedCount = (window.UI._artistAlbumPages.length + 1) * window.UI._artistState.limit;

    var hasMore = false;
    if (totalAlbums > 0) {
        hasMore = loadedCount < totalAlbums;
    } else {
        var albumsContainer = document.getElementById('artist-dynamic-albums');
        var albumList = albumsContainer ? albumsContainer.querySelector('.album-list') : null;
        var currentCount = albumList ? albumList.querySelectorAll('.album-card').length : 0;
        if (window.UI._artistAlbumPages.length === 0) {
            hasMore = currentCount >= window.UI._artistState.limit;
        } else {
            var lastPageKey = window.UI._artistAlbumPages[window.UI._artistAlbumPages.length - 1];
            var lastData = lastPageKey ? window.Utils.Cache.get(lastPageKey) : null;
            hasMore = lastData && lastData.albums && lastData.albums.length >= window.UI._artistState.limit;
        }
    }

    if (!hasMore) {
        container.innerHTML = '<div class="end-of-results">End of albums</div>';
        return;
    }

    /* clang-format off */
    container.innerHTML = window.Utils.compileHTML([
        '<button class="btn-load-more" id="artist-albums-load-more-btn">',
        '    Load ' + window.UI._artistState.limit + ' More Albums',
        '</button>'
    ]);
    /* clang-format on */

    var btn = document.getElementById('artist-albums-load-more-btn');
    if (btn) {
        btn.addEventListener('click', function() {
            loadMoreArtistAlbums();
        });
    }
}

// ============ LOAD MORE ARTIST ALBUMS ============
function loadMoreArtistAlbums() {
    if (window.UI._artistState.isLoadingAlbums) return window.Utils.Promise.resolve();
    window.UI._artistState.isLoadingAlbums = true;

    var btn = document.getElementById('artist-albums-load-more-btn');
    if (btn) {
        btn.textContent = 'Loading...';
        btn.disabled = true;
    }

    var nextPage = window.UI._artistState.albumPage + 1;
    var artistId = window.UI._artistState.artistId;
    var category = window.UI._artistState.category;

    // ============ CHECK CACHE ============
    var cacheKey = 'artist:' + artistId + ':' + category + ':albums:page:' + nextPage;
    if (window.Utils.Cache.has(cacheKey)) {
        console.log('[Artist] Using cached albums page:', nextPage);
        var cachedData = window.Utils.Cache.get(cacheKey);
        var albums = cachedData.albums || [];
        var total = cachedData.total || 0;

        if (albums.length > 0) {
            appendArtistAlbums(albums, nextPage, total, cacheKey);
        } else {
            var container = document.getElementById('artist-albums-load-more');
            if (container) {
                container.innerHTML = '<div class="end-of-results">End of albums</div>';
            }
        }
        window.UI._artistState.isLoadingAlbums = false;
        if (btn) {
            btn.textContent = 'Load ' + window.UI._artistState.limit + ' More Albums';
            btn.disabled = false;
        }
        return window.Utils.Promise.resolve();
    }

    return window.Services.Artist.getMoreAlbums(artistId, nextPage, category)
        .then(function(result) {
            var albums = result.albums || [];
            var total = result.total || 0;

            // ============ STORE IN CACHE ============
            window.Utils.Cache.set(cacheKey, {albums: albums, total: total});

            if (albums.length > 0) {
                appendArtistAlbums(albums, nextPage, total, cacheKey);
            } else {
                var container = document.getElementById('artist-albums-load-more');
                if (container) {
                    container.innerHTML = '<div class="end-of-results">End of albums</div>';
                }
            }
        })
        .catch(function(error) {
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
        })
        .then(function() {
            window.UI._artistState.isLoadingAlbums = false;
            if (btn) {
                btn.textContent = 'Load ' + window.UI._artistState.limit + ' More Albums';
                btn.disabled = false;
            }
        });
}

function appendArtistAlbums(albums, page, total, cacheKey) {
    var albumsContainer = document.getElementById('artist-dynamic-albums');
    if (!albumsContainer) return;

    var albumList = albumsContainer.querySelector('.album-list');
    if (!albumList) return;

    albums.forEach(function(album) {
        var albumCard = createAlbumCard(album);
        if (albumCard && albumList) {
            albumList.appendChild(albumCard);
        }
    });

    // Update state
    window.UI._artistState.albumPage = page;
    window.UI._artistAlbumPages.push(cacheKey || ('artist_albums_' + window.UI._artistState.artistId + '_' + page));

    // Update active stack data using helper
    window.UI.Nav.updateCurrent({loadedAlbumPages: window.UI._artistAlbumPages.slice()});

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
function restoreArtist(data) {
    console.log('[Restore] Artist:', data);
    var category = data.category || 'popular';
    var token = data.token;
    var loadedSongPages = data.loadedSongPages || [];
    var loadedAlbumPages = data.loadedAlbumPages || [];

    window.UI._isRestoring = true;

    // First, load structural view (page 1)
    return viewArtist(token, category)
        .then(function() {
            // Append paged songs
            loadedSongPages.forEach(function(pageKey) {
                if (window.Utils.Cache.has(pageKey)) {
                    var cachedVal = window.Utils.Cache.get(pageKey);
                    var pageNum = parseInt(pageKey.split(':').pop()) || 2;
                    var songs = cachedVal.songs || [];
                    var total = cachedVal.total || 0;
                    appendArtistSongs(songs, pageNum, total, pageKey);
                }
            });

            // Append paged albums
            loadedAlbumPages.forEach(function(pageKey) {
                if (window.Utils.Cache.has(pageKey)) {
                    var cachedVal = window.Utils.Cache.get(pageKey);
                    var pageNum = parseInt(pageKey.split(':').pop()) || 2;
                    var albums = cachedVal.albums || [];
                    var total = cachedVal.total || 0;
                    appendArtistAlbums(albums, pageNum, total, pageKey);
                }
            });
        })
        .then(function() {
            window.UI._isRestoring = false;
        });
}

// ============ EXPOSE ============
window.UI.viewArtist = viewArtist;
window.UI.loadMoreArtistSongs = loadMoreArtistSongs;
window.UI.loadMoreArtistAlbums = loadMoreArtistAlbums;
window.UI.renderArtist = renderArtist;
window.UI.restoreArtist = restoreArtist;
window.UI.switchArtistCategory = switchArtistCategory;

/* clang-format off */
// Register artist card and detail page styling rules
window.Utils.registerStyle([
    '/* ===== Artist Header ===== */',
    '.artist-header {',
    '    background: #1a1a1a;',
    '    padding: 20px;',
    '    border-radius: 8px;',
    '    display: flex;',
    '    gap: 20px;',
    '    margin-bottom: 20px;',
    '    border: 1px solid #222;',
    '}',
    '.artist-header img {',
    '    width: 150px;',
    '    height: 150px;',
    '    border-radius: 50%;',
    '    object-fit: cover;',
    '    background: #222;',
    '}',
    '.artist-header-info {',
    '    flex: 1;',
    '}',
    '.artist-header-info h2 {',
    '    margin-bottom: 5px;',
    '    color: #fff;',
    '    font-size: 24px;',
    '}',
    '.artist-header-info p {',
    '    color: #aaa;',
    '    margin: 5px 0;',
    '}',
    '.artist-bio {',
    '    color: #888 !important;',
    '    font-size: 14px;',
    '    margin-top: 10px !important;',
    '    line-height: 1.6;',
    '}',
    '.artist-actions {',
    '    margin-top: 15px;',
    '    display: flex;',
    '    gap: 10px;',
    '    flex-wrap: wrap;',
    '}',
    '/* ===== Artist Tabs ===== */',
    '.artist-tabs {',
    '    display: flex;',
    '    gap: 10px;',
    '    margin-bottom: 20px;',
    '    border-bottom: 1px solid #333;',
    '    padding-bottom: 10px;',
    '}',
    '.artist-tab {',
    '    padding: 8px 16px;',
    '    background: transparent;',
    '    color: #888;',
    '    border: none;',
    '    border-radius: 4px;',
    '    font-size: 14px;',
    '    cursor: pointer;',
    '    transition: all 0.2s;',
    '}',
    '.artist-tab:hover {',
    '    color: #fff;',
    '    background: #282828;',
    '}',
    '.artist-tab.active {',
    '    color: #1db954;',
    '    background: rgba(29, 185, 84, 0.1);',
    '    font-weight: bold;',
    '}',
    '/* ===== Artist Sections ===== */',
    '.artist-songs-section,',
    '.artist-albums-section,',
    '.artist-playlists-section {',
    '    margin-top: 20px;',
    '}',
    '.artist-songs-section h3,',
    '.artist-albums-section h3,',
    '.artist-playlists-section h3 {',
    '    color: #fff;',
    '    font-size: 18px;',
    '    margin-bottom: 12px;',
    '    padding-bottom: 8px;',
    '    border-bottom: 1px solid #333;',
    '}',
    '/* ===== Artist Cards (Search Results) ===== */',
    '.artist-card {',
    '    background: #1a1a1a;',
    '    padding: 15px;',
    '    border-radius: 8px;',
    '    display: flex;',
    '    gap: 15px;',
    '    align-items: center;',
    '    cursor: pointer;',
    '    border: 1px solid #222;',
    '}',
    '.artist-card:hover {',
    '    background: #222;',
    '}',
    '.artist-card img {',
    '    width: 80px;',
    '    height: 80px;',
    '    border-radius: 50%;',
    '    object-fit: cover;',
    '    background: #222;',
    '}',
    '.artist-info {',
    '    flex: 1;',
    '}',
    '.artist-name {',
    '    font-size: 18px;',
    '    font-weight: bold;',
    '    color: #fff;',
    '}',
    '.artist-role {',
    '    color: #aaa;',
    '    margin: 5px 0;',
    '}',
    '.btn-view-artist {',
    '    margin-top: 8px;',
    '    padding: 6px 16px;',
    '    background: #6c757d;',
    '    color: white;',
    '    border: none;',
    '    border-radius: 4px;',
    '    font-size: 13px;',
    '    cursor: pointer;',
    '}',
    '.btn-view-artist:hover {',
    '    background: #5a6268;',
    '}',
    '/* ===== Responsive ===== */',
    '@media (max-width: 600px) {',
    '    .artist-header {',
    '        flex-direction: column;',
    '        align-items: center;',
    '        text-align: center;',
    '    }',
    '    .artist-header img {',
    '        width: 120px;',
    '        height: 120px;',
    '    }',
    '    .artist-tabs {',
    '        flex-wrap: wrap;',
    '        justify-content: center;',
    '    }',
    '    .artist-tab {',
    '        flex: 1;',
    '        text-align: center;',
    '        padding: 8px 12px;',
    '        font-size: 13px;',
    '    }',
    '}'
]);
/* clang-format on */
