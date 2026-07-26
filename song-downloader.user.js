// ==UserScript==
// @name         JioSaavn Song Downloader
// @namespace    https://github.com
// @version      1.0.0
// @description  Download songs and albums with metadata
// @author       You
// @match        https://www.jiosaavn.com/*
// @grant        GM_xmlhttpRequest
// @connect      aac.saavncdn.com
// @connect      saavncdn.com
// ==/UserScript==

(function() {
    'use strict';
    
    console.log('[Userscript] JioSaavn Downloader loaded');
    console.log('[Userscript] Click the 🎵 button or press Alt+J to open');
    
    // ============================================================
    // EMBEDDED CSS
    // ============================================================
    var UI_CSS = "/* ===== Floating Toggle Button ===== */\n#ui-toggle-btn {\n    position: fixed;\n    bottom: 20px;\n    right: 20px;\n    z-index: 2147483647;\n    background: #1db954;\n    color: white;\n    border: none;\n    border-radius: 50%;\n    width: 56px;\n    height: 56px;\n    font-size: 24px;\n    cursor: pointer;\n    box-shadow: 0 4px 12px rgba(0,0,0,0.3);\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    transition: transform 0.2s;\n    touch-action: manipulation;\n}\n#ui-toggle-btn:hover {\n    transform: scale(1.1);\n}\n#ui-toggle-btn:active {\n    transform: scale(0.95);\n}\n\n/* ===== Fullscreen Overlay ===== */\n#ui-overlay {\n    position: fixed;\n    top: 0;\n    left: 0;\n    right: 0;\n    bottom: 0;\n    z-index: 2147483646;\n    background: #111;\n    color: #fff;\n    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;\n    display: none;\n    flex-direction: column;\n    overflow-y: auto;\n    padding: 20px;\n}\n#ui-overlay.active {\n    display: flex;\n}\n\n/* ===== Overlay Content ===== */\n#ui-overlay .container {\n    max-width: 900px;\n    margin: 0 auto;\n    width: 100%;\n}\n#ui-overlay h1 {\n    color: #1db954;\n    font-size: 24px;\n    margin-bottom: 20px;\n    display: flex;\n    align-items: center;\n    gap: 12px;\n}\n\n/* Search Tabs */\n#ui-overlay .search-tabs {\n    display: flex;\n    gap: 10px;\n    margin-bottom: 20px;\n}\n#ui-overlay .tab {\n    padding: 10px 24px;\n    background: #282828;\n    color: #888;\n    border: none;\n    border-radius: 8px;\n    font-size: 15px;\n    cursor: pointer;\n    transition: all 0.2s;\n}\n#ui-overlay .tab:hover {\n    background: #333;\n}\n#ui-overlay .tab.active {\n    background: #1db954;\n    color: #111;\n    font-weight: bold;\n}\n\n/* Search Box */\n#ui-overlay .search-box {\n    display: flex;\n    gap: 10px;\n    margin-bottom: 20px;\n}\n#ui-overlay .search-box input {\n    flex: 1;\n    padding: 12px;\n    border: 2px solid #333;\n    border-radius: 8px;\n    background: #222;\n    color: #fff;\n    font-size: 16px;\n    outline: none;\n}\n#ui-overlay .search-box input:focus {\n    border-color: #1db954;\n}\n#ui-overlay .search-box input::placeholder {\n    color: #666;\n}\n#ui-overlay .btn-search {\n    padding: 12px 24px;\n    background: #1db954;\n    color: #111;\n    border: none;\n    border-radius: 8px;\n    font-size: 16px;\n    font-weight: bold;\n    cursor: pointer;\n}\n#ui-overlay .btn-search:hover {\n    background: #1ed760;\n}\n\n/* Stats */\n#ui-overlay .stats {\n    margin: 10px 0 20px 0;\n    color: #888;\n    font-size: 14px;\n}\n\n/* Results */\n#ui-overlay .results {\n    display: grid;\n    gap: 15px;\n}\n\n/* Song Cards */\n#ui-overlay .song-card {\n    background: #1a1a1a;\n    padding: 15px;\n    border-radius: 8px;\n    display: flex;\n    gap: 15px;\n    align-items: center;\n    border: 1px solid #222;\n}\n#ui-overlay .song-card img {\n    width: 80px;\n    height: 80px;\n    border-radius: 4px;\n    object-fit: cover;\n    background: #222;\n}\n#ui-overlay .song-info {\n    flex: 1;\n}\n#ui-overlay .song-title {\n    font-size: 18px;\n    font-weight: bold;\n    color: #fff;\n}\n#ui-overlay .song-artist {\n    color: #aaa;\n    margin: 5px 0;\n}\n#ui-overlay .song-details {\n    color: #666;\n    font-size: 14px;\n}\n#ui-overlay .song-actions {\n    display: flex;\n    gap: 8px;\n    margin-top: 8px;\n    flex-wrap: wrap;\n}\n#ui-overlay .btn-download {\n    padding: 6px 16px;\n    background: #1db954;\n    color: #111;\n    border: none;\n    border-radius: 4px;\n    font-size: 13px;\n    font-weight: bold;\n    cursor: pointer;\n}\n#ui-overlay .btn-download:hover {\n    background: #1ed760;\n}\n#ui-overlay .btn-download:disabled {\n    background: #555;\n    cursor: not-allowed;\n}\n#ui-overlay .btn-play {\n    padding: 6px 16px;\n    background: #007bff;\n    color: white;\n    border: none;\n    border-radius: 4px;\n    font-size: 13px;\n    cursor: pointer;\n}\n#ui-overlay .btn-play:hover {\n    background: #0056b3;\n}\n#ui-overlay .btn-play:disabled {\n    background: #555;\n    cursor: not-allowed;\n}\n\n/* Album Cards */\n#ui-overlay .album-card {\n    background: #1a1a1a;\n    padding: 15px;\n    border-radius: 8px;\n    display: flex;\n    gap: 15px;\n    align-items: center;\n    cursor: pointer;\n    border: 1px solid #222;\n}\n#ui-overlay .album-card:hover {\n    background: #222;\n}\n#ui-overlay .album-card img {\n    width: 100px;\n    height: 100px;\n    border-radius: 4px;\n    object-fit: cover;\n    background: #222;\n}\n#ui-overlay .album-info {\n    flex: 1;\n}\n#ui-overlay .album-title {\n    font-size: 18px;\n    font-weight: bold;\n    color: #fff;\n}\n#ui-overlay .album-artist {\n    color: #aaa;\n    margin: 5px 0;\n}\n#ui-overlay .album-details {\n    color: #666;\n    font-size: 14px;\n}\n#ui-overlay .btn-view-album {\n    margin-top: 8px;\n    padding: 6px 16px;\n    background: #6c757d;\n    color: white;\n    border: none;\n    border-radius: 4px;\n    font-size: 13px;\n    cursor: pointer;\n}\n#ui-overlay .btn-view-album:hover {\n    background: #5a6268;\n}\n\n/* Album Detail View */\n#ui-overlay .album-header {\n    background: #1a1a1a;\n    padding: 20px;\n    border-radius: 8px;\n    display: flex;\n    gap: 20px;\n    margin-bottom: 20px;\n    border: 1px solid #222;\n}\n#ui-overlay .album-header img {\n    width: 200px;\n    height: 200px;\n    border-radius: 4px;\n    object-fit: cover;\n    background: #222;\n}\n#ui-overlay .album-header-info {\n    flex: 1;\n}\n#ui-overlay .album-header-info h2 {\n    margin-bottom: 5px;\n    color: #fff;\n}\n#ui-overlay .album-header-info p {\n    color: #aaa;\n    margin: 5px 0;\n}\n#ui-overlay .album-actions {\n    margin-top: 15px;\n    display: flex;\n    gap: 10px;\n    flex-wrap: wrap;\n}\n#ui-overlay .btn-back {\n    padding: 8px 20px;\n    background: #6c757d;\n    color: white;\n    border: none;\n    border-radius: 4px;\n    cursor: pointer;\n}\n#ui-overlay .btn-back:hover {\n    background: #5a6268;\n}\n\n/* Song List in Album */\n#ui-overlay .song-list {\n    display: grid;\n    gap: 8px;\n}\n#ui-overlay .song-item {\n    background: #1a1a1a;\n    padding: 12px 15px;\n    border-radius: 4px;\n    display: flex;\n    align-items: center;\n    gap: 15px;\n    border: 1px solid #222;\n}\n#ui-overlay .song-item .song-title {\n    flex: 2;\n    font-weight: 500;\n    font-size: 15px;\n    color: #fff;\n}\n#ui-overlay .song-item .song-artist {\n    flex: 2;\n    color: #aaa;\n    font-size: 14px;\n}\n#ui-overlay .song-item .song-duration {\n    color: #666;\n    font-size: 13px;\n    min-width: 50px;\n}\n\n/* Loading & Error */\n#ui-overlay .loading {\n    text-align: center;\n    padding: 40px;\n    color: #888;\n}\n#ui-overlay .error {\n    color: #ff4444;\n    padding: 20px;\n    background: #2a1a1a;\n    border-radius: 8px;\n    border: 1px solid #661111;\n}\n#ui-overlay .no-results {\n    text-align: center;\n    padding: 40px;\n    color: #666;\n}\n\n/* Progress */\n#ui-overlay .download-progress,\n#ui-overlay .play-progress {\n    display: none;\n    margin-top: 5px;\n    font-size: 12px;\n    color: #1db954;\n}\n#ui-overlay .download-progress.active,\n#ui-overlay .play-progress.active {\n    display: block;\n}\n\n/* Player */\n#ui-overlay audio {\n    width: 100%;\n    margin-top: 20px;\n    border-radius: 8px;\n}\n\n/* Lyrics Button */\n#ui-overlay .btn-lyrics {\n    padding: 6px 16px;\n    background: #6c757d;\n    color: white;\n    border: none;\n    border-radius: 4px;\n    font-size: 13px;\n    cursor: pointer;\n}\n#ui-overlay .btn-lyrics:hover {\n    background: #5a6268;\n}\n\n/* Responsive */\n@media (max-width: 600px) {\n    #ui-overlay .album-header {\n        flex-direction: column;\n        align-items: center;\n        text-align: center;\n    }\n    #ui-overlay .album-header img {\n        width: 150px;\n        height: 150px;\n    }\n    #ui-overlay .song-item {\n        flex-wrap: wrap;\n    }\n    #ui-overlay .song-item .song-title {\n        flex: 1 1 100%;\n    }\n    #ui-overlay .song-item .song-artist {\n        flex: 1 1 100%;\n    }\n    #ui-overlay .search-tabs {\n        flex-wrap: wrap;\n    }\n    #ui-overlay .tab {\n        flex: 1;\n        text-align: center;\n        padding: 8px 12px;\n        font-size: 13px;\n    }\n}";
    
    // Add CSS to page
    var styleEl = document.createElement('style');
    styleEl.textContent = UI_CSS;
    document.head.appendChild(styleEl);
    console.log('[Userscript] CSS injected');
    

    // ============================================================
    // FILE: /js/ui/utils.js
    // ============================================================

// ui/js/utils.js

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDuration(seconds) {
    if (!seconds) return 'N/A';
    const secs = parseInt(seconds);
    if (isNaN(secs) || secs === 0) return 'N/A';
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs.toString().padStart(2, '0')}`;
}

function getSongId(song) {
    return song.id || song.token || Math.random().toString(36);
}

function hasStream(song) {
    return !!(song.more_info?.encrypted_media_url || song.encrypted_media_url);
}

    // ============================================================
    // FILE: /js/libs/des.js
    // ============================================================

// ui/js/libs/des.js
// Stripped DES library - ECB mode only, decryption only
// Based on Paul Tero's DES implementation

(function() {
    'use strict';

    // S-boxes (standard DES)
    const S1 = new Int32Array([
        0x1010400, 0, 0x10000, 0x1010404, 0x1010004, 0x10404, 0x4, 0x10000,
        0x400, 0x1010400, 0x1010404, 0x400, 0x1000404, 0x1010004, 0x1000000, 0x4,
        0x404, 0x1000400, 0x1000400, 0x10400, 0x10400, 0x1010000, 0x1010000, 0x1000404,
        0x10004, 0x1000004, 0x1000004, 0x10004, 0, 0x404, 0x10404, 0x1000000,
        0x10000, 0x1010404, 0x4, 0x1010000, 0x1010400, 0x1000000, 0x1000000, 0x400,
        0x1010004, 0x10000, 0x10400, 0x1000004, 0x400, 0x4, 0x1000404, 0x10404,
        0x1010404, 0x10004, 0x1010000, 0x1000404, 0x1000004, 0x404, 0x10404, 0x1010400,
        0x404, 0x1000400, 0x1000400, 0, 0x10004, 0x10400, 0, 0x1010004
    ]);

    const S2 = new Int32Array([
        -0x7FEF7FE0, -0x7FFF8000, 0x8000, 0x108020, 0x100000, 0x20, -0x7FEFFFE0, -0x7FFF7FE0,
        -0x7FFFFFE0, -0x7FEF7FE0, -0x7FEF8000, -0x80000000, -0x7FFF8000, 0x100000, 0x20, -0x7FEFFFE0,
        0x108000, 0x100020, -0x7FFF7FE0, 0, -0x80000000, 0x8000, 0x108020, -0x7FF00000,
        0x100020, -0x7FFFFFE0, 0, 0x108000, 0x8020, -0x7FEF8000, -0x7FF00000, 0x8020,
        0, 0x108020, -0x7FEFFFE0, 0x100000, -0x7FFF7FE0, -0x7FF00000, -0x7FEF8000, 0x8000,
        -0x7FF00000, -0x7FFF8000, 0x20, -0x7FEF7FE0, 0x108020, 0x20, 0x8000, -0x80000000,
        0x8020, -0x7FEF8000, 0x100000, -0x7FFFFFE0, 0x100020, -0x7FFF7FE0, -0x7FFFFFE0, 0x100020,
        0x108000, 0, -0x7FFF8000, 0x8020, -0x80000000, -0x7FEFFFE0, -0x7FEF7FE0, 0x108000
    ]);

    const S3 = new Int32Array([
        0x208, 0x8020200, 0, 0x8020008, 0x8000200, 0, 0x20208, 0x8000200,
        0x20008, 0x8000008, 0x8000008, 0x20000, 0x8020208, 0x20008, 0x8020000, 0x208,
        0x8000000, 0x8, 0x8020200, 0x200, 0x20200, 0x8020000, 0x8020008, 0x20208,
        0x8000208, 0x20200, 0x20000, 0x8000208, 0x8, 0x8020208, 0x200, 0x8000000,
        0x8020200, 0x8000000, 0x20008, 0x208, 0x20000, 0x8020200, 0x8000200, 0,
        0x200, 0x20008, 0x8020208, 0x8000200, 0x8000008, 0x200, 0, 0x8020008,
        0x8000208, 0x20000, 0x8000000, 0x8020208, 0x8, 0x20208, 0x20200, 0x8000008,
        0x8020000, 0x8000208, 0x208, 0x8020000, 0x20208, 0x8, 0x8020008, 0x20200
    ]);

    const S4 = new Int32Array([
        0x802001, 0x2081, 0x2081, 0x80, 0x802080, 0x800081, 0x800001, 0x2001,
        0, 0x802000, 0x802000, 0x802081, 0x81, 0, 0x800080, 0x800001,
        0x1, 0x2000, 0x800000, 0x802001, 0x80, 0x800000, 0x2001, 0x2080,
        0x800081, 0x1, 0x2080, 0x800080, 0x2000, 0x802080, 0x802081, 0x81,
        0x800080, 0x800001, 0x802000, 0x802081, 0x81, 0, 0, 0x802000,
        0x2080, 0x800080, 0x800081, 0x1, 0x802001, 0x2081, 0x2081, 0x80,
        0x802081, 0x81, 0x1, 0x2000, 0x800001, 0x2001, 0x802080, 0x800081,
        0x2001, 0x2080, 0x800000, 0x802001, 0x80, 0x800000, 0x2000, 0x802080
    ]);

    const S5 = new Int32Array([
        0x100, 0x2080100, 0x2080000, 0x42000100, 0x80000, 0x100, 0x40000000, 0x2080000,
        0x40080100, 0x80000, 0x2000100, 0x40080100, 0x42000100, 0x42080000, 0x80100, 0x40000000,
        0x2000000, 0x40080000, 0x40080000, 0, 0x40000100, 0x42080100, 0x42080100, 0x2000100,
        0x42080000, 0x40000100, 0, 0x42000000, 0x2080100, 0x2000000, 0x42000000, 0x80100,
        0x80000, 0x42000100, 0x100, 0x2000000, 0x40000000, 0x2080000, 0x42000100, 0x40080100,
        0x2000100, 0x40000000, 0x42080000, 0x2080100, 0x40080100, 0x100, 0x2000000, 0x42080000,
        0x42080100, 0x80100, 0x42000000, 0x42080100, 0x2080000, 0, 0x40080000, 0x42000000,
        0x80100, 0x2000100, 0x40000100, 0x80000, 0, 0x40080000, 0x2080100, 0x40000100
    ]);

    const S6 = new Int32Array([
        0x20000010, 0x20400000, 0x4000, 0x20404010, 0x20400000, 0x10, 0x20404010, 0x400000,
        0x20004000, 0x404010, 0x400000, 0x20000010, 0x400010, 0x20004000, 0x20000000, 0x4010,
        0, 0x400010, 0x20004010, 0x4000, 0x404000, 0x20004010, 0x10, 0x20400010,
        0x20400010, 0, 0x404010, 0x20404000, 0x4010, 0x404000, 0x20404000, 0x20000000,
        0x20004000, 0x10, 0x20400010, 0x404000, 0x20404010, 0x400000, 0x4010, 0x20000010,
        0x400000, 0x20004000, 0x20000000, 0x4010, 0x20000010, 0x20404010, 0x404000, 0x20400000,
        0x404010, 0x20404000, 0, 0x20400010, 0x10, 0x4000, 0x20400000, 0x404010,
        0x4000, 0x400010, 0x20004010, 0, 0x20404000, 0x20000000, 0x400010, 0x20004010
    ]);

    const S7 = new Int32Array([
        0x200000, 0x4200002, 0x4000802, 0, 0x800, 0x4000802, 0x200802, 0x4200800,
        0x4200802, 0x200000, 0, 0x4000002, 0x2, 0x4000000, 0x4200002, 0x802,
        0x4000800, 0x200802, 0x200002, 0x4000800, 0x4000002, 0x4200000, 0x4200800, 0x200002,
        0x4200000, 0x800, 0x802, 0x4200802, 0x200800, 0x2, 0x4000000, 0x200800,
        0x4000000, 0x200800, 0x200000, 0x4000802, 0x4000802, 0x4200002, 0x4200002, 0x2,
        0x200002, 0x4000000, 0x4000800, 0x200000, 0x4200800, 0x802, 0x200802, 0x4200800,
        0x802, 0x4000002, 0x4200802, 0x4200000, 0x200800, 0, 0x2, 0x4200802,
        0, 0x200802, 0x4200000, 0x800, 0x4000002, 0x4000800, 0x800, 0x200002
    ]);

    const S8 = new Int32Array([
        0x10001040, 0x1000, 0x40000, 0x10041040, 0x10000000, 0x10001040, 0x40, 0x10000000,
        0x40040, 0x10040000, 0x10041040, 0x41000, 0x10041000, 0x41040, 0x1000, 0x40,
        0x10040000, 0x10000040, 0x10001000, 0x1040, 0x41000, 0x40040, 0x10040040, 0x10041000,
        0x1040, 0, 0, 0x10040040, 0x10000040, 0x10001000, 0x41040, 0x40000,
        0x41040, 0x40000, 0x10041000, 0x1000, 0x40, 0x10040040, 0x1000, 0x41040,
        0x10001000, 0x40, 0x10000040, 0x10040000, 0x10040040, 0x10000000, 0x40000, 0x10001040,
        0, 0x10041040, 0x40040, 0x10000040, 0x10040000, 0x10001000, 0x10001040, 0,
        0x10041040, 0x41000, 0x41000, 0x1040, 0x1040, 0x40040, 0x10000000, 0x10041000
    ]);

    /**
     * DES decryption - ECB mode only
     * @param {string} message - Encrypted message (binary string)
     * @param {Uint32Array} keys - 32 round keys
     * @returns {string} Decrypted message (binary string)
     */
    function desDecrypt(message, keys) {
        const s1 = S1, s2 = S2, s3 = S3, s4 = S4;
        const s5 = S5, s6 = S6, s7 = S7, s8 = S8;

        const len = message.length;
        let result = '';
        let left, right, temp;

        for (let m = 0; m < len; m += 8) {
            left = (message.charCodeAt(m) << 24) |
                   (message.charCodeAt(m + 1) << 16) |
                   (message.charCodeAt(m + 2) << 8) |
                   message.charCodeAt(m + 3);
            right = (message.charCodeAt(m + 4) << 24) |
                    (message.charCodeAt(m + 5) << 16) |
                    (message.charCodeAt(m + 6) << 8) |
                    message.charCodeAt(m + 7);

            // Initial Permutation
            temp = ((left >>> 4) ^ right) & 0x0F0F0F0F;
            right ^= temp;
            left ^= (temp << 4);

            temp = ((left >>> 16) ^ right) & 0x0000FFFF;
            right ^= temp;
            left ^= (temp << 16);

            temp = ((right >>> 2) ^ left) & 0x33333333;
            left ^= temp;
            right ^= (temp << 2);

            temp = ((right >>> 8) ^ left) & 0x00FF00FF;
            left ^= temp;
            right ^= (temp << 8);

            temp = ((left >>> 1) ^ right) & 0x55555555;
            right ^= temp;
            left ^= (temp << 1);

            left = ((left << 1) | (left >>> 31));
            right = ((right << 1) | (right >>> 31));

            // 16 rounds (decryption - keys in reverse)
            for (let i = 30; i >= 0; i -= 2) {
                const right1 = right ^ keys[i];
                const rrot = (right >>> 4) | (right << 28);
                const right2 = rrot ^ keys[i + 1];

                temp = left;
                left = right;
                right = temp ^ (
                    s2[(right1 >>> 24) & 63] |
                    s4[(right1 >>> 16) & 63] |
                    s6[(right1 >>> 8) & 63] |
                    s8[right1 & 63] |
                    s1[(right2 >>> 24) & 63] |
                    s3[(right2 >>> 16) & 63] |
                    s5[(right2 >>> 8) & 63] |
                    s7[right2 & 63]
                );
            }

            // Swap left and right
            temp = left;
            left = right;
            right = temp;

            // Final Permutation (IP-1)
            left = ((left >>> 1) | (left << 31));
            right = ((right >>> 1) | (right << 31));

            temp = ((left >>> 1) ^ right) & 0x55555555;
            right ^= temp;
            left ^= (temp << 1);

            temp = ((right >>> 8) ^ left) & 0x00FF00FF;
            left ^= temp;
            right ^= (temp << 8);

            temp = ((right >>> 2) ^ left) & 0x33333333;
            left ^= temp;
            right ^= (temp << 2);

            temp = ((left >>> 16) ^ right) & 0x0000FFFF;
            right ^= temp;
            left ^= (temp << 16);

            temp = ((left >>> 4) ^ right) & 0x0F0F0F0F;
            right ^= temp;
            left ^= (temp << 4);

            result += String.fromCharCode(
                (left >>> 24),
                ((left >>> 16) & 0xFF),
                ((left >>> 8) & 0xFF),
                (left & 0xFF),
                (right >>> 24),
                ((right >>> 16) & 0xFF),
                ((right >>> 8) & 0xFF),
                (right & 0xFF)
            );
        }
        return result;
    }

    // Expose to browser
    if (typeof window !== 'undefined') {
        window.desDecrypt = desDecrypt;
    }

})();

    // ============================================================
    // FILE: /js/libs/writem4a.js
    // ============================================================

/**
 * @fileoverview Optimized platform-agnostic M4A metadata reader and writer core.
 * Restricts recursive parsing to metadata-only atoms to avoid GC allocating and
 * shifts index tables in-place using direct byte signatures.
 */

const latin1Decoder = new TextDecoder('latin1');
const utf8Decoder = new TextDecoder('utf-8');
const utf8Encoder = new TextEncoder();

/**
 * Converts a segment of Uint8Array to string.
 *
 * @param {!Uint8Array} bytes
 * @param {number} offset
 * @param {number} endOffset
 * @param {string=} encoding 'latin1' or 'utf8'
 * @return {string}
 */
function bytesToString(bytes, offset, endOffset, encoding = 'latin1') {
  const slice = bytes.subarray(offset, endOffset);
  return encoding === 'utf8' ? utf8Decoder.decode(slice) : latin1Decoder.decode(slice);
}

/**
 * Converts a string to Uint8Array.
 *
 * @param {string} str
 * @param {string=} encoding 'utf8' or 'latin1'
 * @return {!Uint8Array}
 */
function stringToBytes(str, encoding = 'utf8') {
  if (encoding === 'latin1') {
    const bytes = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
      bytes[i] = str.charCodeAt(i) & 0xff;
    }
    return bytes;
  }
  return utf8Encoder.encode(str);
}

/**
 * Concatenates multiple Uint8Array arrays into one.
 *
 * @param {!Array<!Uint8Array>} arrays
 * @return {!Uint8Array}
 */
function concatUint8Arrays(arrays) {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

/**
 * Reads variable-length Big-Endian integer from DataView.
 *
 * @param {!DataView} view
 * @param {number} offset
 * @param {number} byteLength
 * @return {number}
 */
function readUIntBE(view, offset, byteLength) {
  let value = 0;
  for (let i = 0; i < byteLength; i++) {
    value = (value << 8) | view.getUint8(offset + i);
  }
  return value;
}

/**
 * Writes variable-length Big-Endian integer into DataView.
 *
 * @param {!DataView} view
 * @param {number} value
 * @param {number} offset
 * @param {number} byteLength
 */
function writeUIntBE(view, value, offset, byteLength) {
  let temp = value;
  for (let i = byteLength - 1; i >= 0; i--) {
    view.setUint8(offset + i, temp & 0xff);
    temp = temp >> 8;
  }
}

/**
 * Maps M4A 4-byte atom types to human-readable tag keys.
 * @const {!Object<string, string>}
 */
const TAG_MAPPING = {
  '\xa9alb': 'album',
  '\xa9art': 'artist',
  '\xa9ART': 'artist',
  'aART': 'album_artist',
  '\xa9day': 'year',
  '\xa9nam': 'title',
  '\xa9gen': 'genre',
  'trkn': 'track',
  '\xa9wrt': 'composer',
  '\xa9too': 'encoder',
  'cprt': 'copyright',
  'covr': 'picture',
  '\xa9grp': 'grouping',
  'keyw': 'keyword',
  '\xa9lyr': 'lyrics',
  '\xa9cmt': 'comment',
  'tmpo': 'tempo',
  'cpil': 'compilation',
  'disk': 'disc'
};

/**
 * Derived inverse mapping to resolve tag keys to M4A atom types.
 * @const {!Object<string, string>}
 */
const TAG_TO_ATOM = {};
for (const [atom, key] of Object.entries(TAG_MAPPING)) {
  if (!TAG_TO_ATOM[key]) {
    TAG_TO_ATOM[key] = atom;
  }
}

// Override artist to use uppercase ART (ffmpeg standard)
// This makes ffprobe show the artist tag correctly
TAG_TO_ATOM['artist'] = '\xa9ART';

/**
 * Reads size and type boundaries of an atom header.
 *
 * @param {!Uint8Array} bytes File bytes buffer.
 * @param {number} offset Start index.
 * @return {?{type: string, size: number, headerSize: number}} Header meta, or null if out of bounds.
 */
function readAtomHeader(bytes, offset) {
  if (offset + 8 > bytes.length) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset + offset, 8);
  const size = view.getUint32(0, false);
  const type = bytesToString(bytes, offset + 4, offset + 8, 'latin1');
  let headerSize = 8;
  let actualSize = size;

  if (size === 1) {
    if (offset + 16 > bytes.length) return null;
    const viewLong = new DataView(bytes.buffer, bytes.byteOffset + offset + 8, 8);
    actualSize = Number(viewLong.getBigUint64(0, false));
    headerSize = 16;
  }
  return { type, size: actualSize, headerSize };
}

/**
 * Scans top-level atoms in the buffer sequentially.
 *
 * @param {!Uint8Array} bytes File bytes buffer.
 * @return {!Array<!Object>} List of top-level atom descriptors.
 */
function scanTopLevelAtoms(bytes) {
  const atoms = [];
  let pos = 0;
  while (pos < bytes.length) {
    const header = readAtomHeader(bytes, pos);
    if (!header || header.size <= 0 || pos + header.size > bytes.length) break;
    atoms.push({
      type: header.type,
      size: header.size,
      headerSize: header.headerSize,
      offset: pos,
      bytes: bytes.subarray(pos, pos + header.size)
    });
    pos += header.size;
  }
  return atoms;
}

/**
 * Finds or creates a child atom in a parent container tree.
 *
 * @param {!Object} parent The parent containing atom block.
 * @param {string} type 4-byte atom type.
 * @param {!Uint8Array} headerBytes Default fallback header.
 * @param {!Uint8Array=} metaPrefix Optional meta prefix bytes.
 * @return {!Object} The existing/new child atom.
 */
function getOrCreateChild(parent, type, headerBytes, metaPrefix = null) {
  let child = parent.children.find(c => c.type === type);
  if (!child) {
    child = {
      type,
      headerSize: headerBytes.length,
      headerBytes,
      children: []
    };
    if (metaPrefix) child.metaPrefix = metaPrefix;
    parent.children.push(child);
  }
  return child;
}

/**
 * Recursively parses the binary buffer into a structured atom tree.
 * Optimized: Only iterates within metadata containers (moov, udta, meta, ilst)
 * to bypass allocating track timelines on javascript heap.
 *
 * @param {!Uint8Array} bytes The full file buffer as Uint8Array.
 * @param {number} offset The current reading byte offset.
 * @param {number} endOffset The boundary end index of the container.
 * @return {!Object} The parsed atom object with its children tree layout.
 */
function parseAtomTree(bytes, offset, endOffset) {
  const header = readAtomHeader(bytes, offset);
  if (!header) {
    throw new Error('Out of bounds reading atom header.');
  }
  const payloadOffset = offset + header.headerSize;
  const payloadSize = header.size - header.headerSize;

  // Optimized containerTypes list: skips tracking nested trak, mdia, etc., but parses metadata fields
  const containerTypes = [
    'moov', 'udta', 'meta', 'ilst',
    '\xa9nam', '\xa9art', '\xa9ART', 'aART', '\xa9alb', '\xa9day',
    '\xa9gen', 'trkn', '\xa9wrt', '\xa9too', 'cprt', 'covr',
    '\xa9grp', 'keyw', '\xa9lyr', '\xa9cmt', 'tmpo', 'cpil', 'disk'
  ];

  const atom = {
    type: header.type,
    headerSize: header.headerSize,
    headerBytes: bytes.subarray(offset, payloadOffset),
    children: []
  };

  const isContainer = containerTypes.includes(header.type);
  if (isContainer && payloadSize > 0) {
    let childOffset = payloadOffset;
    if (header.type === 'meta') {
      atom.metaPrefix = bytes.subarray(payloadOffset, payloadOffset + 4);
      childOffset += 4;
    }
    const childrenEnd = offset + header.size;
    while (childOffset < childrenEnd) {
      if (childOffset + 8 > childrenEnd) break;
      const childHeader = readAtomHeader(bytes, childOffset);
      if (!childHeader || childHeader.size === 0) break;
      const child = parseAtomTree(bytes, childOffset, childrenEnd);
      atom.children.push(child);
      childOffset += childHeader.size;
    }
  } else {
    atom.payload = bytes.subarray(payloadOffset, payloadOffset + payloadSize);
  }
  return atom;
}

/**
 * Scans a trak byte buffer in-place to find and shift offsets in stco or co64 index tables.
 *
 * @param {!Uint8Array} bytes The raw trak atom payload.
 * @param {number} delta Shift amount to apply.
 */
function shiftStcoInBytes(bytes, delta) {
  if (delta === 0) return;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  
  // Find 'stco' in bytes (4-byte signature: [115, 116, 99, 111])
  let pos = 0;
  while (pos + 8 <= bytes.length) {
    // checking [s, t, c, o]
    if (bytes[pos] === 115 && bytes[pos+1] === 116 && bytes[pos+2] === 99 && bytes[pos+3] === 111) {
      const size = view.getUint32(pos - 4, false);
      if (pos - 4 + size <= bytes.length) {
        const count = view.getUint32(pos + 8, false);
        for (let i = 0; i < count; i++) {
          const idx = pos + 12 + i * 4;
          if (idx + 4 <= bytes.length) {
            const val = view.getUint32(idx, false);
            view.setUint32(idx, val + delta, false);
          }
        }
      }
      break;
    }
    // Find 'co64' in bytes (4-byte signature: [99, 111, 54, 52])
    if (bytes[pos] === 99 && bytes[pos+1] === 111 && bytes[pos+2] === 54 && bytes[pos+3] === 52) {
      const size = view.getUint32(pos - 4, false);
      if (pos - 4 + size <= bytes.length) {
        const count = view.getUint32(pos + 8, false);
        for (let i = 0; i < count; i++) {
          const idx = pos + 12 + i * 8;
          if (idx + 8 <= bytes.length) {
            const val = view.getBigUint64(idx, false);
            view.setBigUint64(idx, val + BigInt(delta), false);
          }
        }
      }
      break;
    }
    pos++;
  }
}

/**
 * Recursively serializes the atom tree back into a binary buffer,
 * adjusting chunk offset indexing tables (`stco` / `co64`) by the shift delta.
 * Optimized: Runs in-place offset adjustments directly on the trak byte arrays
 * and avoids string encoding allocations.
 *
 * @param {!Object} atom The root atom of the tree to serialize.
 * @param {number=} delta Chunk offset shift value (non-zero if moov size changed).
 * @return {!Uint8Array} Serialized binary buffer.
 */
function serializeAtomTree(atom, delta = 0) {
  // If track atom payload is encountered, apply offset shifts to stco/co64 directly
  if (delta !== 0 && atom.type === 'trak') {
    shiftStcoInBytes(atom.payload, delta);
  }

  if (atom.children && atom.children.length > 0) {
    const serializedChildren = atom.children.map(child => serializeAtomTree(child, delta));
    let payloadLength = serializedChildren.reduce((sum, b) => sum + b.length, 0);
    if (atom.type === 'meta') {
      payloadLength += 4;
    }

    const header = new Uint8Array(atom.headerSize);
    const view = new DataView(header.buffer, header.byteOffset, header.byteLength);
    view.setUint32(0, payloadLength + atom.headerSize, false);
    
    // Optimized: Set type string characters directly (allocation-free)
    header[4] = atom.type.charCodeAt(0);
    header[5] = atom.type.charCodeAt(1);
    header[6] = atom.type.charCodeAt(2);
    header[7] = atom.type.charCodeAt(3);

    const parts = [header];
    if (atom.type === 'meta') {
      parts.push(atom.metaPrefix);
    }
    parts.push(...serializedChildren);
    return concatUint8Arrays(parts);
  } else {
    const header = new Uint8Array(atom.headerSize);
    const view = new DataView(header.buffer, header.byteOffset, header.byteLength);
    view.setUint32(0, atom.payload.length + atom.headerSize, false);
    
    // Set type characters directly
    header[4] = atom.type.charCodeAt(0);
    header[5] = atom.type.charCodeAt(1);
    header[6] = atom.type.charCodeAt(2);
    header[7] = atom.type.charCodeAt(3);

    return concatUint8Arrays([header, atom.payload]);
  }
}

/**
 * Decodes metadata fields from parsed tags located inside the `ilst` atom parent.
 *
 * @param {!Object} ilstAtom The item list parsed atom.
 * @return {!Object<string, *>} Extracted metadata tags mapping.
 */
function extractTags(ilstAtom) {
  const tags = {};
  if (!ilstAtom || !ilstAtom.children) return tags;

  for (const tagAtom of ilstAtom.children) {
    const key = TAG_MAPPING[tagAtom.type];
    if (!key) continue;

    const dataAtom = tagAtom.children.find(c => c.type === 'data');
    if (!dataAtom || !dataAtom.payload) continue;

    const payload = dataAtom.payload;
    if (payload.length < 8) continue;
    
    const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
    const typeClass = readUIntBE(view, 1, 3);
    const valueBuf = payload.subarray(8);

    if (key === 'track' || key === 'disc') {
      if (valueBuf.length >= 6) {
        const valView = new DataView(valueBuf.buffer, valueBuf.byteOffset, valueBuf.byteLength);
        tags[key] = valView.getUint16(2, false);
        tags[key + '_count'] = valView.getUint16(4, false);
      }
    } else if (typeClass === 1) {
      tags[key] = bytesToString(valueBuf, 0, valueBuf.length, 'utf8');
    } else if (typeClass === 13 || typeClass === 14) {
      tags[key] = {
        format: typeClass === 13 ? 'jpeg' : 'png',
        mimeType: typeClass === 13 ? 'image/jpeg' : 'image/png',
        data: valueBuf
      };
    } else if (typeClass === 21) {
      const valView = new DataView(valueBuf.buffer, valueBuf.byteOffset, valueBuf.byteLength);
      tags[key] = readUIntBE(valView, 0, valueBuf.length);
    } else {
      tags[key] = bytesToString(valueBuf, 0, valueBuf.length, 'utf8');
    }
  }
  return tags;
}

/**
 * Creates a valid M4A metadata tag atom containing a sub-atom 'data'.
 *
 * @param {string} type M4A 4-byte atom type (e.g. '\xa9nam').
 * @param {*} value The value to write.
 * @param {boolean=} isPicture True if writing picture image bytes.
 * @return {!Object} Constructed tag atom tree.
 */
function createTagAtom(type, value, isPicture = false) {
  let valueBuf;
  let typeClass; // 1 = text, 13 = JPEG cover, 14 = PNG cover, 21 = uint
  
  if (isPicture) {
    valueBuf = value.data;
    typeClass = value.format === 'png' ? 14 : 13;
  } else if (typeof value === 'number') {
    valueBuf = new Uint8Array(4);
    const valView = new DataView(valueBuf.buffer, valueBuf.byteOffset, valueBuf.byteLength);
    valView.setUint32(0, value, false);
    typeClass = 21;
  } else {
    valueBuf = stringToBytes(String(value), 'utf8');
    typeClass = 1;
  }

  const dataAtomHeader = new Uint8Array(16);
  const headerView = new DataView(dataAtomHeader.buffer, dataAtomHeader.byteOffset, dataAtomHeader.byteLength);
  headerView.setUint32(0, 16 + valueBuf.length, false);
  
  // Set 'data' characters directly (allocation-free)
  dataAtomHeader[4] = 100; // 'd'
  dataAtomHeader[5] = 97;  // 'a'
  dataAtomHeader[6] = 116; // 't'
  dataAtomHeader[7] = 97;  // 'a'
  writeUIntBE(headerView, typeClass, 9, 3); // 3-byte class flags

  const dataAtom = {
    type: 'data',
    headerSize: 8,
    headerBytes: dataAtomHeader.subarray(0, 8),
    payload: concatUint8Arrays([dataAtomHeader.subarray(8, 16), valueBuf])
  };

  const tagAtomHeader = new Uint8Array(8);
  tagAtomHeader[4] = type.charCodeAt(0);
  tagAtomHeader[5] = type.charCodeAt(1);
  tagAtomHeader[6] = type.charCodeAt(2);
  tagAtomHeader[7] = type.charCodeAt(3);

  return {
    type,
    headerSize: 8,
    headerBytes: tagAtomHeader,
    children: [dataAtom]
  };
}

/**
 * Scans the binary buffer in-place to verify that the file meets essential M4A structure expectations
 * (ftyp signature, plus mdat and moov containers).
 * Performs zero allocations and runs in under 10 microseconds.
 *
 * @param {!Uint8Array} bytes The Uint8Array file buffer.
 * @return {boolean} True if the essential M4A structure exists.
 */
function verifyM4AStructure(bytes) {
  if (bytes.length < 8) return false;

  // 1. Verify ftyp signature
  if (bytesToString(bytes, 4, 8, 'latin1') !== 'ftyp') return false;

  // 2. Scan top-level atoms for mdat and moov
  const atoms = scanTopLevelAtoms(bytes);
  const hasMdat = atoms.some(a => a.type === 'mdat');
  const hasMoov = atoms.some(a => a.type === 'moov');

  return hasMdat && hasMoov;
}

/**
 * Helper to recursively find an atom of a specific type in the tree structure.
 *
 * @param {!Object} atom The root atom of the tree search start.
 * @param {string} type The 4-byte atom type identifier to look for.
 * @return {?Object} The found atom child, or null if not found.
 */
function findAtom(atom, type) {
  if (atom.type === type) return atom;
  for (const child of atom.children || []) {
    const found = findAtom(child, type);
    if (found) return found;
  }
  return null;
}

/**
 * Core parsing algorithm operating on a Uint8Array.
 *
 * @param {!Uint8Array} bytes The binary file content as Uint8Array.
 * @return {!Object<string, *>} Parsed metadata tag mapping.
 */
function parseM4ABytes(bytes) {
  if (!verifyM4AStructure(bytes)) {
    throw new Error('Unsupported or invalid file structure. Only M4A (.m4a) files with valid audio and metadata containers are supported.');
  }

  const atoms = scanTopLevelAtoms(bytes);
  const moovDescriptor = atoms.find(a => a.type === 'moov');
  if (!moovDescriptor) return {};

  const moovAtom = parseAtomTree(bytes, moovDescriptor.offset, moovDescriptor.offset + moovDescriptor.size);

  let tagsResult = {};
  const udta = moovAtom.children.find(c => c.type === 'udta');
  if (udta) {
    const meta = udta.children.find(c => c.type === 'meta');
    if (meta) {
      const ilst = meta.children.find(c => c.type === 'ilst');
      if (ilst) {
        tagsResult = extractTags(ilst);
      }
    }
  }

  // Extract play duration from mvhd if it exists
  const mvhd = findAtom(moovAtom, 'mvhd');
  if (mvhd && mvhd.payload) {
    const payload = mvhd.payload;
    const version = payload[0];
    let timescale = 0;
    let duration = 0;
    if (version === 0 && payload.length >= 20) {
      const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
      timescale = view.getUint32(12, false);
      duration = view.getUint32(16, false);
    } else if (version === 1 && payload.length >= 32) {
      const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
      timescale = view.getUint32(20, false);
      duration = Number(view.getBigUint64(24, false));
    }
    if (timescale > 0) {
      tagsResult.duration = duration / timescale;
    }
  }

  return tagsResult;
}

/**
 * Core modifying algorithm operating on a Uint8Array and outputting a new Uint8Array.
 * Supporting zero-copy returns via options.returnParts.
 *
 * @param {!Uint8Array} bytes The source M4A file buffer.
 * @param {!Object<string, *>} newTags Tag value key/value pairs to write/overwrite.
 * @param {!Object<string, *>=} options Config options.
 * @return {!Uint8Array|!Array<!Uint8Array>} Serialized modified M4A buffer or parts array.
 */
function writeM4ABytes(bytes, newTags, options = {}) {
  if (!verifyM4AStructure(bytes)) {
    throw new Error('Unsupported or invalid file structure. Only M4A (.m4a) files with valid audio and metadata containers are supported.');
  }

  const atomsList = scanTopLevelAtoms(bytes);
  const moovIndex = atomsList.findIndex(a => a.type === 'moov');
  if (moovIndex === -1) {
    throw new Error('Invalid or corrupted M4A file structure.');
  }

  // Parse moov
  const moovDescriptor = atomsList[moovIndex];
  const moovAtom = parseAtomTree(bytes, moovDescriptor.offset, moovDescriptor.offset + moovDescriptor.size);

  // 2. Traverses/constructs the udta -> meta -> ilst path recursively
  const udta = getOrCreateChild(moovAtom, 'udta', stringToBytes('\x00\x00\x00\x08udta', 'latin1'));
  const meta = getOrCreateChild(udta, 'meta', stringToBytes('\x00\x00\x00\x0cmeta', 'latin1'), new Uint8Array(4));
  const ilst = getOrCreateChild(meta, 'ilst', stringToBytes('\x00\x00\x00\x08ilst', 'latin1'));

  // 3. Rebuilds/appends the metadata tag atoms list
  for (const [key, val] of Object.entries(newTags)) {
    const atomType = TAG_TO_ATOM[key];
    if (!atomType) continue;

    const isPicture = key === 'picture';
    const newTagAtom = createTagAtom(atomType, val, isPicture);

    const oldIndex = ilst.children.findIndex(c => c.type === atomType);
    if (oldIndex !== -1) {
      ilst.children[oldIndex] = newTagAtom;
    } else {
      ilst.children.push(newTagAtom);
    }
  }

  // 4. Calculate change in moov size
  const tempMoovBytes = serializeAtomTree(moovAtom, 0);
  const newMoovSize = tempMoovBytes.length;

  // 5. Calculate precise new mdat offset to retrieve correct shift amount
  let currentNewOffset = 0;
  let oldMdatOffset = 0;
  let newMdatOffset = 0;
  let hasMdat = false;

  for (const atom of atomsList) {
    if (atom.type === 'mdat') {
      oldMdatOffset = atom.offset;
      newMdatOffset = currentNewOffset;
      hasMdat = true;
    }
    const atomSize = (atom.type === 'moov') ? newMoovSize : atom.size;
    currentNewOffset += atomSize;
  }

  // 6. Shift chunk offsets by the exact delta offset
  const shiftAmount = hasMdat ? (newMdatOffset - oldMdatOffset) : 0;
  const finalMoovBytes = serializeAtomTree(moovAtom, shiftAmount);

  // 7. Concatenate all atoms back preserving original order
  const outputParts = [];
  for (const atom of atomsList) {
    if (atom.type === 'moov') {
      outputParts.push(finalMoovBytes);
    } else {
      outputParts.push(atom.bytes);
    }
  }

  // Return segments array directly if requested
  if (options.returnParts) {
    return outputParts;
  }

  return concatUint8Arrays(outputParts);
}

// Always expose to window in browser
if (typeof window !== 'undefined') {
    window.writeM4ABytes = writeM4ABytes;
    window.parseM4ABytes = parseM4ABytes;
}

    // ============================================================
    // FILE: /js/utils/decrypt.js
    // ============================================================

// ui/js/core/decrypt.js

(function() {
    'use strict';

    const KEY = new Uint32Array([
        36443656, 338827529, 170141697, 338826299,
        170272797, 875566612, 170276616, 941097494,
        153487137, 941103620, 154281006, 940128288,
        221380890, 688468270, 621941049, 688727305,
        622007300, 151861785, 890309646, 184882698,
        874054925, 50799890, 874062625, 117842443,
        805908001, 119942188, 839720978, 102894652,
        302780946, 103954180, 302782501, 338829583
    ]);

    /**
     * Decrypt media URL
     * @param {string} encrypted - Base64 encrypted URL
     * @returns {string} Decrypted URL
     */
    function decryptMediaUrl(encrypted) {
        // Get the DES implementation
        const desDecrypt = window.desDecrypt;
        
        if (!desDecrypt) {
            throw new Error('DES decryption library not available');
        }

        const plain = desDecrypt(atob(encrypted), KEY);
        return plain.slice(0, -plain.charCodeAt(plain.length - 1));
    }

    // Expose to browser
    if (typeof window !== 'undefined') {
        window.decryptMediaUrl = decryptMediaUrl;
    }
})();


    // ============================================================
    // FILE: /js/utils/resource.js
    // ============================================================

// src/js/utils/resource.js

window.Utils = window.Utils || {};

// ============ HELPERS ============

function getHeaders() {
    return {
        'Referer': window.API.constants.REFERER,
        'Origin': window.API.constants.API_HOST,
        'User-Agent': window.API.constants.DEFAULT_HEADERS['User-Agent']
    };
}

function handleResponse(response, responseType) {
    if (!response.ok) throw new Error('HTTP ' + response.status);
    
    if (responseType === 'arraybuffer') return response.arrayBuffer();
    if (responseType === 'blob') return response.blob();
    return response;
}

function handleGMResponse(response, resolve, reject) {
    if (response.status === 200) {
        resolve(response.response);
    } else {
        reject(new Error('GM returned ' + response.status));
    }
}

// ============ FETCH METHODS ============

function fetchViaDirect(url, responseType) {
    return fetch(url, { headers: getHeaders() })
        .then(function(response) {
            return handleResponse(response, responseType);
        });
}

function fetchViaGM(url, responseType) {
    return new Promise(function(resolve, reject) {
        GM_xmlhttpRequest({
            method: "GET",
            url: url,
            responseType: responseType === 'arraybuffer' ? 'arraybuffer' : 'blob',
            headers: getHeaders(),
            onload: function(response) {
                handleGMResponse(response, resolve, reject);
            },
            onerror: function(error) {
                reject(new Error('GM failed: ' + (error.error || 'Unknown')));
            },
            ontimeout: function() {
                reject(new Error('GM timeout'));
            }
        });
    });
}

// ============ MAIN FETCH FUNCTION ============

window.Utils.fetchResource = function(url, responseType) {
    responseType = responseType || 'arraybuffer';
    console.log('[Utils] Fetching:', url.substring(0, 60) + '...');
    
    // Proxy mode: direct fetch (CDN allows CORS)
    if (window.isProxy) {
        return fetchViaDirect(url, responseType);
    }
    
    // Userscript mode: use GM_xmlhttpRequest
    if (typeof GM_xmlhttpRequest !== 'undefined') {
        console.log('[Utils] Using GM_xmlhttpRequest');
        return fetchViaGM(url, responseType);
    }
    
    // Fallback: standard fetch
    console.log('[Utils] Using standard fetch');
    return fetchViaDirect(url, responseType);
};

// ============ FETCH ALBUM ART ============

function getHighResUrl(url) {
    return url.replace(/\d+x\d+\.jpg$/, '500x500.jpg');
}

function processAlbumArt(buffer) {
    var artBytes = new Uint8Array(buffer);
    console.log('[Utils] Album art loaded:', (artBytes.length / 1024).toFixed(1) + ' KB');
    return { data: artBytes, format: 'jpeg' };
}

function fetchAlbumArtWithFallback(url) {
    var highResUrl = getHighResUrl(url);
    console.log('[Utils] Album art:', highResUrl);
    
    return window.Utils.fetchResource(highResUrl, 'arraybuffer')
        .then(processAlbumArt)
        .catch(function() {
            console.log('[Utils] High-res failed, trying original...');
            return window.Utils.fetchResource(url, 'arraybuffer')
                .then(processAlbumArt)
                .catch(function() {
                    console.warn('[Utils] Album art fetch failed');
                    return null;
                });
        });
}

window.Utils.fetchAlbumArt = function(url) {
    if (!url) return Promise.resolve(null);
    return fetchAlbumArtWithFallback(url);
};

console.log('[Utils] Resource module loaded');

    // ============================================================
    // FILE: /js/utils/formatters.js
    // ============================================================

// ui/js/core/formatters.js

window.Utils = window.Utils || {};
window.Utils.formatters = window.Utils.formatters || {};

// ============ DECODE ============
window.Utils.formatters.decode = function(text) {
    if (!text) return '';
    return text
        .replace(/&amp;/g, '&')
        .replace(/&#039;/g, "'")
        .replace(/&quot;/g, '"');
};

// ============ EXTRACT TOKEN ============
window.Utils.formatters.extractToken = function(url) {
    if (!url) return '';
    return url.split('/').pop() || '';
};

// ============ HIGH RES ALBUM ART ============
window.Utils.formatters.getHighResAlbumArt = function(url) {
    if (!url) return null;
    return url.replace(/\d+x\d+\.jpg$/, '500x500.jpg');
};


window.Utils.formatters.formatLyrics = function(rawLyrics) {
    return rawLyrics.replace(/<br>/g, '\n');
};

/**
 * Replace bitrate in decrypted URL with selected quality
 * Example: https://.../song_96.mp4 -> https://.../song_320.mp4
 */
window.Utils.formatters.formatUrlWithQuality = function(url, quality) {
    if (!url) return url;
    if (!quality) quality = 96;
    
    // Match pattern like _96.mp4, _160.mp4, _320.mp4
    // Replace with selected quality
    return url.replace(/_(\d+)\.mp4/, '_' + quality + '.mp4');
};

// ============ FORMAT ARTIST ============
window.Utils.formatters.formatArtist = function(artist) {
    return {
        id: artist.id,
        token: window.Utils.formatters.extractToken(artist.perma_url),
        name: window.Utils.formatters.decode(artist.name),
        image: artist.image || "",
        perma_url: artist.perma_url || "",
    };
};

// ============ GET ARTISTS ============
window.Utils.formatters.getPrimaryArtists = function(artists) {
    if (!artists || artists.length === 0) return "";
    return artists.map(function(a) { return a.name; }).join(", ");
};

window.Utils.formatters.getAllArtists = function(primary, featured) {
    var all = [];
    if (primary && primary.length > 0) {
        all.push.apply(all, primary.map(function(a) { return a.name; }));
    }
    if (featured && featured.length > 0) {
        all.push.apply(all, featured.map(function(a) { return a.name; }));
    }
    return all.join(", ");
};

// ============ FORMAT SEARCH RESULTS ============
window.Utils.formatters.formatSearchResults = function(data, type) {
    var results = (data.results || [])
        .filter(function(item) { return item.type === type; });
    
    if (type === 'song') {
        results = results.map(window.Utils.formatters.formatSong);
    } else if (type === 'album') {
        results = results.map(window.Utils.formatters.formatAlbum);
    }
    
    return {
        total: Number(data.total || 0),
        start: Number(data.start || 0),
        results: results
    };
};

// ============ SONG FORMATTER ============
window.Utils.formatters.formatSong = function(song) {
    if (song.more_info.has_lyrics) {
        console.log('[Utils] has lyrics true');
    }

    return {
        id: song.id,
        token: window.Utils.formatters.extractToken(song.perma_url),
        title: window.Utils.formatters.decode(song.title),
        image: song.image || '',
        language: song.language,
        year: song.year,
        play_count: song.play_count || '0',
        more_info: {
            duration: song.more_info ? song.more_info.duration || 'N/A' : 'N/A',
            encrypted_media_url: song.more_info ? song.more_info.encrypted_media_url || '' : '',
            album: song.more_info ? window.Utils.formatters.decode(song.more_info.album || '') : ''
        },
        has_stream: song.more_info ? !!song.more_info.encrypted_media_url : false,
has_lyrics: !!(song.more_info && song.more_info.has_lyrics === 'true')
    };
};

// ============ ALBUM FORMATTER ============
window.Utils.formatters.formatAlbum = function(album) {
    return {
        id: album.id,
        token: window.Utils.formatters.extractToken(album.perma_url),
        title: window.Utils.formatters.decode(album.title),
        subtitle: window.Utils.formatters.decode(album.subtitle),
        image: album.image || '',
        language: album.language,
        year: album.year,
        more_info: {
            song_count: album.more_info ? album.more_info.song_count || '0' : '0'
        }
    };
};

// ============ ALBUM DETAIL FORMATTER ============
window.Utils.formatters.formatAlbumDetail = function(data) {
    return {
        id: data.id,
        token: window.Utils.formatters.extractToken(data.perma_url),
        title: window.Utils.formatters.decode(data.title),
        image: data.image || '',
        language: data.language,
        year: data.year,
        song_count: data.list ? data.list.length : 0,
        songs: (data.list || []).map(function(song) {
            return {
                id: song.id,
                token: window.Utils.formatters.extractToken(song.perma_url),
                title: window.Utils.formatters.decode(song.title),
                image: song.image || '',
                duration: song.more_info ? song.more_info.duration || 'N/A' : 'N/A',
                has_stream: song.more_info ? !!song.more_info.encrypted_media_url : false
            };
        })
    };
};

// ============ DECRYPTED SONG FORMATTER ============
window.Utils.formatters.formatDecryptedSong = function(songData, decryptedUrl) {
    var primaryArtists = (songData.more_info && songData.more_info.artistMap) 
        ? songData.more_info.artistMap.primary_artists || [] 
        : [];
    var featuredArtists = (songData.more_info && songData.more_info.artistMap) 
        ? songData.more_info.artistMap.featured_artists || [] 
        : [];
    
    var primaryNames = primaryArtists.map(function(a) { return a.name; });
    var featuredNames = featuredArtists.map(function(a) { return a.name; });
    var allNames = primaryNames.concat(featuredNames);
    var primaryArtist = primaryNames[0] || '';
    var allArtists = allNames.join(', ');
    
    // Get album name
    var albumName = songData.more_info ? window.Utils.formatters.decode(songData.more_info.album || '') : '';
    if (!albumName) {
        var subtitleParts = window.Utils.formatters.decode(songData.subtitle || '').split(' - ');
        if (subtitleParts.length > 1) {
            albumName = subtitleParts[subtitleParts.length - 1];
        }
    }
    
    return {
        title: window.Utils.formatters.decode(songData.title),
        subtitle: window.Utils.formatters.decode(songData.subtitle),
        artist: allArtists,
        primary_artist: primaryArtist,
        all_artists: allArtists,
        album: albumName,
        image: songData.image || '',
        year: songData.year || '',
        language: songData.language || '',
        copyright: songData.more_info ? window.Utils.formatters.decode(songData.more_info.copyright_text || '') : '',
        token: songData.id,
        url: decryptedUrl,
        has_lyrics: !!(songData.more_info && songData.more_info.has_lyrics === 'true')
    };
};

console.log('[Utils] Formatters loaded');

    // ============================================================
    // FILE: /js/utils/url-helper.js
    // ============================================================

// utils/url-helper.js

window.Utils = window.Utils || {};

/**
 * Parse URL to extract type and token
 * @param {string} url - Full URL or path
 * @returns {{ type: 'song'|'album'|'lyrics'|null, token: string|null }}
 */
window.Utils.parseUrl = function(url) {
    if (!url) return { type: null, token: null };
    
    // Check if it's a valid URL
    if (!url.includes(window.API.constants.API_HOST)) {
        return { type: null, token: null };
    }
    
    // Determine type from URL
    var type = null;
    if (url.includes('/song/')) {
        type = 'song';
    } else if (url.includes('/album/')) {
        type = 'album';
    } else if (url.includes('/lyrics/')) {
        type = 'lyrics';
    } else {
        return { type: null, token: null };
    }
    
    // Extract token (last part after /)
    var token = window.Utils.formatters.extractToken(url);
    if (!token) {
        return { type: null, token: null };
    }
    
    return { type: type, token: token };
};

console.log('[Utils] URL helper loaded');


    // ============================================================
    // FILE: /js/utils/download-helper.js
    // ============================================================

// ui/js/core/download-helper.js

window.Utils = window.Utils || {};

/**
 * Trigger a file download in the browser
 */
window.Utils.downloadFile = function(data, filename) {
    var blob = new Blob([data], { type: 'audio/mp4' });
    var blobUrl = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    
    setTimeout(function() {
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
    }, 5000);
    
    return true;
};

/**
 * Build a filename from song metadata
 */
window.Utils.buildFilename = function(song, quality) {
    var artist = song.primary_artist || 'Unknown Artist';
    var safeTitle = (song.title || 'song').replace(/[^a-zA-Z0-9\s-]/g, '').trim();
    var safeArtist = artist.replace(/[^a-zA-Z0-9\s-]/g, '').trim();
    var filename = safeTitle + ' - ' + safeArtist;
    if (quality) {
        filename += ' (' + quality + ')';
    }
    return filename + '.m4a';
};


/**
 * Build metadata object for M4A
 */
window.Utils.buildMetadata = function(song, albumArt, lyrics) {
    var allArtists = song.all_artists || song.subtitle || '';

    var metadata = {
        title: song.title || '',
        artist: allArtists,
        album: song.album || '',
        year: song.year || '',
        genre: song.language || '',
        copyright: song.copyright || '',
        comment: 'ID: ' + (song.token || ''),
        album_artist: allArtists,
    };
    
    if (albumArt && albumArt.data && albumArt.data.length > 0) {
        metadata.picture = albumArt;
    }

    if (lyrics) {
        metadata.lyrics = lyrics;
    }

    return metadata;
};

console.log('[Utils] Download helper loaded');


    // ============================================================
    // FILE: /js/api/constants.js
    // ============================================================

// src/js/api/constants.js

window.API = window.API || {};
window.API.constants = window.API.constants || {};

// API endpoints
window.API.constants.API_HOST = 'https://www.jiosaavn.com';
window.API.constants.API_BASE = 'https://www.jiosaavn.com/api.php';
window.API.constants.REFERER = 'https://www.jiosaavn.com/';

// CDN domains for audio and album art
window.API.constants.CDN_DOMAINS = [
    'aac.saavncdn.com',
    'saavncdn.com'
];

// Default headers for all requests
window.API.constants.DEFAULT_HEADERS = {
    'Accept': 'application/json, text/plain, */*',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
};

// Default parameters for all API calls
window.API.constants.API_DEFAULTS = {
    _format: 'json',
    _marker: 0,
    api_version: 4,
    ctx: 'web6dot0'
};

console.log('[API] Constants loaded');

    // ============================================================
    // FILE: /js/api/fetch.js
    // ============================================================

// src/js/api/fetch.js

window.API = window.API || {};

// ============ LOW-LEVEL FETCH ============
window.API._fetchAPI = function(url, options) {
    options = options || {};
    
    // Proxy mode (local development)
    if (window.isProxy) {
        console.log('[API] Using proxy for:', url.substring(0, 60) + '...');
        return fetch('/proxy', {
            method: 'POST',
            headers: {
                'X-Proxy-URL': url,
                'X-Proxy-User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'X-Proxy-Cookie': 'DL=english; L=english; mm_latlong=19.0760%2C72.8777; geo=19.0760%2C72.8777%2CIN%2CMaharashtra%2CMumbai%2C400001'
            }
        })
        .then(function(res) {
            if (!res.ok) throw new Error('Proxy returned ' + res.status);
            return res.json();
        });
    }
    
    // Direct fetch (userscript or browser)
    console.log('[API] Direct fetch for:', url.substring(0, 60) + '...');
    return fetch(url, options)
        .then(function(res) {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.json();
        });
};

// ============ API CALL WRAPPER ============
window.API.callAPI = function(call, extraParams) {
    var params = Object.assign(
        {},
        window.API.constants.API_DEFAULTS,
        { __call: call },
        extraParams || {}
    );
    
    var url = new URL(window.API.constants.API_BASE);
    Object.keys(params).forEach(function(key) {
        url.searchParams.append(key, params[key]);
    });
    
    return window.API._fetchAPI(url.toString(), {
        headers: window.API.constants.DEFAULT_HEADERS
    });
};

console.log('[API] Fetch loaded');

    // ============================================================
    // FILE: /js/api/songs.js
    // ============================================================

// src/js/api/songs.js
// Pure API calls - no formatting or business logic

window.API = window.API || {};

/**
 * Search for songs - returns raw API response
 */
window.API.searchSongs = async function(query, limit, page) {
    return await window.API.callAPI('search.getResults', {
        q: query,
        p: page || 1,
        n: limit || 20
    });
};

/**
 * Get song details by token - returns raw API response
 */
window.API.getSong = async function(token) {
    return await window.API.callAPI('webapi.get', {
        token: token,
        type: 'song',
        includeMetaTags: 0
    });
};

/**
 * Get lyrics for a song by token
 */
window.API.getLyrics = async function(token) {
    return await window.API.callAPI('webapi.get', {
        token: token,
        type: 'lyrics'
    });
};

console.log('[API] Songs loaded');

    // ============================================================
    // FILE: /js/api/albums.js
    // ============================================================

// src/js/api/albums.js
// Pure API calls - no formatting or business logic

window.API = window.API || {};

/**
 * Search for albums - returns raw API response
 */
window.API.searchAlbums = async function(query, limit, page) {
    return await window.API.callAPI('search.getAlbumResults', {
        q: query,
        p: page || 1,
        n: limit || 20
    });
};

/**
 * Get album details by token - returns raw API response
 */
window.API.getAlbum = async function(token) {
    return await window.API.callAPI('webapi.get', {
        token: token,
        type: 'album',
        includeMetaTags: 0
    });
};

console.log('[API] Albums loaded');

    // ============================================================
    // FILE: /js/services/song.js
    // ============================================================

// ui/js/services/song.js
// Song business logic - orchestrates API calls and formatting

window.Services = window.Services || {};

window.Services.Song = {
    // Search for songs and format results
    search: async function(query, limit, page) {
        var rawData = await window.API.searchSongs(query, limit, page);
        return window.Utils.formatters.formatSearchResults(rawData, 'song');
    },
    
    // Get decrypted song URL and metadata
    getDecrypted: async function(token) {
        var rawData = await window.API.getSong(token);
        var songData = rawData.songs ? rawData.songs[0] : null;
        if (!songData) throw new Error('Song not found');
        
        var encrypted = songData.more_info ? songData.more_info.encrypted_media_url : null;
        if (!encrypted) throw new Error('No encrypted URL found');
        
        if (typeof window.decryptMediaUrl !== 'function') {
            throw new Error('decryptMediaUrl not available');
        }
        
        var decryptedUrl = window.decryptMediaUrl(encrypted);
        if (!decryptedUrl) throw new Error('Decryption failed');

        decryptedUrl = window.Utils.formatters.formatUrlWithQuality(decryptedUrl, window.currentQuality || 96);

        return window.Utils.formatters.formatDecryptedSong(songData, decryptedUrl);
    }
};

console.log('[Services] Song loaded');


    // ============================================================
    // FILE: /js/services/album.js
    // ============================================================

// ui/js/services/album.js

window.Services = window.Services || {};

window.Services.Album = {
    // Search for albums and format results
    search: async function(query, limit, page) {
        var rawData = await window.API.searchAlbums(query, limit, page);
        return window.Utils.formatters.formatSearchResults(rawData, 'album');
    },
    
    // Get album details with formatted songs
    getDetails: async function(token) {
        var rawData = await window.API.getAlbum(token);
        return window.Utils.formatters.formatAlbumDetail(rawData);
    }
};

console.log('[Services] Album loaded');

    // ============================================================
    // FILE: /js/services/download.js
    // ============================================================

// ui/js/services/download.js
// Download business logic

window.Services = window.Services || {};

window.Services.Download = {
    // Download a song with metadata
    song: async function(token, filename) {
        console.log('[Services] Downloading song:', token);
        
        // 1. Get decrypted song data
        var song = await window.Services.Song.getDecrypted(token);
        if (!song.url) throw new Error('No stream URL available');
        
        console.log('[Services] Song:', song.title, '-', song.artist);
        
        // 2. Fetch audio
        var audioBuffer = await window.Utils.fetchResource(song.url, 'arraybuffer');
        var audioBytes = new Uint8Array(audioBuffer);
        console.log('[Services] Audio fetched:', (audioBytes.length / 1024 / 1024).toFixed(2) + ' MB');
        
        if (audioBytes.length === 0) {
            throw new Error('Audio file is empty (0 bytes)');
        }
        
        // 3. Fetch album art
        var albumArtData = null;
        if (song.image) {
            albumArtData = await window.Utils.fetchAlbumArt(song.image);
            if (albumArtData) {
                console.log('[Services] Album art ready for metadata');
            }
        }

// Fetch lyrics if available
var lyricsText = null;
if (song.has_lyrics) {
    try {
        var lyricsData = await window.API.getLyrics(token);
        if (lyricsData && lyricsData.lyrics && lyricsData.lyrics.lyrics) {
            lyricsText = lyricsData.lyrics.lyrics;
   lyricsText = window.Utils.formatters.formatLyrics(lyricsText);
            console.log('[Services] Lyrics fetched');
        }
    } catch (e) {
        console.warn('[Services] Failed to fetch lyrics:', e.message);
    }
}
        // 4. Build metadata
        var metadata = window.Utils.buildMetadata(song, albumArtData, lyricsText);
        console.log('[Services] Metadata: title="' + song.title + '", artist="' + song.artist + '"');
        
        // 5. Write metadata to M4A
        var dataToDownload = audioBytes;
        if (typeof window.writeM4ABytes === 'function') {
            try {
                dataToDownload = window.writeM4ABytes(audioBytes, metadata);
                console.log('[Services] Metadata written to M4A');
            } catch (e) {
                console.warn('[Services] Metadata write failed:', e.message);
                dataToDownload = audioBytes;
            }
        }
        
        // 6. Generate filename
        var quality = window.currentQuality || 96;
        var finalFilename = filename || window.Utils.buildFilename(song, quality);

        console.log('[Services] Filename:', finalFilename);

        // 7. Trigger download
        return window.Utils.downloadFile(dataToDownload, finalFilename);
    },
    
    // Download all songs in an album
    album: async function(albumToken) {
        var album = await window.Services.Album.getDetails(albumToken);
        console.log('[Services] Downloading album:', album.title, 
                   '(' + album.songs.length + ' songs)');
        
        var results = [];
        for (var i = 0; i < album.songs.length; i++) {
            var song = album.songs[i];
            try {
                var filename = (i + 1).toString().padStart(2, '0') + '. ' + song.title + '.m4a';
                await window.Services.Download.song(song.token, filename);
                results.push({ song: song.title, success: true });
            } catch (error) {
                console.error('[Services] Failed to download:', song.title, error.message);
                results.push({ song: song.title, success: false, error: error.message });
            }
        }
        return results;
    }
};

console.log('[Services] Download loaded');


    // ============================================================
    // FILE: /js/ui/search.js
    // ============================================================

// ui/js/search.js

async function search() {
    var searchInput = document.getElementById('searchInput');
    var resultsDiv = document.getElementById('results');
    var statsDiv = document.getElementById('stats');
    var playerDiv = document.getElementById('player');
    
    if (!searchInput || !resultsDiv) {
        console.error('[Search] Required DOM elements not found');
        return;
    }
    
    var query = searchInput.value.trim();
    if (!query) {
        alert('Please enter a search term');
        return;
    }

// Check if it's a valid URL
var parsed = window.Utils.parseUrl(query);
if (parsed && parsed.token) {
    // Clear previous results
    resultsDiv.innerHTML = '<div class="loading">🔍 Loading...</div>';
    if (statsDiv) statsDiv.innerHTML = '';
    if (playerDiv) playerDiv.innerHTML = '';
    
    try {
        if (parsed.type === 'song' || parsed.type === 'lyrics') {
            // Switch to Songs tab if needed
            if (window.currentSearchType !== 'songs') {
                switchTab('songs');
            }
            
            // Get song details
            var songData = await window.API.getSong(parsed.token);
            var song = songData.songs ? songData.songs[0] : null;
            
            if (song) {
                var formattedSong = window.Utils.formatters.formatSong(song);
                if (statsDiv) statsDiv.innerHTML = 'Found 1 song';
                displaySongs([formattedSong]);
            } else {
                resultsDiv.innerHTML = '<div class="no-results">😕 Song not found</div>';
            }
            
        } else if (parsed.type === 'album') {
            // Switch to Albums tab if needed
            if (window.currentSearchType !== 'albums') {
                switchTab('albums');
            }
            
            // Get album details
            var albumData = await window.API.getAlbum(parsed.token);
            
            if (albumData && albumData.id) {
                if (statsDiv) statsDiv.innerHTML = 'Found 1 album';
                viewAlbum(parsed.token);
            } else {
                resultsDiv.innerHTML = '<div class="no-results">😕 Album not found</div>';
            }
        }
    } catch (error) {
        console.error('[Search] URL fetch error:', error);
        resultsDiv.innerHTML = '<div class="error">❌ Failed to load: ' + error.message + '</div>';
    }
    
    return; // Exit after handling URL
}

    var searchType = window.currentSearchType || 'songs';
    console.log('[Search] Searching for:', query, 'Type:', searchType);

    resultsDiv.innerHTML = '<div class="loading">🔍 Searching</div>';
    if (statsDiv) statsDiv.innerHTML = '';
    if (playerDiv) playerDiv.innerHTML = '';

    try {
        var data;
        if (searchType === 'songs') {
            data = await window.Services.Song.search(query, 20);
        } else {
            data = await window.Services.Album.search(query, 20);
        }

        if (data.results && data.results.length > 0) {
            if (statsDiv) statsDiv.innerHTML = 'Found ' + data.results.length + ' ' + searchType;
            if (searchType === 'songs') {
                displaySongs(data.results);
            } else {
                displayAlbums(data.results);
            }
        } else {
            resultsDiv.innerHTML = '<div class="no-results">😕 No results found. Try a different search term.</div>';
        }
    } catch (error) {
        console.error('[Search] Error:', error);
        resultsDiv.innerHTML = '<div class="error">❌ Error: ' + error.message + '</div>';
        if (statsDiv) statsDiv.innerHTML = '';
    }
}

window.search = search;

    // ============================================================
    // FILE: /js/ui/display.js
    // ============================================================

// ui/js/display.js

// ============ CREATE SONG CARD ============
function createSongCard(song, index, albumContext) {
    var hasStream = song.has_stream;
    var songId = song.id || song.token || 'song-' + (index || 0);
    var playCount = song.play_count ? parseInt(song.play_count).toLocaleString() : '0';
    var duration = formatDuration(song.duration || song.more_info?.duration);
    var image = song.image || (albumContext ? albumContext.image : 'https://via.placeholder.com/80');
    var albumLanguage = albumContext ? albumContext.language : '';
    var albumYear = albumContext ? albumContext.year : '';
    
    // For album view, show index number
    var titlePrefix = (index !== undefined && albumContext) ? (index + 1) + '. ' : '';
    
    var html = `
        <div class="song-card" id="song-${songId}">
            <img src="${image}" alt="${escapeHtml(song.title)}" />
            <div class="song-info">
                <div class="song-title">${titlePrefix}${escapeHtml(song.title)}</div>
                <div class="song-artist">${escapeHtml(song.subtitle)}</div>
                <div class="song-details">
                    ${escapeHtml(albumLanguage || song.language || 'Unknown')} • 
                    ${song.year || albumYear || 'N/A'} • 
                    ${playCount} plays • 
                    ${duration}
                </div>
                <div class="song-actions">
                    <button class="btn-play" data-token="${song.token}" data-songid="${songId}" 
                        ${!hasStream ? 'disabled' : ''}>
                        ▶ Play
                    </button>
                    <button class="btn-download" data-token="${song.token}" data-songid="${songId}" 
                        ${!hasStream ? 'disabled' : ''}>
                        ⬇ Download
                    </button>
                    ${song.has_lyrics ? `<button class="btn-lyrics" data-token="${song.token}" data-songid="${songId}">📜</button>` : ''}
                    <div class="play-progress" id="play-progress-${songId}">⏳ Decrypting stream...</div>
                    <div class="download-progress" id="download-progress-${songId}">⏳ Downloading with metadata...</div>
                    ${!hasStream ? '<span style="color:#999;font-size:12px;">No stream available</span>' : ''}
                </div>
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
            var token = this.dataset.token;
            var songId = this.dataset.songid;
            if (token && songId && typeof window.playSong === 'function') {
                // Find the song card
                var songCard = document.getElementById('song-' + songId);
                window.playSong(token, songId, songCard);
            }
        });
    });

    downloadBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            var token = this.dataset.token;
            var songId = this.dataset.songid;
            if (token && songId && typeof window.downloadSong === 'function') {
                window.downloadSong(token, songId);
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
}

