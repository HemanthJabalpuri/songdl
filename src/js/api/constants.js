// src/js/api/constants.js

window.API = window.API || {};
window.API.constants = window.API.constants || {};

// API endpoints
const HOST = 'https://www.jiosaavn.com';
Object.assign(window.API.constants, {
  API_HOST: HOST,
  API_BASE: `${HOST}/api.php`,
  REFERER: `${HOST}/`,
});

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