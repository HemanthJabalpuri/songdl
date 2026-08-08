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
        console.log('[Nav] PUSH:', view.type, 'Stack:', window._navStack.map(v => v.type).join(' → '));
    },
    pop: function() {
        var view = window._navStack.pop();
        console.log('[Nav] POP:', view ? view.type : 'none', 'Stack:', window._navStack.map(v => v.type).join(' → '));
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