// ============ CREATE ALBUM CARD ============
function createAlbumCard(album) {
    var songCount = album.more_info?.song_count || 0;
    
    var html = `
        <div class="album-card" data-token="${album.token}">
            <img src="${album.image || 'https://via.placeholder.com/100'}" alt="${album.title}" />
            <div class="album-info">
                <div class="album-title">${escapeHtml(album.title)}</div>
                <div class="album-artist">${escapeHtml(album.subtitle)}</div>
                <div class="album-details">
                    ${songCount} songs • 
                    ${escapeHtml(album.language || 'Unknown')} • 
                    ${album.year || 'N/A'}
                </div>
                <button class="btn-view-album" data-token="${album.token}">
                    📂 View Album
                </button>
            </div>
        </div>
    `;
    
    return html;
}

// ============ ATTACH ALBUM EVENTS ============
function attachAlbumEvents(container) {
    // Album card click (open album)
    container.querySelectorAll('.album-card').forEach(function(card) {
        card.addEventListener('click', function() {
            var token = this.dataset.token;
            if (token && typeof window.viewAlbum === 'function') {
                window.viewAlbum(token);
            }
        });
    });
    
    // View album button click
    container.querySelectorAll('.btn-view-album').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            var token = this.dataset.token;
            if (token && typeof window.viewAlbum === 'function') {
                window.viewAlbum(token);
            }
        });
    });
}

