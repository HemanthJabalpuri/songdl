// src/js/ui/display/album-view.js

// Extract rendering logic to a separate function
function renderAlbum(album) {
    var image = album.image;
    if (!image || image.indexOf('placeholder.com') !== -1) {
        image = window.Utils.getDefaultImage('album');
    }
    var songCountInfo = album.song_count || (album.songs ? album.songs.length : 0);
    var html = '\n        <div class="album-header">\n' +
        '            <img src="' + image + '" alt="' + escapeHtml(album.title) + '" />\n' +
        '            <div class="album-header-info">\n' +
        '                <h2>' + escapeHtml(album.title) + '</h2>\n' +
        '                <p>' + escapeHtml(album.subtitle || '') + '</p>\n' +
        '                <p>' + songCountInfo + ' songs • ' + escapeHtml(album.language || 'Unknown') + ' • ' +
        (album.year || 'N/A') + '</p>\n' +
        '                <div class="album-actions">\n' +
        '                    <button class="btn-back" id="btn-back-search">← Back</button>\n' +
        '                </div>\n' +
        '            </div>\n' +
        '        </div>\n' +
        '        <div class="song-list album-songs-list">\n    ';

    var albumContext =
        {type: 'album', image: album.image, language: album.language, year: album.year, title: album.title};

    if (album.songs && album.songs.length > 0) {
        album.songs.forEach(function(song, index) {
            html += createSongCard(song, index, albumContext);
        });
    } else {
        html += '<div class="no-results">No songs found in this album.</div>';
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
function viewAlbum(token) {
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
        return window.Utils.Promise.resolve();
    }

    DOM.results.innerHTML = '<div class="loading">📂 Loading album...</div>';
    DOM.stats.innerHTML = '';

    return window.Services.Album.getDetails(token)
        .then(function(album) {
            // Store in cache
            window.Cache.set(cacheKey, album);
            renderAlbum(album);
        })
        .catch(function(error) {
            console.error('[View Album Error] Failed to load or render details:', error);
            DOM.results.innerHTML =
                '<div class="error">❌ Error loading album: ' + escapeHtml(error.message) + '</div>';
        });
}

// ============ EXPOSE ============
window.viewAlbum = viewAlbum;
