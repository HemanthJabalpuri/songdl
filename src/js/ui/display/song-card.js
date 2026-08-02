// ============ CREATE SONG CARD ============
function createSongCard(song, index, context) {
    var hasStream = song.has_stream;
    var songId = song.id || song.token || 'song-' + (index || 0);
    var playCount = song.play_count ? parseInt(song.play_count).toLocaleString() : '0';
    var duration = formatDuration(song.duration || song.more_info?.duration);
    var image = song.image || (context && context.image ? context.image : 'https://via.placeholder.com/80');
    var contextLanguage = context ? context.language : '';
    var contextYear = context ? context.year : '';
    var titlePrefix = (index !== undefined && context) ? (index + 1) + '. ' : '';
    var hasLyrics = song.has_lyrics || false;
    
    // Determine context type
    var isAlbumView = context && context.type === 'album';
    var isPlaylistView = context && context.type === 'playlist';
    
    // Extract album token and name for more menu
    var albumToken = null;
    var albumName = '';
    if (song.more_info && song.more_info.album_url) {
        albumToken = window.Utils.formatters.extractToken(song.more_info.album_url);
        albumName = song.more_info.album || 'Album';
    }
    
    // Extract artists from artistMap
    var artists = [];
    if (song.more_info && song.more_info.artistMap && song.more_info.artistMap.primary_artists) {
        artists = song.more_info.artistMap.primary_artists.map(function(artist) {
            return {
                name: artist.name,
                token: window.Utils.formatters.extractToken(artist.perma_url)
            };
        });
    }
    
    // Show album in menu only if NOT in album view (playlist view should show album)
    var showAlbumInMenu = albumToken && !isAlbumView;
    var hasMoreActions = showAlbumInMenu || artists.length > 0;
    
    // Context-specific display
    var artistDisplay = song.subtitle || '';
    if (isAlbumView && artistDisplay.includes(' - ')) {
        var parts = artistDisplay.split(' - ');
        artistDisplay = parts[0];
    }
    
    // Album view: compact details (no language/year)
    var detailsHtml;
    if (isAlbumView) {
        detailsHtml = `${playCount} plays • ${duration}`;
    } else {
        detailsHtml = `${escapeHtml(contextLanguage || song.language || 'Unknown')} • 
                       ${song.year || contextYear || 'N/A'} • 
                       ${playCount} plays • 
                       ${duration}`;
    }
    
    var html = `
        <div class="song-card" data-token="${song.token || song.id}">
            <img src="${image}" alt="${escapeHtml(song.title)}" />
            <div class="song-info">
                <div class="song-title">${titlePrefix}${escapeHtml(song.title)}</div>
                <div class="song-artist">${escapeHtml(artistDisplay)}</div>
                <div class="song-details">${detailsHtml}</div>
                <div class="song-actions">
                    <button class="btn-play" data-token="${song.token || song.id}" data-songid="${songId}" 
                        ${!hasStream ? 'disabled' : ''}>
                        ▶
                    </button>
                    <button class="btn-download" data-token="${song.token || song.id}" data-songid="${songId}" 
                        ${!hasStream ? 'disabled' : ''}>
                        ⬇
                    </button>
                    ${hasLyrics ? `<button class="btn-lyrics" data-token="${song.token}" data-songid="${songId}">📜</button>` : ''}
                    ${hasMoreActions ? `<button class="btn-more" data-token="${song.token}" data-songid="${songId}">⋮</button>` : ''}
                    <div class="play-progress" id="play-progress-${songId}">⏳ Decrypting...</div>
                    <div class="download-progress" id="download-progress-${songId}">⏳ Downloading...</div>
                    ${!hasStream ? '<span style="color:#999;font-size:12px;">No stream</span>' : ''}
                </div>
                ${hasMoreActions ? `
                <div class="more-menu" id="more-menu-${songId}" style="display:none;">
                    ${showAlbumInMenu ? `<button class="more-item" data-action="album" data-token="${albumToken}">💿 ${escapeHtml(albumName)}</button>` : ''}
                    ${artists.map(function(artist) {
                        return `<button class="more-item" data-action="artist" data-token="${artist.token}">🎤 ${escapeHtml(artist.name)}</button>`;
                    }).join('')}
                </div>
                ` : ''}
            </div>
        </div>
    `;
    
    return html;
}

// ============ ATTACH SONG EVENTS ============
function attachSongEvents(container) {
    var playBtns = container.querySelectorAll('.btn-play');
    var downloadBtns = container.querySelectorAll('.btn-download');
    
    playBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            var songCard = this.closest('.song-card');
            var songData = songCard ? songCard._songData : null;
            if (songData && typeof window.playSong === 'function') {
                window.playSong(songData);
            }
        });
    });
    
    downloadBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            var songCard = this.closest('.song-card');
            var songData = songCard ? songCard._songData : null;
            if (songData && typeof window.downloadSong === 'function') {
                window.downloadSong(songData);
            }
        });
    });

    // Lyrics buttons
    var lyricsBtns = container.querySelectorAll('.btn-lyrics');
    lyricsBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            var token = this.dataset.token;
            var songId = this.dataset.songid;
            if (token && typeof window.showLyrics === 'function') {
                window.showLyrics(token, songId);
            }
        });
    });

    // More buttons - toggle menu
    var moreBtns = container.querySelectorAll('.btn-more');
    moreBtns.forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            var songId = this.dataset.songid;
            var menu = document.getElementById('more-menu-' + songId);
            if (!menu) return;
            
            // Close all other menus
            document.querySelectorAll('.more-menu').forEach(function(m) {
                if (m.id !== 'more-menu-' + songId) {
                    m.style.display = 'none';
                }
            });
            
            // Toggle this menu
            menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
        });
    });
    
    // More menu items
    var moreItems = container.querySelectorAll('.more-item');
    moreItems.forEach(function(item) {
        item.addEventListener('click', function(e) {
            e.stopPropagation();
            var action = this.dataset.action;
            var token = this.dataset.token;
            var menu = this.closest('.more-menu');
            if (menu) menu.style.display = 'none';
            
            if (action === 'album') {
                if (typeof window.viewAlbum === 'function') {
                    window.viewAlbum(token);
                }
            } else if (action === 'artist') {
                // TODO: View artist (will implement later)
                console.log('[More] View artist:', token);
            }
        });
    });
    
    // Click outside to close all menus
    document.addEventListener('click', function() {
        document.querySelectorAll('.more-menu').forEach(function(m) {
            m.style.display = 'none';
        });
    });
}