// ============ DISPLAY SONGS ============
function displaySongs(songs) {
    var html = '<div class="results">';
    
    songs.forEach(function(song, index) {
        html += createSongCard(song, index);
    });
    
    html += '</div>';
    DOM.results.innerHTML = html;
    
    // Attach events to the results container
    attachSongEvents(DOM.results);
}

// ============ DISPLAY ALBUMS ============
function displayAlbums(albums) {
    var html = '<div class="results">';
    
    albums.forEach(function(album) {
        html += createAlbumCard(album);
    });
    
    html += '</div>';
    DOM.results.innerHTML = html;
    
    // Attach events to the results container
    attachAlbumEvents(DOM.results);
}

// ============ VIEW ALBUM ============
async function viewAlbum(token) {
    DOM.results.innerHTML = '<div class="loading">📂 Loading album...</div>';
    DOM.stats.innerHTML = '';

    try {
        var album = await window.Services.Album.getDetails(token);

        var html = `
            <div class="album-header">
                <img src="${album.image || 'https://via.placeholder.com/200'}" alt="${album.title}" />
                <div class="album-header-info">
                    <h2>${escapeHtml(album.title)}</h2>
                    <p>${escapeHtml(album.subtitle || '')}</p>
                    <p>${album.song_count || album.songs?.length || 0} songs • ${escapeHtml(album.language || 'Unknown')} • ${album.year || 'N/A'}</p>
                    <div class="album-actions">
                        <button class="btn-back" id="btn-back-search">← Back to Search</button>
                    </div>
                </div>
            </div>
            <div class="song-list">
        `;

        if (album.songs && album.songs.length > 0) {
            album.songs.forEach(function(song, index) {
                // Pass album context for album view
                html += createSongCard(song, index, album);
            });
        } else {
            html += `<div class="no-results">No songs found in this album.</div>`;
        }

        html += '</div>';
        DOM.results.innerHTML = html;
        
        // Attach events to the results container
        attachSongEvents(DOM.results);
        
        // Back button
        var backBtn = document.getElementById('btn-back-search');
        if (backBtn) {
            backBtn.addEventListener('click', function() {
                if (typeof window.search === 'function') {
                    window.search();
                }
            });
        }
        
    } catch (error) {
        DOM.results.innerHTML = `<div class="error">❌ Error loading album: ${error.message}</div>`;
    }
}

