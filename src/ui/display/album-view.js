// src/js/ui/display/album-view.js

// Extract rendering logic to a separate function
function renderAlbum(album) {
    var image = album.image;
    if (!image || image.indexOf('placeholder.com') !== -1) {
        image = window.Utils.getDefaultImage('album');
    }
    var songCountInfo = album.song_count || (album.songs ? album.songs.length : 0);
    /* clang-format off */
    var html = window.Utils.compileHTML([
        '<div class="album-header">',
        '    <img src="' + image + '" alt="' + escapeHtml(album.title) + '" />',
        '    <div class="album-header-info">',
        '        <h2>' + escapeHtml(album.title) + '</h2>',
        '        <p>' + escapeHtml(album.subtitle || '') + '</p>',
        '        <p>' + songCountInfo + ' songs • ' + escapeHtml(album.language || 'Unknown') + ' • ' + (album.year || 'N/A') + '</p>',
        '        <div class="album-actions">',
        '            <button class="btn-back" id="btn-back-search">← Back</button>',
        '        </div>',
        '    </div>',
        '</div>',
        '<div class="song-list album-songs-list">'
    ]);
    /* clang-format on */

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
    console.log('[View] viewAlbum called, isRestoring:', window.UI._isRestoring);

    // Only push if not restoring
    if (!window.UI._isRestoring) {
        window.UI.Nav.push({type: 'album', data: {token: token}});
    }

    var cacheKey = window.Utils.Cache.getDetailKey('album', token);

    // Check cache first
    if (window.Utils.Cache.has(cacheKey)) {
        console.log('[Display] Using cached album:', token);
        var album = window.Utils.Cache.get(cacheKey);
        renderAlbum(album);
        return window.Utils.Promise.resolve();
    }

    DOM.results.innerHTML = '<div class="loading">📂 Loading album...</div>';
    DOM.stats.innerHTML = '';

    return window.Services.Album.getDetails(token)
        .then(function(album) {
            // Store in cache
            window.Utils.Cache.set(cacheKey, album);
            renderAlbum(album);
        })
        .catch(function(error) {
            console.error('[View Album Error] Failed to load or render details:', error);
            DOM.results.innerHTML =
                '<div class="error">❌ Error loading album: ' + escapeHtml(error.message) + '</div>';
        });
}

// ============ EXPOSE ============
window.UI.viewAlbum = viewAlbum;

/* clang-format off */
// Register album card and detail page styling rules
window.Utils.registerStyle([
    '/* Album Cards */',
    '.album-card {',
    '    background: #1a1a1a;',
    '    padding: 15px;',
    '    border-radius: 8px;',
    '    display: flex;',
    '    gap: 15px;',
    '    align-items: center;',
    '    cursor: pointer;',
    '    border: 1px solid #222;',
    '}',
    '.album-card:hover {',
    '    background: #222;',
    '}',
    '.album-card img {',
    '    width: 100px;',
    '    height: 100px;',
    '    border-radius: 4px;',
    '    object-fit: cover;',
    '    background: #222;',
    '}',
    '.album-info {',
    '    flex: 1;',
    '}',
    '.album-title {',
    '    font-size: 18px;',
    '    font-weight: bold;',
    '    color: #fff;',
    '}',
    '.album-artist {',
    '    color: #aaa;',
    '    margin: 5px 0;',
    '}',
    '.album-details {',
    '    color: #666;',
    '    font-size: 14px;',
    '}',
    '.btn-view-album {',
    '    margin-top: 8px;',
    '    padding: 6px 16px;',
    '    background: #6c757d;',
    '    color: white;',
    '    border: none;',
    '    border-radius: 4px;',
    '    font-size: 13px;',
    '    cursor: pointer;',
    '}',
    '.btn-view-album:hover {',
    '    background: #5a6268;',
    '}',
    '/* Album Detail View Banner */',
    '.album-header {',
    '    background: #1a1a1a;',
    '    padding: 20px;',
    '    border-radius: 8px;',
    '    display: flex;',
    '    gap: 20px;',
    '    margin-bottom: 20px;',
    '    border: 1px solid #222;',
    '}',
    '.album-header img {',
    '    width: 200px;',
    '    height: 200px;',
    '    border-radius: 4px;',
    '    object-fit: cover;',
    '    background: #222;',
    '}',
    '.album-header-info {',
    '    flex: 1;',
    '}',
    '.album-header-info h2 {',
    '    margin-bottom: 5px;',
    '    color: #fff;',
    '}',
    '.album-header-info p {',
    '    color: #aaa;',
    '    margin: 5px 0;',
    '}',
    '.album-actions {',
    '    margin-top: 15px;',
    '    display: flex;',
    '    gap: 10px;',
    '    flex-wrap: wrap;',
    '}',
    '/* Song List in Album Details */',
    '.song-list {',
    '    display: grid;',
    '    gap: 8px;',
    '}',
    '.song-item {',
    '    background: #1a1a1a;',
    '    padding: 12px 15px;',
    '    border-radius: 4px;',
    '    display: flex;',
    '    align-items: center;',
    '    gap: 15px;',
    '    border: 1px solid #222;',
    '}',
    '.song-item .song-title {',
    '    flex: 2;',
    '    font-weight: 500;',
    '    font-size: 15px;',
    '    color: #fff;',
    '}',
    '.song-item .song-artist {',
    '    flex: 2;',
    '    color: #aaa;',
    '    font-size: 14px;',
    '}',
    '.song-item .song-duration {',
    '    color: #666;',
    '    font-size: 13px;',
    '    min-width: 50px;',
    '}',
    '/* Responsive */',
    '@media (max-width: 600px) {',
    '    .album-header {',
    '        flex-direction: column;',
    '        align-items: center;',
    '        text-align: center;',
    '    }',
    '    .album-header img {',
    '        width: 150px;',
    '        height: 150px;',
    '    }',
    '    .song-item {',
    '        flex-wrap: wrap;',
    '    }',
    '    .song-item .song-title {',
    '        flex: 1 1 100%;',
    '    }',
    '    .song-item .song-artist {',
    '        flex: 1 1 100%;',
    '    }',
    '}'
]);
/* clang-format on */
