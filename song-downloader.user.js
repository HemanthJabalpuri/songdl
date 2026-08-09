// ==UserScript==
// @name         Song Downloader
// @namespace    Violentmonkey
// @version      1.4.0
// @description  Download songs and albums with metadata
// @author       Hemanth
// @match        https://www.mymusic.com/*
// @grant        GM_xmlhttpRequest
// @connect      aac.musiccdn.com
// @connect      musiccdn.com
// ==/UserScript==

(function() {
    'use strict';

    console.log('[Userscript] Song Downloader loaded');
    console.log('[Userscript] Click the 🎵 button or press Alt+J to open');

    // ============================================================
    // EMBEDDED CSS
    // ============================================================
    var UI_CSS = "/* ===== Floating Toggle Button ===== */\n#ui-toggle-btn {\n    position: fixed;\n    bottom: 20px;\n    right: 20px;\n    z-index: 2147483647;\n    background: #1db954;\n    color: white;\n    border: none;\n    border-radius: 50%;\n    width: 56px;\n    height: 56px;\n    font-size: 24px;\n    cursor: pointer;\n    box-shadow: 0 4px 12px rgba(0,0,0,0.3);\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    transition: transform 0.2s;\n    touch-action: manipulation;\n}\n#ui-toggle-btn:hover {\n    transform: scale(1.1);\n}\n#ui-toggle-btn:active {\n    transform: scale(0.95);\n}\n\n/* ===== Fullscreen Overlay ===== */\n#ui-overlay {\n    position: fixed;\n    top: 0;\n    left: 0;\n    right: 0;\n    bottom: 0;\n    z-index: 2147483646;\n    background: #111;\n    color: #fff;\n    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;\n    display: none;\n    flex-direction: column;\n    overflow-y: auto;\n    padding: 20px;\n}\n#ui-overlay.active {\n    display: flex;\n}\n\n/* ===== Overlay Content ===== */\n#ui-overlay .container {\n    max-width: 900px;\n    margin: 0 auto;\n    width: 100%;\n}\n#ui-overlay h1 {\n    color: #1db954;\n    font-size: 24px;\n    margin-bottom: 20px;\n    display: flex;\n    align-items: center;\n    gap: 12px;\n}\n\n/* Search Tabs */\n#ui-overlay .search-tabs {\n    display: flex;\n    gap: 10px;\n    margin-bottom: 20px;\n}\n#ui-overlay .tab {\n    padding: 10px 24px;\n    background: #282828;\n    color: #888;\n    border: none;\n    border-radius: 8px;\n    font-size: 15px;\n    cursor: pointer;\n    transition: all 0.2s;\n}\n#ui-overlay .tab:hover {\n    background: #333;\n}\n#ui-overlay .tab.active {\n    background: #1db954;\n    color: #111;\n    font-weight: bold;\n}\n\n/* Disabled tab */\n#ui-overlay .tab.disabled {\n    opacity: 0.4;\n    cursor: not-allowed;\n    pointer-events: none;\n}\n\n/* Search Box */\n#ui-overlay .search-box {\n    display: flex;\n    gap: 10px;\n    margin-bottom: 20px;\n}\n#ui-overlay .search-box input {\n    flex: 1;\n    padding: 12px;\n    border: 2px solid #333;\n    border-radius: 8px;\n    background: #222;\n    color: #fff;\n    font-size: 16px;\n    outline: none;\n}\n#ui-overlay .search-box input:focus {\n    border-color: #1db954;\n}\n#ui-overlay .search-box input::placeholder {\n    color: #666;\n}\n#ui-overlay .btn-search {\n    padding: 12px 24px;\n    background: #1db954;\n    color: #111;\n    border: none;\n    border-radius: 8px;\n    font-size: 16px;\n    font-weight: bold;\n    cursor: pointer;\n}\n#ui-overlay .btn-search:hover {\n    background: #1ed760;\n}\n\n/* Stats */\n#ui-overlay .stats {\n    margin: 10px 0 20px 0;\n    color: #888;\n    font-size: 14px;\n}\n\n/* Results */\n#ui-overlay .results {\n    display: grid;\n    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));\n    gap: 15px;\n}\n\n/* Song Cards */\n#ui-overlay .song-card {\n    background: #1a1a1a;\n    padding: 15px;\n    border-radius: 8px;\n    display: flex;\n    gap: 15px;\n    align-items: center;\n    border: 1px solid #222;\n}\n#ui-overlay .song-card img {\n    width: 80px;\n    height: 80px;\n    border-radius: 4px;\n    object-fit: cover;\n    background: #222;\n}\n#ui-overlay .song-info {\n    flex: 1;\n}\n#ui-overlay .song-title {\n    font-size: 18px;\n    font-weight: bold;\n    color: #fff;\n}\n#ui-overlay .song-artist {\n    color: #aaa;\n    margin: 5px 0;\n}\n#ui-overlay .song-details {\n    color: #666;\n    font-size: 14px;\n}\n#ui-overlay .song-actions {\n    display: flex;\n    gap: 8px;\n    margin-top: 8px;\n    flex-wrap: wrap;\n}\n#ui-overlay .btn-download {\n    padding: 6px 16px;\n    background: #1db954;\n    color: #111;\n    border: none;\n    border-radius: 4px;\n    font-size: 13px;\n    font-weight: bold;\n    cursor: pointer;\n}\n#ui-overlay .btn-download:hover {\n    background: #1ed760;\n}\n#ui-overlay .btn-download:disabled {\n    background: #555;\n    cursor: not-allowed;\n}\n#ui-overlay .btn-play {\n    padding: 6px 16px;\n    background: #007bff;\n    color: white;\n    border: none;\n    border-radius: 4px;\n    font-size: 13px;\n    cursor: pointer;\n}\n#ui-overlay .btn-play:hover {\n    background: #0056b3;\n}\n#ui-overlay .btn-play:disabled {\n    background: #555;\n    cursor: not-allowed;\n}\n\n/* Album Cards */\n#ui-overlay .album-card {\n    background: #1a1a1a;\n    padding: 15px;\n    border-radius: 8px;\n    display: flex;\n    gap: 15px;\n    align-items: center;\n    cursor: pointer;\n    border: 1px solid #222;\n}\n#ui-overlay .album-card:hover {\n    background: #222;\n}\n#ui-overlay .album-card img {\n    width: 100px;\n    height: 100px;\n    border-radius: 4px;\n    object-fit: cover;\n    background: #222;\n}\n#ui-overlay .album-info {\n    flex: 1;\n}\n#ui-overlay .album-title {\n    font-size: 18px;\n    font-weight: bold;\n    color: #fff;\n}\n#ui-overlay .album-artist {\n    color: #aaa;\n    margin: 5px 0;\n}\n#ui-overlay .album-details {\n    color: #666;\n    font-size: 14px;\n}\n#ui-overlay .btn-view-album {\n    margin-top: 8px;\n    padding: 6px 16px;\n    background: #6c757d;\n    color: white;\n    border: none;\n    border-radius: 4px;\n    font-size: 13px;\n    cursor: pointer;\n}\n#ui-overlay .btn-view-album:hover {\n    background: #5a6268;\n}\n\n/* Album Detail View */\n#ui-overlay .album-header {\n    background: #1a1a1a;\n    padding: 20px;\n    border-radius: 8px;\n    display: flex;\n    gap: 20px;\n    margin-bottom: 20px;\n    border: 1px solid #222;\n}\n#ui-overlay .album-header img {\n    width: 200px;\n    height: 200px;\n    border-radius: 4px;\n    object-fit: cover;\n    background: #222;\n}\n#ui-overlay .album-header-info {\n    flex: 1;\n}\n#ui-overlay .album-header-info h2 {\n    margin-bottom: 5px;\n    color: #fff;\n}\n#ui-overlay .album-header-info p {\n    color: #aaa;\n    margin: 5px 0;\n}\n#ui-overlay .album-actions {\n    margin-top: 15px;\n    display: flex;\n    gap: 10px;\n    flex-wrap: wrap;\n}\n#ui-overlay .btn-back {\n    padding: 8px 20px;\n    background: #6c757d;\n    color: white;\n    border: none;\n    border-radius: 4px;\n    cursor: pointer;\n}\n#ui-overlay .btn-back:hover {\n    background: #5a6268;\n}\n\n/* Song List in Album */\n#ui-overlay .song-list {\n    display: grid;\n    gap: 8px;\n}\n\n/* Unified grid layout for card elements in detail views */\n#ui-overlay .album-list,\n#ui-overlay .playlist-list,\n#ui-overlay .album-songs-list,\n#ui-overlay .playlist-songs-list,\n#ui-overlay .artist-songs-section .song-list {\n    display: grid;\n    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));\n    gap: 15px;\n}\n#ui-overlay .song-item {\n    background: #1a1a1a;\n    padding: 12px 15px;\n    border-radius: 4px;\n    display: flex;\n    align-items: center;\n    gap: 15px;\n    border: 1px solid #222;\n}\n#ui-overlay .song-item .song-title {\n    flex: 2;\n    font-weight: 500;\n    font-size: 15px;\n    color: #fff;\n}\n#ui-overlay .song-item .song-artist {\n    flex: 2;\n    color: #aaa;\n    font-size: 14px;\n}\n#ui-overlay .song-item .song-duration {\n    color: #666;\n    font-size: 13px;\n    min-width: 50px;\n}\n\n/* Playlist Cards */\n#ui-overlay .playlist-card {\n    background: #1a1a1a;\n    padding: 15px;\n    border-radius: 8px;\n    display: flex;\n    gap: 15px;\n    align-items: center;\n    cursor: pointer;\n    border: 1px solid #222;\n}\n#ui-overlay .playlist-card:hover {\n    background: #222;\n}\n#ui-overlay .playlist-card img {\n    width: 100px;\n    height: 100px;\n    border-radius: 4px;\n    object-fit: cover;\n    background: #222;\n}\n#ui-overlay .playlist-info {\n    flex: 1;\n}\n#ui-overlay .playlist-title {\n    font-size: 18px;\n    font-weight: bold;\n    color: #fff;\n}\n#ui-overlay .playlist-artist {\n    color: #aaa;\n    margin: 5px 0;\n}\n#ui-overlay .playlist-details {\n    color: #666;\n    font-size: 14px;\n}\n#ui-overlay .btn-view-playlist {\n    margin-top: 8px;\n    padding: 6px 16px;\n    background: #6c757d;\n    color: white;\n    border: none;\n    border-radius: 4px;\n    font-size: 13px;\n    cursor: pointer;\n}\n#ui-overlay .btn-view-playlist:hover {\n    background: #5a6268;\n}\n\n/* Playlist Header */\n#ui-overlay .playlist-header {\n    background: #1a1a1a;\n    padding: 20px;\n    border-radius: 8px;\n    display: flex;\n    gap: 20px;\n    margin-bottom: 20px;\n    border: 1px solid #222;\n}\n#ui-overlay .playlist-header img {\n    width: 200px;\n    height: 200px;\n    border-radius: 4px;\n    object-fit: cover;\n    background: #222;\n}\n#ui-overlay .playlist-header-info {\n    flex: 1;\n}\n#ui-overlay .playlist-header-info h2 {\n    margin-bottom: 5px;\n    color: #fff;\n}\n#ui-overlay .playlist-header-info p {\n    color: #aaa;\n    margin: 5px 0;\n}\n#ui-overlay .playlist-description {\n    color: #888 !important;\n    font-style: italic;\n    margin-top: 10px !important;\n}\n#ui-overlay .playlist-actions {\n    margin-top: 15px;\n    display: flex;\n    gap: 10px;\n    flex-wrap: wrap;\n}\n\n/* Loading & Error */\n#ui-overlay .loading {\n    text-align: center;\n    padding: 40px;\n    color: #888;\n}\n#ui-overlay .error {\n    color: #ff4444;\n    padding: 20px;\n    background: #2a1a1a;\n    border-radius: 8px;\n    border: 1px solid #661111;\n}\n#ui-overlay .no-results {\n    text-align: center;\n    padding: 40px;\n    color: #666;\n}\n\n/* Progress */\n#ui-overlay .download-progress,\n#ui-overlay .play-progress {\n    display: none;\n    margin-top: 5px;\n    font-size: 12px;\n    color: #1db954;\n}\n#ui-overlay .download-progress.active,\n#ui-overlay .play-progress.active {\n    display: block;\n}\n\n/* Player */\n#ui-overlay audio {\n    width: 100%;\n    margin-top: 20px;\n    border-radius: 8px;\n}\n\n/* Lyrics Button */\n#ui-overlay .btn-lyrics {\n    padding: 6px 16px;\n    background: #6c757d;\n    color: white;\n    border: none;\n    border-radius: 4px;\n    font-size: 13px;\n    cursor: pointer;\n}\n#ui-overlay .btn-lyrics:hover {\n    background: #5a6268;\n}\n\n/* ===== More Button ===== */\n#ui-overlay .btn-more {\n    padding: 6px 12px;\n    background: transparent;\n    color: #aaa;\n    border: none;\n    border-radius: 4px;\n    font-size: 18px;\n    cursor: pointer;\n    line-height: 1;\n}\n#ui-overlay .btn-more:hover {\n    color: #fff;\n    background: #282828;\n}\n\n/* ===== More Menu ===== */\n#ui-overlay .more-menu {\n    position: absolute;\n    right: 0;\n    top: 100%;\n    min-width: 160px;\n    max-width: 250px;\n    background: #1a1a1a;\n    border: 1px solid #333;\n    border-radius: 8px;\n    padding: 4px 0;\n    z-index: 100;\n    box-shadow: 0 4px 12px rgba(0,0,0,0.5);\n    margin-top: 4px;\n}\n\n#ui-overlay .more-item {\n    display: block;\n    width: 100%;\n    padding: 8px 16px;\n    background: transparent;\n    color: #ddd;\n    border: none;\n    text-align: left;\n    font-size: 14px;\n    cursor: pointer;\n    white-space: nowrap;\n    overflow: hidden;\n    text-overflow: ellipsis;\n}\n#ui-overlay .more-item:hover {\n    background: #282828;\n    color: #fff;\n}\n\n/* Song card needs position relative for menu positioning */\n#ui-overlay .song-card {\n    position: relative;\n}\n\n/* ===== Load More Button ===== */\n#ui-overlay .btn-load-more {\n    display: block;\n    width: 100%;\n    padding: 12px 20px;\n    margin-top: 15px;\n    background: #282828;\n    color: #fff;\n    border: 1px solid #444;\n    border-radius: 8px;\n    font-size: 14px;\n    font-weight: 500;\n    cursor: pointer;\n    transition: all 0.2s;\n    text-align: center;\n}\n\n#ui-overlay .btn-load-more:hover {\n    background: #333;\n    border-color: #1db954;\n}\n\n#ui-overlay .btn-load-more:disabled {\n    opacity: 0.5;\n    cursor: not-allowed;\n}\n\n#ui-overlay .btn-load-more:disabled:hover {\n    background: #282828;\n    border-color: #444;\n}\n\n/* ===== End of Results ===== */\n#ui-overlay .end-of-results {\n    display: block;\n    width: 100%;\n    padding: 12px 20px;\n    margin-top: 15px;\n    color: #666;\n    font-size: 14px;\n    text-align: center;\n    border-top: 1px solid #333;\n}\n\n/* ===== Artist Header ===== */\n#ui-overlay .artist-header {\n    background: #1a1a1a;\n    padding: 20px;\n    border-radius: 8px;\n    display: flex;\n    gap: 20px;\n    margin-bottom: 20px;\n    border: 1px solid #222;\n}\n#ui-overlay .artist-header img {\n    width: 150px;\n    height: 150px;\n    border-radius: 50%;\n    object-fit: cover;\n    background: #222;\n}\n#ui-overlay .artist-header-info {\n    flex: 1;\n}\n#ui-overlay .artist-header-info h2 {\n    margin-bottom: 5px;\n    color: #fff;\n    font-size: 24px;\n}\n#ui-overlay .artist-header-info p {\n    color: #aaa;\n    margin: 5px 0;\n}\n#ui-overlay .artist-bio {\n    color: #888 !important;\n    font-size: 14px;\n    margin-top: 10px !important;\n    line-height: 1.6;\n}\n#ui-overlay .artist-actions {\n    margin-top: 15px;\n    display: flex;\n    gap: 10px;\n    flex-wrap: wrap;\n}\n\n/* ===== Artist Tabs ===== */\n#ui-overlay .artist-tabs {\n    display: flex;\n    gap: 10px;\n    margin-bottom: 20px;\n    border-bottom: 1px solid #333;\n    padding-bottom: 10px;\n}\n#ui-overlay .artist-tab {\n    padding: 8px 16px;\n    background: transparent;\n    color: #888;\n    border: none;\n    border-radius: 4px;\n    font-size: 14px;\n    cursor: pointer;\n    transition: all 0.2s;\n}\n#ui-overlay .artist-tab:hover {\n    color: #fff;\n    background: #282828;\n}\n#ui-overlay .artist-tab.active {\n    color: #1db954;\n    background: rgba(29, 185, 84, 0.1);\n    font-weight: bold;\n}\n\n/* ===== Artist Sections ===== */\n#ui-overlay .artist-songs-section,\n#ui-overlay .artist-albums-section,\n#ui-overlay .artist-playlists-section {\n    margin-top: 20px;\n}\n#ui-overlay .artist-songs-section h3,\n#ui-overlay .artist-albums-section h3,\n#ui-overlay .artist-playlists-section h3 {\n    color: #fff;\n    font-size: 18px;\n    margin-bottom: 12px;\n    padding-bottom: 8px;\n    border-bottom: 1px solid #333;\n}\n\n/* ===== Artist Cards (Search Results) ===== */\n#ui-overlay .artist-card {\n    background: #1a1a1a;\n    padding: 15px;\n    border-radius: 8px;\n    display: flex;\n    gap: 15px;\n    align-items: center;\n    cursor: pointer;\n    border: 1px solid #222;\n}\n#ui-overlay .artist-card:hover {\n    background: #222;\n}\n#ui-overlay .artist-card img {\n    width: 80px;\n    height: 80px;\n    border-radius: 50%;\n    object-fit: cover;\n    background: #222;\n}\n#ui-overlay .artist-info {\n    flex: 1;\n}\n#ui-overlay .artist-name {\n    font-size: 18px;\n    font-weight: bold;\n    color: #fff;\n}\n#ui-overlay .artist-role {\n    color: #aaa;\n    margin: 5px 0;\n}\n#ui-overlay .btn-view-artist {\n    margin-top: 8px;\n    padding: 6px 16px;\n    background: #6c757d;\n    color: white;\n    border: none;\n    border-radius: 4px;\n    font-size: 13px;\n    cursor: pointer;\n}\n#ui-overlay .btn-view-artist:hover {\n    background: #5a6268;\n}\n\n/* ===== Responsive ===== */\n@media (max-width: 600px) {\n    #ui-overlay .artist-header {\n        flex-direction: column;\n        align-items: center;\n        text-align: center;\n    }\n    #ui-overlay .artist-header img {\n        width: 120px;\n        height: 120px;\n    }\n    #ui-overlay .artist-tabs {\n        flex-wrap: wrap;\n        justify-content: center;\n    }\n    #ui-overlay .artist-tab {\n        flex: 1;\n        text-align: center;\n        padding: 8px 12px;\n        font-size: 13px;\n    }\n}\n\n/* Responsive */\n@media (max-width: 600px) {\n    #ui-overlay .album-header {\n        flex-direction: column;\n        align-items: center;\n        text-align: center;\n    }\n    #ui-overlay .album-header img {\n        width: 150px;\n        height: 150px;\n    }\n    #ui-overlay .song-item {\n        flex-wrap: wrap;\n    }\n    #ui-overlay .song-item .song-title {\n        flex: 1 1 100%;\n    }\n    #ui-overlay .song-item .song-artist {\n        flex: 1 1 100%;\n    }\n    #ui-overlay .search-tabs {\n        flex-wrap: wrap;\n    }\n    #ui-overlay .tab {\n        flex: 1;\n        text-align: center;\n        padding: 8px 12px;\n        font-size: 13px;\n    }\n    #ui-overlay .playlist-header {\n        flex-direction: column;\n        align-items: center;\n        text-align: center;\n    }\n    #ui-overlay .playlist-header img {\n        width: 150px;\n        height: 150px;\n    }\n}\n\n#ui-overlay .song-card.playing {\n    border: 1px solid #1db954;\n    background: rgba(29, 185, 84, 0.05);\n}";

    // Add CSS to page
    var styleEl = document.createElement('style');
    styleEl.textContent = UI_CSS;
    document.head.appendChild(styleEl);
    console.log('[Userscript] CSS injected');


    // ============================================================
    // FILE: /js/api/constants.js
    // ============================================================

// src/js/api/constants.js

window.API = window.API || {};
window.API.constants = window.API.constants || {};

// API endpoints
const HOST = 'https://www.mymusic.com';
window.API.constants.API_HOST = HOST;
window.API.constants.API_BASE = HOST + '/api.php';
window.API.constants.REFERER = HOST + '/';

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


    // ============================================================
    // FILE: /js/utils/logger.js
    // ============================================================

// src/js/utils/logger.js
// Centralized Logging Control Interceptor

// Global toggle: Set to true to show all logs, false to silence them.
window.LOGGING_ENABLED = true;

var originalLog = console.log;
var originalWarn = console.warn;
var originalError = console.error;

console.log = function() {
    if (window.LOGGING_ENABLED === false) return;
    originalLog.apply(console, arguments);
};

console.warn = function() {
    if (window.LOGGING_ENABLED === false) return;
    originalWarn.apply(console, arguments);
};

console.error = function() {
    // Errors always render by default, but respect the toggle if wanted
    if (window.LOGGING_ENABLED === false) return;
    originalError.apply(console, arguments);
};


    // ============================================================
    // FILE: /js/ui/utils.js
    // ============================================================

// src/js/ui/utils.js

function escapeHtml(text) {
    if (!text) return '';
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDuration(seconds) {
    if (isNaN(seconds) || seconds === null || seconds === undefined || seconds <= 0) return 'N/A';
    var secs = parseInt(seconds);
    var mins = Math.floor(secs / 60);
    var remainingSecs = secs % 60;
    return mins + ':' + (remainingSecs < 10 ? '0' + remainingSecs : remainingSecs);
}

// Get a standard SVG vector placeholder matching the component type
function getDefaultImage(type) {
    var emoji = '🎵';
    if (type === 'artist') {
        emoji = '🎤';
    } else if (type === 'album') {
        emoji = '💿';
    } else if (type === 'playlist') {
        emoji = '🎶';
    }

    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">' +
        '<rect width="200" height="200" fill="#282828"/>' +
        '<text x="50%" y="60%" font-size="80" text-anchor="middle" dominant-baseline="middle">' + emoji +
        '</text></svg>';

    return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
}

// Expose getDefaultImage to utility scope
window.Utils = window.Utils || {};
window.Utils.getDefaultImage = getDefaultImage;

function buildCard(options) {
    var type = options.type;
    var token = options.token;
    var image = options.image;
    if (!image || image.indexOf('placeholder.com') !== -1) {
        image = getDefaultImage(type);
    }
    var title = options.title || '';
    var subtitle = options.subtitle || '';
    var details = options.details || '';
    var buttonText = options.buttonText || '';

    // Map class names to fit existing CSS selectors in ui.css
    var titleClass = type === 'artist' ? 'artist-name' : type + '-title';
    var subtitleClass = type === 'artist' ? 'artist-role' : type + '-subtitle';
    if (type !== 'artist') {
        subtitleClass = type === 'album' ? 'album-artist' : 'playlist-artist';
    }

    return '\n        <div class="' + type + '-card" data-token="' + token + '">\n' +
        '            <img src="' + image + '" alt="' + escapeHtml(title) + '" />\n' +
        '            <div class="' + type + '-info">\n' +
        '                <div class="' + titleClass + '">' + escapeHtml(title) + '</div>\n' +
        '                <div class="' + subtitleClass + '">' + escapeHtml(subtitle) + '</div>\n' +
        (details ? '                <div class="' + type + '-details">' + details + '</div>\n' : '') +
        '                <button class="btn-view-' + type + '" data-token="' + token + '">\n' +
        '                    ' + buttonText + '\n' +
        '                </button>\n' +
        '            </div>\n' +
        '        </div>\n    ';
}

// Create HTML representations for album cards
function createAlbumCard(album) {
    var songCount = (album.more_info && album.more_info.song_count) || 0;
    return buildCard({
        type: 'album',
        token: album.token,
        image: album.image,
        title: album.title,
        subtitle: album.subtitle,
        details: songCount + ' songs • ' + escapeHtml(album.language || 'Unknown') + ' • ' + (album.year || 'N/A'),
        buttonText: '📂 View Album'
    });
}

// Create HTML representations for playlist cards
function createPlaylistCard(playlist) {
    var songCount = (playlist.more_info && playlist.more_info.song_count) || playlist.song_count || '0';
    return buildCard({
        type: 'playlist',
        token: playlist.token,
        image: playlist.image,
        title: playlist.title,
        subtitle: playlist.subtitle || '',
        details: songCount + ' songs • ' + escapeHtml(playlist.language || 'Unknown'),
        buttonText: '📂 View Playlist'
    });
}

// Create HTML representations for artist cards
function createArtistCard(artist) {
    return buildCard({
        type: 'artist',
        token: artist.token,
        image: artist.image,
        title: artist.name,
        subtitle: artist.role || 'Artist',
        buttonText: '🎤 View Artist'
    });
}

// Expose card creators to global window scope
window.Utils = window.Utils || {};
window.Utils.formatDuration = formatDuration;
window.createArtistCard = createArtistCard;
window.createAlbumCard = createAlbumCard;
window.createPlaylistCard = createPlaylistCard;

    // ============================================================
    // FILE: /js/libs/des.js
    // ============================================================

// src/js/libs/des.js
// Stripped DES library - ECB mode only, decryption only
// Based on Paul Tero's DES implementation

// S-boxes (standard DES)
const S1 = new Int32Array([
    0x1010400, 0,         0x10000,   0x1010404, 0x1010004, 0x10404,   0x4,       0x10000,   0x400,     0x1010400,
    0x1010404, 0x400,     0x1000404, 0x1010004, 0x1000000, 0x4,       0x404,     0x1000400, 0x1000400, 0x10400,
    0x10400,   0x1010000, 0x1010000, 0x1000404, 0x10004,   0x1000004, 0x1000004, 0x10004,   0,         0x404,
    0x10404,   0x1000000, 0x10000,   0x1010404, 0x4,       0x1010000, 0x1010400, 0x1000000, 0x1000000, 0x400,
    0x1010004, 0x10000,   0x10400,   0x1000004, 0x400,     0x4,       0x1000404, 0x10404,   0x1010404, 0x10004,
    0x1010000, 0x1000404, 0x1000004, 0x404,     0x10404,   0x1010400, 0x404,     0x1000400, 0x1000400, 0,
    0x10004,   0x10400,   0,         0x1010004
]);

const S2 = new Int32Array([
    -0x7FEF7FE0, -0x7FFF8000, 0x8000,      0x108020,    0x100000,    0x20,        -0x7FEFFFE0, -0x7FFF7FE0,
    -0x7FFFFFE0, -0x7FEF7FE0, -0x7FEF8000, -0x80000000, -0x7FFF8000, 0x100000,    0x20,        -0x7FEFFFE0,
    0x108000,    0x100020,    -0x7FFF7FE0, 0,           -0x80000000, 0x8000,      0x108020,    -0x7FF00000,
    0x100020,    -0x7FFFFFE0, 0,           0x108000,    0x8020,      -0x7FEF8000, -0x7FF00000, 0x8020,
    0,           0x108020,    -0x7FEFFFE0, 0x100000,    -0x7FFF7FE0, -0x7FF00000, -0x7FEF8000, 0x8000,
    -0x7FF00000, -0x7FFF8000, 0x20,        -0x7FEF7FE0, 0x108020,    0x20,        0x8000,      -0x80000000,
    0x8020,      -0x7FEF8000, 0x100000,    -0x7FFFFFE0, 0x100020,    -0x7FFF7FE0, -0x7FFFFFE0, 0x100020,
    0x108000,    0,           -0x7FFF8000, 0x8020,      -0x80000000, -0x7FEFFFE0, -0x7FEF7FE0, 0x108000
]);

const S3 = new Int32Array([
    0x208,     0x8020200, 0,         0x8020008, 0x8000200, 0,         0x20208,   0x8000200, 0x20008,   0x8000008,
    0x8000008, 0x20000,   0x8020208, 0x20008,   0x8020000, 0x208,     0x8000000, 0x8,       0x8020200, 0x200,
    0x20200,   0x8020000, 0x8020008, 0x20208,   0x8000208, 0x20200,   0x20000,   0x8000208, 0x8,       0x8020208,
    0x200,     0x8000000, 0x8020200, 0x8000000, 0x20008,   0x208,     0x20000,   0x8020200, 0x8000200, 0,
    0x200,     0x20008,   0x8020208, 0x8000200, 0x8000008, 0x200,     0,         0x8020008, 0x8000208, 0x20000,
    0x8000000, 0x8020208, 0x8,       0x20208,   0x20200,   0x8000008, 0x8020000, 0x8000208, 0x208,     0x8020000,
    0x20208,   0x8,       0x8020008, 0x20200
]);

const S4 = new Int32Array([
    0x802001, 0x2081,   0x2081,   0x80,     0x802080, 0x800081, 0x800001, 0x2001,   0,        0x802000, 0x802000,
    0x802081, 0x81,     0,        0x800080, 0x800001, 0x1,      0x2000,   0x800000, 0x802001, 0x80,     0x800000,
    0x2001,   0x2080,   0x800081, 0x1,      0x2080,   0x800080, 0x2000,   0x802080, 0x802081, 0x81,     0x800080,
    0x800001, 0x802000, 0x802081, 0x81,     0,        0,        0x802000, 0x2080,   0x800080, 0x800081, 0x1,
    0x802001, 0x2081,   0x2081,   0x80,     0x802081, 0x81,     0x1,      0x2000,   0x800001, 0x2001,   0x802080,
    0x800081, 0x2001,   0x2080,   0x800000, 0x802001, 0x80,     0x800000, 0x2000,   0x802080
]);

const S5 = new Int32Array([
    0x100,      0x2080100,  0x2080000,  0x42000100, 0x80000,    0x100,      0x40000000, 0x2080000,
    0x40080100, 0x80000,    0x2000100,  0x40080100, 0x42000100, 0x42080000, 0x80100,    0x40000000,
    0x2000000,  0x40080000, 0x40080000, 0,          0x40000100, 0x42080100, 0x42080100, 0x2000100,
    0x42080000, 0x40000100, 0,          0x42000000, 0x2080100,  0x2000000,  0x42000000, 0x80100,
    0x80000,    0x42000100, 0x100,      0x2000000,  0x40000000, 0x2080000,  0x42000100, 0x40080100,
    0x2000100,  0x40000000, 0x42080000, 0x2080100,  0x40080100, 0x100,      0x2000000,  0x42080000,
    0x42080100, 0x80100,    0x42000000, 0x42080100, 0x2080000,  0,          0x40080000, 0x42000000,
    0x80100,    0x2000100,  0x40000100, 0x80000,    0,          0x40080000, 0x2080100,  0x40000100
]);

const S6 = new Int32Array([
    0x20000010, 0x20400000, 0x4000,     0x20404010, 0x20400000, 0x10,       0x20404010, 0x400000,
    0x20004000, 0x404010,   0x400000,   0x20000010, 0x400010,   0x20004000, 0x20000000, 0x4010,
    0,          0x400010,   0x20004010, 0x4000,     0x404000,   0x20004010, 0x10,       0x20400010,
    0x20400010, 0,          0x404010,   0x20404000, 0x4010,     0x404000,   0x20404000, 0x20000000,
    0x20004000, 0x10,       0x20400010, 0x404000,   0x20404010, 0x400000,   0x4010,     0x20000010,
    0x400000,   0x20004000, 0x20000000, 0x4010,     0x20000010, 0x20404010, 0x404000,   0x20400000,
    0x404010,   0x20404000, 0,          0x20400010, 0x10,       0x4000,     0x20400000, 0x404010,
    0x4000,     0x400010,   0x20004010, 0,          0x20404000, 0x20000000, 0x400010,   0x20004010
]);

const S7 = new Int32Array([
    0x200000,  0x4200002, 0x4000802, 0,         0x800,     0x4000802, 0x200802,  0x4200800, 0x4200802, 0x200000,
    0,         0x4000002, 0x2,       0x4000000, 0x4200002, 0x802,     0x4000800, 0x200802,  0x200002,  0x4000800,
    0x4000002, 0x4200000, 0x4200800, 0x200002,  0x4200000, 0x800,     0x802,     0x4200802, 0x200800,  0x2,
    0x4000000, 0x200800,  0x4000000, 0x200800,  0x200000,  0x4000802, 0x4000802, 0x4200002, 0x4200002, 0x2,
    0x200002,  0x4000000, 0x4000800, 0x200000,  0x4200800, 0x802,     0x200802,  0x4200800, 0x802,     0x4000002,
    0x4200802, 0x4200000, 0x200800,  0,         0x2,       0x4200802, 0,         0x200802,  0x4200000, 0x800,
    0x4000002, 0x4000800, 0x800,     0x200002
]);

const S8 = new Int32Array([
    0x10001040, 0x1000,     0x40000,    0x10041040, 0x10000000, 0x10001040, 0x40,       0x10000000,
    0x40040,    0x10040000, 0x10041040, 0x41000,    0x10041000, 0x41040,    0x1000,     0x40,
    0x10040000, 0x10000040, 0x10001000, 0x1040,     0x41000,    0x40040,    0x10040040, 0x10041000,
    0x1040,     0,          0,          0x10040040, 0x10000040, 0x10001000, 0x41040,    0x40000,
    0x41040,    0x40000,    0x10041000, 0x1000,     0x40,       0x10040040, 0x1000,     0x41040,
    0x10001000, 0x40,       0x10000040, 0x10040000, 0x10040040, 0x10000000, 0x40000,    0x10001040,
    0,          0x10041040, 0x40040,    0x10000040, 0x10040000, 0x10001000, 0x10001040, 0,
    0x10041040, 0x41000,    0x41000,    0x1040,     0x1040,     0x40040,    0x10000000, 0x10041000
]);

// DES decryption - ECB mode only
function desDecrypt(message, keys) {
    var s1 = S1, s2 = S2, s3 = S3, s4 = S4;
    var s5 = S5, s6 = S6, s7 = S7, s8 = S8;

    var len = message.length;
    var result = '';
    var left, right, temp;

    for (var m = 0; m < len; m += 8) {
        left = (message.charCodeAt(m) << 24) | (message.charCodeAt(m + 1) << 16) | (message.charCodeAt(m + 2) << 8) |
            message.charCodeAt(m + 3);
        right = (message.charCodeAt(m + 4) << 24) | (message.charCodeAt(m + 5) << 16) |
            (message.charCodeAt(m + 6) << 8) | message.charCodeAt(m + 7);

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
        for (var i = 30; i >= 0; i -= 2) {
            var right1 = right ^ keys[i];
            var rrot = (right >>> 4) | (right << 28);
            var right2 = rrot ^ keys[i + 1];

            temp = left;
            left = right;
            right = temp ^
                (s2[(right1 >>> 24) & 63] | s4[(right1 >>> 16) & 63] | s6[(right1 >>> 8) & 63] | s8[right1 & 63] |
                 s1[(right2 >>> 24) & 63] | s3[(right2 >>> 16) & 63] | s5[(right2 >>> 8) & 63] | s7[right2 & 63]);
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
            (left >>> 24), ((left >>> 16) & 0xFF), ((left >>> 8) & 0xFF), (left & 0xFF), (right >>> 24),
            ((right >>> 16) & 0xFF), ((right >>> 8) & 0xFF), (right & 0xFF));
    }
    return result;
}

// Expose to browser
if (typeof window !== 'undefined') {
    window.desDecrypt = desDecrypt;
}

    // ============================================================
    // FILE: /js/libs/writem4a.js
    // ============================================================

// src/js/libs/writem4a.js

// Restricts recursive parsing to metadata-only atoms to avoid GC allocating and shifts index tables in-place using
// direct byte signatures.

var latin1Decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('latin1') : null;
var utf8Decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8') : null;
var utf8Encoder = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;

// Converts a segment of Uint8Array to string.
function bytesToString(bytes, offset, endOffset, encoding) {
    if (encoding === undefined) encoding = 'latin1';
    var slice = bytes.subarray(offset, endOffset);
    if (encoding === 'utf8') {
        if (utf8Decoder) return utf8Decoder.decode(slice);
        // Fallback for old Node.js
        var buf;
        if (typeof Buffer.from === 'function') {
            buf = Buffer.from(slice);
        } else {
            buf = new Buffer(slice.length);
            for (var i = 0; i < slice.length; i++) {
                buf[i] = slice[i];
            }
        }
        return buf.toString('utf8');
    } else {
        if (latin1Decoder) return latin1Decoder.decode(slice);
        var buf;
        if (typeof Buffer.from === 'function') {
            buf = Buffer.from(slice);
        } else {
            buf = new Buffer(slice.length);
            for (var i = 0; i < slice.length; i++) {
                buf[i] = slice[i];
            }
        }
        return buf.toString('binary');
    }
}

// Converts a string to Uint8Array.
function stringToBytes(str, encoding) {
    if (encoding === undefined) encoding = 'utf8';
    if (encoding === 'latin1') {
        var bytes = new Uint8Array(str.length);
        for (var i = 0; i < str.length; i++) {
            bytes[i] = str.charCodeAt(i) & 0xff;
        }
        return bytes;
    }
    if (utf8Encoder) return utf8Encoder.encode(str);
    // Fallback for old Node.js
    var buf = new Buffer(str, 'utf8');
    var arr = new Uint8Array(buf.length);
    for (var i = 0; i < buf.length; i++) {
        arr[i] = buf[i];
    }
    return arr;
}

// Concatenates multiple Uint8Array arrays into one.
function concatUint8Arrays(arrays) {
    var totalLength = 0;
    for (var i = 0; i < arrays.length; i++) {
        totalLength += arrays[i].length;
    }
    var result = new Uint8Array(totalLength);
    var offset = 0;
    for (var i = 0; i < arrays.length; i++) {
        var arr = arrays[i];
        result.set(arr, offset);
        offset += arr.length;
    }
    return result;
}

// Reads variable-length Big-Endian integer from DataView.
function readUIntBE(view, offset, byteLength) {
    var value = 0;
    for (var i = 0; i < byteLength; i++) {
        value = (value << 8) | view.getUint8(offset + i);
    }
    return value;
}

// Writes variable-length Big-Endian integer into DataView.
function writeUIntBE(view, value, offset, byteLength) {
    var temp = value;
    for (var i = byteLength - 1; i >= 0; i--) {
        view.setUint8(offset + i, temp & 0xff);
        temp = temp >> 8;
    }
}

// 64-bit Big-Endian DataView helpers supporting legacy runtimes natively
function readUInt64(view, offset) {
    if (typeof view.getBigUint64 === 'function') {
        return Number(view.getBigUint64(offset, false));
    }
    var high = view.getUint32(offset, false);
    var low = view.getUint32(offset + 4, false);
    return high * 0x100000000 + low;
}

function writeUInt64(view, value, offset) {
    if (typeof view.setBigUint64 === 'function') {
        view.setBigUint64(offset, BigInt(value), false);
        return;
    }
    var high = Math.floor(value / 0x100000000);
    var low = value % 0x100000000;
    view.setUint32(offset, high, false);
    view.setUint32(offset + 4, low, false);
}

// Array Search Helpers (bypass ES6 prototype method dependency)
function findChild(parent, type) {
    if (!parent || !parent.children) return null;
    for (var k = 0; k < parent.children.length; k++) {
        if (parent.children[k].type === type) return parent.children[k];
    }
    return null;
}

function findAtomInList(atoms, type) {
    if (!atoms) return null;
    for (var k = 0; k < atoms.length; k++) {
        if (atoms[k].type === type) return atoms[k];
    }
    return null;
}

function findIndexInList(list, type) {
    if (!list) return -1;
    for (var k = 0; k < list.length; k++) {
        if (list[k].type === type) return k;
    }
    return -1;
}

// Maps M4A 4-byte atom types to human-readable tag keys.
var TAG_MAPPING = {
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

// Derived inverse mapping to resolve tag keys to M4A atom types.
var TAG_TO_ATOM = {};
var mapKeys = Object.keys(TAG_MAPPING);
for (var i = 0; i < mapKeys.length; i++) {
    var atom = mapKeys[i];
    var key = TAG_MAPPING[atom];
    if (!TAG_TO_ATOM[key] || (atom === '\xa9ART' && TAG_TO_ATOM[key] === '\xa9art')) {
        TAG_TO_ATOM[key] = atom;
    }
}

// Reads size and type boundaries of an atom header.
function readAtomHeader(bytes, offset) {
    if (offset + 8 > bytes.length) return null;
    var view = new DataView(bytes.buffer, bytes.byteOffset + offset, 8);
    var size = view.getUint32(0, false);
    var type = bytesToString(bytes, offset + 4, offset + 8, 'latin1');
    var headerSize = 8;
    var actualSize = size;

    if (size === 1) {
        if (offset + 16 > bytes.length) return null;
        var viewLong = new DataView(bytes.buffer, bytes.byteOffset + offset + 8, 8);
        actualSize = readUInt64(viewLong, 0);
        headerSize = 16;
    }
    return {type: type, size: actualSize, headerSize: headerSize};
}

// Scans top-level atoms in the buffer sequentially.
function scanTopLevelAtoms(bytes) {
    var atoms = [];
    var pos = 0;
    while (pos < bytes.length) {
        var header = readAtomHeader(bytes, pos);
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

// Finds or creates a child atom in a parent container tree.
function getOrCreateChild(parent, type, headerBytes, metaPrefix) {
    if (metaPrefix === undefined) metaPrefix = null;
    var child = findChild(parent, type);
    if (!child) {
        child = {type: type, headerSize: headerBytes.length, headerBytes: headerBytes, children: []};
        if (metaPrefix) child.metaPrefix = metaPrefix;
        parent.children.push(child);
    }
    return child;
}

// Recursively parses the binary buffer into a structured atom tree. Optimized: Only iterates within metadata containers
// (moov, udta, meta, ilst) to bypass allocating track timelines on javascript heap.
function parseAtomTree(bytes, offset, endOffset) {
    var header = readAtomHeader(bytes, offset);
    if (!header) {
        throw new Error('Out of bounds reading atom header.');
    }
    var payloadOffset = offset + header.headerSize;
    var payloadSize = header.size - header.headerSize;

    // Optimized containerTypes list: skips tracking nested trak, mdia, etc., but parses metadata fields
    var containerTypes = [
        'moov',    'udta',    'meta',    'ilst',    '\xa9nam', '\xa9art', '\xa9ART', 'aART',
        '\xa9alb', '\xa9day', '\xa9gen', 'trkn',    '\xa9wrt', '\xa9too', 'cprt',    'covr',
        '\xa9grp', 'keyw',    '\xa9lyr', '\xa9cmt', 'tmpo',    'cpil',    'disk'
    ];

    var atom = {
        type: header.type,
        headerSize: header.headerSize,
        headerBytes: bytes.subarray(offset, payloadOffset),
        children: []
    };

    var isContainer = containerTypes.indexOf(header.type) !== -1;
    if (isContainer && payloadSize > 0) {
        var childOffset = payloadOffset;
        if (header.type === 'meta') {
            atom.metaPrefix = bytes.subarray(payloadOffset, payloadOffset + 4);
            childOffset += 4;
        }
        var childrenEnd = offset + header.size;
        while (childOffset < childrenEnd) {
            if (childOffset + 8 > childrenEnd) break;
            var childHeader = readAtomHeader(bytes, childOffset);
            if (!childHeader || childHeader.size === 0) break;
            var child = parseAtomTree(bytes, childOffset, childrenEnd);
            atom.children.push(child);
            childOffset += childHeader.size;
        }
    } else {
        atom.payload = bytes.subarray(payloadOffset, payloadOffset + payloadSize);
    }
    return atom;
}

// Scans a trak byte buffer in-place to find and shift offsets in stco or co64 index tables.
function shiftStcoInBytes(bytes, delta) {
    if (delta === 0) return;
    var view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

    // Find 'stco' in bytes (4-byte signature: [115, 116, 99, 111])
    var pos = 0;
    while (pos + 8 <= bytes.length) {
        // checking [s, t, c, o]
        if (bytes[pos] === 115 && bytes[pos + 1] === 116 && bytes[pos + 2] === 99 && bytes[pos + 3] === 111) {
            var size = view.getUint32(pos - 4, false);
            if (pos - 4 + size <= bytes.length) {
                var count = view.getUint32(pos + 8, false);
                for (var i = 0; i < count; i++) {
                    var idx = pos + 12 + i * 4;
                    if (idx + 4 <= bytes.length) {
                        var val = view.getUint32(idx, false);
                        view.setUint32(idx, val + delta, false);
                    }
                }
            }
            break;
        }
        // Find 'co64' in bytes (4-byte signature: [99, 111, 54, 52])
        if (bytes[pos] === 99 && bytes[pos + 1] === 111 && bytes[pos + 2] === 54 && bytes[pos + 3] === 52) {
            var size = view.getUint32(pos - 4, false);
            if (pos - 4 + size <= bytes.length) {
                var count = view.getUint32(pos + 8, false);
                for (var i = 0; i < count; i++) {
                    var idx = pos + 12 + i * 8;
                    if (idx + 8 <= bytes.length) {
                        var val = readUInt64(view, idx);
                        writeUInt64(view, val + delta, idx);
                    }
                }
            }
            break;
        }
        pos++;
    }
}

// Recursively serializes the atom tree back into a binary buffer, adjusting chunk offset indexing tables (`stco` /
// `co64`) by the shift delta. Optimized: Runs in-place offset adjustments directly on the trak byte arrays and avoids
// string encoding allocations.
function serializeAtomTree(atom, delta) {
    if (delta === undefined) delta = 0;
    // If track atom payload is encountered, apply offset shifts to stco/co64 directly
    if (delta !== 0 && atom.type === 'trak') {
        shiftStcoInBytes(atom.payload, delta);
    }

    if (atom.children && atom.children.length > 0) {
        var serializedChildren = [];
        for (var i = 0; i < atom.children.length; i++) {
            serializedChildren.push(serializeAtomTree(atom.children[i], delta));
        }

        var payloadLength = 0;
        for (var i = 0; i < serializedChildren.length; i++) {
            payloadLength += serializedChildren[i].length;
        }
        if (atom.type === 'meta') {
            payloadLength += 4;
        }

        var header = new Uint8Array(atom.headerSize);
        var view = new DataView(header.buffer, header.byteOffset, header.byteLength);
        view.setUint32(0, payloadLength + atom.headerSize, false);

        // Optimized: Set type string characters directly (allocation-free)
        header[4] = atom.type.charCodeAt(0);
        header[5] = atom.type.charCodeAt(1);
        header[6] = atom.type.charCodeAt(2);
        header[7] = atom.type.charCodeAt(3);

        var parts = [header];
        if (atom.type === 'meta') {
            parts.push(atom.metaPrefix);
        }
        parts = parts.concat(serializedChildren);
        return concatUint8Arrays(parts);
    } else {
        var header = new Uint8Array(atom.headerSize);
        var view = new DataView(header.buffer, header.byteOffset, header.byteLength);
        view.setUint32(0, atom.payload.length + atom.headerSize, false);

        // Set type characters directly
        header[4] = atom.type.charCodeAt(0);
        header[5] = atom.type.charCodeAt(1);
        header[6] = atom.type.charCodeAt(2);
        header[7] = atom.type.charCodeAt(3);

        return concatUint8Arrays([header, atom.payload]);
    }
}

// Decodes metadata fields from parsed tags located inside the `ilst` atom parent.
function extractTags(ilstAtom) {
    var tags = {};
    if (!ilstAtom || !ilstAtom.children) return tags;

    for (var i = 0; i < ilstAtom.children.length; i++) {
        var tagAtom = ilstAtom.children[i];
        var key = TAG_MAPPING[tagAtom.type];
        if (!key) continue;

        var dataAtom = findChild(tagAtom, 'data');
        if (!dataAtom || !dataAtom.payload) continue;

        var payload = dataAtom.payload;
        if (payload.length < 8) continue;

        var view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
        var typeClass = readUIntBE(view, 1, 3);
        var valueBuf = payload.subarray(8);

        if (key === 'track' || key === 'disc') {
            if (valueBuf.length >= 6) {
                var valView = new DataView(valueBuf.buffer, valueBuf.byteOffset, valueBuf.byteLength);
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
            var valView = new DataView(valueBuf.buffer, valueBuf.byteOffset, valueBuf.byteLength);
            tags[key] = readUIntBE(valView, 0, valueBuf.length);
        } else {
            tags[key] = bytesToString(valueBuf, 0, valueBuf.length, 'utf8');
        }
    }
    return tags;
}

// Creates a valid M4A metadata tag atom containing a sub-atom 'data'.
function createTagAtom(type, value, isPicture) {
    if (isPicture === undefined) isPicture = false;
    var valueBuf;
    var typeClass;  // 1 = text, 13 = JPEG cover, 14 = PNG cover, 21 = uint

    if (isPicture) {
        valueBuf = value.data;
        typeClass = value.format === 'png' ? 14 : 13;
    } else if (typeof value === 'number') {
        valueBuf = new Uint8Array(4);
        var valView = new DataView(valueBuf.buffer, valueBuf.byteOffset, valueBuf.byteLength);
        valView.setUint32(0, value, false);
        typeClass = 21;
    } else {
        valueBuf = stringToBytes(String(value), 'utf8');
        typeClass = 1;
    }

    var dataAtomHeader = new Uint8Array(16);
    var headerView = new DataView(dataAtomHeader.buffer, dataAtomHeader.byteOffset, dataAtomHeader.byteLength);
    headerView.setUint32(0, 16 + valueBuf.length, false);

    // Set 'data' characters directly (allocation-free)
    dataAtomHeader[4] = 100;                   // 'd'
    dataAtomHeader[5] = 97;                    // 'a'
    dataAtomHeader[6] = 116;                   // 't'
    dataAtomHeader[7] = 97;                    // 'a'
    writeUIntBE(headerView, typeClass, 9, 3);  // 3-byte class flags

    var dataAtom = {
        type: 'data',
        headerSize: 8,
        headerBytes: dataAtomHeader.subarray(0, 8),
        payload: concatUint8Arrays([dataAtomHeader.subarray(8, 16), valueBuf])
    };

    var tagAtomHeader = new Uint8Array(8);
    tagAtomHeader[4] = type.charCodeAt(0);
    tagAtomHeader[5] = type.charCodeAt(1);
    tagAtomHeader[6] = type.charCodeAt(2);
    tagAtomHeader[7] = type.charCodeAt(3);

    return {type: type, headerSize: 8, headerBytes: tagAtomHeader, children: [dataAtom]};
}

// Scans the binary buffer in-place to verify that the file meets essential M4A structure expectations (ftyp signature,
// plus mdat and moov containers). Performs zero allocations and runs in under 10 microseconds.
function verifyM4AStructure(bytes) {
    if (bytes.length < 8) return false;

    // 1. Verify ftyp signature
    if (bytesToString(bytes, 4, 8, 'latin1') !== 'ftyp') return false;

    // 2. Scan top-level atoms for mdat and moov
    var atoms = scanTopLevelAtoms(bytes);
    var hasMdat = false;
    var hasMoov = false;
    for (var i = 0; i < atoms.length; i++) {
        if (atoms[i].type === 'mdat') hasMdat = true;
        if (atoms[i].type === 'moov') hasMoov = true;
    }

    return hasMdat && hasMoov;
}

// Helper to recursively find an atom of a specific type in the tree structure.
function findAtom(atom, type) {
    if (atom.type === type) return atom;
    var children = atom.children || [];
    for (var i = 0; i < children.length; i++) {
        var found = findAtom(children[i], type);
        if (found) return found;
    }
    return null;
}

// Core parsing algorithm operating on a Uint8Array.
function parseM4ABytes(bytes) {
    if (!verifyM4AStructure(bytes)) {
        throw new Error(
            'Unsupported or invalid file structure. Only M4A (.m4a) files with valid audio and metadata containers are supported.');
    }

    var atoms = scanTopLevelAtoms(bytes);
    var moovDescriptor = findAtomInList(atoms, 'moov');
    if (!moovDescriptor) return {};

    var moovAtom = parseAtomTree(bytes, moovDescriptor.offset, moovDescriptor.offset + moovDescriptor.size);

    var tagsResult = {};
    var udta = findChild(moovAtom, 'udta');
    if (udta) {
        var meta = findChild(udta, 'meta');
        if (meta) {
            var ilst = findChild(meta, 'ilst');
            if (ilst) {
                tagsResult = extractTags(ilst);
            }
        }
    }

    // Extract play duration from mvhd if it exists
    var mvhd = findAtom(moovAtom, 'mvhd');
    if (mvhd && mvhd.payload) {
        var payload = mvhd.payload;
        var version = payload[0];
        var timescale = 0;
        var duration = 0;
        if (version === 0 && payload.length >= 20) {
            var view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
            timescale = view.getUint32(12, false);
            duration = view.getUint32(16, false);
        } else if (version === 1 && payload.length >= 32) {
            var view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
            timescale = view.getUint32(20, false);
            duration = readUInt64(view, 24);
        }
        if (timescale > 0) {
            tagsResult.duration = duration / timescale;
        }
    }

    return tagsResult;
}

// Core modifying algorithm operating on a Uint8Array and outputting a new Uint8Array. Supporting zero-copy returns via
// options.returnParts.
function writeM4ABytes(bytes, newTags, options) {
    if (options === undefined) options = {};
    if (!verifyM4AStructure(bytes)) {
        throw new Error(
            'Unsupported or invalid file structure. Only M4A (.m4a) files with valid audio and metadata containers are supported.');
    }

    var atomsList = scanTopLevelAtoms(bytes);
    var moovIndex = findIndexInList(atomsList, 'moov');
    if (moovIndex === -1) {
        throw new Error('Invalid or corrupted M4A file structure.');
    }

    // Parse moov
    var moovDescriptor = atomsList[moovIndex];
    var moovAtom = parseAtomTree(bytes, moovDescriptor.offset, moovDescriptor.offset + moovDescriptor.size);

    // 2. Traverses/constructs the udta -> meta -> ilst path recursively
    var udta = getOrCreateChild(moovAtom, 'udta', stringToBytes('\x00\x00\x00\x08udta', 'latin1'));
    var meta = getOrCreateChild(udta, 'meta', stringToBytes('\x00\x00\x00\x0cmeta', 'latin1'), new Uint8Array(4));
    var ilst = getOrCreateChild(meta, 'ilst', stringToBytes('\x00\x00\x00\x08ilst', 'latin1'));

    // 3. Rebuilds/appends the metadata tag atoms list
    var newKeys = Object.keys(newTags);
    for (var i = 0; i < newKeys.length; i++) {
        var key = newKeys[i];
        var val = newTags[key];
        var atomType = TAG_TO_ATOM[key];
        if (!atomType) continue;

        var isPicture = key === 'picture';
        var newTagAtom = createTagAtom(atomType, val, isPicture);

        var oldIndex = findIndexInList(ilst.children, atomType);
        if (oldIndex !== -1) {
            ilst.children[oldIndex] = newTagAtom;
        } else {
            ilst.children.push(newTagAtom);
        }
    }

    // 4. Calculate change in moov size
    var tempMoovBytes = serializeAtomTree(moovAtom, 0);
    var newMoovSize = tempMoovBytes.length;

    // 5. Calculate precise new mdat offset to retrieve correct shift amount
    var currentNewOffset = 0;
    var oldMdatOffset = 0;
    var newMdatOffset = 0;
    var hasMdat = false;

    for (var i = 0; i < atomsList.length; i++) {
        var atom = atomsList[i];
        if (atom.type === 'mdat') {
            oldMdatOffset = atom.offset;
            newMdatOffset = currentNewOffset;
            hasMdat = true;
        }
        var atomSize = (atom.type === 'moov') ? newMoovSize : atom.size;
        currentNewOffset += atomSize;
    }

    // 6. Shift chunk offsets by the exact delta offset
    var shiftAmount = hasMdat ? (newMdatOffset - oldMdatOffset) : 0;
    var finalMoovBytes = serializeAtomTree(moovAtom, shiftAmount);

    // 7. Concatenate all atoms back preserving original order
    var outputParts = [];
    for (var i = 0; i < atomsList.length; i++) {
        var atom = atomsList[i];
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
    // FILE: /js/utils/promise.js
    // ============================================================

// src/js/utils/promise.js

// Expose Utils namespace
window.Utils = window.Utils || {};

// setImmediate fallback for Node v0.8.x and browser environments
var localSetImmediate = typeof setImmediate === 'function' ? setImmediate : function(fn) {
    setTimeout(fn, 0);
};

function FallbackPromise(executor) {
    var self = this;
    self.state = 'pending';
    self.value = undefined;
    self.callbacks = [];

    function resolve(val) {
        if (self.state !== 'pending') return;
        if (val && typeof val.then === 'function') {
            val.then(resolve, reject);
            return;
        }
        self.state = 'fulfilled';
        self.value = val;
        self.callbacks.forEach(function(cb) {
            cb.onFulfilled(val);
        });
    }

    function reject(reason) {
        if (self.state !== 'pending') return;
        self.state = 'rejected';
        self.value = reason;
        self.callbacks.forEach(function(cb) {
            cb.onRejected(reason);
        });
    }

    try {
        executor(resolve, reject);
    } catch (e) {
        reject(e);
    }
}

FallbackPromise.prototype.then = function(onFulfilled, onRejected) {
    var self = this;
    return new FallbackPromise(function(resolve, reject) {
        function handle(value) {
            try {
                if (self.state === 'fulfilled') {
                    if (typeof onFulfilled === 'function') {
                        resolve(onFulfilled(value));
                    } else {
                        resolve(value);
                    }
                } else if (self.state === 'rejected') {
                    if (typeof onRejected === 'function') {
                        resolve(onRejected(value));
                    } else {
                        reject(value);
                    }
                }
            } catch (e) {
                reject(e);
            }
        }

        if (self.state === 'pending') {
            self.callbacks.push({onFulfilled: handle, onRejected: handle});
        } else {
            localSetImmediate(function() {
                handle(self.value);
            });
        }
    });
};

FallbackPromise.prototype.catch = function(onRejected) {
    return this.then(null, onRejected);
};

FallbackPromise.resolve = function(val) {
    return new FallbackPromise(function(resolve) {
        resolve(val);
    });
};

FallbackPromise.reject = function(reason) {
    return new FallbackPromise(function(resolve, reject) {
        reject(reason);
    });
};

FallbackPromise.all = function(promises) {
    return new FallbackPromise(function(resolve, reject) {
        var results = [];
        var completed = 0;
        if (promises.length === 0) return resolve(results);
        promises.forEach(function(p, i) {
            FallbackPromise.resolve(p).then(function(val) {
                results[i] = val;
                completed++;
                if (completed === promises.length) resolve(results);
            }, reject);
        });
    });
};

// Bind to unified wrapper
window.Utils.Promise = window.Promise || FallbackPromise;


    // ============================================================
    // FILE: /js/utils/decrypt.js
    // ============================================================

// src/js/utils/decrypt.js

const KEY = new Uint32Array([
    36443656,  338827529, 170141697, 338826299, 170272797, 875566612, 170276616, 941097494,
    153487137, 941103620, 154281006, 940128288, 221380890, 688468270, 621941049, 688727305,
    622007300, 151861785, 890309646, 184882698, 874054925, 50799890,  874062625, 117842443,
    805908001, 119942188, 839720978, 102894652, 302780946, 103954180, 302782501, 338829583
]);

// Decrypt media URL
function decryptMediaUrl(encrypted) {
    // Get the DES implementation
    const desDecrypt = window.desDecrypt;

    if (!desDecrypt) {
        throw new Error('DES decryption library not available');
    }

    var binaryString;
    if (typeof atob === 'function') {
        binaryString = atob(encrypted);
    } else {
        binaryString = new Buffer(encrypted, 'base64').toString('binary');
    }

    const plain = desDecrypt(binaryString, KEY);
    return plain.slice(0, -plain.charCodeAt(plain.length - 1));
}

// Get decrypted URL from song object and format it with quality
function getDecryptedUrl(songData, quality) {
    var encrypted = songData.more_info ? songData.more_info.encrypted_media_url : null;
    if (!encrypted) throw new Error('No encrypted URL found');

    var decryptedUrl = decryptMediaUrl(encrypted);
    if (!decryptedUrl) throw new Error('Decryption failed');

    if (typeof window.Utils !== 'undefined' && window.Utils.formatters &&
        typeof window.Utils.formatters.formatUrlWithQuality === 'function') {
        return window.Utils.formatters.formatUrlWithQuality(decryptedUrl, quality || window.currentQuality || 96);
    }
    return decryptedUrl;
}

// Expose to browser
if (typeof window !== 'undefined') {
    window.decryptMediaUrl = decryptMediaUrl;
    window.Utils = window.Utils || {};
    window.Utils.getDecryptedUrl = getDecryptedUrl;
}


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

function handleResponse(response, responseType, url) {
    if (!response.ok) {
        console.error('[Utils Fetch Error] Server returnedStatus:', response.status, 'for:', url);
        throw new Error('HTTP ' + response.status);
    }

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
    return (window.Utils.fetch || fetch)(url, {headers: getHeaders()}).then(function(response) {
        return handleResponse(response, responseType, url);
    });
}

function fetchViaGM(url, responseType) {
    return new window.Utils.Promise(function(resolve, reject) {
        GM_xmlhttpRequest({
            method: 'GET',
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

window.Utils.getHighResImageUrl = function(url, isArtist) {
    if (!url) return '';
    return isArtist ? url.replace(/_50x50\.jpg$/, '_150x150.jpg') : url.replace(/\d+x\d+\.jpg$/, '500x500.jpg');
};

function processAlbumArt(buffer) {
    var artBytes = new Uint8Array(buffer);
    console.log('[Utils] Album art loaded:', (artBytes.length / 1024).toFixed(1) + ' KB');
    return {data: artBytes, format: 'jpeg'};
}

window.Utils.fetchAlbumArt = function(url) {
    if (!url) return window.Utils.Promise.resolve(null);
    var highResUrl = window.Utils.getHighResImageUrl(url, false);
    console.log('[Utils] Album art:', highResUrl);

    return window.Utils.fetchResource(highResUrl, 'arraybuffer').then(processAlbumArt).catch(function() {
        console.log('[Utils] High-res failed, trying original...');
        return window.Utils.fetchResource(url, 'arraybuffer').then(processAlbumArt).catch(function() {
            console.warn('[Utils] Album art fetch failed');
            return null;
        });
    });
};


    // ============================================================
    // FILE: /js/utils/formatters.js
    // ============================================================

// src/js/utils/formatters.js

window.Utils = window.Utils || {};
window.Utils.formatters = window.Utils.formatters || {};

// ============ DECODE ============
window.Utils.formatters.decode = function(text) {
    if (!text) return '';
    return text.replace(/&amp;/g, '&').replace(/&#039;/g, '\'').replace(/&quot;/g, '"');
};

// ============ EXTRACT TOKEN ============
window.Utils.formatters.extractToken = function(url) {
    if (!url) return '';
    return url.split('/').pop() || '';
};



// ============ HIGH RES ARTIST IMAGE ============
window.Utils.formatters.getHighResArtistImage = function(url) {
    return window.Utils.getHighResImageUrl(url, true);
};

window.Utils.formatters.formatLyrics = function(rawLyrics) {
    return rawLyrics.replace(/<br>/g, '\n');
};

// Replace bitrate in decrypted URL with selected quality Example: https://.../song_96.mp4 -> https://.../song_320.mp4
window.Utils.formatters.formatUrlWithQuality = function(url, quality) {
    if (!url) return url;
    if (!quality) quality = 96;

    // Match pattern like _96.mp4, _160.mp4, _320.mp4
    // Replace with selected quality
    return url.replace(/_(\d+)\.mp4/, '_' + quality + '.mp4');
};

// ============ EXTRACT ARTISTS ============
window.Utils.formatters.extractArtists = function(songData) {
    var artistMap = songData.more_info ? songData.more_info.artistMap : null;

    var primaryArtists = (artistMap && artistMap.primary_artists) ? artistMap.primary_artists : [];
    var featuredArtists = (artistMap && artistMap.featured_artists) ? artistMap.featured_artists : [];

    var primaryNames = primaryArtists.map(function(a) {
        return a.name;
    });
    var featuredNames = featuredArtists.map(function(a) {
        return a.name;
    });
    var allNames = primaryNames.concat(featuredNames);
    var primaryArtist = primaryNames[0] || '';
    var allArtists = allNames.join(', ');

    return {
        primary: primaryArtists,
        featured: featuredArtists,
        primaryNames: primaryNames,
        featuredNames: featuredNames,
        allNames: allNames,
        primaryArtist: primaryArtist,
        allArtists: allArtists
    };
};

// ============ GET ALBUM NAME ============
window.Utils.formatters.getAlbumName = function(songData) {
    var albumName = songData.more_info ? window.Utils.formatters.decode(songData.more_info.album || '') : '';
    if (!albumName) {
        var subtitleParts = window.Utils.formatters.decode(songData.subtitle || '').split(' - ');
        if (subtitleParts.length > 1) {
            albumName = subtitleParts[subtitleParts.length - 1];
        }
    }
    return albumName;
};

// ============ GET COPYRIGHT ============
window.Utils.formatters.getCopyright = function(songData) {
    return songData.more_info ? window.Utils.formatters.decode(songData.more_info.copyright_text || '') : '';
};

// ============ FORMAT SEARCH RESULTS ============
window.Utils.formatters.formatSearchResults = function(data, type) {
    var results = (data.results || []).filter(function(item) {
        return item.type === type;
    });

    if (type === 'song') {
        results = results.map(window.Utils.formatters.formatSong);
    } else if (type === 'album') {
        results = results.map(window.Utils.formatters.formatAlbum);
    } else if (type === 'playlist') {
        results = results.map(window.Utils.formatters.formatPlaylist);
    } else if (type === 'artist') {
        results = results.map(window.Utils.formatters.formatArtistSearch);
    }

    return {total: Number(data.total || 0), start: Number(data.start || 0), results: results};
};

// ============ SONG FORMATTER ============
window.Utils.formatters.formatSong = function(song) {
    return {
        id: song.id,
        token: window.Utils.formatters.extractToken(song.perma_url),
        title: window.Utils.formatters.decode(song.title),
        subtitle: window.Utils.formatters.decode(song.subtitle),
        image: song.image || '',
        language: song.language,
        year: song.year,
        play_count: song.play_count || '0',
        more_info: {
            duration: song.more_info ? song.more_info.duration || 'N/A' : 'N/A',
            encrypted_media_url: song.more_info ? song.more_info.encrypted_media_url || '' : '',
            album: song.more_info ? window.Utils.formatters.decode(song.more_info.album || '') : '',
            album_url: song.more_info ? song.more_info.album_url || '' : '',
            artistMap: song.more_info ? song.more_info.artistMap || null : null
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
        more_info: {song_count: album.more_info ? album.more_info.song_count || '0' : '0'}
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
            return window.Utils.formatters.formatSong(song);
        })
    };
};

// ============ PLAYLIST FORMATTER ============
window.Utils.formatters.formatPlaylist = function(playlist) {
    return {
        id: playlist.id,
        token: window.Utils.formatters.extractToken(playlist.perma_url),
        title: window.Utils.formatters.decode(playlist.title),
        subtitle: window.Utils.formatters.decode(playlist.subtitle || ''),
        image: playlist.image || '',
        language: playlist.more_info ? playlist.more_info.language || '' : '',
        year: '',
        more_info: {song_count: playlist.more_info ? playlist.more_info.song_count || '0' : '0'}
    };
};

// ============ PLAYLIST DETAIL FORMATTER ============
window.Utils.formatters.formatPlaylistDetail = function(data) {
    return {
        id: data.id,
        token: window.Utils.formatters.extractToken(data.perma_url),
        title: window.Utils.formatters.decode(data.title),
        image: data.image || '',
        language: data.language || '',
        year: '',
        list_count: parseInt(data.list_count) || 0,
        song_count: parseInt(data.song_count) || parseInt(data.list_count) || data.list ? data.list.length : 0,
        description: data.header_desc || '',
        songs: (data.list || []).map(function(song) {
            return window.Utils.formatters.formatSong(song);
        })
    };
};

// ============ ARTIST SEARCH FORMATTER ============
window.Utils.formatters.formatArtistSearch = function(artist) {
    return {
        id: artist.id,
        token: window.Utils.formatters.extractToken(artist.perma_url),
        name: artist.name || '',
        image: window.Utils.formatters.getHighResArtistImage(artist.image) || '',
        role: artist.role || 'Artist',
        type: 'artist'
    };
};

// ============ ARTIST DETAIL FORMATTER ============
window.Utils.formatters.formatArtistDetail = function(data) {
    // Parse bio
    var bioText = '';
    if (data.bio) {
        try {
            var bioArray = JSON.parse(data.bio);
            if (Array.isArray(bioArray) && bioArray.length > 0) {
                bioText = bioArray[0].text || '';
            }
        } catch (e) {
            bioText = data.bio;
        }
    }

    return {
        id: data.artistId,
        token: window.Utils.formatters.extractToken(data.perma_url),
        name: data.name || '',
        image: data.image || '',
        subtitle: data.subtitle || '',
        // fan_count removed (duplicate of subtitle)
        isVerified: data.isVerified || false,
        bio: bioText,  // Already parsed
        // First page songs and albums
        songs: (data.topSongs || []).map(window.Utils.formatters.formatSong),
        albums: (data.topAlbums || []).map(window.Utils.formatters.formatAlbum),
        // Other sections
        dedicatedPlaylists: (data.dedicated_artist_playlist || []).map(window.Utils.formatters.formatPlaylist),
        featuredPlaylists: (data.featured_artist_playlist || []).map(window.Utils.formatters.formatPlaylist),
        singles: (data.singles || []).map(window.Utils.formatters.formatAlbum),
        latestReleases: (data.latest_release || []).map(window.Utils.formatters.formatAlbum),
        // Store artistId for more API calls
        artistId: data.artistId
    };
};

// ============ DECRYPTED SONG FORMATTER ============
window.Utils.formatters.formatDecryptedSong = function(songData, decryptedUrl) {
    var rawData = songData;

    // Extract artist info from songData
    var artists = window.Utils.formatters.extractArtists(rawData);

    // Get album name from songData
    var albumName = window.Utils.formatters.getAlbumName(rawData);

    // Get copyright from songData
    var copyright = window.Utils.formatters.getCopyright(rawData);

    return {
        title: window.Utils.formatters.decode(rawData.title),
        subtitle: window.Utils.formatters.decode(rawData.subtitle),
        token: window.Utils.formatters.extractToken(rawData.perma_url) || rawData.id,
        image: rawData.image || '',
        year: rawData.year || '',
        language: rawData.language || '',
        has_lyrics: !!(rawData.more_info && rawData.more_info.has_lyrics === 'true'),
        artist: artists.allArtists,
        primary_artist: artists.primaryArtist,
        all_artists: artists.allArtists,
        album: albumName,
        copyright: copyright,
        url: decryptedUrl
    };
};


    // ============================================================
    // FILE: /js/utils/url-helper.js
    // ============================================================

// src/js/utils/url-helper.js

window.Utils = window.Utils || {};

// Parse URL to extract type and token
window.Utils.parseUrl = function(url) {
    if (!url) return {type: null, token: null};

    // Check if it's a valid URL
    if (url.indexOf(window.API.constants.API_HOST) === -1) {
        return {type: null, token: null};
    }

    // Determine type from URL
    var type = null;
    if (url.indexOf('/song/') !== -1) {
        type = 'song';
    } else if (url.indexOf('/album/') !== -1) {
        type = 'album';
    } else if (url.indexOf('/lyrics/') !== -1) {
        type = 'lyrics';
    } else if (url.indexOf('/featured/') !== -1) {
        type = 'playlist';
    } else if (url.indexOf('/artist/') !== -1) {
        type = 'artist';
    } else {
        return {type: null, token: null};
    }

    // Extract token (last part after /)
    var token = window.Utils.formatters.extractToken(url);
    if (!token) {
        return {type: null, token: null};
    }

    return {type: type, token: token};
};


    // ============================================================
    // FILE: /js/utils/download-helper.js
    // ============================================================

// src/js/utils/download-helper.js

window.Utils = window.Utils || {};

// Trigger a file download in the browser
window.Utils.downloadFile = function(data, filename) {
    var blob = new Blob([data], {type: 'audio/mp4'});
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

// Build a filename from song metadata
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


// Build metadata object for M4A
window.Utils.buildMetadata = function(song, albumArt, lyrics) {
    var allArtists = song.all_artists || song.subtitle || '';

    var metadata = {
        title: song.title || '',
        artist: allArtists,
        album: song.album || '',
        year: song.year || '',
        genre: song.language || '',
        copyright: song.copyright || '',
        comment: 'Token: ' + (song.token || ''),
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


    // ============================================================
    // FILE: /js/api/fetch.js
    // ============================================================

// src/js/api/fetch.js

window.API = window.API || {};

// ============ ISOMORPHIC FETCH FALLBACK ============
var isomorphicFetch = function(url, options) {
    if (typeof fetch === 'function') {
        return fetch(url, options);
    }

    options = options || {};
    var urlStr = url.toString();

    function makeResponse(status, buffer) {
        return {
            ok: status >= 200 && status < 300,
            status: status,
            json: function() {
                return window.Utils.Promise.resolve(JSON.parse(buffer.toString('utf8')));
            },
            arrayBuffer: function() {
                var ab = new ArrayBuffer(buffer.length);
                var view = new Uint8Array(ab);
                for (var i = 0; i < buffer.length; i++) {
                    view[i] = buffer[i];
                }
                return window.Utils.Promise.resolve(ab);
            }
        };
    }

    // In-process Mock Server delegation for offline testing
    if (global.isProxy && (urlStr.indexOf('/proxy') !== -1 || urlStr.indexOf('/mock/') !== -1)) {
        return new window.Utils.Promise(function(resolve, reject) {
            var mockReq = {url: urlStr, method: options.method || 'GET', headers: options.headers || {}};
            var mockRes = {
                writeHead: function(status) {
                    this.status = status;
                },
                setHeader: function() {},
                end: function(body) {
                    var buf = typeof body === 'string' ? new Buffer(body) : body;
                    resolve(makeResponse(this.status || 200, buf));
                }
            };
            var mockServer;
            try {
                mockServer = require('./mock/mock-server.js');
            } catch (e) {
                mockServer = require('../mock/mock-server.js');
            }
            mockServer.handleRequest(mockReq, mockRes);
        });
    }

    // Native Node HTTP/HTTPS request loader
    var httpModule = urlStr.indexOf('https:') === 0 ? require('https') : require('http');
    return new window.Utils.Promise(function(resolve, reject) {
        var parsed = require('url').parse(urlStr);
        var reqOptions = {
            hostname: parsed.hostname,
            port: parsed.port,
            path: parsed.path,
            method: options.method || 'GET',
            headers: options.headers || {},
            rejectUnauthorized: false
        };
        var req = httpModule.request(reqOptions, function(res) {
            var chunks = [];
            res.on('data', function(chunk) {
                chunks.push(chunk);
            });
            res.on('end', function() {
                resolve(makeResponse(res.statusCode, Buffer.concat(chunks)));
            });
        });
        req.on('error', reject);
        if (options.body) {
            req.write(options.body);
        }
        req.end();
    });
};

window.Utils = window.Utils || {};
window.Utils.fetch = isomorphicFetch;

// ============ LOW-LEVEL FETCH ============
window.API._fetchAPI = function(url, options) {
    options = options || {};

    // Proxy mode (local development)
    if (window.isProxy) {
        console.log('[API] Using proxy for:', url.substring(0, 60) + '...');
        var proxyEndpoint =
            (typeof window !== 'undefined' && window.location) ? '/proxy' : 'http://localhost:3000/proxy';
        return isomorphicFetch(proxyEndpoint, {
                   method: 'POST',
                   headers: {
                       'X-Proxy-URL': url,
                       'X-Proxy-User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                       'X-Proxy-Cookie':
                           'DL=english; L=english; mm_latlong=19.0760%2C72.8777; geo=19.0760%2C72.8777%2CIN%2CMaharashtra%2CMumbai%2C400001'
                   }
               })
            .then(function(res) {
                if (!res.ok) {
                    console.error('[API Fetch Error] Server returnedStatus:', res.status, 'for:', url);
                    throw new Error('Proxy returned ' + res.status);
                }
                return res.json();
            });
    }

    // Direct fetch (userscript or browser)
    console.log('[API] Direct fetch for:', url.substring(0, 60) + '...');
    return isomorphicFetch(url, options).then(function(res) {
        if (!res.ok) {
            console.error('[API Fetch Error] Direct HTTP failed with status:', res.status, 'for:', url);
            throw new Error('HTTP ' + res.status);
        }
        return res.json();
    });
};

// ============ API CALL WRAPPER ============
window.API.callAPI = function(call, extraParams) {
    var defaults = window.API.constants.API_DEFAULTS;
    var params = {__call: call};
    Object.keys(defaults).forEach(function(k) {
        params[k] = defaults[k];
    });
    if (extraParams) {
        Object.keys(extraParams).forEach(function(k) {
            params[k] = extraParams[k];
        });
    }

    var url = window.API.constants.API_BASE;
    var qParts = [];
    Object.keys(params).forEach(function(key) {
        qParts.push(encodeURIComponent(key) + '=' + encodeURIComponent(params[key]));
    });
    var finalUrl = url + (url.indexOf('?') === -1 ? '?' : '&') + qParts.join('&');

    return window.API._fetchAPI(finalUrl, {headers: window.API.constants.DEFAULT_HEADERS});
};


    // ============================================================
    // FILE: /js/api/songs.js
    // ============================================================

// src/js/api/songs.js
// Pure API calls - no formatting or business logic

window.API = window.API || {};

// Search for songs - returns raw API response
window.API.searchSongs = function(query, limit, page) {
    return window.API.callAPI('search.getResults', {q: query, p: page || 1, n: limit || 20});
};

// Get song details by token - returns raw API response
window.API.getSong = function(token) {
    return window.API.callAPI('webapi.get', {token: token, type: 'song', includeMetaTags: 0});
};

// Get lyrics for a song by token
window.API.getLyrics = function(token) {
    return window.API.callAPI('webapi.get', {token: token, type: 'lyrics'});
};


    // ============================================================
    // FILE: /js/api/albums.js
    // ============================================================

// src/js/api/albums.js
// Pure API calls - no formatting or business logic

window.API = window.API || {};

// Search for albums - returns raw API response
window.API.searchAlbums = function(query, limit, page) {
    return window.API.callAPI('search.getAlbumResults', {q: query, p: page || 1, n: limit || 20});
};

// Get album details by token - returns raw API response
window.API.getAlbum = function(token) {
    return window.API.callAPI('webapi.get', {token: token, type: 'album', includeMetaTags: 0});
};


    // ============================================================
    // FILE: /js/api/playlists.js
    // ============================================================

// src/js/api/playlists.js
// Pure API calls - no formatting or business logic

window.API = window.API || {};

// Search for playlists - returns raw API response
window.API.searchPlaylists = function(query, limit, page) {
    return window.API.callAPI('search.getPlaylistResults', {q: query, p: page || 1, n: limit || 20});
};

// Get playlist details by token - returns raw API response Supports pagination for large playlists
window.API.getPlaylist = function(token, page, limit) {
    return window.API.callAPI(
        'webapi.get', {token: token, type: 'playlist', includeMetaTags: 0, p: page || 1, n: limit || 50});
};


    // ============================================================
    // FILE: /js/api/artists.js
    // ============================================================

// src/js/api/artists.js
// Pure API calls - no formatting or business logic

window.API = window.API || {};

// Search for artists - returns raw API response
window.API.searchArtists = function(query, limit, page) {
    return window.API.callAPI('search.getArtistResults', {q: query, p: page || 1, n: limit || 20});
};

// Get artist details by token - returns raw API response
window.API.getArtist = function(token, category) {
    return window.API.callAPI('webapi.get', {
        token: token,
        type: 'artist',
        p: 1,
        n_song: 10,
        n_album: 10,
        sub_type: '',
        category: category || 'popular',
        sort_order: category === 'latest' ? 'desc' : 'asc'
    });
};

// Get more songs by artist - returns raw API response
window.API.getArtistMoreSongs = function(artistId, page, category) {
    return window.API.callAPI('artist.getArtistMoreSong', {
        artistId: artistId,
        page: page || 1,
        category: category || 'popular',
        sort_order: category === 'latest' ? 'desc' : 'asc'
    });
};

// Get more albums by artist - returns raw API response
window.API.getArtistMoreAlbums = function(artistId, page, category) {
    return window.API.callAPI('artist.getArtistMoreAlbum', {
        artistId: artistId,
        page: page || 1,
        category: category || 'popular',
        sort_order: category === 'latest' ? 'desc' : 'asc'
    });
};


    // ============================================================
    // FILE: /js/services/song.js
    // ============================================================

// src/js/services/song.js
// Song business logic - orchestrates API calls and formatting

window.Services = window.Services || {};

window.Services.Song = {
    // Search for songs and format results
    search: function(query, limit, page) {
        return window.API.searchSongs(query, limit, page).then(function(rawData) {
            return window.Utils.formatters.formatSearchResults(rawData, 'song');
        });
    },

    // Get decrypted song URL and metadata
    getDecrypted: function(token) {
        return window.API.getSong(token).then(function(rawData) {
            var songData = rawData.songs ? rawData.songs[0] : null;
            if (!songData) throw new Error('Song not found');

            var decryptedUrl = window.Utils.getDecryptedUrl(songData, window.currentQuality || 96);
            return window.Utils.formatters.formatDecryptedSong(songData, decryptedUrl);
        });
    },

    // Get lyrics for a song and cache them
    getLyrics: function(token) {
        var cached = window.Cache.get('lyrics:' + token);
        if (cached) {
            return window.Utils.Promise.resolve(cached);
        }

        return window.API.getLyrics(token).then(function(data) {
            var lyricsText = data.lyrics && data.lyrics.lyrics ? data.lyrics.lyrics : 'No lyrics available';
            lyricsText = window.Utils.formatters.formatLyrics(lyricsText);

            window.Cache.set('lyrics:' + token, lyricsText);
            return lyricsText;
        });
    }
};


    // ============================================================
    // FILE: /js/services/album.js
    // ============================================================

// src/js/services/album.js

window.Services = window.Services || {};

window.Services.Album = {
    // Search for albums and format results
    search: function(query, limit, page) {
        return window.API.searchAlbums(query, limit, page).then(function(rawData) {
            return window.Utils.formatters.formatSearchResults(rawData, 'album');
        });
    },

    // Get album details with formatted songs
    getDetails: function(token) {
        return window.API.getAlbum(token).then(function(rawData) {
            return window.Utils.formatters.formatAlbumDetail(rawData);
        });
    }
};


    // ============================================================
    // FILE: /js/services/download.js
    // ============================================================

// src/js/services/download.js
// Download business logic

window.Services = window.Services || {};

window.Services.Download = {
    // Download a song from pre-fetched data (no API call)
    songFromData: function(songData, filename) {
        console.log('[Services] Downloading song from data:', songData.title);

        var songUrl = songData.url;
        if (!songUrl) return window.Utils.Promise.reject(new Error('No stream URL available'));

        songUrl = window.Utils.formatters.formatUrlWithQuality(songUrl, window.currentQuality || 96);

        // Initiate all requests in parallel
        var audioPromise = window.Utils.fetchResource(songUrl, 'arraybuffer');

        var artPromise =
            songData.image ? window.Utils.fetchAlbumArt(songData.image) : window.Utils.Promise.resolve(null);

        var lyricsPromise = songData.has_lyrics ?
            window.Services.Song.getLyrics(songData.token || songData.id).catch(function(e) {
                console.warn('[Services] Failed to fetch lyrics:', e.message);
                return null;
            }) :
            window.Utils.Promise.resolve(null);

        // Resolve all in parallel
        return window.Utils.Promise.all([audioPromise, artPromise, lyricsPromise]).then(function(results) {
            var audioBuffer = results[0];
            var albumArtData = results[1];
            var lyricsText = results[2];

            var audioBytes = new Uint8Array(audioBuffer);
            if (audioBytes.length === 0) {
                throw new Error('Audio file is empty (0 bytes)');
            }

            // Build metadata and tag M4A
            var metadata = window.Utils.buildMetadata(songData, albumArtData, lyricsText);
            console.log(
                '[Services] Metadata: title="' + songData.title + '", artist="' +
                (songData.artist || songData.all_artists) + '"');

            var dataToDownload = audioBytes;
            if (typeof window.writeM4ABytes === 'function') {
                try {
                    dataToDownload = window.writeM4ABytes(audioBytes, metadata);
                    console.log('[Services] Metadata written to M4A');
                } catch (e) {
                    console.warn('[Services] Metadata write failed:', e.message);
                }
            }

            var quality = window.currentQuality || 96;
            var finalFilename = filename || window.Utils.buildFilename(songData, quality);
            console.log('[Services] Filename:', finalFilename);

            return window.Utils.downloadFile(dataToDownload, finalFilename);
        });
    }
};


    // ============================================================
    // FILE: /js/services/playlist.js
    // ============================================================

// src/js/services/playlist.js
// Playlist business logic - orchestrates API calls and formatting

window.Services = window.Services || {};

window.Services.Playlist = {
    // Search for playlists and format results
    search: function(query, limit, page) {
        return window.API.searchPlaylists(query, limit, page).then(function(rawData) {
            return window.Utils.formatters.formatSearchResults(rawData, 'playlist');
        });
    },

    // Get playlist details with formatted songs Supports pagination
    getDetails: function(token, page, limit) {
        return window.API.getPlaylist(token, page, limit).then(function(rawData) {
            return window.Utils.formatters.formatPlaylistDetail(rawData);
        });
    }
};


    // ============================================================
    // FILE: /js/services/artist.js
    // ============================================================

// src/js/services/artist.js
// Artist business logic - orchestrates API calls and formatting

window.Services = window.Services || {};

window.Services.Artist = {
    // Search for artists and format results
    search: function(query, limit, page) {
        return window.API.searchArtists(query, limit, page).then(function(rawData) {
            return window.Utils.formatters.formatSearchResults(rawData, 'artist');
        });
    },

    // Get artist details with formatted songs and albums
    getDetails: function(token, category) {
        return window.API.getArtist(token, category).then(function(rawData) {
            return window.Utils.formatters.formatArtistDetail(rawData);
        });
    },

    // Get more songs by artist
    getMoreSongs: function(artistId, page, category) {
        return window.API.getArtistMoreSongs(artistId, page, category).then(function(rawData) {
            var songs = rawData.topSongs && rawData.topSongs.songs ? rawData.topSongs.songs : [];
            return {
                songs: songs.map(window.Utils.formatters.formatSong),
                total: rawData.topSongs ? rawData.topSongs.total || 0 : 0,
                last_page: rawData.topSongs ? rawData.topSongs.last_page !== false : true
            };
        });
    },

    // Get more albums by artist
    getMoreAlbums: function(artistId, page, category) {
        return window.API.getArtistMoreAlbums(artistId, page, category).then(function(rawData) {
            var albums = rawData.topAlbums && rawData.topAlbums.albums ? rawData.topAlbums.albums : [];
            return {
                albums: albums.map(window.Utils.formatters.formatAlbum),
                total: rawData.topAlbums ? rawData.topAlbums.total || 0 : 0,
                last_page: rawData.topAlbums ? rawData.topAlbums.last_page !== false : true
            };
        });
    }
};


    // ============================================================
    // FILE: /js/ui/display/song-card.js
    // ============================================================

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

    var html = '\n        <div class="song-card" data-token="' + (song.token || song.id) + '">\n' +
        '            <img src="' + image + '" alt="' + escapeHtml(song.title) + '" />\n' +
        '            <div class="song-info">\n' +
        '                <div class="song-title">' + titlePrefix + escapeHtml(song.title) + '</div>\n' +
        '                <div class="song-artist">' + escapeHtml(artistDisplay) + '</div>\n' +
        '                <div class="song-details">' + detailsHtml + '</div>\n' +
        '                <div class="song-actions">\n' +
        '                    <button class="btn-play" data-token="' + (song.token || song.id) + '" data-songid="' +
        songId + '" \n' + (!hasStream ? '                        disabled' : '') + '>\n' +
        '                        ▶\n' +
        '                    </button>\n' +
        '                    <button class="btn-download" data-token="' + (song.token || song.id) + '" data-songid="' +
        songId + '" \n' + (!hasStream ? '                        disabled' : '') + '>\n' +
        '                        ⬇\n' +
        '                    </button>\n' +
        (hasLyrics ? '                    <button class="btn-lyrics" data-token="' + song.token + '" data-songid="' +
                 songId + '">📜</button>\n' :
                     '') +
        (hasMoreActions ? '                    <div style="position: relative; display: inline-block;">\n' +
                 '                        <button class="btn-more" data-token="' + song.token + '" data-songid="' +
                 songId + '">⋮</button>\n' +
                 '                        <div class="more-menu" id="more-menu-' + songId +
                 '" style="display:none; position: absolute; right: 0; top: 100%;">\n' +
                 (showAlbumInMenu ?
                      '                            <button class="more-item" data-action="album" data-token="' +
                          albumToken + '">💿 ' + escapeHtml(albumName) + '</button>\n' :
                      '') +
                 artists
                     .map(function(artist) {
                         return '                            <button class="more-item" data-action="artist" data-token="' +
                             artist.token + '">🎤 ' + escapeHtml(artist.name) + '</button>\n';
                     })
                     .join('') +
                 '                        </div>\n' +
                 '                    </div>\n' :
                          '') +
        '                    <div class="play-progress" id="play-progress-' + songId + '">⏳ Decrypting...</div>\n' +
        '                    <div class="download-progress" id="download-progress-' + songId +
        '">⏳ Downloading...</div>\n' +
        (!hasStream ? '                    <span style="color:#999;font-size:12px;">No stream</span>\n' : '') +
        '                </div>\n' +
        '            </div>\n' +
        '        </div>\n    ';

    return html;
}


    // ============================================================
    // FILE: /js/ui/display/display-results.js
    // ============================================================

// src/js/ui/display/display-results.js

// ============ DISPLAY SONGS ============
function displaySongs(songs) {
    var html = '<div class="results">';

    songs.forEach(function(song, index) {
        html += createSongCard(song, index);
    });

    html += '</div>';
    DOM.results.innerHTML = html;

    // Attach song data to cards
    var cards = DOM.results.querySelectorAll('.song-card');
    cards.forEach(function(card, index) {
        if (songs[index]) {
            card._songData = songs[index];
        }
    });
}

// ============ DISPLAY ALBUMS ============
function displayAlbums(albums) {
    var html = '<div class="results">';

    albums.forEach(function(album) {
        html += createAlbumCard(album);
    });

    html += '</div>';
    DOM.results.innerHTML = html;
}

// ============ DISPLAY PLAYLISTS ============
function displayPlaylists(playlists) {
    var html = '<div class="results">';

    playlists.forEach(function(playlist) {
        html += createPlaylistCard(playlist);
    });

    html += '</div>';
    DOM.results.innerHTML = html;
}

// ============ DISPLAY ARTISTS ============
function displayArtists(artists) {
    var html = '<div class="results">';

    artists.forEach(function(artist) {
        html += createArtistCard(artist);
    });

    html += '</div>';
    DOM.results.innerHTML = html;
}

// ============ DISPLAY SEARCH RESULTS ============
function displaySearchResults(results, type) {
    if (type === 'songs') {
        displaySongs(results);
    } else if (type === 'albums') {
        displayAlbums(results);
    } else if (type === 'playlists') {
        displayPlaylists(results);
    } else if (type === 'artists') {
        displayArtists(results);
    }
}

// ============ EXPOSE ============
window.displaySongs = displaySongs;
window.displayAlbums = displayAlbums;
window.displayPlaylists = displayPlaylists;
window.displayArtists = displayArtists;


    // ============================================================
    // FILE: /js/ui/display/album-view.js
    // ============================================================

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


    // ============================================================
    // FILE: /js/ui/display/playlist-view.js
    // ============================================================

// src/js/ui/display/playlist-view.js

// ============ LOAD MORE PLAYLIST ============
function loadMorePlaylist() {
    if (window._playlistState.isLoading) return window.Utils.Promise.resolve();
    window._playlistState.isLoading = true;

    var btn = document.getElementById('playlist-load-more-btn');
    if (btn) {
        btn.textContent = 'Loading...';
        btn.disabled = true;
    }

    var nextPage = window._playlistState.currentPage + 1;
    var cacheKey = window.Cache.getDetailKey('playlist', window._playlistState.token) + ':' + nextPage + ':' +
        window._playlistState.limit;

    var promise;

    // Check cache first
    if (window.Cache.has(cacheKey)) {
        console.log('[Display] Using cached playlist page:', nextPage);
        promise = window.Utils.Promise.resolve(window.Cache.get(cacheKey));
    } else {
        promise =
            window.Services.Playlist.getDetails(window._playlistState.token, nextPage, window._playlistState.limit)
                .then(function(data) {
                    window.Cache.set(cacheKey, data);
                    return data;
                });
    }

    return promise
        .then(function(data) {
            // Append songs
            if (data.songs && data.songs.length > 0) {
                var resultsDiv = document.getElementById('results');

                // Remove load more button
                var oldBtn = document.getElementById('playlist-load-more-btn');
                if (oldBtn) oldBtn.remove();

                // Calculate starting index for this page (global)
                var startIndex = (nextPage - 1) * window._playlistState.limit;

                // Append new songs with correct global numbering
                data.songs.forEach(function(song, idx) {
                    var globalIndex = startIndex + idx;
                    var songCard = createSongCard(song, globalIndex, data);
                    resultsDiv.insertAdjacentHTML('beforeend', songCard);
                });

                // Update state
                window._playlistState.currentPage = nextPage;
                window._playlistLoadedPages.push(cacheKey);

                // Update active stack data using helper
                window.Nav.updateCurrent({loadedPages: window._playlistLoadedPages.slice()});

                // Attach song data to new cards
                var cards = resultsDiv.querySelectorAll('.song-card');
                cards.forEach(function(card, idx) {
                    if (idx >= startIndex && data.songs[idx - startIndex]) {
                        card._songData = data.songs[idx - startIndex];
                    }
                });

                // Show load more button again
                showPlaylistLoadMoreButton();
            } else {
                var endMsg = document.createElement('div');
                endMsg.className = 'end-of-results';
                endMsg.id = 'playlist-load-more-btn';
                endMsg.textContent = '🏁 End of playlist';
                document.getElementById('results').appendChild(endMsg);
            }
        })
        .catch(function(error) {
            console.error('[Display] Load more playlist error:', error);
            var btn = document.getElementById('playlist-load-more-btn');
            if (btn) {
                btn.textContent = 'Retry';
                btn.disabled = false;
            }
        })
        .then(function() {
            window._playlistState.isLoading = false;
        });
}

// ============ SHOW PLAYLIST LOAD MORE BUTTON ============
function showPlaylistLoadMoreButton() {
    var resultsDiv = document.getElementById('results');
    if (!resultsDiv) return;

    // Remove existing load more button
    var existingBtn = document.getElementById('playlist-load-more-btn');
    if (existingBtn) existingBtn.remove();

    // Check if more results exist
    var hasMore = false;
    if (window._playlistState.total > 0) {
        var loadedCount = window._playlistLoadedPages.length * window._playlistState.limit;
        hasMore = loadedCount < window._playlistState.total;
    } else {
        var lastKey = window._playlistLoadedPages[window._playlistLoadedPages.length - 1];
        var lastData = window.Cache.get(lastKey);
        if (lastData && lastData.songs) {
            hasMore = lastData.songs.length >= window._playlistState.limit;
        }
    }

    if (!hasMore) {
        var endMsg = document.createElement('div');
        endMsg.className = 'end-of-results';
        endMsg.id = 'playlist-load-more-btn';
        endMsg.textContent = '🏁 End of playlist';
        resultsDiv.appendChild(endMsg);
        return;
    }

    var btn = document.createElement('button');
    btn.id = 'playlist-load-more-btn';
    btn.className = 'btn-load-more';
    btn.textContent = 'Load ' + window._playlistState.limit + ' More Songs';
    btn.addEventListener('click', function() {
        loadMorePlaylist();
    });
    resultsDiv.appendChild(btn);
}

// ============ RENDER PLAYLIST ============
function renderPlaylist(playlist) {
    var image = playlist.image;
    if (!image || image.indexOf('placeholder.com') !== -1) {
        image = window.Utils.getDefaultImage('playlist');
    }
    var playlistCountInfo = playlist.list_count || playlist.song_count || 0;
    var html = '\n        <div class="playlist-header">\n' +
        '            <img src="' + image + '" alt="' + escapeHtml(playlist.title) + '" />\n' +
        '            <div class="playlist-header-info">\n' +
        '                <h2>' + escapeHtml(playlist.title) + '</h2>\n' +
        '                <p>' + escapeHtml(playlist.subtitle || '') + '</p>\n' +
        '                <p>' + playlistCountInfo + ' songs • ' + escapeHtml(playlist.language || 'Unknown') +
        '</p>\n' +
        (playlist.description ?
             '                <p class="playlist-description">' + escapeHtml(playlist.description) + '</p>\n' :
             '') +
        '                <div class="playlist-actions">\n' +
        '                    <button class="btn-back" id="btn-back-search">← Back</button>\n' +
        '                </div>\n' +
        '            </div>\n' +
        '        </div>\n' +
        '        <div class="song-list playlist-songs-list">\n    ';

    var playlistContext = {
        type: 'playlist',
        image: playlist.image,
        language: playlist.language,
        year: playlist.year,
        title: playlist.title
    };

    if (playlist.songs && playlist.songs.length > 0) {
        // For page 1, index starts at 0, so it's correct
        playlist.songs.forEach(function(song, index) {
            html += createSongCard(song, index, playlistContext);
        });
    } else {
        html += '<div class="no-results">No songs found in this playlist.</div>';
    }

    html += '</div>';
    DOM.results.innerHTML = html;

    // Attach song data to cards
    var cards = DOM.results.querySelectorAll('.song-card');
    if (playlist.songs && playlist.songs.length > 0) {
        cards.forEach(function(card, index) {
            if (playlist.songs[index]) {
                card._songData = playlist.songs[index];
            }
        });
    }
}

function viewPlaylist(token) {
    console.log('[View] viewPlaylist called, isRestoring:', window._isRestoring);

    // Only push if not restoring
    if (!window._isRestoring) {
        window.Nav.push({type: 'playlist', data: {token: token, page: 1, loadedPages: []}});
    }

    // Reset playlist state
    window._playlistState.token = token;
    window._playlistState.currentPage = 1;
    window._playlistState.limit = 50;
    window._playlistState.total = 0;
    window._playlistState.isLoading = false;
    window._playlistLoadedPages = [];

    var page = window._playlistState.currentPage;
    var limit = window._playlistState.limit;
    var cacheKey = 'playlist:' + token + ':' + page + ':' + limit;

    DOM.results.innerHTML = '<div class="loading">📂 Loading playlist...</div>';
    DOM.stats.innerHTML = '';

    // Check cache first
    if (window.Cache.has(cacheKey)) {
        console.log('[Display] Using cached playlist page 1:', token);
        var playlist = window.Cache.get(cacheKey);
        window._playlistState.total = parseInt(playlist.list_count) || parseInt(playlist.song_count) || 0;
        window._playlistLoadedPages.push(cacheKey);

        // Update stack entry with the first page
        var currentStack = window.Nav.getStack();
        for (var i = currentStack.length - 1; i >= 0; i--) {
            if (currentStack[i].type === 'playlist') {
                currentStack[i].data.loadedPages = window._playlistLoadedPages.slice();
                console.log('[Nav] Updated playlist stack with first page');
                break;
            }
        }

        renderPlaylist(playlist);
        showPlaylistLoadMoreButton();
        return window.Utils.Promise.resolve();
    }

    return window.Services.Playlist.getDetails(token, page, limit)
        .then(function(playlist) {
            // Store in cache
            window.Cache.set(cacheKey, playlist);
            window._playlistState.total = parseInt(playlist.list_count) || parseInt(playlist.song_count) || 0;
            window._playlistLoadedPages.push(cacheKey);

            // Update stack entry with the first page
            var currentStack = window.Nav.getStack();
            for (var i = currentStack.length - 1; i >= 0; i--) {
                if (currentStack[i].type === 'playlist') {
                    currentStack[i].data.loadedPages = window._playlistLoadedPages.slice();
                    console.log('[Nav] Updated playlist stack with first page');
                    break;
                }
            }

            renderPlaylist(playlist);
            showPlaylistLoadMoreButton();
        })
        .catch(function(error) {
            console.error('[View Playlist Error] Failed to load or render details:', error);
            DOM.results.innerHTML =
                '<div class="error">❌ Error loading playlist: ' + escapeHtml(error.message) + '</div>';
        });
}

// ============ EXPOSE ============
window.viewPlaylist = viewPlaylist;
window.loadMorePlaylist = loadMorePlaylist;
window.renderPlaylist = renderPlaylist;
window.showPlaylistLoadMoreButton = showPlaylistLoadMoreButton;


    // ============================================================
    // FILE: /js/ui/display/artist-view.js
    // ============================================================

// src/js/ui/display/artist-view.js

window._artistState = {
    token: '',
    artistId: '',
    category: 'popular',  // 'popular' | 'latest'
    songPage: 1,
    albumPage: 1,
    limit: 10,
    isLoadingSongs: false,
    isLoadingAlbums: false
};
window._artistSongPages = [];
window._artistAlbumPages = [];

// ============ RENDER HEADER ============
function renderHeader(artist) {
    // Parse bio if it's a JSON string
    var bioText = '';
    if (artist.bio) {
        try {
            var bioArray = JSON.parse(artist.bio);
            if (Array.isArray(bioArray) && bioArray.length > 0) {
                bioText = bioArray[0].text || '';
            }
        } catch (e) {
            bioText = artist.bio;
        }
    }

    var image = artist.image;
    if (!image || image.indexOf('placeholder.com') !== -1) {
        image = window.Utils.getDefaultImage('artist');
    }

    var bioTagHtml = '';
    if (bioText) {
        bioTagHtml = '<p class="artist-bio">' + escapeHtml(bioText.substring(0, 200)) +
            (bioText.length > 200 ? '...' : '') + '</p>\n';
    }

    var checkedIcon = artist.isVerified ? '✅' : '';

    var html = '\n        <div class="artist-header">\n' +
        '            <img src="' + image + '" alt="' + artist.name + '" />\n' +
        '            <div class="artist-header-info">\n' +
        '                <h2>' + escapeHtml(artist.name) + ' ' + checkedIcon + '</h2>\n' +
        '                <p>' + escapeHtml(artist.subtitle || '') + '</p>\n' +
        '                ' + bioTagHtml + '                <div class="artist-actions">\n' +
        '                    <button class="btn-back" id="btn-back">← Back</button>\n' +
        '                </div>\n' +
        '            </div>\n' +
        '        </div>\n' +
        '        <div class="artist-tabs">\n' +
        '            <button class="artist-tab active" data-category="popular">🔥 Popular</button>\n' +
        '            <button class="artist-tab" data-category="latest">🕐 Latest</button>\n' +
        '        </div>\n    ';
    return html;
}

// ============ RENDER FOOTER (Static Sections) ============
function renderFooter(artist) {
    var html = '';

    if (artist.dedicatedPlaylists && artist.dedicatedPlaylists.length > 0) {
        html += '\n            <div class="artist-playlists-section" id="artist-dedicated-playlists">\n' +
            '                <h3>Dedicated Playlists</h3>\n' +
            '                <div class="playlist-list">\n' +
            '                    ' +
            artist.dedicatedPlaylists
                .map(function(playlist) {
                    return createPlaylistCard(playlist);
                })
                .join('') +
            '\n' +
            '                </div>\n' +
            '            </div>\n        ';
    }

    if (artist.featuredPlaylists && artist.featuredPlaylists.length > 0) {
        html += '\n            <div class="artist-playlists-section" id="artist-featured-playlists">\n' +
            '                <h3>Featured In</h3>\n' +
            '                <div class="playlist-list">\n' +
            '                    ' +
            artist.featuredPlaylists
                .map(function(playlist) {
                    return createPlaylistCard(playlist);
                })
                .join('') +
            '\n' +
            '                </div>\n' +
            '            </div>\n        ';
    }

    if (artist.singles && artist.singles.length > 0) {
        html += '\n            <div class="artist-albums-section" id="artist-singles">\n' +
            '                <h3>Singles</h3>\n' +
            '                <div class="album-list">\n' +
            '                    ' +
            artist.singles
                .map(function(single) {
                    return createAlbumCard(single);
                })
                .join('') +
            '\n' +
            '                </div>\n' +
            '            </div>\n        ';
    }

    if (artist.latestReleases && artist.latestReleases.length > 0) {
        html += '\n            <div class="artist-albums-section" id="artist-latest-releases">\n' +
            '                <h3>Latest Releases</h3>\n' +
            '                <div class="album-list">\n' +
            '                    ' +
            artist.latestReleases
                .map(function(release) {
                    return createAlbumCard(release);
                })
                .join('') +
            '\n' +
            '                </div>\n' +
            '            </div>\n        ';
    }

    return html;
}

// ============ RENDER DYNAMIC SONGS SECTION ============
function renderSongsSectionHTML(songs, category, totalSongs) {
    var songHeaderCount = songs ? songs.length : 0;
    var html = '\n        <div class="artist-songs-section" id="artist-dynamic-songs" data-category="' + category +
        '">\n' +
        '            <h3>Top Songs (' + songHeaderCount + ')</h3>\n' +
        '            <div class="song-list">\n    ';

    if (songs && songs.length > 0) {
        var artistContext = {type: 'artist', image: '', language: '', year: '', title: window._artistState.token};
        songs.forEach(function(song, index) {
            html += createSongCard(song, index, artistContext);
        });
    } else {
        html += '<div class="no-results">No songs found</div>';
    }

    html += '\n            </div>\n' +
        '            <div id="artist-songs-load-more"></div>\n' +
        '        </div>\n    ';

    return html;
}

// ============ RENDER DYNAMIC ALBUMS SECTION ============
function renderAlbumsSectionHTML(albums, category, totalAlbums) {
    var albumHeaderCount = albums ? albums.length : 0;
    var html = '\n        <div class="artist-albums-section" id="artist-dynamic-albums" data-category="' + category +
        '">\n' +
        '            <h3>Top Albums (' + albumHeaderCount + ')</h3>\n' +
        '            <div class="album-list">\n    ';

    if (albums && albums.length > 0) {
        albums.forEach(function(album) {
            html += createAlbumCard(album);
        });
    } else {
        html += '<div class="no-results">No albums found</div>';
    }

    html += '\n            </div>\n' +
        '            <div id="artist-albums-load-more"></div>\n' +
        '        </div>\n    ';

    return html;
}

// ============ SET ACTIVE TAB ============
function setActiveTab(category) {
    var tabs = document.querySelectorAll('.artist-tab');
    tabs.forEach(function(tab) {
        tab.classList.toggle('active', tab.dataset.category === category);
    });
}

// ============ RENDER ARTIST ============
function renderArtist(artist) {
    // 1. Build full HTML with correct order
    var headerHtml = renderHeader(artist);
    var songsHtml = renderSongsSectionHTML(artist.songs, window._artistState.category || 'popular', artist.totalSongs);
    var albumsHtml =
        renderAlbumsSectionHTML(artist.albums, window._artistState.category || 'popular', artist.totalAlbums);
    var footerHtml = renderFooter(artist);  // Static sections at the bottom

    var fullHtml = headerHtml + songsHtml + albumsHtml + footerHtml;
    DOM.results.innerHTML = fullHtml;
    DOM.stats.innerHTML = '';

    // 2. Attach _songData to song cards
    var cards = DOM.results.querySelectorAll('.song-card');
    var allSongs = artist.songs || [];
    cards.forEach(function(card, index) {
        if (allSongs[index]) {
            card._songData = allSongs[index];
        }
    });

    // 3. Show load more buttons
    showArtistSongsLoadMore();
    showArtistAlbumsLoadMore();

    // 4. Set active tab
    setActiveTab(window._artistState.category || 'popular');
}

// ============ VIEW ARTIST ============
function viewArtist(token, category) {
    console.log('[DEBUG] viewArtist called with:', {token: token, category: category});

    // If category is undefined, try to get it from the navigation stack
    if (!category) {
        var stack = window.Nav.getStack();
        for (var i = stack.length - 1; i >= 0; i--) {
            if (stack[i].type === 'artist') {
                category = stack[i].data.category || 'popular';
                console.log('[DEBUG] Found category from stack:', category);
                break;
            }
        }
        // If still no category, default to 'popular'
        if (!category) {
            category = 'popular';
            console.log('[DEBUG] Using default category: popular');
        }
    }

    console.log('[View] viewArtist called, isRestoring:', window._isRestoring);
    category = category || 'popular';

    if (!window._isRestoring) {
        window.Nav.push({type: 'artist', data: {token: token, category: category}});
    }

    // Reset state with the category
    window._artistState.token = token;
    window._artistState.category = category;
    window._artistState.songPage = 1;
    window._artistState.albumPage = 1;
    window._artistState.isLoadingSongs = false;
    window._artistState.isLoadingAlbums = false;

    window._artistSongPages = [];
    window._artistAlbumPages = [];

    DOM.results.innerHTML = '<div class="loading">🎤 Loading artist...</div>';
    DOM.stats.innerHTML = '';

    var cacheKey = 'artist:' + token + ':' + category;
    console.log('[DEBUG] Looking for cache key:', cacheKey);
    if (window.Cache.has(cacheKey)) {
        console.log('[DEBUG] Cache FOUND for key:', cacheKey);
        var artist = window.Cache.get(cacheKey);
        window._artistState.artistId = artist.artistId || artist.id;
        renderArtist(artist);
        return window.Utils.Promise.resolve();
    } else {
        console.log('[DEBUG] Cache MISS for key:', cacheKey);
    }

    return window.Services.Artist.getDetails(token, category)
        .then(function(artist) {
            window.Cache.set(cacheKey, artist);
            window._artistState.artistId = artist.artistId || artist.id;
            renderArtist(artist);
        })
        .catch(function(error) {
            console.error('[View Artist Error] Failed to load or render details:', error);
            DOM.results.innerHTML =
                '<div class="error">❌ Error loading artist: ' + escapeHtml(error.message) + '</div>';
        });
}

// ============ SWITCH ARTIST CATEGORY ============
function switchArtistCategory(category) {
    console.log('[Artist] Switching category:', category);

    // 1. Update state
    window._artistState.category = category;
    window._artistState.songPage = 1;
    window._artistState.albumPage = 1;
    window._artistSongPages = [];
    window._artistAlbumPages = [];

    // 2. Update navigation stack entry with the new category
    var currentStack = window.Nav.getStack();
    for (var i = currentStack.length - 1; i >= 0; i--) {
        if (currentStack[i].type === 'artist') {
            currentStack[i].data.category = category;
            console.log('[Nav] Updated artist stack category to:', category);
            break;
        }
    }

    // 3. Set active tab (visual)
    setActiveTab(category);

    // 4. Check cache for this category
    var token = window._artistState.token;
    var fullCacheKey = 'artist:' + token + ':' + category;
    var artistData = window.Cache.get(fullCacheKey);

    if (artistData) {
        console.log('[Display] Using cached artist data for category:', category);
        updateDynamicParts(artistData.songs, artistData.albums, category);
        return window.Utils.Promise.resolve();
    }

    // 5. Fetch from API
    var songsContainer = document.getElementById('artist-dynamic-songs');
    var albumsContainer = document.getElementById('artist-dynamic-albums');
    if (songsContainer) songsContainer.innerHTML = '<div class="loading">🎤 Loading songs...</div>';
    if (albumsContainer) albumsContainer.innerHTML = '<div class="loading">🎤 Loading albums...</div>';

    return window.Services.Artist.getDetails(token, category)
        .then(function(artist) {
            window.Cache.set(fullCacheKey, artist);
            updateDynamicParts(artist.songs, artist.albums, category);
            window._artistState.totalSongs = artist.totalSongs || 0;
            window._artistState.totalAlbums = artist.totalAlbums || 0;
        })
        .catch(function(error) {
            if (songsContainer)
                songsContainer.innerHTML =
                    '<div class="error">❌ Error loading songs: ' + escapeHtml(error.message) + '</div>';
            if (albumsContainer)
                albumsContainer.innerHTML =
                    '<div class="error">❌ Error loading albums: ' + escapeHtml(error.message) + '</div>';
        });
}

// ============ UPDATE DYNAMIC PARTS ============
function updateDynamicParts(songs, albums, category) {
    console.log('[Artist] updateDynamicParts called');
    console.log('[Artist] songs count:', songs ? songs.length : 0);
    console.log('[Artist] albums count:', albums ? albums.length : 0);
    console.log('[Artist] category:', category);

    // 1. Update songs section (using ID)
    var songsContainer = document.getElementById('artist-dynamic-songs');
    if (songsContainer) {
        var songsHtml = renderSongsSectionHTML(songs, category);
        songsContainer.outerHTML = songsHtml;
    }

    // 2. Update albums section (using ID)
    var albumsContainer = document.getElementById('artist-dynamic-albums');
    console.log('[Artist] albumsContainer found:', albumsContainer ? 'YES' : 'NO');
    if (albumsContainer) {
        var albumsHtml = renderAlbumsSectionHTML(albums, category);
        albumsContainer.outerHTML = albumsHtml;
    }

    // 3. Attach _songData to new cards
    var cards = DOM.results.querySelectorAll('.song-card');
    var allSongs = songs || [];
    cards.forEach(function(card, index) {
        if (allSongs[index]) {
            card._songData = allSongs[index];
        }
    });

    // 5. Show load more buttons
    showArtistSongsLoadMore();
    showArtistAlbumsLoadMore();
}

// ============ SHOW ARTIST SONGS LOAD MORE ============
function showArtistSongsLoadMore() {
    var container = document.getElementById('artist-songs-load-more');
    if (!container) return;

    var totalSongs = 0;
    var loadedCount = (window._artistSongPages.length + 1) * window._artistState.limit;

    var hasMore = false;
    if (totalSongs > 0) {
        hasMore = loadedCount < totalSongs;
    } else {
        var songsContainer = document.querySelector('.artist-songs-section .song-list');
        var currentCount = songsContainer ? songsContainer.querySelectorAll('.song-card').length : 0;
        if (window._artistSongPages.length === 0) {
            hasMore = currentCount >= window._artistState.limit;
        } else {
            var lastPageKey = window._artistSongPages[window._artistSongPages.length - 1];
            var lastData = lastPageKey ? window.Cache.get(lastPageKey) : null;
            hasMore = lastData && lastData.songs && lastData.songs.length >= window._artistState.limit;
        }
    }

    if (!hasMore) {
        container.innerHTML = '<div class="end-of-results">🏁 End of songs</div>';
        return;
    }

    container.innerHTML = '\n        <button class="btn-load-more" id="artist-songs-load-more-btn">\n' +
        '            Load ' + window._artistState.limit + ' More Songs\n' +
        '        </button>\n    ';

    var btn = document.getElementById('artist-songs-load-more-btn');
    if (btn) {
        btn.addEventListener('click', function() {
            loadMoreArtistSongs();
        });
    }
}

// ============ LOAD MORE ARTIST SONGS ============
function loadMoreArtistSongs() {
    if (window._artistState.isLoadingSongs) return window.Utils.Promise.resolve();
    window._artistState.isLoadingSongs = true;

    var btn = document.getElementById('artist-songs-load-more-btn');
    if (btn) {
        btn.textContent = 'Loading...';
        btn.disabled = true;
    }

    var nextPage = window._artistState.songPage + 1;
    var artistId = window._artistState.artistId;
    var category = window._artistState.category;

    // ============ CHECK CACHE ============
    var cacheKey = 'artist:' + artistId + ':' + category + ':songs:page:' + nextPage;
    if (window.Cache.has(cacheKey)) {
        console.log('[Artist] Using cached songs page:', nextPage);
        var cachedData = window.Cache.get(cacheKey);
        var songs = cachedData.songs || [];
        var total = cachedData.total || 0;

        // Append songs
        if (songs.length > 0) {
            appendArtistSongs(songs, nextPage, total, cacheKey);
        } else {
            var container = document.getElementById('artist-songs-load-more');
            if (container) {
                container.innerHTML = '<div class="end-of-results">🏁 End of songs</div>';
            }
        }
        window._artistState.isLoadingSongs = false;
        if (btn) {
            btn.textContent = 'Load ' + window._artistState.limit + ' More Songs';
            btn.disabled = false;
        }
        return window.Utils.Promise.resolve();
    }

    return window.Services.Artist.getMoreSongs(artistId, nextPage, category)
        .then(function(result) {
            var songs = result.songs || [];
            var total = result.total || 0;

            // ============ STORE IN CACHE ============
            window.Cache.set(cacheKey, {songs: songs, total: total});

            // Append songs
            if (songs.length > 0) {
                appendArtistSongs(songs, nextPage, total, cacheKey);
            } else {
                var container = document.getElementById('artist-songs-load-more');
                if (container) {
                    container.innerHTML = '<div class="end-of-results">🏁 End of songs</div>';
                }
            }
        })
        .catch(function(error) {
            console.error('[Artist] Load more songs error:', error);
            var container = document.getElementById('artist-songs-load-more');
            if (container) {
                container.innerHTML = '<button class="btn-load-more" id="artist-songs-load-more-btn">Retry</button>';
                var newBtn = document.getElementById('artist-songs-load-more-btn');
                if (newBtn) {
                    newBtn.addEventListener('click', function() {
                        loadMoreArtistSongs();
                    });
                }
            }
        })
        .then(function() {
            window._artistState.isLoadingSongs = false;
            if (btn) {
                btn.textContent = 'Load ' + window._artistState.limit + ' More Songs';
                btn.disabled = false;
            }
        });
}

// ============ APPEND ARTIST SONGS ============
function appendArtistSongs(songs, page, total, cacheKey) {
    var songsContainer = document.querySelector('.artist-songs-section .song-list');
    if (!songsContainer) return;

    var artistContext = {type: 'artist', image: '', language: '', year: '', title: window._artistState.token};

    // Get current card count BEFORE appending
    var cardsBefore = songsContainer.querySelectorAll('.song-card').length;

    songs.forEach(function(song, idx) {
        var globalIndex = cardsBefore + idx;
        var songCard = createSongCard(song, globalIndex, artistContext);
        songsContainer.insertAdjacentHTML('beforeend', songCard);
    });

    // Attach _songData to new cards
    var allCards = songsContainer.querySelectorAll('.song-card');
    var existingCardsCount = allCards.length - songs.length;
    songs.forEach(function(song, idx) {
        var globalIndex = existingCardsCount + idx;
        var card = allCards[globalIndex];
        if (card) {
            card._songData = song;
        }
    });

    // Update state
    window._artistState.songPage = page;
    window._artistSongPages.push(cacheKey || ('artist_songs_' + window._artistState.artistId + '_' + page));

    // Update active stack data using helper
    window.Nav.updateCurrent({loadedSongPages: window._artistSongPages.slice()});

    // Update load more button
    showArtistSongsLoadMore();

    // Update stats
    var h3 = document.querySelector('.artist-songs-section h3');
    if (h3) {
        var currentCount = songsContainer.querySelectorAll('.song-card').length;
        h3.textContent = 'Top Songs (' + currentCount + ')';
    }
}

// ============ SHOW ARTIST ALBUMS LOAD MORE ============
function showArtistAlbumsLoadMore() {
    var container = document.getElementById('artist-albums-load-more');
    if (!container) return;

    var totalAlbums = window._artistState.totalAlbums || 0;
    var loadedCount = (window._artistAlbumPages.length + 1) * window._artistState.limit;

    var hasMore = false;
    if (totalAlbums > 0) {
        hasMore = loadedCount < totalAlbums;
    } else {
        var albumsContainer = document.getElementById('artist-dynamic-albums');
        var albumList = albumsContainer ? albumsContainer.querySelector('.album-list') : null;
        var currentCount = albumList ? albumList.querySelectorAll('.album-card').length : 0;
        if (window._artistAlbumPages.length === 0) {
            hasMore = currentCount >= window._artistState.limit;
        } else {
            var lastPageKey = window._artistAlbumPages[window._artistAlbumPages.length - 1];
            var lastData = lastPageKey ? window.Cache.get(lastPageKey) : null;
            hasMore = lastData && lastData.albums && lastData.albums.length >= window._artistState.limit;
        }
    }

    if (!hasMore) {
        container.innerHTML = '<div class="end-of-results">🏁 End of albums</div>';
        return;
    }

    container.innerHTML = '\n        <button class="btn-load-more" id="artist-albums-load-more-btn">\n' +
        '            Load ' + window._artistState.limit + ' More Albums\n' +
        '        </button>\n    ';

    var btn = document.getElementById('artist-albums-load-more-btn');
    if (btn) {
        btn.addEventListener('click', function() {
            loadMoreArtistAlbums();
        });
    }
}

// ============ LOAD MORE ARTIST ALBUMS ============
function loadMoreArtistAlbums() {
    if (window._artistState.isLoadingAlbums) return window.Utils.Promise.resolve();
    window._artistState.isLoadingAlbums = true;

    var btn = document.getElementById('artist-albums-load-more-btn');
    if (btn) {
        btn.textContent = 'Loading...';
        btn.disabled = true;
    }

    var nextPage = window._artistState.albumPage + 1;
    var artistId = window._artistState.artistId;
    var category = window._artistState.category;

    // ============ CHECK CACHE ============
    var cacheKey = 'artist:' + artistId + ':' + category + ':albums:page:' + nextPage;
    if (window.Cache.has(cacheKey)) {
        console.log('[Artist] Using cached albums page:', nextPage);
        var cachedData = window.Cache.get(cacheKey);
        var albums = cachedData.albums || [];
        var total = cachedData.total || 0;

        if (albums.length > 0) {
            appendArtistAlbums(albums, nextPage, total, cacheKey);
        } else {
            var container = document.getElementById('artist-albums-load-more');
            if (container) {
                container.innerHTML = '<div class="end-of-results">🏁 End of albums</div>';
            }
        }
        window._artistState.isLoadingAlbums = false;
        if (btn) {
            btn.textContent = 'Load ' + window._artistState.limit + ' More Albums';
            btn.disabled = false;
        }
        return window.Utils.Promise.resolve();
    }

    return window.Services.Artist.getMoreAlbums(artistId, nextPage, category)
        .then(function(result) {
            var albums = result.albums || [];
            var total = result.total || 0;

            // ============ STORE IN CACHE ============
            window.Cache.set(cacheKey, {albums: albums, total: total});

            if (albums.length > 0) {
                appendArtistAlbums(albums, nextPage, total, cacheKey);
            } else {
                var container = document.getElementById('artist-albums-load-more');
                if (container) {
                    container.innerHTML = '<div class="end-of-results">🏁 End of albums</div>';
                }
            }
        })
        .catch(function(error) {
            console.error('[Artist] Load more albums error:', error);
            var container = document.getElementById('artist-albums-load-more');
            if (container) {
                container.innerHTML = '<button class="btn-load-more" id="artist-albums-load-more-btn">Retry</button>';
                var newBtn = document.getElementById('artist-albums-load-more-btn');
                if (newBtn) {
                    newBtn.addEventListener('click', function() {
                        loadMoreArtistAlbums();
                    });
                }
            }
        })
        .then(function() {
            window._artistState.isLoadingAlbums = false;
            if (btn) {
                btn.textContent = 'Load ' + window._artistState.limit + ' More Albums';
                btn.disabled = false;
            }
        });
}

function appendArtistAlbums(albums, page, total, cacheKey) {
    var albumsContainer = document.getElementById('artist-dynamic-albums');
    if (!albumsContainer) return;

    var albumList = albumsContainer.querySelector('.album-list');
    if (!albumList) return;

    albums.forEach(function(album) {
        var albumCard = createAlbumCard(album);
        albumList.insertAdjacentHTML('beforeend', albumCard);
    });

    // Update state
    window._artistState.albumPage = page;
    window._artistAlbumPages.push(cacheKey || ('artist_albums_' + window._artistState.artistId + '_' + page));

    // Update active stack data using helper
    window.Nav.updateCurrent({loadedAlbumPages: window._artistAlbumPages.slice()});

    // Update load more button
    showArtistAlbumsLoadMore();

    // Update stats
    var h3 = albumsContainer.querySelector('h3');
    if (h3) {
        var currentCount = albumList.querySelectorAll('.album-card').length;
        h3.textContent = 'Top Albums (' + currentCount + ')';
    }
}

// ============ RESTORE ARTIST ============
function restoreArtist(data) {
    console.log('[Restore] Artist:', data);
    var category = data.category || 'popular';
    var token = data.token;
    var loadedSongPages = data.loadedSongPages || [];
    var loadedAlbumPages = data.loadedAlbumPages || [];

    window._isRestoring = true;

    // First, load structural view (page 1)
    return viewArtist(token, category)
        .then(function() {
            // Append paged songs
            loadedSongPages.forEach(function(pageKey) {
                if (window.Cache.has(pageKey)) {
                    var cachedVal = window.Cache.get(pageKey);
                    var pageNum = parseInt(pageKey.split(':').pop()) || 2;
                    var songs = cachedVal.songs || [];
                    var total = cachedVal.total || 0;
                    appendArtistSongs(songs, pageNum, total, pageKey);
                }
            });

            // Append paged albums
            loadedAlbumPages.forEach(function(pageKey) {
                if (window.Cache.has(pageKey)) {
                    var cachedVal = window.Cache.get(pageKey);
                    var pageNum = parseInt(pageKey.split(':').pop()) || 2;
                    var albums = cachedVal.albums || [];
                    var total = cachedVal.total || 0;
                    appendArtistAlbums(albums, pageNum, total, pageKey);
                }
            });
        })
        .then(function() {
            window._isRestoring = false;
        });
}

// ============ EXPOSE ============
window.viewArtist = viewArtist;
window.loadMoreArtistSongs = loadMoreArtistSongs;
window.loadMoreArtistAlbums = loadMoreArtistAlbums;
window.renderArtist = renderArtist;
window.restoreArtist = restoreArtist;


    // ============================================================
    // FILE: /js/ui/display/lyrics.js
    // ============================================================

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


    // ============================================================
    // FILE: /js/ui/display/navigation.js
    // ============================================================

// src/js/ui/display/navigation.js

// ============ RESTORE SEARCH ============
function restoreSearch(data) {
    console.log('[Restore] Search:', data);

    var searchType = data.type || 'songs';
    var query = data.query;
    var loadedPages = data.loadedPages || [];

    // Get first page from cache
    var firstPageKey = window.Cache.getSearchKey(searchType, query, 1, 20);

    if (!window.Cache.has(firstPageKey)) {
        console.log('[Restore] No cache for search, falling back to search');
        if (typeof window.search === 'function') {
            window.search();
        }
        return;
    }

    // Collect all results from all loaded pages
    var allResults = [];
    if (loadedPages.length > 0) {
        loadedPages.forEach(function(pageKey) {
            var pageData = window.Cache.get(pageKey);
            if (pageData && pageData.results) {
                allResults = allResults.concat(pageData.results);
            }
        });
    } else {
        var data = window.Cache.get(firstPageKey);
        allResults = data.results || [];
        loadedPages = [firstPageKey];
    }

    if (allResults.length === 0) {
        console.log('[Restore] No results found, falling back to search');
        if (typeof window.search === 'function') {
            window.search();
        }
        return;
    }

    // Restore state
    window._searchState.type = searchType;
    window._searchState.query = query;
    window._searchState.currentPage = loadedPages.length;
    window._searchLoadedPages = loadedPages.slice();

    // Display results
    displaySearchResults(allResults, searchType);
    showLoadMoreButton('search');

    var statsDiv = document.getElementById('stats');
    if (statsDiv) statsDiv.innerHTML = 'Found ' + allResults.length + ' ' + searchType + ' (cached)';

    console.log('[Restore] Search restored with', allResults.length, 'results');
}

// ============ RESTORE PLAYLIST ============
function restorePlaylist(data) {
    console.log('[Restore] Playlist:', data);

    var token = data.token;
    var loadedPages = data.loadedPages || [];

    // Get first page from cache
    var firstPageKey = 'playlist:' + token + ':' + 1 + ':' + 50;

    if (!window.Cache.has(firstPageKey)) {
        console.log('[Restore] No cache for playlist, falling back to viewPlaylist');
        window._isRestoring = false;  // Temporarily allow push
        viewPlaylist(token);
        window._isRestoring = true;
        return;
    }

    // Collect all songs from all loaded pages
    var allSongs = [];
    var playlistData = null;

    if (loadedPages.length > 0) {
        loadedPages.forEach(function(pageKey) {
            var pageData = window.Cache.get(pageKey);
            if (pageData && pageData.songs) {
                if (!playlistData) playlistData = pageData;
                allSongs = allSongs.concat(pageData.songs);
            }
        });
    } else {
        var data = window.Cache.get(firstPageKey);
        playlistData = data;
        allSongs = data.songs || [];
        loadedPages = [firstPageKey];
    }

    if (allSongs.length === 0) {
        console.log('[Restore] No songs found, falling back to viewPlaylist');
        window._isRestoring = false;
        viewPlaylist(token);
        window._isRestoring = true;
        return;
    }

    // Restore state
    if (playlistData) {
        playlistData.songs = allSongs;
    }
    window._playlistState.token = token;
    window._playlistState.currentPage = loadedPages.length;
    window._playlistLoadedPages = loadedPages.slice();

    // Display playlist
    renderPlaylist(playlistData);
    showPlaylistLoadMoreButton();

    console.log('[Restore] Playlist restored with', allSongs.length, 'songs');
}

// ============ RESTORE ALBUM ============
function restoreAlbum(data) {
    console.log('[Restore] Album:', data);
    viewAlbum(data.token);
}

// ============ RESTORE VIEW ============
function restoreView(view) {
    console.log('[Restore] Restoring:', view.type, 'Data:', view.data);

    window._isRestoring = true;

    var promise;
    switch (view.type) {
        case 'search':
            restoreSearch(view.data);
            promise = window.Utils.Promise.resolve();
            break;
        case 'playlist':
            restorePlaylist(view.data);
            promise = window.Utils.Promise.resolve();
            break;
        case 'album':
            restoreAlbum(view.data);
            promise = window.Utils.Promise.resolve();
            break;
        case 'artist':
            promise = restoreArtist(view.data);
            break;
        default:
            console.log('[Restore] Unknown type:', view.type);
            if (typeof window.search === 'function') {
                window.search();
            }
            promise = window.Utils.Promise.resolve();
    }

    return promise.then(function() {
        window._isRestoring = false;
        console.log('[Restore] Done, isRestoring:', window._isRestoring);
    });
}


    // ============================================================
    // FILE: /js/ui/search.js
    // ============================================================

// src/js/ui/search.js

// Handle searches where the query is a parsed URL target
function handleUrlSearch(parsed) {
    var resultsDiv = document.getElementById('results');
    var statsDiv = document.getElementById('stats');
    var playerDiv = document.getElementById('player');

    // Clear previous results
    resultsDiv.innerHTML = '<div class="loading">🔍 Loading...</div>';
    if (statsDiv) statsDiv.innerHTML = '';
    if (playerDiv) playerDiv.innerHTML = '';

    var promise;
    if (parsed.type === 'song' || parsed.type === 'lyrics') {
        if (window.currentSearchType !== 'songs') {
            switchTab('songs');
        }
        promise = window.API.getSong(parsed.token).then(function(songData) {
            var song = songData.songs ? songData.songs[0] : null;
            if (song) {
                var formattedSong = window.Utils.formatters.formatSong(song);
                if (statsDiv) statsDiv.innerHTML = 'Found 1 song';
                displaySongs([formattedSong]);
            } else {
                resultsDiv.innerHTML = '<div class="no-results">😕 Song not found</div>';
            }
        });
    } else if (parsed.type === 'album') {
        if (window.currentSearchType !== 'albums') {
            switchTab('albums');
        }
        promise = window.API.getAlbum(parsed.token).then(function(albumData) {
            if (albumData && albumData.id) {
                if (statsDiv) statsDiv.innerHTML = 'Found 1 album';
                viewAlbum(parsed.token);
            } else {
                resultsDiv.innerHTML = '<div class="no-results">😕 Album not found</div>';
            }
        });
    } else if (parsed.type === 'playlist') {
        if (window.currentSearchType !== 'playlists') {
            switchTab('playlists');
        }
        promise = window.API.getPlaylist(parsed.token).then(function(playlistData) {
            if (playlistData && playlistData.id) {
                if (statsDiv) statsDiv.innerHTML = 'Found 1 playlist';
                viewPlaylist(parsed.token);
            } else {
                resultsDiv.innerHTML = '<div class="no-results">😕 Playlist not found</div>';
            }
        });
    } else if (parsed.type === 'artist') {
        if (window.currentSearchType !== 'artists') {
            switchTab('artists');
        }
        promise = window.API.getArtist(parsed.token).then(function(artistData) {
            if (artistData && artistData.artistId) {
                if (statsDiv) statsDiv.innerHTML = 'Found 1 artist';
                viewArtist(parsed.token);
            } else {
                resultsDiv.innerHTML = '<div class="no-results">😕 Artist not found</div>';
            }
        });
    } else {
        promise = window.Utils.Promise.resolve();
    }

    return promise.catch(function(error) {
        console.error('[Search] URL fetch error:', error);
        resultsDiv.innerHTML = '<div class="error">❌ Failed to load: ' + escapeHtml(error.message) + '</div>';
    });
}

// Handle searches where the query is plain search text
function handleTextSearch(query) {
    var resultsDiv = document.getElementById('results');
    var statsDiv = document.getElementById('stats');
    var playerDiv = document.getElementById('player');

    var searchType = window.currentSearchType || 'songs';

    // Reset search state for new search
    window._searchState.type = searchType;
    window._searchState.query = query;
    window._searchState.currentPage = 1;
    window._searchState.limit = 20;
    window._searchState.total = 0;
    window._searchState.isLoading = false;
    window._searchLoadedPages = [];

    var page = window._searchState.currentPage;
    var limit = window._searchState.limit;
    var cacheKey = window.Cache.getSearchKey(searchType, query, page, limit);

    console.log('[Search] Searching for:', query, 'Type:', searchType);

    resultsDiv.innerHTML = '<div class="loading">🔍 Searching</div>';
    if (statsDiv) statsDiv.innerHTML = '';
    if (playerDiv) playerDiv.innerHTML = '';

    // Check cache for page 1
    if (window.Cache.has(cacheKey)) {
        window.Nav.clear();
        window.Nav.push({
            type: 'search',
            data: {
                type: searchType,
                query: query,
                page: 1,
                loadedPages: window._searchLoadedPages ? window._searchLoadedPages.slice() : []
            }
        });
        console.log('[Search] Using cached results for page 1');
        var data = window.Cache.get(cacheKey);
        window._searchState.total = data.total || 0;
        window._searchLoadedPages.push(cacheKey);

        if (data.results && data.results.length > 0) {
            if (statsDiv) statsDiv.innerHTML = 'Found ' + data.results.length + ' ' + searchType + ' (cached)';
            displaySearchResults(data.results, searchType);
            showLoadMoreButton('search');
        } else {
            resultsDiv.innerHTML = '<div class="no-results">😕 No results found. Try a different search term.</div>';
        }
        return window.Utils.Promise.resolve();
    }

    var servicePromise;
    if (searchType === 'songs') {
        servicePromise = window.Services.Song.search(query, limit, page);
    } else if (searchType === 'albums') {
        servicePromise = window.Services.Album.search(query, limit, page);
    } else if (searchType === 'playlists') {
        servicePromise = window.Services.Playlist.search(query, limit, page);
    } else if (searchType === 'artists') {
        servicePromise = window.Services.Artist.search(query, limit, page);
    } else {
        servicePromise = window.Services.Song.search(query, limit, page);
    }

    return servicePromise
        .then(function(data) {
            // Store in cache
            window.Cache.set(cacheKey, data);
            window._searchState.total = data.total || 0;
            window._searchLoadedPages.push(cacheKey);

            window.Nav.clear();
            window.Nav.push({
                type: 'search',
                data: {
                    type: searchType,
                    query: query,
                    page: window._searchState.currentPage || 1,
                    loadedPages: window._searchLoadedPages ? window._searchLoadedPages.slice() : []
                }
            });

            if (data.results && data.results.length > 0) {
                if (statsDiv) statsDiv.innerHTML = 'Found ' + data.results.length + ' ' + searchType;
                displaySearchResults(data.results, searchType);
                showLoadMoreButton('search');
            } else {
                resultsDiv.innerHTML =
                    '<div class="no-results">😕 No results found. Try a different search term.</div>';
            }
        })
        .catch(function(error) {
            console.error('[Search] Error:', error);
            resultsDiv.innerHTML = '<div class="error">❌ Error: ' + escapeHtml(error.message) + '</div>';
            if (statsDiv) statsDiv.innerHTML = '';
        });
}

// Coordinate search input queries
function search() {
    var searchInput = document.getElementById('searchInput');
    var resultsDiv = document.getElementById('results');

    if (!searchInput || !resultsDiv) {
        console.error('[Search] Required DOM elements not found');
        return window.Utils.Promise.resolve();
    }

    var query = searchInput.value.trim();
    if (!query) {
        alert('Please enter a search term');
        return window.Utils.Promise.resolve();
    }

    var parsed = window.Utils.parseUrl(query);
    if (parsed && parsed.token) {
        return handleUrlSearch(parsed);
    } else {
        return handleTextSearch(query);
    }
}

// ============ LOAD MORE SEARCH ============
function loadMoreSearch() {
    if (window._searchState.isLoading) return window.Utils.Promise.resolve();
    window._searchState.isLoading = true;

    var btn = document.getElementById('load-more-btn');
    if (btn) {
        btn.textContent = 'Loading...';
        btn.disabled = true;
    }

    var nextPage = window._searchState.currentPage + 1;
    var cacheKey = window.Cache.getSearchKey(
        window._searchState.type, window._searchState.query, nextPage, window._searchState.limit);

    var type = window._searchState.type;
    var promise;

    // Check cache first
    if (window.Cache.has(cacheKey)) {
        console.log('[Search] Using cached page:', nextPage);
        promise = window.Utils.Promise.resolve(window.Cache.get(cacheKey));
    } else {
        if (type === 'songs') {
            promise = window.Services.Song.search(window._searchState.query, window._searchState.limit, nextPage);
        } else if (type === 'albums') {
            promise = window.Services.Album.search(window._searchState.query, window._searchState.limit, nextPage);
        } else if (type === 'playlists') {
            promise = window.Services.Playlist.search(window._searchState.query, window._searchState.limit, nextPage);
        } else if (type === 'artists') {
            promise = window.Services.Artist.search(window._searchState.query, window._searchState.limit, nextPage);
        }
        promise = promise.then(function(data) {
            window.Cache.set(cacheKey, data);
            return data;
        });
    }

    return promise
        .then(function(data) {
            // Append results
            if (data.results && data.results.length > 0) {
                var resultsDiv = document.getElementById('results');

                // Remove load more button
                var oldBtn = document.getElementById('load-more-btn');
                if (oldBtn) oldBtn.remove();

                // Append new results
                if (type === 'songs') {
                    data.results.forEach(function(song) {
                        resultsDiv.insertAdjacentHTML('beforeend', createSongCard(song));
                    });
                } else if (type === 'albums') {
                    data.results.forEach(function(album) {
                        resultsDiv.insertAdjacentHTML('beforeend', createAlbumCard(album));
                    });
                } else if (type === 'playlists') {
                    data.results.forEach(function(playlist) {
                        resultsDiv.insertAdjacentHTML('beforeend', createPlaylistCard(playlist));
                    });
                } else if (type === 'artists') {
                    data.results.forEach(function(artist) {
                        resultsDiv.insertAdjacentHTML('beforeend', createArtistCard(artist));
                    });
                }
                // Update state
                window._searchState.currentPage = nextPage;
                window._searchLoadedPages.push(cacheKey);

                // Persist loaded pages state so back-button recalls pagination
                window.Nav.updateCurrent({loadedPages: window._searchLoadedPages.slice()});

                // Show load more button again
                showLoadMoreButton('search');
            } else {
                // No more results
                var endMsg = document.createElement('div');
                endMsg.className = 'end-of-results';
                endMsg.id = 'load-more-btn';
                endMsg.textContent = '🏁 End of results';
                document.getElementById('results').appendChild(endMsg);
            }
        })
        .catch(function(error) {
            console.error('[Search] Load more error:', error);
            var btn = document.getElementById('load-more-btn');
            if (btn) {
                btn.textContent = 'Retry';
                btn.disabled = false;
            }
        })
        .then(function() {
            window._searchState.isLoading = false;
        });
}

// ============ SHOW LOAD MORE BUTTON ============
function showLoadMoreButton(source) {
    var resultsDiv = document.getElementById('results');
    if (!resultsDiv) return;

    // Remove existing load more button
    var existingBtn = document.getElementById('load-more-btn');
    if (existingBtn) existingBtn.remove();

    // Check if more results exist
    var hasMore = false;
    if (window._searchState.total > 0) {
        var loadedCount = window._searchLoadedPages.length * window._searchState.limit;
        hasMore = loadedCount < window._searchState.total;
    } else {
        // If total unknown, assume more if we have results
        var lastData = window.Cache.get(window._searchLoadedPages[window._searchLoadedPages.length - 1]);
        if (lastData && lastData.results) {
            hasMore = lastData.results.length >= window._searchState.limit;
        }
    }

    if (!hasMore) {
        var endMsg = document.createElement('div');
        endMsg.className = 'end-of-results';
        endMsg.id = 'load-more-btn';
        endMsg.textContent = '🏁 End of results';
        resultsDiv.appendChild(endMsg);
        return;
    }

    var btn = document.createElement('button');
    btn.id = 'load-more-btn';
    btn.className = 'btn-load-more';
    btn.textContent = 'Load ' + window._searchState.limit + ' More';
    btn.dataset.source = source || 'search';
    btn.addEventListener('click', function() {
        loadMoreSearch();
    });
    resultsDiv.appendChild(btn);
}

window.search = search;
window.loadMoreSearch = loadMoreSearch;

    // ============================================================
    // FILE: /js/ui/player.js
    // ============================================================

// src/js/ui/player.js

// Global player variables and queue manager
var currentPlayerElement = null;
var currentSongCard = null;
window.currentAudio = null;
window.playerQueue = [];
window.currentQueueIndex = -1;

// Play a song and initialize the audio element
function playSong(songData) {
    if (!songData) {
        console.error('[Player] No song data provided');
        return;
    }

    var token = songData.token || songData.id;
    console.log('[Player] Playing song:', token);

    // If player already exists, remove it
    if (currentPlayerElement) {
        currentPlayerElement.remove();
        currentPlayerElement = null;
        currentSongCard = null;
    }

    var progressDiv = document.getElementById('play-progress-' + token);

    if (progressDiv) {
        progressDiv.style.display = 'block';
        progressDiv.textContent = '⏳ Decrypting...';
    }

    var buttons = document.querySelectorAll('[data-token="' + token + '"] .btn-play');
    buttons.forEach(function(btn) {
        btn.textContent = '⏳';
        btn.disabled = true;
    });

    try {
        var decryptedUrl = window.Cache.get('decrypt:' + token);

        if (!decryptedUrl) {
            decryptedUrl = window.Utils.getDecryptedUrl(songData, window.currentQuality || 96);
            window.Cache.set('decrypt:' + token, decryptedUrl);
        }

        if (progressDiv) {
            progressDiv.textContent = '✅ Ready!';
            setTimeout(function() {
                progressDiv.style.display = 'none';
            }, 2000);
        }

        // Get title from songData if available
        var displayTitle = songData.title || 'Song';

        // Find the song card to insert player below it
        var songCard = document.querySelector('[data-token="' + token + '"]');
        if (!songCard) {
            // Fallback: try to find by id
            songCard = document.getElementById('song-' + token) || document.getElementById('album-song-' + token);
        }

        if (songCard) {
            var titleEl = songCard.querySelector('.song-title');
            if (titleEl) displayTitle = titleEl.textContent || displayTitle;
        }

        // ============ BUILD QUEUE CONTEXT ============
        if (songCard) {
            var container = songCard.closest('.song-list, .results');
            var cards = container ? container.querySelectorAll('.song-card') : [songCard];

            var newQueue = [];
            var activeIndex = -1;

            cards.forEach(function(card) {
                if (card._songData) {
                    newQueue.push(card._songData);
                    if (card._songData.token === token) {
                        activeIndex = newQueue.length - 1;
                    }
                }
            });

            if (newQueue.length > 0 && activeIndex !== -1) {
                window.playerQueue = newQueue;
                window.currentQueueIndex = activeIndex;
                console.log('[Queue] Loaded queue of ' + newQueue.length + ' tracks. Playing index ' + activeIndex);
            }
        }

        // Visual highlighting of the playing card
        document.querySelectorAll('.song-card.playing').forEach(function(card) {
            card.classList.remove('playing');
        });
        if (songCard) {
            songCard.classList.add('playing');
        }

        if (window.currentAudio) {
            window.currentAudio.pause();
            window.currentAudio = null;
        }

        var audioHtml =
            '<div id="player-container" style="background: #1a1a1a; padding: 15px; border-radius: 8px; border: 1px solid #333; margin-top: 15px; color: #fff;">\n' +
            '    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">\n' +
            '        <strong>Now Playing: ' + displayTitle + '</strong>\n' +
            '        <button id="player-close-btn" style="background: #dc3545; color: white; border: none; padding: 4px 12px; border-radius: 4px; cursor: pointer;">✕ Close</button>\n' +
            '    </div>\n' +
            '    <audio controls autoplay style="width: 100%;">\n' +
            '        <source src="' + decryptedUrl + '" type="audio/mpeg">\n' +
            '        Your browser does not support the audio element.\n' +
            '    </audio>\n' +
            '</div>';

        var tempDiv = document.createElement('div');
        tempDiv.innerHTML = audioHtml;
        var playerElement = tempDiv.firstElementChild;

        // Insert after the song card - make sure it's a sibling
        if (songCard && songCard.parentNode) {
            // Insert as next sibling of the song card
            songCard.parentNode.insertBefore(playerElement, songCard.nextSibling);

            // Add a margin to separate from the card
            playerElement.style.marginTop = '10px';
        } else {
            // Fallback: append to results
            var resultsDiv = document.getElementById('results');
            if (resultsDiv) {
                resultsDiv.appendChild(playerElement);
            }
        }

        // Store references
        currentPlayerElement = playerElement;
        currentSongCard = songCard;

        var audio = playerElement.querySelector('audio');
        window.currentAudio = audio;

        // Bindended event for sequential playing
        audio.addEventListener('ended', function() {
            playNextInQueue();
        });

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

// Play next song in the queue
function playNextInQueue() {
    if (!window.playerQueue || window.playerQueue.length === 0) return;
    var nextIndex = window.currentQueueIndex + 1;
    if (nextIndex < window.playerQueue.length) {
        window.currentQueueIndex = nextIndex;
        console.log('[Queue] Playing next track index ' + nextIndex + ': ' + window.playerQueue[nextIndex].title);
        playSong(window.playerQueue[nextIndex]);
    } else {
        console.log('[Queue] End of queue reached');
        closePlayer();
    }
}

// Close the active audio player and release elements
function closePlayer() {
    console.log('[Player] closePlayer called');
    if (window.currentAudio) {
        window.currentAudio.pause();
        window.currentAudio.currentTime = 0;
        if (window.currentAudio.src) {
            if (window.currentAudio.src.indexOf('blob:') === 0) {
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

    // Clear active playing highlights
    document.querySelectorAll('.song-card.playing').forEach(function(card) {
        card.classList.remove('playing');
    });
}

window.playSong = playSong;
window.closePlayer = closePlayer;
window.playNextInQueue = playNextInQueue;

    // ============================================================
    // FILE: /js/ui/download.js
    // ============================================================

// src/js/ui/download.js

function downloadSong(songData) {
    if (!songData) {
        console.error('[Download] No song data provided');
        return window.Utils.Promise.resolve();
    }

    var token = songData.token || songData.id;
    console.log('[Download] Downloading song:', token);

    var progressDiv = document.getElementById('download-progress-' + token);
    if (progressDiv) {
        progressDiv.style.display = 'block';
        progressDiv.textContent = '⏳ Downloading...';
    }

    var buttons = document.querySelectorAll('[data-token="' + token + '"] .btn-download');
    buttons.forEach(function(btn) {
        btn.textContent = '⏳';
        btn.disabled = true;
    });

    try {
        var decryptedUrl = window.Utils.getDecryptedUrl(songData, window.currentQuality || 96);
        var song = window.Utils.formatters.formatDecryptedSong(songData, decryptedUrl);

        // Use existing download logic
        return window.Services.Download.songFromData(song)
            .then(function() {
                if (progressDiv) {
                    progressDiv.textContent = '✅ Done!';
                    progressDiv.style.color = '#1db954';
                    setTimeout(function() {
                        progressDiv.style.display = 'none';
                        progressDiv.style.color = '#28a745';
                    }, 3000);
                }
            })
            .catch(function(error) {
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
            })
            .then(function() {
                buttons.forEach(function(btn) {
                    btn.textContent = '⬇';
                    btn.disabled = false;
                });
            });

    } catch (error) {
        console.error('[Download] Setup error:', error);
        alert('Failed to initialize download: ' + error.message);
        buttons.forEach(function(btn) {
            btn.textContent = '⬇';
            btn.disabled = false;
        });
        if (progressDiv) {
            progressDiv.style.display = 'none';
        }
        return window.Utils.Promise.resolve();
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
window.currentQuality = 96;
// ============ CACHE ============
window.Cache = {
    store: {},

    set: function(key, data) {
        this.store[key] = data;
    },

    get: function(key) {
        return this.store[key] !== undefined ? this.store[key] : null;
    },

    has: function(key) {
        return this.store[key] !== undefined;
    },



    getSearchKey: function(type, query, page, limit) {
        return 'search:' + type + ':' + query + ':' + (page || 1) + ':' + (limit || 20);
    },

    getDetailKey: function(type, token) {
        return 'detail:' + type + ':' + token;
    }
};
// ============ PAGINATION STATE ============
// For search results
window._searchState = {
    type: 'songs',
    query: '',
    currentPage: 1,
    limit: 20,
    total: 0,
    isLoading: false
};
window._searchLoadedPages = [];

// For playlist details
window._playlistState = {
    token: '',
    currentPage: 1,
    limit: 50,
    total: 0,
    isLoading: false
};
window._playlistLoadedPages = [];

// ============ NAVIGATION ============
window._navStack = [];
window._isRestoring = false;

window.Nav = {
    push: function(view) {
        window._navStack.push(view);
        console.log(
            '[Nav] PUSH:', view.type, 'Stack:',
            window._navStack
                .map(function(v) {
                    return v.type;
                })
                .join(' → '));
    },
    pop: function() {
        var view = window._navStack.pop();
        console.log(
            '[Nav] POP:', view ? view.type : 'none', 'Stack:',
            window._navStack
                .map(function(v) {
                    return v.type;
                })
                .join(' → '));
        return view;
    },
    clear: function() {
        window._navStack = [];
        console.log('[Nav] CLEAR');
    },
    peek: function() {
        return window._navStack[window._navStack.length - 1];
    },
    getStack: function() {
        return window._navStack;
    },
    updateCurrent: function(dataUpdates) {
        var current = this.peek();
        if (current && current.data) {
            Object.assign(current.data, dataUpdates);
            console.log('[Nav] Updated active stack view data:', current.type, dataUpdates);
        }
    }
};

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

// Prefill search query if current tab URL matches a platform item
function detectAndPrefillUrl() {
    var searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    var parsed = window.Utils.parseUrl(window.location.href);
    if (parsed && parsed.token) {
        searchInput.value = window.location.href;
        console.log('[UI] Prefilled URL from page:', window.location.href);
    }
}

// Close overlay Dialog panel
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

// Expose variables
window.DOM = DOM;
window.closeUI = closeUI;


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
    overlay.innerHTML = '<div class="container">\n' +
        '    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;gap:10px;flex-wrap:wrap;">\n' +
        '        <h1 style="margin:0;font-size:24px;white-space:nowrap;">🎵 Song Downloader</h1>\n' +
        '        <div style="display:flex;align-items:center;gap:6px;font-size:13px;color:#888;flex-shrink:0;margin-left:auto;">\n' +
        '            <span>Quality:</span>\n' +
        '            <select id="quality-select" style="background:#222;color:#fff;border:1px solid #444;border-radius:4px;padding:4px 8px;font-size:13px;cursor:pointer;">\n' +
        '                <option value="12">12</option>\n' +
        '                <option value="48">48</option>\n' +
        '                <option value="96" selected>96</option>\n' +
        '                <option value="160">160</option>\n' +
        '                <option value="320">320</option>\n' +
        '            </select>\n' +
        '            <span style="font-size:11px;color:#666;">kbps</span>\n' +
        '        </div>\n' +
        '    </div>\n' +
        '    <div class="search-tabs">\n' +
        '        <button class="tab active" id="tab-songs">Songs</button>\n' +
        '        <button class="tab" id="tab-albums">Albums</button>\n' +
        '        <button class="tab" id="tab-playlists">Playlists</button>\n' +
        '        <button class="tab" id="tab-artists">Artists</button>\n' +
        '    </div>\n' +
        '    <div class="search-box">\n' +
        '        <input type="text" id="searchInput" placeholder="Search for songs or albums..." autofocus />\n' +
        '        <button class="btn-search" id="searchBtn">Search</button>\n' +
        '    </div>\n' +
        '    <div id="stats" class="stats"></div>\n' +
        '    <div id="results"></div>\n' +
        '</div>';

    document.body.appendChild(overlay);

    var toggleBtn = document.createElement('button');
    toggleBtn.id = 'ui-toggle-btn';
    toggleBtn.textContent = '🎵';
    toggleBtn.title = 'Open Song Downloader (Alt+J)';
    document.body.appendChild(toggleBtn);

    isInitialized = true;

    // Populate DOM references synchronously
    DOM.searchInput = document.getElementById('searchInput');
    DOM.results = document.getElementById('results');
    DOM.stats = document.getElementById('stats');
    DOM.tabs = document.querySelectorAll('.tab');
    DOM.overlay = document.getElementById('ui-overlay');
    DOM.toggleBtn = document.getElementById('ui-toggle-btn');
    DOM.closeBtn = document.getElementById('ui-close-btn');

    setupEventListeners();
    setupAppEventListeners();
    console.log('[UI] UI ready');
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


    // ============================================================
    // FILE: /js/ui/handlers.js
    // ============================================================

// src/js/ui/handlers.js

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
            toggleUI();
        });
    }

    // Close button
    if (DOM.closeBtn) {
        DOM.closeBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            e.preventDefault();
            closeUI();
        });
    }

    // Search button
    var searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            e.preventDefault();
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

    // Playlists tab
    var playlistsTab = document.getElementById('tab-playlists');
    if (playlistsTab) {
        playlistsTab.addEventListener('click', function(e) {
            e.stopPropagation();
            e.preventDefault();
            switchTab('playlists');
        });
    }

    // Artists tab
    var artistsTab = document.getElementById('tab-artists');
    if (artistsTab) {
        artistsTab.addEventListener('click', function(e) {
            e.stopPropagation();
            e.preventDefault();
            switchTab('artists');
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

    // Global delegated click listener on results container
    var results = document.getElementById('results');
    if (results) {
        results.addEventListener('click', function(e) {
            var target = e.target;

            // 1. Back navigation click handling
            var backBtn =
                target.closest('.btn-back') || (target.id === 'btn-back-search') || (target.id === 'btn-back');
            if (backBtn) {
                e.preventDefault();
                e.stopPropagation();
                var current = window.Nav.pop();
                var prev = window.Nav.peek();
                if (prev) {
                    restoreView(prev);
                } else if (typeof window.search === 'function') {
                    window.search();
                }
                return;
            }

            // 2. Play button click handling
            var playBtn = target.closest('.btn-play');
            if (playBtn) {
                e.preventDefault();
                e.stopPropagation();
                var songCard = playBtn.closest('.song-card');
                var songData = songCard ? songCard._songData : null;
                if (songData && typeof window.playSong === 'function') {
                    window.playSong(songData);
                }
                return;
            }

            // 3. Download button click handling
            var downloadBtn = target.closest('.btn-download');
            if (downloadBtn) {
                e.preventDefault();
                e.stopPropagation();
                var songCard = downloadBtn.closest('.song-card');
                var songData = songCard ? songCard._songData : null;
                if (songData && typeof window.downloadSong === 'function') {
                    window.downloadSong(songData);
                }
                return;
            }

            // 4. Lyrics button click handling
            var lyricsBtn = target.closest('.btn-lyrics');
            if (lyricsBtn) {
                e.preventDefault();
                e.stopPropagation();
                var token = lyricsBtn.dataset.token;
                var songId = lyricsBtn.dataset.songid;
                if (token && typeof window.showLyrics === 'function') {
                    window.showLyrics(token, songId);
                }
                return;
            }

            // 5. More actions menu toggle button
            var moreBtn = target.closest('.btn-more');
            if (moreBtn) {
                e.preventDefault();
                e.stopPropagation();
                var songId = moreBtn.dataset.songid;
                var menu = document.getElementById('more-menu-' + songId);
                if (menu) {
                    document.querySelectorAll('.more-menu').forEach(function(m) {
                        if (m.id !== 'more-menu-' + songId) {
                            m.style.display = 'none';
                        }
                    });
                    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
                }
                return;
            }

            // 6. Action items inside the more menu
            var moreItem = target.closest('.more-item');
            if (moreItem) {
                e.preventDefault();
                e.stopPropagation();
                var action = moreItem.dataset.action;
                var token = moreItem.dataset.token;
                var menu = moreItem.closest('.more-menu');
                if (menu) menu.style.display = 'none';
                if (action === 'album' && typeof window.viewAlbum === 'function') {
                    window.viewAlbum(token);
                } else if (action === 'artist' && typeof window.viewArtist === 'function') {
                    window.viewArtist(token);
                }
                return;
            }

            // 7. View transition for Albums (either .album-card or its inner .btn-view-album)
            var viewAlbumBtn = target.closest('.btn-view-album') || target.closest('.album-card');
            if (viewAlbumBtn) {
                e.preventDefault();
                e.stopPropagation();
                var token = viewAlbumBtn.dataset.token;
                if (token && typeof window.viewAlbum === 'function') {
                    window.viewAlbum(token);
                }
                return;
            }

            // 8. View transition for Playlists (either .playlist-card or its inner .btn-view-playlist)
            var viewPlaylistBtn = target.closest('.btn-view-playlist') || target.closest('.playlist-card');
            if (viewPlaylistBtn) {
                e.preventDefault();
                e.stopPropagation();
                var token = viewPlaylistBtn.dataset.token;
                if (token && typeof window.viewPlaylist === 'function') {
                    window.viewPlaylist(token);
                }
                return;
            }

            // 9. View transition for Artists (either .artist-card or its inner .btn-view-artist)
            var viewArtistBtn = target.closest('.btn-view-artist') || target.closest('.artist-card');
            if (viewArtistBtn) {
                e.preventDefault();
                e.stopPropagation();
                var token = viewArtistBtn.dataset.token;
                if (token && typeof window.viewArtist === 'function') {
                    window.viewArtist(token);
                }
                return;
            }

            // 10. Category switching sub-tabs in Artist detail view
            var artistTab = target.closest('.artist-tab');
            if (artistTab) {
                e.preventDefault();
                e.stopPropagation();
                var category = artistTab.dataset.category;
                if (typeof window.switchArtistCategory === 'function') {
                    window.switchArtistCategory(category);
                }
                return;
            }
        });

        // Global document click listener for menus and overlays closing
        document.addEventListener('click', function(e) {
            var target = e.target;

            // Close more actions menus on outside click
            if (!target.closest('.btn-more') && !target.closest('.more-menu')) {
                document.querySelectorAll('.more-menu').forEach(function(m) {
                    m.style.display = 'none';
                });
            }

            // Close lyrics overlay on close button click
            var lyricsCloseBtn = target.closest('#lyrics-close-btn');
            if (lyricsCloseBtn) {
                e.preventDefault();
                e.stopPropagation();
                if (typeof window.closeLyricsOverlay === 'function') {
                    window.closeLyricsOverlay();
                }
                return;
            }

            // Close lyrics overlay on click outside modal backdrop
            var lyricsOverlay = document.getElementById('lyrics-overlay');
            if (lyricsOverlay && target === lyricsOverlay) {
                e.preventDefault();
                e.stopPropagation();
                if (typeof window.closeLyricsOverlay === 'function') {
                    window.closeLyricsOverlay();
                }
            }
        });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.altKey && e.key === 'j') {
            e.preventDefault();
            e.stopPropagation();
            toggleUI();
        }
        if (e.key === 'Escape') {
            var lyricsOverlay = document.getElementById('lyrics-overlay');
            if (lyricsOverlay) {
                e.preventDefault();
                e.stopPropagation();
                if (typeof window.closeLyricsOverlay === 'function') {
                    window.closeLyricsOverlay();
                }
                return;
            }
            if (DOM.overlay && DOM.overlay.classList.contains('active')) {
                e.preventDefault();
                e.stopPropagation();
                closeUI();
            }
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
    var playlistsTab = document.getElementById('tab-playlists');
    var artistsTab = document.getElementById('tab-artists');
    var stats = document.getElementById('stats');
    var results = document.getElementById('results');
    var player = document.getElementById('player');

    // Remove active class from all tabs
    if (songsTab) songsTab.classList.remove('active');
    if (albumsTab) albumsTab.classList.remove('active');
    if (playlistsTab) playlistsTab.classList.remove('active');
    if (artistsTab) artistsTab.classList.remove('active');

    // Add active class to selected tab
    if (type === 'songs' && songsTab) {
        songsTab.classList.add('active');
    } else if (type === 'albums' && albumsTab) {
        albumsTab.classList.add('active');
    } else if (type === 'playlists' && playlistsTab) {
        playlistsTab.classList.add('active');
    } else if (type === 'artists' && artistsTab) {
        artistsTab.classList.add('active');
    }

    // Clear results for other tabs
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
    isOpen: function() {
        return isOpen;
    },
    toggle: toggleUI,
    open: openUI,
    close: closeUI
};

// Start the application UI initialization immediately in browser context
if (typeof window.createUI === 'function' && typeof document !== 'undefined') {
    window.createUI();
}

console.log('[UI] Press Alt+J to toggle, or click the 🎵 button');

})();