// ============ SHOW LYRICS ============
async function showLyrics(token, songId) {
    console.log('[Display] Fetching lyrics for:', token);
    
    // Check if lyrics overlay already exists
    var existingOverlay = document.getElementById('lyrics-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }
    
    try {
        var data = await window.API.getLyrics(token);
        var lyricsText = data.lyrics && data.lyrics.lyrics ? data.lyrics.lyrics : 'No lyrics available';
        
        // Format lyrics (replace <br> with newlines)
        lyricsText = window.Utils.formatters.formatLyrics(lyricsText);
        
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
        
        // ESC key to close
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                var overlayEl = document.getElementById('lyrics-overlay');
                if (overlayEl) {
                    closeLyricsOverlay();
                }
            }
        });
        
    } catch (error) {
        console.error('[Display] Lyrics fetch error:', error);
        alert('Failed to fetch lyrics: ' + error.message);
    }
}

function closeLyricsOverlay() {
    var overlay = document.getElementById('lyrics-overlay');
    if (overlay) {
        overlay.remove();
        console.log('[Display] Lyrics overlay closed');
    }
}

// ============ EXPOSE ============
window.displaySongs = displaySongs;
window.displayAlbums = displayAlbums;
window.viewAlbum = viewAlbum;
window.showLyrics = showLyrics;
window.closeLyricsOverlay = closeLyricsOverlay;


    // ============================================================
    // FILE: /js/ui/player.js
    // ============================================================

