// src/js/ui/core.js

// STATE
window.currentAudio = null;
window.currentSearchType = 'songs';
window.currentQuery = '';
window.decryptedUrlCache = new Map();
window.lyricsCache = {};
// Quality setting (default: 96 kbps)
window.currentQuality = 96;
// ============ CACHE ============
window.Cache = {
    store: {},
    
    set: function(key, data) {
        this.store[key] = {
            data: data,
            timestamp: Date.now()
        };
    },
    
    get: function(key) {
        return this.store[key] ? this.store[key].data : null;
    },
    
    has: function(key) {
        return !!this.store[key];
    },
    
    delete: function(key) {
        delete this.store[key];
    },
    
    clear: function() {
        this.store = {};
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