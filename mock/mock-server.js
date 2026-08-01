// mock/mock-server.js
// Mock server for JioSaavn API - Dynamic with Cache

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const SEARCH_SONGS_DIR = path.join(DATA_DIR, 'search', 'songs');
const SEARCH_ALBUMS_DIR = path.join(DATA_DIR, 'search', 'albums');
const DETAILS_SONGS_DIR = path.join(DATA_DIR, 'details', 'songs');
const DETAILS_ALBUMS_DIR = path.join(DATA_DIR, 'details', 'albums');
const DETAILS_LYRICS_DIR = path.join(DATA_DIR, 'details', 'lyrics');

// ============ CACHE (loaded once at startup) ============

let searchSongFiles = [];
let searchAlbumFiles = [];
let songTokens = [];
let albumTokens = [];
let lyricsTokens = [];

function loadCache() {
    // Load search files
    try {
        searchSongFiles = fs.readdirSync(SEARCH_SONGS_DIR)
            .filter(f => f.endsWith('.json') && f !== 'default.json')
            .map(f => f.replace('.json', ''));
    } catch (e) {
        searchSongFiles = [];
    }
    
    try {
        searchAlbumFiles = fs.readdirSync(SEARCH_ALBUMS_DIR)
            .filter(f => f.endsWith('.json') && f !== 'default.json')
            .map(f => f.replace('.json', ''));
    } catch (e) {
        searchAlbumFiles = [];
    }
    
    // Load details tokens
    try {
        songTokens = fs.readdirSync(DETAILS_SONGS_DIR)
            .filter(f => f.endsWith('.json'))
            .map(f => f.replace('.json', ''));
    } catch (e) {
        songTokens = [];
    }
    
    try {
        albumTokens = fs.readdirSync(DETAILS_ALBUMS_DIR)
            .filter(f => f.endsWith('.json'))
            .map(f => f.replace('.json', ''));
    } catch (e) {
        albumTokens = [];
    }
    
    try {
        lyricsTokens = fs.readdirSync(DETAILS_LYRICS_DIR)
            .filter(f => f.endsWith('.json'))
            .map(f => f.replace('.json', ''));
    } catch (e) {
        lyricsTokens = [];
    }
    
    console.log('[Mock] Cache loaded:');
    console.log('  - Song search files:', searchSongFiles.length);
    console.log('  - Album search files:', searchAlbumFiles.length);
    console.log('  - Song tokens:', songTokens.length);
    console.log('  - Album tokens:', albumTokens.length);
    console.log('  - Lyrics tokens:', lyricsTokens.length);
}

function loadJSON(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(content);
    } catch (e) {
        return null;
    }
}

function getSearchResponse(query, type) {
    query = query.toLowerCase().trim();
    
    // Use cached file list
    const files = type === 'song' ? searchSongFiles : searchAlbumFiles;
    
    // Find matching file
    let matchedFile = null;
    for (const file of files) {
        if (query.includes(file.toLowerCase())) {
            matchedFile = file;
            break;
        }
    }
    
    // If no match, return default
    const searchDir = type === 'song' ? SEARCH_SONGS_DIR : SEARCH_ALBUMS_DIR;
    if (!matchedFile) {
        const defaultPath = path.join(searchDir, 'default.json');
        const data = loadJSON(defaultPath);
        return data || { total: 0, start: 0, results: [] };
    }
    
    const filePath = path.join(searchDir, matchedFile + '.json');
    const data = loadJSON(filePath);
    return data || { total: 0, start: 0, results: [] };
}

function getDetailsResponse(token, type) {
    // Use cached tokens to check existence
    let dir;
    let tokens;
    
    if (type === 'song') {
        dir = DETAILS_SONGS_DIR;
        tokens = songTokens;
    } else if (type === 'album') {
        dir = DETAILS_ALBUMS_DIR;
        tokens = albumTokens;
    } else if (type === 'lyrics') {
        dir = DETAILS_LYRICS_DIR;
        tokens = lyricsTokens;
    } else {
        return null;
    }
    
    // Check if token exists
    if (!tokens.includes(token)) {
        return null;
    }
    
    const filePath = path.join(dir, token + '.json');
    return loadJSON(filePath);
}

// ============ Load cache at startup ============
loadCache();

// ============ Handler ============

function handleRequest(req, res) {
    const target = req.headers["x-proxy-url"];
    if (!target) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing X-Proxy-URL header' }));
        return;
    }

    const urlParts = target.split('?');
    const params = new URLSearchParams(urlParts[1] || '');
    const call = params.get('__call');
    const token = params.get('token');
    const query = params.get('q');
    const type = params.get('type');

    let responseData = null;

    if (call === 'search.getResults' || call === 'search.getAlbumResults') {
        const searchType = call === 'search.getResults' ? 'song' : 'album';
        responseData = getSearchResponse(query, searchType);
    } else if (call === 'webapi.get') {
        responseData = getDetailsResponse(token, type);
    }

    if (responseData) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(responseData));
        console.log('[Mock] Returning mock data for:', call, query || token);
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Mock data not found' }));
        console.log('[Mock] No mock data found for:', call, query || token);
    }
}

module.exports = { handleRequest };