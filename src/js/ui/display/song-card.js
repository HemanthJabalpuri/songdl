// src/js/ui/display/song-card.js

// ============ CREATE SONG CARD ============
function createSongCard(song, index, context) {
    var hasStream = song.has_stream;
    var songId = song.id || song.token || 'song-' + (index || 0);
    var playCount = song.play_count ? parseInt(song.play_count).toLocaleString() : '0';
    var duration = formatDuration(song.duration || (song.more_info && song.more_info.duration));
    var image = song.image || (context && context.image ? context.image : '');
    if (!image || image.indexOf('placeholder.com') !== -1) {
        image = window.Utils.getDefaultImage('song');
    }
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
            return {name: artist.name, token: window.Utils.formatters.extractToken(artist.perma_url)};
        });
    }

    // Show album in menu only if NOT in album view (playlist view should show album)
    var showAlbumInMenu = albumToken && !isAlbumView;
    var hasMoreActions = showAlbumInMenu || artists.length > 0;

    // Context-specific display
    var artistDisplay = song.subtitle || '';
    if (isAlbumView && artistDisplay.indexOf(' - ') !== -1) {
        var parts = artistDisplay.split(' - ');
        artistDisplay = parts[0];
    }

    // Album view: compact details (no language/year)
    var detailsHtml;
    if (isAlbumView) {
        detailsHtml = playCount + ' plays • ' + duration;
    } else {
        detailsHtml = escapeHtml(contextLanguage || song.language || 'Unknown') + ' • ' +
            (song.year || contextYear || 'N/A') + ' • ' + playCount + ' plays • ' + duration;
    }

    /* clang-format off */
    var html = window.Utils.compileHTML([
        '<div class="song-card" data-token="' + (song.token || song.id) + '">',
        '    <img src="' + image + '" alt="' + escapeHtml(song.title) + '" />',
        '    <div class="song-info">',
        '        <div class="song-title">' + titlePrefix + escapeHtml(song.title) + '</div>',
        '        <div class="song-artist">' + escapeHtml(artistDisplay) + '</div>',
        '        <div class="song-details">' + detailsHtml + '</div>',
        '        <div class="song-actions">',
        '            <button class="btn-play" data-token="' + (song.token || song.id) + '" data-songid="' + songId + '"' + (!hasStream ? ' disabled' : '') + '>',
        '                ▶',
        '            </button>',
        '            <button class="btn-download" data-token="' + (song.token || song.id) + '" data-songid="' + songId + '"' + (!hasStream ? ' disabled' : '') + '>',
        '                ⬇',
        '            </button>',
        hasLyrics ? '            <button class="btn-lyrics" data-token="' + song.token + '" data-songid="' + songId + '">📜</button>' : '',
        hasMoreActions ? [
            '            <div class="more-actions-wrapper">',
            '                <button class="btn-more" data-token="' + song.token + '" data-songid="' + songId + '">⋮</button>',
            '                <div class="more-menu" id="more-menu-' + songId + '" style="display: none;">',
            showAlbumInMenu ? '                    <button class="more-item" data-action="album" data-token="' + albumToken + '">💿 ' + escapeHtml(albumName) + '</button>' : '',
            artists.map(function(artist) {
                return '                    <button class="more-item" data-action="artist" data-token="' + artist.token + '">🎤 ' + escapeHtml(artist.name) + '</button>';
            }).join('\n'),
            '                </div>',
            '            </div>'
        ].join('\n') : '',
        '            <div class="play-progress" id="play-progress-' + songId + '">⏳ Decrypting...</div>',
        '            <div class="download-progress" id="download-progress-' + songId + '">⏳ Downloading...</div>',
        !hasStream ? '            <span style="color:#999;font-size:12px;">No stream</span>' : '',
        '        </div>',
        '    </div>',
        '</div>'
    ]);
    /* clang-format on */

    return html;
}

