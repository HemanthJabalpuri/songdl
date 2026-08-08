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
