// src/js/ui/display/lyrics.js

// ============ FETCH AND DISPLAY LYRICS ============
function showLyrics(token) {
    console.log('[Display] Fetching lyrics for token:', token);

    window.Services.Song.getLyrics(token)
        .then(function(lyricsText) {
            displayLyricsOverlay(lyricsText);
        })
        .catch(function(error) {
            console.error('[Display] Lyrics fetch error:', error);
            alert('Failed to fetch lyrics: ' + error.message);
        });
}

// ============ DISPLAY LYRICS OVERLAY ============
function displayLyricsOverlay(lyricsText) {
    // Create overlay
    var overlay = document.createElement('div');
    overlay.id = 'lyrics-overlay';
    overlay.className = 'lyrics-overlay';

    /* clang-format off */
    overlay.innerHTML = window.Utils.compileHTML([
        '<div class="lyrics-card">',
        '    <div class="lyrics-header">',
        '        <h2>📜 Lyrics</h2>',
        '        <button id="lyrics-close-btn">✕</button>',
        '    </div>',
        '    <div id="lyrics-content">' + escapeHtml(lyricsText),
        '    </div>',
        '</div>'
    ]);
    /* clang-format on */

    document.body.appendChild(overlay);
}

function closeLyricsOverlay() {
    var overlay = document.getElementById('lyrics-overlay');
    if (overlay) {
        overlay.remove();
        console.log('[Display] Lyrics overlay closed');
    }
}

// ============ EXPOSE ============
window.showLyrics = showLyrics;
window.closeLyricsOverlay = closeLyricsOverlay;

/* clang-format off */
// Register lyrics styling rules
window.Utils.registerStyle([
    '/* ===== Lyrics Overlay ===== */',
    '.lyrics-overlay {',
    '    position: fixed;',
    '    top: 0;',
    '    left: 0;',
    '    right: 0;',
    '    bottom: 0;',
    '    background: rgba(0, 0, 0, 0.95);',
    '    color: #fff;',
    '    z-index: 2147483647;',
    '    display: flex;',
    '    flex-direction: column;',
    '    align-items: center;',
    '    justify-content: center;',
    '    padding: 20px;',
    '    font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif;',
    '}',
    '.lyrics-card {',
    '    max-width: 600px;',
    '    width: 100%;',
    '    max-height: 80vh;',
    '    background: #1a1a1a;',
    '    border-radius: 12px;',
    '    padding: 24px;',
    '    border: 1px solid #333;',
    '    display: flex;',
    '    flex-direction: column;',
    '}',
    '.lyrics-header {',
    '    display: flex;',
    '    justify-content: space-between;',
    '    align-items: center;',
    '    margin-bottom: 16px;',
    '}',
    '.lyrics-header h2 {',
    '    color: #1db954;',
    '    margin: 0;',
    '    font-size: 20px;',
    '}',
    '#lyrics-close-btn {',
    '    background: #333;',
    '    color: #fff;',
    '    border: none;',
    '    border-radius: 50%;',
    '    width: 36px;',
    '    height: 36px;',
    '    font-size: 18px;',
    '    cursor: pointer;',
    '    display: flex;',
    '    align-items: center;',
    '    justify-content: center;',
    '    transition: background 0.2s;',
    '}',
    '#lyrics-close-btn:hover {',
    '    background: #444;',
    '}',
    '#lyrics-content {',
    '    overflow-y: auto;',
    '    max-height: 60vh;',
    '    color: #ddd;',
    '    font-size: 15px;',
    '    line-height: 1.8;',
    '    white-space: pre-wrap;',
    '    padding-right: 8px;',
    '}'
], '');
/* clang-format on */
