// ============ SHOW LYRICS ============
async function showLyrics(token, songId) {
    console.log('[Display] Fetching lyrics for:', token);
    
    // Check if lyrics overlay already exists
    var existingOverlay = document.getElementById('lyrics-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }
    
    // Check cache first
    if (window.lyricsCache && window.lyricsCache[token]) {
        console.log('[Display] Using cached lyrics for:', token);
        var cachedLyrics = window.lyricsCache[token];
        displayLyricsOverlay(cachedLyrics);
        return;
    }
    
    try {
        var data = await window.API.getLyrics(token);
        var lyricsText = data.lyrics && data.lyrics.lyrics ? data.lyrics.lyrics : 'No lyrics available';
        
        // Format lyrics (replace <br> with newlines)
        lyricsText = window.Utils.formatters.formatLyrics(lyricsText);
        
        // Store in cache
        if (!window.lyricsCache) {
            window.lyricsCache = {};
        }
        window.lyricsCache[token] = lyricsText;
        console.log('[Display] Lyrics cached for:', token);
        
        // Display lyrics overlay
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
    
    // Close button event listener
    var closeBtn = document.getElementById('lyrics-close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            closeLyricsOverlay();
        });
    }
    
    // Click outside to close
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            closeLyricsOverlay();
        }
    });
    
    // ESC key to close (using a single listener)
    var escHandler = function(e) {
        if (e.key === 'Escape') {
            var overlayEl = document.getElementById('lyrics-overlay');
            if (overlayEl) {
                closeLyricsOverlay();
                document.removeEventListener('keydown', escHandler);
            }
        }
    };
    document.addEventListener('keydown', escHandler);
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
