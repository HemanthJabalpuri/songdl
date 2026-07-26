// src/js/api/constants.js

window.API = window.API || {};
window.API.constants = window.API.constants || {};

// API endpoints
window.API.constants.API_HOST = 'https://www.jiosaavn.com';
window.API.constants.API_BASE = 'https://www.jiosaavn.com/api.php';
window.API.constants.REFERER = 'https://www.jiosaavn.com/';

// CDN domains for audio and album art
window.API.constants.CDN_DOMAINS = [
    'aac.saavncdn.com',
    'saavncdn.com'
];

// Default headers for all requests
window.API.constants.DEFAULT_HEADERS = {
    'Accept': 'application/json, text/plain, */*',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
};

// Default parameters for all API calls
window.API.constants.API_DEFAULTS = {
    _format: 'json',
    _marker: 0,
    api_version: 4,
    ctx: 'web6dot0'
};

console.log('[API] Constants loaded');