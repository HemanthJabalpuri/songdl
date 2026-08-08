// src/js/ui/handlers.js

// ============================================================
// APP EVENT LISTENERS
// ============================================================
function setupAppEventListeners() {
    if (DOM.searchInput) {
        DOM.searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                if (typeof window.search === 'function') {
                    window.search();
                }
            }
        });
        DOM.searchInput.focus();
        console.log('[UI] App event listeners attached');
    }

    if (typeof window.API !== 'undefined') {
        console.log('[UI] API loaded');
    }
}

// ============================================================
// UI EVENT LISTENERS
// ============================================================
function setupEventListeners() {
    console.log('[UI] Setting up event listeners...');

    // Toggle button
    if (DOM.toggleBtn) {
        DOM.toggleBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            e.preventDefault();
            toggleUI();
        });
    }

    // Close button
    if (DOM.closeBtn) {
        DOM.closeBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            e.preventDefault();
            closeUI();
        });
    }

    // Search button
    var searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            e.preventDefault();
            if (typeof window.search === 'function') {
                window.search();
            }
        });
    }

    // Songs tab
    var songsTab = document.getElementById('tab-songs');
    if (songsTab) {
        songsTab.addEventListener('click', function(e) {
            e.stopPropagation();
            e.preventDefault();
            switchTab('songs');
        });
    }

    // Albums tab
    var albumsTab = document.getElementById('tab-albums');
    if (albumsTab) {
        albumsTab.addEventListener('click', function(e) {
            e.stopPropagation();
            e.preventDefault();
            switchTab('albums');
        });
    }

    // Playlists tab
    var playlistsTab = document.getElementById('tab-playlists');
    if (playlistsTab) {
        playlistsTab.addEventListener('click', function(e) {
            e.stopPropagation();
            e.preventDefault();
            switchTab('playlists');
        });
    }

    // Artists tab
    var artistsTab = document.getElementById('tab-artists');
    if (artistsTab) {
        artistsTab.addEventListener('click', function(e) {
            e.stopPropagation();
            e.preventDefault();
            switchTab('artists');
        });
    }

    // Quality dropdown
    var qualitySelect = document.getElementById('quality-select');
    if (qualitySelect) {
        qualitySelect.addEventListener('change', function() {
            window.currentQuality = parseInt(this.value);
            console.log('[UI] Quality changed to:', window.currentQuality, 'kbps');
        });
    }

    // Global delegated click listener on results container
    var results = document.getElementById('results');
    if (results) {
        results.addEventListener('click', function(e) {
            var target = e.target;

            // 1. Back navigation click handling
            var backBtn =
                target.closest('.btn-back') || (target.id === 'btn-back-search') || (target.id === 'btn-back');
            if (backBtn) {
                e.preventDefault();
                e.stopPropagation();
                var current = window.Nav.pop();
                var prev = window.Nav.peek();
                if (prev) {
                    restoreView(prev);
                } else if (typeof window.search === 'function') {
                    window.search();
                }
                return;
            }

            // 2. Play button click handling
            var playBtn = target.closest('.btn-play');
            if (playBtn) {
                e.preventDefault();
                e.stopPropagation();
                var songCard = playBtn.closest('.song-card');
                var songData = songCard ? songCard._songData : null;
                if (songData && typeof window.playSong === 'function') {
                    window.playSong(songData);
                }
                return;
            }

            // 3. Download button click handling
            var downloadBtn = target.closest('.btn-download');
            if (downloadBtn) {
                e.preventDefault();
                e.stopPropagation();
                var songCard = downloadBtn.closest('.song-card');
                var songData = songCard ? songCard._songData : null;
                if (songData && typeof window.downloadSong === 'function') {
                    window.downloadSong(songData);
                }
                return;
            }

            // 4. Lyrics button click handling
            var lyricsBtn = target.closest('.btn-lyrics');
            if (lyricsBtn) {
                e.preventDefault();
                e.stopPropagation();
                var token = lyricsBtn.dataset.token;
                var songId = lyricsBtn.dataset.songid;
                if (token && typeof window.showLyrics === 'function') {
                    window.showLyrics(token, songId);
                }
                return;
            }

            // 5. More actions menu toggle button
            var moreBtn = target.closest('.btn-more');
            if (moreBtn) {
                e.preventDefault();
                e.stopPropagation();
                var songId = moreBtn.dataset.songid;
                var menu = document.getElementById('more-menu-' + songId);
                if (menu) {
                    document.querySelectorAll('.more-menu').forEach(function(m) {
                        if (m.id !== 'more-menu-' + songId) {
                            m.style.display = 'none';
                        }
                    });
                    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
                }
                return;
            }

            // 6. Action items inside the more menu
            var moreItem = target.closest('.more-item');
            if (moreItem) {
                e.preventDefault();
                e.stopPropagation();
                var action = moreItem.dataset.action;
                var token = moreItem.dataset.token;
                var menu = moreItem.closest('.more-menu');
                if (menu) menu.style.display = 'none';
                if (action === 'album' && typeof window.viewAlbum === 'function') {
                    window.viewAlbum(token);
                } else if (action === 'artist' && typeof window.viewArtist === 'function') {
                    window.viewArtist(token);
                }
                return;
            }

            // 7. View transition for Albums (either .album-card or its inner .btn-view-album)
            var viewAlbumBtn = target.closest('.btn-view-album') || target.closest('.album-card');
            if (viewAlbumBtn) {
                e.preventDefault();
                e.stopPropagation();
                var token = viewAlbumBtn.dataset.token;
                if (token && typeof window.viewAlbum === 'function') {
                    window.viewAlbum(token);
                }
                return;
            }

            // 8. View transition for Playlists (either .playlist-card or its inner .btn-view-playlist)
            var viewPlaylistBtn = target.closest('.btn-view-playlist') || target.closest('.playlist-card');
            if (viewPlaylistBtn) {
                e.preventDefault();
                e.stopPropagation();
                var token = viewPlaylistBtn.dataset.token;
                if (token && typeof window.viewPlaylist === 'function') {
                    window.viewPlaylist(token);
                }
                return;
            }

            // 9. View transition for Artists (either .artist-card or its inner .btn-view-artist)
            var viewArtistBtn = target.closest('.btn-view-artist') || target.closest('.artist-card');
            if (viewArtistBtn) {
                e.preventDefault();
                e.stopPropagation();
                var token = viewArtistBtn.dataset.token;
                if (token && typeof window.viewArtist === 'function') {
                    window.viewArtist(token);
                }
                return;
            }

            // 10. Category switching sub-tabs in Artist detail view
            var artistTab = target.closest('.artist-tab');
            if (artistTab) {
                e.preventDefault();
                e.stopPropagation();
                var category = artistTab.dataset.category;
                if (typeof window.switchArtistCategory === 'function') {
                    window.switchArtistCategory(category);
                }
                return;
            }
        });

        // Hide all more menus when clicking outside
        document.addEventListener('click', function() {
            document.querySelectorAll('.more-menu').forEach(function(m) {
                m.style.display = 'none';
            });
        });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.altKey && e.key === 'j') {
            e.preventDefault();
            e.stopPropagation();
            toggleUI();
        }
        if (e.key === 'Escape' && DOM.overlay && DOM.overlay.classList.contains('active')) {
            e.preventDefault();
            e.stopPropagation();
            closeUI();
        }
    });

    console.log('[UI] Event listeners setup complete');
}

