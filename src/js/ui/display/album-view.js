// src/js/ui/display/album-view.js

// Extract rendering logic to a separate function
function renderAlbum(album) {
    var image = album.image;
    if (!image || image.includes('placeholder.com')) {
        image = window.Utils.getDefaultImage('album');
    }
    var html = `
        <div class="album-header">
            <img src="${image}" alt="${album.title}" />
            <div class="album-header-info">
                <h2>${escapeHtml(album.title)}</h2>
                <p>${escapeHtml(album.subtitle || '')}</p>
                <p>${album.song_count || album.songs?.length || 0} songs • ${
        escapeHtml(album.language || 'Unknown')} • ${album.year || 'N/A'}</p>
                <div class="album-actions">
                    <button class="btn-back" id="btn-back-search">← Back</button>
                </div>
            </div>
        </div>
        <div class="song-list album-songs-list">
    `;

    var albumContext =
        {type: 'album', image: album.image, language: album.language, year: album.year, title: album.title};

    if (album.songs && album.songs.length > 0) {
        album.songs.forEach(function(song, index) {
            html += createSongCard(song, index, albumContext);
        });
    } else {
        html += `<div class="no-results">No songs found in this album.</div>`;
    }

    html += '</div>';
    DOM.results.innerHTML = html;

    // Attach song data to cards
    var cards = DOM.results.querySelectorAll('.song-card');
    if (album.songs && album.songs.length > 0) {
        cards.forEach(function(card, index) {
            if (album.songs[index]) {
                card._songData = album.songs[index];
            }
        });
    }
}

// ============ VIEW ALBUM ============
async function viewAlbum(token) {
    console.log('[View] viewAlbum called, isRestoring:', window._isRestoring);

    // Only push if not restoring
    if (!window._isRestoring) {
        window.Nav.push({type: 'album', data: {token: token}});
    }

    var cacheKey = window.Cache.getDetailKey('album', token);

    // Check cache first
    if (window.Cache.has(cacheKey)) {
        console.log('[Display] Using cached album:', token);
        var album = window.Cache.get(cacheKey);
        renderAlbum(album);
        return;
    }

    DOM.results.innerHTML = '<div class="loading">📂 Loading album...</div>';
    DOM.stats.innerHTML = '';

    try {
        var album = await window.Services.Album.getDetails(token);

        // Store in cache
        window.Cache.set(cacheKey, album);
        renderAlbum(album);

    } catch (error) {
        console.error('[View Album Error] Failed to load or render details:', error);
        DOM.results.innerHTML = `<div class="error">❌ Error loading album: ${error.message}</div>`;
    }
}

// ============ EXPOSE ============
window.viewAlbum = viewAlbum;
