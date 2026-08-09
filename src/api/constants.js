// src/js/api/constants.js

window.API = window.API || {};
window.Services = window.Services || {};
window.Utils = window.Utils || {};
window.UI = window.UI || {};
window.API.constants = window.API.constants || {};

// API endpoints
const HOST = 'https://www.mymusic.com';
window.API.constants.API_HOST = HOST;
window.API.constants.API_BASE = HOST + '/api.php';
window.API.constants.REFERER = HOST + '/';

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
