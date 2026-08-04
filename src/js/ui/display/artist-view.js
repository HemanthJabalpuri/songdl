// ============ ARTIST STATE ============
window._artistState = {
    token: '',
    artistId: '',
    category: 'popular',  // 'popular' | 'latest'
    songPage: 1,
    albumPage: 1,
    limit: 10,
    isLoadingSongs: false,
    isLoadingAlbums: false,
    totalSongs: 0,
    totalAlbums: 0
};
window._artistSongPages = [];
window._artistAlbumPages = [];

// ============ RENDER HEADER ============
function renderHeader(artist) {
    var html = `
        <div class="artist-header">
            <img src="${artist.image || 'https://via.placeholder.com/200'}" alt="${artist.name}" />
            <div class="artist-header-info">
                <h2>${escapeHtml(artist.name)} ${artist.isVerified ? '✅' : ''}</h2>
                <p>${escapeHtml(artist.subtitle || '')}</p>
                <p>${artist.fan_count ? artist.fan_count + ' Fans' : ''}</p>
                ${artist.bio ? `<p class="artist-bio">${escapeHtml(artist.bio.substring(0, 200))}${artist.bio.length > 200 ? '...' : ''}</p>` : ''}
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
                    ${artist.dedicatedPlaylists.map(function(playlist) {
                        return createPlaylistCard(playlist);
                    }).join('')}
                </div>
            </div>
        `;
    }

    if (artist.featuredPlaylists && artist.featuredPlaylists.length > 0) {
        html += `
            <div class="artist-playlists-section" id="artist-featured-playlists">
                <h3>Featured In</h3>
                <div class="playlist-list">
                    ${artist.featuredPlaylists.map(function(playlist) {
                        return createPlaylistCard(playlist);
                    }).join('')}
                </div>
            </div>
        `;
    }

    if (artist.singles && artist.singles.length > 0) {
        html += `
            <div class="artist-albums-section" id="artist-singles">
                <h3>Singles</h3>
                <div class="album-list">
                    ${artist.singles.map(function(single) {
                        return createAlbumCard(single);
                    }).join('')}
                </div>
            </div>
        `;
    }

    if (artist.latestReleases && artist.latestReleases.length > 0) {
        html += `
            <div class="artist-albums-section" id="artist-latest-releases">
                <h3>Latest Releases</h3>
                <div class="album-list">
                    ${artist.latestReleases.map(function(release) {
                        return createAlbumCard(release);
                    }).join('')}
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
        var artistContext = {
            type: 'artist',
            image: '',
            language: '',
            year: '',
            title: window._artistState.token
        };
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

// ============ ATTACH ARTIST EVENTS ============
function attachArtistViewEvents() {
    // Back button
    var backBtn = document.getElementById('btn-back');
    if (backBtn) {
        // Remove old listeners to prevent duplicates
        var newBackBtn = backBtn.cloneNode(true);
        backBtn.parentNode.replaceChild(newBackBtn, backBtn);
        newBackBtn.addEventListener('click', function() {
            var prev = window.Nav.pop();
            if (prev) {
                restoreView(prev);
            } else {
                if (typeof window.search === 'function') {
                    window.search();
                }
            }
        });
    }

    // Tab clicks
    var tabs = document.querySelectorAll('.artist-tab');
    tabs.forEach(function(tab) {
        // Remove old listeners
        var newTab = tab.cloneNode(true);
        tab.parentNode.replaceChild(newTab, tab);
        newTab.addEventListener('click', function() {
            var category = this.dataset.category;
            switchArtistCategory(category);
        });
    });
}


// ============ RENDER ARTIST ============
function renderArtist(artist) {
    // 1. Build full HTML with correct order
    var headerHtml = renderHeader(artist);
    var songsHtml = renderSongsSectionHTML(artist.songs, window._artistState.category || 'popular', artist.totalSongs);
    var albumsHtml = renderAlbumsSectionHTML(artist.albums, window._artistState.category || 'popular', artist.totalAlbums);
    var footerHtml = renderFooter(artist); // Static sections at the bottom

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

    // 3. Attach events
    attachSongEvents(DOM.results);
    attachAlbumEvents(DOM.results);
    attachPlaylistEvents(DOM.results);

    // 4. Show load more buttons
    showArtistSongsLoadMore();
    showArtistAlbumsLoadMore();

    // 5. Attach back button and tab events
    attachArtistViewEvents();

    // 6. Set active tab
    setActiveTab(window._artistState.category || 'popular');
}

// ============ VIEW ARTIST ============
async function viewArtist(token) {
    console.log('[View] viewArtist called, isRestoring:', window._isRestoring);

    if (!window._isRestoring) {
        window.Nav.push({ type: 'artist', data: { token: token, category: 'popular' } });
    }

    // Reset state
    window._artistState.token = token;
    window._artistState.category = 'popular';
    window._artistState.songPage = 1;
    window._artistState.albumPage = 1;
    window._artistState.isLoadingSongs = false;
    window._artistState.isLoadingAlbums = false;
    window._artistState.totalSongs = 0;
    window._artistState.totalAlbums = 0;
    window._artistSongPages = [];
    window._artistAlbumPages = [];

    DOM.results.innerHTML = '<div class="loading">🎤 Loading artist...</div>';
    DOM.stats.innerHTML = '';

    var cacheKey = 'artist:' + token + ':popular';
    if (window.Cache.has(cacheKey)) {
        console.log('[Display] Using cached artist:', token);
        var artist = window.Cache.get(cacheKey);
        renderArtist(artist);
        return;
    }

    try {
        var artist = await window.Services.Artist.getDetails(token, 'popular');
        window.Cache.set(cacheKey, artist);
        window._artistState.artistId = artist.artistId || artist.id;
        renderArtist(artist);
    } catch (error) {
        DOM.results.innerHTML = `<div class="error">❌ Error loading artist: ${error.message}</div>`;
    }
}

// ============ SWITCH ARTIST CATEGORY ============
async function switchArtistCategory(category) {
    console.log('[Artist] Switching category:', category);

    // 1. Update state
    var oldCategory = window._artistState.category;
    window._artistState.category = category;
    window._artistState.songPage = 1;
    window._artistState.albumPage = 1;
    window._artistSongPages = [];
    window._artistAlbumPages = [];

    // 2. Set active tab (visual)
    setActiveTab(category);

    // 3. Check cache for this category
    var token = window._artistState.token;
    var cacheKey = 'artist:' + token + ':' + category + ':songs';
    
    // We need to get the full artist data for this category
    // We could fetch only songs/albums, but for simplicity we'll fetch the whole artist data
    // and extract songs/albums. Later we can optimize to fetch only songs/albums.

    var fullCacheKey = 'artist:' + token + ':' + category;
    var artistData = window.Cache.get(fullCacheKey);

    if (artistData) {
        console.log('[Display] Using cached artist data for category:', category);
        updateDynamicParts(artistData.songs, artistData.albums, category);
        return;
    }

    // 4. Fetch from API
    DOM.results.querySelector('.artist-songs-section').innerHTML = '<div class="loading">🎤 Loading songs...</div>';
    DOM.results.querySelector('.artist-albums-section').innerHTML = '<div class="loading">🎤 Loading albums...</div>';

    try {
        var artist = await window.Services.Artist.getDetails(token, category);
        window.Cache.set(fullCacheKey, artist);

        // Update only dynamic parts
        updateDynamicParts(artist.songs, artist.albums, category);

        // Also update total counts in state
        window._artistState.totalSongs = artist.totalSongs || 0;
        window._artistState.totalAlbums = artist.totalAlbums || 0;

    } catch (error) {
        DOM.results.querySelector('.artist-songs-section').innerHTML = `<div class="error">❌ Error loading songs: ${error.message}</div>`;
        DOM.results.querySelector('.artist-albums-section').innerHTML = `<div class="error">❌ Error loading albums: ${error.message}</div>`;
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

    // 4. Attach events
    attachSongEvents(DOM.results);
    attachAlbumEvents(DOM.results);
    attachPlaylistEvents(DOM.results);

    // 5. Show load more buttons
    showArtistSongsLoadMore();
    showArtistAlbumsLoadMore();
}

// ============ SHOW ARTIST SONGS LOAD MORE ============
function showArtistSongsLoadMore() {
    var container = document.getElementById('artist-songs-load-more');
    if (!container) return;

    var totalSongs = window._artistState.totalSongs || 0;
    var loadedCount = window._artistSongPages.length * window._artistState.limit;
    var hasMore = totalSongs === 0 || loadedCount < totalSongs;

    // Also check if we have a last_page flag from the API
    // For now, assume more if totalSongs > loadedCount

    if (!hasMore && totalSongs > 0) {
        container.innerHTML = '<div class="end-of-results">🏁 End of songs</div>';
        return;
    }

    if (!hasMore && totalSongs === 0) {
        // If we don't know total, check if we got less than limit
        // For now, show button if we have songs
        var lastData = window.Cache.get(window._artistSongPages[window._artistSongPages.length - 1]);
        if (lastData && lastData.length < window._artistState.limit) {
            container.innerHTML = '<div class="end-of-results">🏁 End of songs</div>';
            return;
        }
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
            appendArtistSongs(songs, nextPage, total);
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
        window.Cache.set(cacheKey, { songs: songs, total: total });

        if (total > 0) {
            window._artistState.totalSongs = total;
        } else {
            window._artistState.totalSongs += songs.length;
        }

        // Append songs
        if (songs.length > 0) {
            appendArtistSongs(songs, nextPage, total);
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
function appendArtistSongs(songs, page, total) {
    var songsContainer = document.querySelector('.artist-songs-section .song-list');
    if (!songsContainer) return;

    var artistContext = {
        type: 'artist',
        image: '',
        language: '',
        year: '',
        title: window._artistState.token
    };

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

    // Attach events
    attachSongEvents(songsContainer);

    // Update state
    window._artistState.songPage = page;
    window._artistSongPages.push('artist_songs_' + window._artistState.artistId + '_' + page);

    // Update load more button
    showArtistSongsLoadMore();

    // Update stats
    var h3 = document.querySelector('.artist-songs-section h3');
    if (h3) {
        var totalDisplay = window._artistState.totalSongs || songs.length;
        h3.textContent = 'Top Songs (' + totalDisplay + ')';
    }
}

// ============ SHOW ARTIST ALBUMS LOAD MORE ============
function showArtistAlbumsLoadMore() {
    var container = document.getElementById('artist-albums-load-more');
    if (!container) return;

    var totalAlbums = window._artistState.totalAlbums || 0;
    var loadedCount = window._artistAlbumPages.length * window._artistState.limit;
    var hasMore = totalAlbums === 0 || loadedCount < totalAlbums;

    if (!hasMore && totalAlbums > 0) {
        container.innerHTML = '<div class="end-of-results">🏁 End of albums</div>';
        return;
    }

    if (!hasMore && totalAlbums === 0) {
        var lastData = window.Cache.get(window._artistAlbumPages[window._artistAlbumPages.length - 1]);
        if (lastData && lastData.length < window._artistState.limit) {
            container.innerHTML = '<div class="end-of-results">🏁 End of albums</div>';
            return;
        }
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
            appendArtistAlbums(albums, nextPage, total);
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
        window.Cache.set(cacheKey, { albums: albums, total: total });

        if (total > 0) {
            window._artistState.totalAlbums = total;
        } else {
            window._artistState.totalAlbums += albums.length;
        }

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

// ============ APPEND ARTIST ALBUMS ============
function appendArtistAlbums(albums, page, total) {
    var albumsContainer = document.getElementById('artist-dynamic-albums');
    if (!albumsContainer) return;

    var albumList = albumsContainer.querySelector('.album-list');
    if (!albumList) return;

    albums.forEach(function(album) {
        var albumCard = createAlbumCard(album);
        albumList.insertAdjacentHTML('beforeend', albumCard);
    });

    // Attach events to new cards
    attachAlbumEvents(albumList);

    // Update state
    window._artistState.albumPage = page;
    window._artistAlbumPages.push('artist_albums_' + window._artistState.artistId + '_' + page);

    // Update load more button
    showArtistAlbumsLoadMore();

    // Update stats
    var h3 = albumsContainer.querySelector('h3');
    if (h3) {
        var totalDisplay = window._artistState.totalAlbums || albums.length;
        h3.textContent = 'Top Albums (' + totalDisplay + ')';
    }
}

// ============ RESTORE ARTIST ============
function restoreArtist(data) {
    console.log('[Restore] Artist:', data);
    viewArtist(data.token);
}

// ============ EXPOSE ============
window.viewArtist = viewArtist;
window.loadMoreArtistSongs = loadMoreArtistSongs;
window.loadMoreArtistAlbums = loadMoreArtistAlbums;
window.renderArtist = renderArtist;
