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

// ============ RENDER ARTIST ============
function renderArtist(artist) {
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
        <div class="artist-songs-section">
            <h3>Top Songs (${artist.songs ? artist.songs.length : 0})</h3>
            <div class="song-list">
    `;

    if (artist.songs && artist.songs.length > 0) {
        var artistContext = {
            type: 'artist',
            image: artist.image,
            language: '',
            year: '',
            title: artist.name
        };
        artist.songs.forEach(function(song, index) {
            html += createSongCard(song, index, artistContext);
        });
    } else {
        html += `<div class="no-results">No songs found</div>`;
    }

    html += `
            </div>
            <div id="artist-songs-load-more"></div>
        </div>
        <div class="artist-albums-section">
            <h3>Top Albums (${artist.albums ? artist.albums.length : 0})</h3>
            <div class="album-list">
    `;

    if (artist.albums && artist.albums.length > 0) {
        artist.albums.forEach(function(album, index) {
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

    // Other sections (if data exists)
    if (artist.dedicatedPlaylists && artist.dedicatedPlaylists.length > 0) {
        html += `
            <div class="artist-playlists-section">
                <h3>Dedicated Playlists</h3>
                <div class="playlist-list">
        `;
        artist.dedicatedPlaylists.forEach(function(playlist) {
            html += createPlaylistCard(playlist);
        });
        html += `
                </div>
            </div>
        `;
    }

    if (artist.featuredPlaylists && artist.featuredPlaylists.length > 0) {
        html += `
            <div class="artist-playlists-section">
                <h3>Featured In</h3>
                <div class="playlist-list">
        `;
        artist.featuredPlaylists.forEach(function(playlist) {
            html += createPlaylistCard(playlist);
        });
        html += `
                </div>
            </div>
        `;
    }

    if (artist.singles && artist.singles.length > 0) {
        html += `
            <div class="artist-albums-section">
                <h3>Singles</h3>
                <div class="album-list">
        `;
        artist.singles.forEach(function(single) {
            html += createAlbumCard(single);
        });
        html += `
                </div>
            </div>
        `;
    }

    if (artist.latestReleases && artist.latestReleases.length > 0) {
        html += `
            <div class="artist-albums-section">
                <h3>Latest Releases</h3>
                <div class="album-list">
        `;
        artist.latestReleases.forEach(function(release) {
            html += createAlbumCard(release);
        });
        html += `
                </div>
            </div>
        `;
    }

    DOM.results.innerHTML = html;
    DOM.stats.innerHTML = '';

    // Attach events to song cards
    attachSongEvents(DOM.results);
    attachAlbumEvents(DOM.results);
    attachPlaylistEvents(DOM.results);

    // Show load more buttons
    showArtistSongsLoadMore();
    showArtistAlbumsLoadMore();

    // Back button
    var backBtn = document.getElementById('btn-back');
    if (backBtn) {
        backBtn.addEventListener('click', function() {
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

    // Category tabs
    var tabs = document.querySelectorAll('.artist-tab');
    tabs.forEach(function(tab) {
        tab.addEventListener('click', function() {
            var category = this.dataset.category;
            tabs.forEach(function(t) { t.classList.remove('active'); });
            this.classList.add('active');
            switchArtistCategory(category);
        });
    });
}

// ============ VIEW ARTIST ============
async function viewArtist(token) {
    console.log('[View] viewArtist called, isRestoring:', window._isRestoring);

    // Only push if not restoring
    if (!window._isRestoring) {
        window.Nav.push({ type: 'artist', data: { token: token, category: 'popular' } });
    }

    // Reset artist state
    window._artistState.token = token;
    window._artistState.artistId = '';
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
        window._artistState.artistId = artist.artistId || artist.id;
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

    window._artistState.category = category;
    window._artistState.songPage = 1;
    window._artistState.albumPage = 1;
    window._artistSongPages = [];
    window._artistAlbumPages = [];

    DOM.results.innerHTML = '<div class="loading">🎤 Loading artist...</div>';

    var token = window._artistState.token;
    var cacheKey = 'artist:' + token + ':' + category;

    if (window.Cache.has(cacheKey)) {
        console.log('[Display] Using cached artist:', token, category);
        var artist = window.Cache.get(cacheKey);
        renderArtist(artist);
        return;
    }

    try {
        var artist = await window.Services.Artist.getDetails(token, category);
        window.Cache.set(cacheKey, artist);
        renderArtist(artist);
    } catch (error) {
        DOM.results.innerHTML = `<div class="error">❌ Error loading artist: ${error.message}</div>`;
    }
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

    try {
        var result = await window.Services.Artist.getMoreSongs(artistId, nextPage, category);
        var songs = result.songs || [];
        var total = result.total || 0;

        // Update total if available
        if (total > 0) {
            window._artistState.totalSongs = total;
        } else {
            window._artistState.totalSongs += songs.length;
        }

        // Append songs
        if (songs.length > 0) {
            // Find the songs container
            var songsContainer = document.querySelector('.artist-songs-section .song-list');
            if (songsContainer) {
                var artistContext = {
                    type: 'artist',
                    image: '',
                    language: '',
                    year: '',
                    title: window._artistState.token
                };
                var startIndex = window._artistSongPages.length * window._artistState.limit;
                songs.forEach(function(song, idx) {
                    var globalIndex = startIndex + idx;
                    var songCard = createSongCard(song, globalIndex, artistContext);
                    songsContainer.insertAdjacentHTML('beforeend', songCard);
                });

                // Attach events to new cards
                attachSongEvents(songsContainer);

                // Update state
                window._artistState.songPage = nextPage;
                window._artistSongPages.push('artist_songs_' + artistId + '_' + nextPage);

                // Update load more button
                showArtistSongsLoadMore();

                // Update stats
                var h3 = document.querySelector('.artist-songs-section h3');
                if (h3) {
                    var totalDisplay = window._artistState.totalSongs || songs.length;
                    h3.textContent = 'Top Songs (' + totalDisplay + ')';
                }
            }
        } else {
            // No more songs
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

    try {
        var result = await window.Services.Artist.getMoreAlbums(artistId, nextPage, category);
        var albums = result.albums || [];
        var total = result.total || 0;

        if (total > 0) {
            window._artistState.totalAlbums = total;
        } else {
            window._artistState.totalAlbums += albums.length;
        }

        if (albums.length > 0) {
            var albumsContainer = document.querySelector('.artist-albums-section .album-list');
            if (albumsContainer) {
                albums.forEach(function(album) {
                    var albumCard = createAlbumCard(album);
                    albumsContainer.insertAdjacentHTML('beforeend', albumCard);
                });

                attachAlbumEvents(albumsContainer);

                window._artistState.albumPage = nextPage;
                window._artistAlbumPages.push('artist_albums_' + artistId + '_' + nextPage);

                showArtistAlbumsLoadMore();

                var h3 = document.querySelector('.artist-albums-section h3');
                if (h3) {
                    var totalDisplay = window._artistState.totalAlbums || albums.length;
                    h3.textContent = 'Top Albums (' + totalDisplay + ')';
                }
            }
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
