// src/js/utils/ui-loader.js

window.UI._styleRegistry = [];

// Push style block to memory registry with custom scope (default: '#ui-overlay')
window.Utils.registerStyle = function(cssLines, scope) {
    window.UI._styleRegistry.push({lines: cssLines, scope: scope !== undefined ? scope : '#ui-overlay'});
};

// Batch compile, auto-scope, and inject all styles into a single DOM element
window.Utils.injectAllStyles = function() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('songdl-injected-styles')) return;

    var styleEl = document.createElement('style');
    styleEl.id = 'songdl-injected-styles';

    var combinedCSS =
        window.UI._styleRegistry
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

    console.log('[StyleLoader] Batched and injected ' + window.UI._styleRegistry.length + ' style blocks');
};

// Compile HTML string array into a single markup string
window.Utils.compileHTML = function(htmlLines) {
    return Array.isArray(htmlLines) ? htmlLines.join('\n') : htmlLines;
};

// Compile HTML string array into a single interactive DOM element node
window.Utils.compileHTMLToNode = function(htmlLines) {
    var rawHtml = Array.isArray(htmlLines) ? htmlLines.join('\n') : htmlLines;
    var temp = document.createElement('div');
    temp.innerHTML = rawHtml.trim();
    return temp.firstElementChild;
};

// Render HTML strings or DOM elements or arrays of mixed content to a parent node container
window.Utils.render = function(parent, content) {
    if (!parent) return;
    parent.innerHTML = '';
    
    if (content === undefined || content === null) {
        return;
    }
    
    var items = Array.isArray(content) ? content : [content];
    items.forEach(function(item) {
        if (item === undefined || item === null) return;
        if (item instanceof HTMLElement) {
            parent.appendChild(item);
        } else if (typeof item === 'string') {
            parent.insertAdjacentHTML('beforeend', item);
        }
    });
};

// Bind click events on elements matching selector within parent, handling default/propagation details automatically
window.Utils.bindClick = function(parent, selector, handler) {
    if (!parent) return;
    var elements = selector ? parent.querySelectorAll(selector) : [parent];
    elements.forEach(function(element) {
        element.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            handler(e, element);
        });
    });
};
