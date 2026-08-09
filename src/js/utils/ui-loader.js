// src/js/utils/ui-loader.js

window.Utils = window.Utils || {};
window._styleRegistry = [];

// Push style block to memory registry with custom scope (default: '#ui-overlay')
window.Utils.registerStyle = function(cssLines, scope) {
    window._styleRegistry.push({lines: cssLines, scope: scope !== undefined ? scope : '#ui-overlay'});
};

// Batch compile, auto-scope, and inject all styles into a single DOM element
window.Utils.injectAllStyles = function() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('songdl-injected-styles')) return;

    var styleEl = document.createElement('style');
    styleEl.id = 'songdl-injected-styles';

    var combinedCSS =
        window._styleRegistry
            .map(function(block) {
                var lines = Array.isArray(block.lines) ? block.lines : [block.lines];
                var scope = block.scope;

                return lines
                    .map(function(line) {
                        var trimmed = line.trim();

                        // Prepend custom scope only if scope is defined and line is a selector
                        if (scope && trimmed.length > 0 &&
                            (trimmed.indexOf('{') !== -1 || trimmed.indexOf(',') === trimmed.length - 1) &&
                            trimmed.indexOf('@') !== 0 && trimmed.indexOf('}') !== 0 && trimmed.indexOf(scope) !== 0 &&
                            trimmed.indexOf('#ui-toggle-btn') !== 0) {
                            // Prepend selector scope
                            return scope + ' ' + line;
                        }
                        return line;
                    })
                    .join('\n');
            })
            .join('\n');

    // Bypasses CSP/unsafe-inline if running inside a Userscript Manager
    if (typeof GM_addStyle !== 'undefined') {
        GM_addStyle(combinedCSS);
    } else {
        styleEl.textContent = combinedCSS;
        document.head.appendChild(styleEl);
    }

    console.log('[StyleLoader] Batched and injected ' + window._styleRegistry.length + ' style blocks');
};

// Compile HTML string array into a single markup string
window.Utils.compileHTML = function(htmlLines) {
    return Array.isArray(htmlLines) ? htmlLines.join('\n') : htmlLines;
};
