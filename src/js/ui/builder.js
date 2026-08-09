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
