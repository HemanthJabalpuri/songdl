// src/js/ui/handlers.js

// ============================================================
// APP EVENT LISTENERS
// ============================================================
function setupAppEventListeners() {
    if (DOM.searchInput) {
        DOM.searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                window.UI.search();
            }
        });
        DOM.searchInput.addEventListener('focus', function() {
            window.UI.showSearchOptions();
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
    window.Utils.bindClick(DOM.toggleBtn, null, function() {
        toggleUI();
    });

    // Close button
    window.Utils.bindClick(DOM.closeBtn, null, function() {
        closeUI();
    });

    // Search button
    window.Utils.bindClick(document, '#searchBtn', function() {
        window.UI.search();
    });

    // Quality dropdown
    var qualitySelect = document.getElementById('quality-select');
    if (qualitySelect) {
        qualitySelect.addEventListener('change', function() {
            window.UI.currentQuality = parseInt(this.value);
            console.log('[UI] Quality changed to:', window.UI.currentQuality, 'kbps');
        });
    }

    // Global document click listener for closing menus on outside click
    document.addEventListener('click', function(e) {
        var target = e.target;
        if (!target.closest('.btn-more') && !target.closest('.more-menu')) {
            document.querySelectorAll('.more-menu').forEach(function(m) {
                m.style.display = 'none';
            });
        }
        if (!target.closest('#searchInput') && !target.closest('#search-options')) {
            window.UI.hideSearchOptions();
        }
    });

    console.log('[UI] Event listeners setup complete');
}

// Debug helper
window.UI.__UI_DEBUG = {
    isOpen: function() {
        return isOpen;
    },
    toggle: toggleUI,
    open: openUI,
    close: closeUI
};

// Start the application UI initialization immediately in browser context
if (typeof window.UI.createUI === 'function' && typeof document !== 'undefined') {
    window.UI.createUI();
}

console.log('[UI] Click the 🎵 button in the bottom-right corner to toggle');