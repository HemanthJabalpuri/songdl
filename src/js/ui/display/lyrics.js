// src/js/ui/display/lyrics.js

// ============ SHOW LYRICS ============
function showLyrics(token, songId) {
    console.log('[Display] Fetching lyrics for:', token);

    // Check if lyrics overlay already exists
    var existingOverlay = document.getElementById('lyrics-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }

    return window.Services.Song.getLyrics(token)
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
    overlay.style.cssText = 'position: fixed;\n' +
        'top: 0;\n' +
        'left: 0;\n' +
        'right: 0;\n' +
        'bottom: 0;\n' +
        'z-index: 2147483647;\n' +
        'background: rgba(17, 17, 17, 0.95);\n' +
        'display: flex;\n' +
        'align-items: center;\n' +
        'justify-content: center;\n' +
        'padding: 20px;\n' +
        'font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif;\n';

    overlay.innerHTML = '<div style="\n' +
        '    max-width: 600px;\n' +
        '    width: 100%;\n' +
        '    max-height: 80vh;\n' +
        '    background: #1a1a1a;\n' +
        '    border-radius: 12px;\n' +
        '    padding: 24px;\n' +
        '    border: 1px solid #333;\n' +
        '    display: flex;\n' +
        '    flex-direction: column;\n' +
        '">\n' +
        '    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">\n' +
        '        <h2 style="color: #1db954; margin: 0; font-size: 20px;">📜 Lyrics</h2>\n' +
        '        <button id="lyrics-close-btn" style="\n' +
        '            background: #333;\n' +
        '            color: #fff;\n' +
        '            border: none;\n' +
        '            border-radius: 55%;\n' +
        '            width: 36px;\n' +
        '            height: 36px;\n' +
        '            font-size: 18px;\n' +
        '            cursor: pointer;\n' +
        '        ">✕</button>\n' +
        '    </div>\n' +
        '    <div id="lyrics-content" style="\n' +
        '        overflow-y: auto;\n' +
        '        max-height: 60vh;\n' +
        '        color: #ddd;\n' +
        '        font-size: 15px;\n' +
        '        line-height: 1.8;\n' +
        '        white-space: pre-wrap;\n' +
        '        padding-right: 8px;\n' +
        '    ">\n' + escapeHtml(lyricsText) + '\n' +
        '    </div>\n' +
        '</div>';

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