/* clang-format off */
// Register song-card styling rules
window.Utils.registerStyle([
    '/* Song Cards */',
    '.song-card {',
    '    background: #1a1a1a;',
    '    padding: 15px;',
    '    border-radius: 8px;',
    '    display: flex;',
    '    gap: 15px;',
    '    align-items: center;',
    '    border: 1px solid #222;',
    '    position: relative;',
    '}',
    '.song-card img {',
    '    width: 80px;',
    '    height: 80px;',
    '    border-radius: 4px;',
    '    object-fit: cover;',
    '    background: #222;',
    '}',
    '.song-info {',
    '    flex: 1;',
    '}',
    '.song-title {',
    '    font-size: 18px;',
    '    font-weight: bold;',
    '    color: #fff;',
    '}',
    '.song-artist {',
    '    color: #aaa;',
    '    margin: 5px 0;',
    '}',
    '.song-details {',
    '    color: #666;',
    '    font-size: 14px;',
    '}',
    '.song-actions {',
    '    display: flex;',
    '    gap: 8px;',
    '    margin-top: 8px;',
    '    flex-wrap: wrap;',
    '}',
    '.btn-download {',
    '    padding: 6px 16px;',
    '    background: #1db954;',
    '    color: #111;',
    '    border: none;',
    '    border-radius: 4px;',
    '    font-size: 13px;',
    '    font-weight: bold;',
    '    cursor: pointer;',
    '}',
    '.btn-download:hover {',
    '    background: #1ed760;',
    '}',
    '.btn-download:disabled {',
    '    background: #555;',
    '    cursor: not-allowed;',
    '}',
    '.btn-play {',
    '    padding: 6px 16px;',
    '    background: #007bff;',
    '    color: white;',
    '    border: none;',
    '    border-radius: 4px;',
    '    font-size: 13px;',
    '    cursor: pointer;',
    '}',
    '.btn-play:hover {',
    '    background: #0056b3;',
    '}',
    '.btn-play:disabled {',
    '    background: #555;',
    '    cursor: not-allowed;',
    '}',
    '.download-progress,',
    '.play-progress {',
    '    display: none;',
    '    margin-top: 5px;',
    '    font-size: 12px;',
    '    color: #1db954;',
    '}',
    '.download-progress.active,',
    '.play-progress.active {',
    '    display: block;',
    '}',
    '.btn-lyrics {',
    '    padding: 6px 16px;',
    '    background: #6c757d;',
    '    color: white;',
    '    border: none;',
    '    border-radius: 4px;',
    '    font-size: 13px;',
    '    cursor: pointer;',
    '}',
    '.btn-lyrics:hover {',
    '    background: #5a6268;',
    '}',
    '/* More Actions Button Wrapper */',
    '.more-actions-wrapper {',
    '    position: relative;',
    '    display: inline-block;',
    '}',
    '/* ===== More Button ===== */',
    '.btn-more {',
    '    padding: 6px 12px;',
    '    background: transparent;',
    '    color: #aaa;',
    '    border: none;',
    '    border-radius: 4px;',
    '    font-size: 18px;',
    '    cursor: pointer;',
    '    line-height: 1;',
    '}',
    '.btn-more:hover {',
    '    color: #fff;',
    '    background: #282828;',
    '}',
    '/* ===== More Menu ===== */',
    '.more-menu {',
    '    position: absolute;',
    '    right: 0;',
    '    top: 100%;',
    '    min-width: 160px;',
    '    max-width: 250px;',
    '    background: #1a1a1a;',
    '    border: 1px solid #333;',
    '    border-radius: 8px;',
    '    padding: 4px 0;',
    '    z-index: 100;',
    '    box-shadow: 0 4px 12px rgba(0,0,0,0.5);',
    '    margin-top: 4px;',
    '}',
    '.more-item {',
    '    display: block;',
    '    width: 100%;',
    '    padding: 8px 16px;',
    '    background: transparent;',
    '    color: #ddd;',
    '    border: none;',
    '    text-align: left;',
    '    font-size: 14px;',
    '    cursor: pointer;',
    '    white-space: nowrap;',
    '    overflow: hidden;',
    '    text-overflow: ellipsis;',
    '}',
    '.more-item:hover {',
    '    background: #282828;',
    '    color: #fff;',
    '}'
]);
/* clang-format on */