// ============================================================
// TAB SWITCHING
// ============================================================
function switchTab(type) {
    console.log('[UI] Switching to tab:', type);
    window.currentSearchType = type;

    var songsTab = document.getElementById('tab-songs');
    var albumsTab = document.getElementById('tab-albums');
    var playlistsTab = document.getElementById('tab-playlists');
    var artistsTab = document.getElementById('tab-artists');
    var stats = document.getElementById('stats');
    var results = document.getElementById('results');
    var player = document.getElementById('player');

    // Remove active class from all tabs
    if (songsTab) songsTab.classList.remove('active');
    if (albumsTab) albumsTab.classList.remove('active');
    if (playlistsTab) playlistsTab.classList.remove('active');
    if (artistsTab) artistsTab.classList.remove('active');

    // Add active class to selected tab
    if (type === 'songs' && songsTab) {
        songsTab.classList.add('active');
    } else if (type === 'albums' && albumsTab) {
        albumsTab.classList.add('active');
    } else if (type === 'playlists' && playlistsTab) {
        playlistsTab.classList.add('active');
    } else if (type === 'artists' && artistsTab) {
        artistsTab.classList.add('active');
    }

    // Clear results for other tabs
    if (results) results.innerHTML = '';
    if (stats) stats.innerHTML = '';
    if (player) player.innerHTML = '';
    if (DOM.searchInput) DOM.searchInput.focus();
}

// ============================================================
// EXPOSE HANDLERS
// ============================================================
window.switchTab = switchTab;

// Debug helper
window.__UI_DEBUG = {
    isOpen: function() {
        return isOpen;
    },
    toggle: toggleUI,
    open: openUI,
    close: closeUI
};

console.log('[UI] Press Alt+J to toggle, or click the 🎵 button');