// src/js/ui/core.js

// STATE
window.UI.currentAudio = null;
window.UI.currentSearchType = 'songs';
window.UI.currentQuery = '';
window.UI.currentQuality = 96;
// ============ CACHE ============

// ============ PAGINATION STATE ============
// For search results
window.UI._searchState = {
    type: 'songs',
    query: '',
    currentPage: 1,
    limit: 20,
    total: 0,
    isLoading: false
};
window.UI._searchLoadedPages = [];

// For playlist details
window.UI._playlistState = {
    token: '',
    currentPage: 1,
    limit: 50,
    total: 0,
    isLoading: false
};
window.UI._playlistLoadedPages = [];

// ============ NAVIGATION ============
window.UI._navStack = [];
window.UI._isRestoring = false;

window.UI.Nav = {
    push: function(view) {
        window.UI._navStack.push(view);
        console.log(
            '[Nav] PUSH:', view.type, 'Stack:',
            window.UI._navStack
                .map(function(v) {
                    return v.type;
                })
                .join(' -> '));
    },
    pop: function() {
        var view = window.UI._navStack.pop();
        console.log(
            '[Nav] POP:', view ? view.type : 'none', 'Stack:',
            window.UI._navStack
                .map(function(v) {
                    return v.type;
                })
                .join(' -> '));
        return view;
    },
    clear: function() {
        window.UI._navStack = [];
        console.log('[Nav] CLEAR');
    },
    peek: function() {
        return window.UI._navStack[window.UI._navStack.length - 1];
    },
    getStack: function() {
        return window.UI._navStack;
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
    if (typeof window.UI.closePlayer === 'function') {
        window.UI.closePlayer();
    }

    DOM.overlay.classList.remove('active');
    if (DOM.toggleBtn) DOM.toggleBtn.innerHTML = window.UI.icons.music;

    isOpen = false;
    console.log('[UI] Closed');
}

// Expose variables
window.UI.DOM = DOM;
window.UI.closeUI = closeUI;
