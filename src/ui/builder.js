// src/js/ui/builder.js

function createUI() {
    console.log('[UI] Creating UI...');

    if (isInitialized) {
        console.log('[UI] Already initialized');
        return;
    }

    if (typeof window.Utils.injectAllStyles === 'function') {
        window.Utils.injectAllStyles();
    }

    var overlay = document.createElement('div');
    overlay.id = 'ui-overlay';
    /* clang-format off */
    overlay.innerHTML = window.Utils.compileHTML([
        '<div class="container">',
        '    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;gap:10px;flex-wrap:wrap;">',
        '        <h1 style="margin:0;font-size:24px;white-space:nowrap;">🎵 Song Downloader</h1>',
        '        <div style="display:flex;align-items:center;gap:6px;font-size:13px;color:#888;flex-shrink:0;margin-left:auto;">',
        '            <span>Quality:</span>',
        '            <select id="quality-select" style="background:#222;color:#fff;border:1px solid #444;border-radius:4px;padding:4px 8px;font-size:13px;cursor:pointer;">',
        '                <option value="12">12</option>',
        '                <option value="48">48</option>',
        '                <option value="96" selected>96</option>',
        '                <option value="160">160</option>',
        '                <option value="320">320</option>',
        '            </select>',
        '            <span style="font-size:11px;color:#666;">kbps</span>',
        '        </div>',
        '    </div>',
        '    <div class="search-box">',
        '        <input type="text" id="searchInput" placeholder="Search for songs or albums..." autofocus />',
        '        <button class="btn-search" id="searchBtn">Search</button>',
        '    </div>',
        '    <div class="search-options" id="search-options" style="display: none;">',
        '        <button class="search-option active" data-type="songs">Songs</button>',
        '        <button class="search-option" data-type="albums">Albums</button>',
        '        <button class="search-option" data-type="playlists">Playlists</button>',
        '        <button class="search-option" data-type="artists">Artists</button>',
        '    </div>',
        '    <div id="stats" class="stats"></div>',
        '    <div id="results"></div>',
        '</div>'
    ]);
    /* clang-format on */

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
    DOM.tabs = document.querySelectorAll('.search-option');
    DOM.overlay = document.getElementById('ui-overlay');
    DOM.toggleBtn = document.getElementById('ui-toggle-btn');
    DOM.closeBtn = document.getElementById('ui-close-btn');

    // Bind search option clicks locally
    var optsNode = overlay.querySelector('.search-options');
    if (optsNode) {
        window.Utils.bindClick(optsNode, '.search-option', function(e, btn) {
            var selectedType = btn.dataset.type;
            window.UI.setCategoryHighlight(selectedType);
            window.UI.currentSearchType = selectedType;

            // Reset current results view for the new category
            var results = document.getElementById('results');
            var stats = document.getElementById('stats');
            if (results) results.innerHTML = '';
            if (stats) stats.innerHTML = '';

            // Auto-trigger search if input isn't empty
            if (DOM.searchInput && DOM.searchInput.value.trim() !== '') {
                window.UI.search();
            }
        });
    }

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

window.UI.setCategoryHighlight = function(type) {
    var optsNode = document.getElementById('search-options');
    if (optsNode) {
        optsNode.querySelectorAll('.search-option').forEach(function(btn) {
            btn.classList.toggle('active', btn.dataset.type === type);
        });
    }
};

window.UI.createUI = createUI;
window.UI.toggleUI = toggleUI;
window.UI.openUI = openUI;

/* clang-format off */
// Register core frames and layouts styles
window.Utils.registerStyle([
    '/* ===== Floating Toggle Button ===== */',
    '#ui-toggle-btn {',
    '    position: fixed;',
    '    bottom: 20px;',
    '    right: 20px;',
    '    z-index: 2147483647;',
    '    background: #1db954;',
    '    color: white;',
    '    border: none;',
    '    border-radius: 50%;',
    '    width: 56px;',
    '    height: 56px;',
    '    font-size: 24px;',
    '    cursor: pointer;',
    '    box-shadow: 0 4px 12px rgba(0,0,0,0.3);',
    '    display: flex;',
    '    align-items: center;',
    '    justify-content: center;',
    '    transition: transform 0.2s;',
    '    touch-action: manipulation;',
    '}',
    '#ui-toggle-btn:hover {',
    '    transform: scale(1.1);',
    '}',
    '#ui-toggle-btn:active {',
    '    transform: scale(0.95);',
    '}',
    '/* ===== Fullscreen Overlay ===== */',
    '#ui-overlay {',
    '    position: fixed;',
    '    top: 0;',
    '    left: 0;',
    '    right: 0;',
    '    bottom: 0;',
    '    z-index: 2147483646;',
    '    background: #111;',
    '    color: #fff;',
    '    font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif;',
    '    display: none;',
    '    flex-direction: column;',
    '    overflow-y: auto;',
    '    padding: 20px;',
    '}',
    '#ui-overlay.active {',
    '    display: flex;',
    '}',
    '/* ===== Overlay Content ===== */',
    '.container {',
    '    max-width: 900px;',
    '    margin: 0 auto;',
    '    width: 100%;',
    '}',
    'h1 {',
    '    color: #1db954;',
    '    font-size: 24px;',
    '    margin-bottom: 20px;',
    '    display: flex;',
    '    align-items: center;',
    '    gap: 12px;',
    '}',
    '/* Loading & Error */',
    '.loading {',
    '    text-align: center;',
    '    padding: 40px;',
    '    color: #888;',
    '}',
    '.error {',
    '    color: #ff4444;',
    '    padding: 20px;',
    '    background: #2a1a1a;',
    '    border-radius: 8px;',
    '    border: 1px solid #661111;',
    '}',
    '.no-results {',
    '    text-align: center;',
    '    padding: 40px;',
    '    color: #666;',
    '}',
    '/* ===== Load More Button ===== */',
    '.btn-load-more {',
    '    display: block;',
    '    width: 100%;',
    '    padding: 12px 20px;',
    '    margin-top: 15px;',
    '    background: #282828;',
    '    color: #fff;',
    '    border: 1px solid #444;',
    '    border-radius: 8px;',
    '    font-size: 14px;',
    '    font-weight: 500;',
    '    cursor: pointer;',
    '    transition: all 0.2s;',
    '    text-align: center;',
    '}',
    '.btn-load-more:hover {',
    '    background: #333;',
    '    border-color: #1db954;',
    '}',
    '.btn-load-more:disabled {',
    '    opacity: 0.5;',
    '    cursor: not-allowed;',
    '}',
    '.btn-load-more:disabled:hover {',
    '    background: #282828;',
    '    border-color: #444;',
    '}',
    '/* ===== End of Results ===== */',
    '.end-of-results {',
    '    display: block;',
    '    width: 100%;',
    '    padding: 12px 20px;',
    '    margin-top: 15px;',
    '    color: #666;',
    '    font-size: 14px;',
    '    text-align: center;',
    '    border-top: 1px solid #333;',
    '}',
    '/* ===== Back Button ===== */',
    '.btn-back {',
    '    padding: 8px 20px;',
    '    background: #6c757d;',
    '    color: white;',
    '    border: none;',
    '    border-radius: 4px;',
    '    cursor: pointer;',
    '}',
    '.btn-back:hover {',
    '    background: #5a6268;',
    '}',
    '/* Unified grid layout for card elements in detail views */',
    '.results,',
    '.album-list,',
    '.playlist-list,',
    '.album-songs-list,',
    '.playlist-songs-list,',
    '.artist-songs-section .song-list {',
    '    display: grid;',
    '    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));',
    '    gap: 15px;',
    '}',
    '/* ===== Responsive ===== */',
    '@media (max-width: 600px) {',
    '    .search-options {',
    '        flex-wrap: wrap;',
    '    }',
    '    .search-option {',
    '        flex: 1;',
    '        text-align: center;',
    '        padding: 8px 12px;',
    '        font-size: 13px;',
    '    }',
    '}'
]);
/* clang-format on */
