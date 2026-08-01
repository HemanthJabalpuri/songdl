// mock/mock-server.js
// Mock server for JioSaavn API - returns predefined responses

const fs = require('fs');
const path = require('path');

// Load mock data
const searchSongs = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/search-songs.json'), 'utf8'));
const searchAlbums = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/search-albums.json'), 'utf8'));
const songDetails = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/song-details.json'), 'utf8'));
const albumDetails = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/album-details.json'), 'utf8'));
const lyrics = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/lyrics.json'), 'utf8'));

function getMockResponse(url) {
    const params = new URLSearchParams(url.split('?')[1]);
    const call = params.get('__call');
    const token = params.get('token');
    const query = params.get('q');

    switch(call) {
        case 'search.getResults':
            return searchSongs;
        case 'search.getAlbumResults':
            return searchAlbums;
        case 'webapi.get':
            const type = params.get('type');
            if (type === 'song') {
                return songDetails[token] || null;
            } else if (type === 'album') {
                return albumDetails[token] || null;
            } else if (type === 'lyrics') {
                return lyrics[token] || null;
            }
            return null;
        default:
            return null;
    }
}

function handleRequest(req, res) {
    const target = req.headers["x-proxy-url"];
    console.log('[Mock] Request target:', target);  // ← ADD THIS

    if (!target) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing X-Proxy-URL header' }));
        return;
    }

    const mockData = getMockResponse(target);
    
    if (mockData) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(mockData));
        console.log('[Mock] Returning mock data for:', target.split('?')[0]);
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Mock data not found for this request' }));
        console.log('[Mock] No mock data found for:', target);
    }
}

module.exports = { handleRequest };