// src/js/ui/display/lyrics.js

// ============ SHOW LYRICS ============
async function showLyrics(token, songId) {
    console.log('[Display] Fetching lyrics for:', token);

    // Check if lyrics overlay already exists
    var existingOverlay = document.getElementById('lyrics-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }

    try {
        var lyricsText = await window.Services.Song.getLyrics(token);
        displayLyricsOverlay(lyricsText);
    } catch (error) {
        console.error('[Display] Lyrics fetch error:', error);
        alert('Failed to fetch lyrics: ' + error.message);
    }
}

// ============ DISPLAY LYRICS OVERLAY ============
function displayLyricsOverlay(lyricsText) {
    // Create overlay
    var overlay = document.createElement('div');
    overlay.id = 'lyrics-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 2147483647;
        background: rgba(17, 17, 17, 0.95);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    overlay.innerHTML = `
        <div style="
            max-width: 600px;
            width: 100%;
            max-height: 80vh;
            background: #1a1a1a;
            border-radius: 12px;
            padding: 24px;
            border: 1px solid #333;
            display: flex;
            flex-direction: column;
        ">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <h2 style="color: #1db954; margin: 0; font-size: 20px;">📜 Lyrics</h2>
                <button id="lyrics-close-btn" style="
                    background: #333;
                    color: #fff;
                    border: none;
                    border-radius: 50%;
                    width: 36px;
                    height: 36px;
                    font-size: 18px;
                    cursor: pointer;
                ">✕</button>
            </div>
            <div id="lyrics-content" style="
                overflow-y: auto;
                max-height: 60vh;
                color: #ddd;
                font-size: 15px;
                line-height: 1.8;
                white-space: pre-wrap;
                padding-right: 8px;
            ">
${lyricsText}
            </div>
        </div>
    `;

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