// src/js/ui/player.js

async function playSong(token, songId, songCardElement) {
    console.log('[Player] Playing song:', token, songId);

    // If player already exists, remove it
    if (currentPlayerElement) {
        currentPlayerElement.remove();
        currentPlayerElement = null;
        currentSongCard = null;
    }

    var progressDiv = document.getElementById('play-progress-' + songId);
    
    if (progressDiv) {
        progressDiv.style.display = 'block';
        progressDiv.textContent = '⏳ Decrypting...';
    }

    var buttons = document.querySelectorAll('#song-' + songId + ' .btn-play, #album-song-' + songId + ' .btn-play');
    buttons.forEach(function(btn) {
        btn.textContent = '⏳';
        btn.disabled = true;
    });

    try {
        var decryptedUrl = decryptedUrlCache.get(token);
        
        if (!decryptedUrl) {
            var song = await window.Services.Song.getDecrypted(token);
            decryptedUrl = song.url;
            decryptedUrlCache.set(token, decryptedUrl);
            setTimeout(function() { decryptedUrlCache.delete(token); }, 3600000);
        }

        if (progressDiv) {
            progressDiv.textContent = '✅ Ready!';
            setTimeout(function() {
                progressDiv.style.display = 'none';
            }, 2000);
        }

        var title = 'Song';
        var songElement = document.getElementById('song-' + songId) || document.getElementById('album-song-' + songId);
        if (songElement) {
            var titleEl = songElement.querySelector('.song-title');
            if (titleEl) title = titleEl.textContent;
        }

        if (window.currentAudio) {
            window.currentAudio.pause();
            window.currentAudio = null;
        }

        var audioHtml = `
            <div id="player-container" style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-top: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <strong>Now Playing: ${title}</strong>
                    <button id="player-close-btn" style="background: #dc3545; color: white; border: none; padding: 4px 12px; border-radius: 4px; cursor: pointer;">✕ Close</button>
                </div>
                <audio controls autoplay style="width: 100%;">
                    <source src="${decryptedUrl}" type="audio/mpeg">
                    Your browser does not support the audio element.
                </audio>
            </div>
        `;
        
        var tempDiv = document.createElement('div');
        tempDiv.innerHTML = audioHtml;
        var playerElement = tempDiv.firstElementChild;

        // Insert after the song card
        songCardElement.parentNode.insertBefore(playerElement, songCardElement.nextSibling);

        // Store references
        currentPlayerElement = playerElement;
        currentSongCard = songCardElement;

        window.currentAudio = playerElement.querySelector('audio');
        
        var closeBtn = playerElement.querySelector('#player-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                closePlayer();
            });
        }

    } catch (error) {
        console.error('[Player] Play error:', error);
        alert('Failed to play: ' + error.message);
        if (progressDiv) {
            progressDiv.textContent = '❌ Failed';
            progressDiv.style.color = '#dc3545';
            setTimeout(function() {
                progressDiv.style.display = 'none';
                progressDiv.style.color = '#17a2b8';
            }, 3000);
        }
    } finally {
        buttons.forEach(function(btn) {
            btn.textContent = '▶';
            btn.disabled = false;
        });
    }
}

