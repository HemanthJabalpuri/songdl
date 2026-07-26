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