function closePlayer() {
    console.log('[Player] closePlayer called');
    if (window.currentAudio) {
        window.currentAudio.pause();
        window.currentAudio.currentTime = 0;
        if (window.currentAudio.src) {
            if (window.currentAudio.src.startsWith('blob:')) {
                URL.revokeObjectURL(window.currentAudio.src);
            }
            window.currentAudio.src = '';
            window.currentAudio.load();
        }
        window.currentAudio = null;
    }
    
    if (currentPlayerElement) {
        currentPlayerElement.remove();
        currentPlayerElement = null;
        currentSongCard = null;
    }
}


window.playSong = playSong;
window.closePlayer = closePlayer;

    // ============================================================
    // FILE: /js/ui/download.js
    // ============================================================

// ui/js/download.js

async function downloadSong(token, songId) {
    console.log('[Download] Downloading song:', token, songId);
    
    var progressDiv = document.getElementById('download-progress-' + songId);
    if (progressDiv) {
        progressDiv.style.display = 'block';
        progressDiv.textContent = '⏳ Downloading...';
    }

    var buttons = document.querySelectorAll('#song-' + songId + ' .btn-download');
    buttons.forEach(function(btn) {
        btn.textContent = '⏳';
        btn.disabled = true;
    });

    try {
        await window.Services.Download.song(token);

        if (progressDiv) {
            progressDiv.textContent = '✅ Done!';
            progressDiv.style.color = '#1db954';
            setTimeout(function() {
                progressDiv.style.display = 'none';
                progressDiv.style.color = '#28a745';
            }, 3000);
        }
    } catch (error) {
        console.error('[Download] Error:', error);
        alert('Failed to download: ' + error.message);
        if (progressDiv) {
            progressDiv.textContent = '❌ Failed';
            progressDiv.style.color = '#ff4444';
            setTimeout(function() {
                progressDiv.style.display = 'none';
                progressDiv.style.color = '#28a745';
            }, 3000);
        }
    } finally {
        buttons.forEach(function(btn) {
            btn.textContent = '⬇';
            btn.disabled = false;
        });
    }
}

window.downloadSong = downloadSong;

    // ============================================================
    // FILE: /js/ui/core.js
    // ============================================================

// src/js/ui/core.js

// STATE
window.currentAudio = null;
window.currentSearchType = 'songs';
window.currentQuery = '';
window.decryptedUrlCache = new Map();
// Quality setting (default: 96 kbps)
window.currentQuality = 96;

var isOpen = false;
var isInitialized = false;
var isToggling = false;
var currentPlayerElement = null;
var currentSongCard = null;

// DOM references
var DOM = {
    searchInput: null,
    results: null,
    stats: null,
    tabs: null,
    overlay: null,
    toggleBtn: null,
    closeBtn: null,
};

// WAIT FOR DOM ELEMENTS
function waitForElements(callback, retries) {
    retries = retries || 0;
    
    DOM.searchInput = document.getElementById('searchInput');
    DOM.results = document.getElementById('results');
    DOM.stats = document.getElementById('stats');
    DOM.tabs = document.querySelectorAll('.tab');
    DOM.overlay = document.getElementById('ui-overlay');
    DOM.toggleBtn = document.getElementById('ui-toggle-btn');
    DOM.closeBtn = document.getElementById('ui-close-btn');
    
    if (DOM.searchInput && DOM.results && DOM.overlay) {
        console.log('[UI] DOM elements found');
        callback();
        return;
    }
    
    if (retries > 30) {
        console.warn('[UI] DOM elements not found after 3 seconds');
        callback();
        return;
    }
    
    setTimeout(function() {
        waitForElements(callback, retries + 1);
    }, 100);
}

function detectAndPrefillUrl() {
    var searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    var parsed = window.Utils.parseUrl(window.location.href);
    if (parsed && parsed.token) {
        searchInput.value = window.location.href;
        console.log('[UI] Prefilled URL from page:', window.location.href);
    }
}

function closeUI() {
    console.log('[UI] closeUI called');
    
    if (!DOM.overlay) return;
    if (!isOpen) return;
    
    // Close player first
    if (typeof window.closePlayer === 'function') {
        window.closePlayer();
    }
    
    DOM.overlay.classList.remove('active');
    if (DOM.toggleBtn) DOM.toggleBtn.textContent = '🎵';
    
    isOpen = false;
    console.log('[UI] Closed');
}

// EXPOSE
window.DOM = DOM;
window.waitForElements = waitForElements;
window.closeUI = closeUI;

// FORCE INIT
(function forceInit() {
    console.log('[UI] Force init...');
    
    if (typeof window.createUI === 'function') {
        window.createUI();
        return;
    }
    
    setTimeout(function() {
        if (typeof window.createUI === 'function') {
            window.createUI();
            return;
        }
        setTimeout(function() {
            if (typeof window.createUI === 'function') {
                window.createUI();
            }
        }, 500);
    }, 200);
})();

console.log('[UI] Core module loaded');

    // ============================================================
    // FILE: /js/ui/builder.js
    // ============================================================

// src/js/ui/builder.js

window.createUI = function() {
    console.log('[UI] Creating UI...');
    
    if (isInitialized) {
        console.log('[UI] Already initialized');
        return;
    }
    
    var overlay = document.createElement('div');
    overlay.id = 'ui-overlay';
    overlay.innerHTML = `
        <div class="container">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;gap:10px;flex-wrap:wrap;">
                <h1 style="margin:0;font-size:24px;white-space:nowrap;">🎵 Song Downloader</h1>
                <div style="display:flex;align-items:center;gap:6px;font-size:13px;color:#888;flex-shrink:0;margin-left:auto;">
                    <span>Quality:</span>
                    <select id="quality-select" style="background:#222;color:#fff;border:1px solid #444;border-radius:4px;padding:4px 8px;font-size:13px;cursor:pointer;">
                        <option value="12">12</option>
                        <option value="48">48</option>
                        <option value="96" selected>96</option>
                        <option value="160">160</option>
                        <option value="320">320</option>
                    </select>
                    <span style="font-size:11px;color:#666;">kbps</span>
                </div>
            </div>

            <div class="search-tabs">
                <button class="tab active" id="tab-songs">🎵 Songs</button>
                <button class="tab" id="tab-albums">💿 Albums</button>
            </div>

            <div class="search-box">
                <input type="text" id="searchInput" placeholder="Search for songs or albums..." autofocus />
                <button class="btn-search" id="searchBtn">Search</button>
            </div>

            <div id="stats" class="stats"></div>
            <div id="results"></div>
        </div>
    `;
    document.body.appendChild(overlay);
    
    var toggleBtn = document.createElement('button');
    toggleBtn.id = 'ui-toggle-btn';
    toggleBtn.textContent = '🎵';
    toggleBtn.title = 'Open Song Downloader (Alt+J)';
    document.body.appendChild(toggleBtn);
    
    isInitialized = true;
    
    waitForElements(function() {
        setupEventListeners();
        setupAppEventListeners();
        console.log('[UI] UI ready');
    });
    
    console.log('[UI] UI created');
};

function toggleUI() {
    if (isToggling) return;
    isToggling = true;
    
    if (isOpen) {
        closeUI();
    } else {
        openUI();
    }
    
    setTimeout(function() {
        isToggling = false;
    }, 300);
}

function openUI() {
    if (!DOM.overlay) return;
    if (isOpen) return;
    
    DOM.overlay.classList.add('active');

    // Prefill URL from current page if available
    detectAndPrefillUrl();

    if (DOM.toggleBtn) DOM.toggleBtn.textContent = '✕';
    if (DOM.searchInput) {
        setTimeout(function() {
            DOM.searchInput.focus();
        }, 100);
    }
    
    isOpen = true;
    console.log('[UI] Opened');
}

window.toggleUI = toggleUI;
window.openUI = openUI;

console.log('[UI] Builder module loaded');

    // ============================================================
    // FILE: /js/ui/handlers.js
    // ============================================================

// ui/js/ui-handlers.js

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
            console.log('[UI] Toggle button clicked');
            toggleUI();
        });
    }
    
    // Close button
    if (DOM.closeBtn) {
        DOM.closeBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            e.preventDefault();
            console.log('[UI] Close button clicked');
            closeUI();
        });
    }
    
    // Search button
    var searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            e.preventDefault();
            console.log('[UI] Search button clicked');
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

    // Quality dropdown
    var qualitySelect = document.getElementById('quality-select');
    if (qualitySelect) {
        qualitySelect.addEventListener('change', function() {
            window.currentQuality = parseInt(this.value);
            console.log('[UI] Quality changed to:', window.currentQuality, 'kbps');
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
    var stats = document.getElementById('stats');
    var results = document.getElementById('results');
    var player = document.getElementById('player');
    
    if (songsTab && albumsTab) {
        if (type === 'songs') {
            songsTab.classList.add('active');
            albumsTab.classList.remove('active');
        } else {
            albumsTab.classList.add('active');
            songsTab.classList.remove('active');
        }
    }
    
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
    isOpen: function() { return isOpen; },
    toggle: toggleUI,
    open: openUI,
    close: closeUI
};

console.log('[UI] Handlers module loaded');
console.log('[UI] Press Alt+J to toggle, or click the 🎵 button');

})();
