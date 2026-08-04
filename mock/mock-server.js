// mock/mock-server.js
// Mock server for JioSaavn API - Static JSON with Pagination

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const SEARCH_SONGS_DIR = path.join(DATA_DIR, 'search', 'songs');
const SEARCH_ALBUMS_DIR = path.join(DATA_DIR, 'search', 'albums');
const SEARCH_PLAYLISTS_DIR = path.join(DATA_DIR, 'search', 'playlists');
const DETAILS_SONGS_DIR = path.join(DATA_DIR, 'details', 'songs');
const DETAILS_ALBUMS_DIR = path.join(DATA_DIR, 'details', 'albums');
const DETAILS_LYRICS_DIR = path.join(DATA_DIR, 'details', 'lyrics');
const DETAILS_PLAYLISTS_DIR = path.join(DATA_DIR, 'details', 'playlists');
const SEARCH_ARTISTS_DIR = path.join(DATA_DIR, 'search', 'artists');
const DETAILS_ARTISTS_DIR = path.join(DATA_DIR, 'details', 'artists');

// ============ CACHE (loaded once at startup) ============

let searchSongFiles = [];
let searchAlbumFiles = [];
let searchPlaylistFiles = [];
let songTokens = [];
let albumTokens = [];
let lyricsTokens = [];
let playlistTokens = [];
let searchArtistFiles = [];
let artistTokens = [];

function loadCache() {
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
    
    try {
        searchPlaylistFiles = fs.readdirSync(SEARCH_PLAYLISTS_DIR)
            .filter(f => f.endsWith('.json') && f !== 'default.json')
            .map(f => f.replace('.json', ''));
    } catch (e) {
        searchPlaylistFiles = [];
    }
    
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
        playlistTokens = fs.readdirSync(DETAILS_PLAYLISTS_DIR)
            .filter(f => f.endsWith('.json'))
            .map(f => f.replace('.json', ''));
    } catch (e) {
        playlistTokens = [];
    }
    
    try {
        lyricsTokens = fs.readdirSync(DETAILS_LYRICS_DIR)
            .filter(f => f.endsWith('.json'))
            .map(f => f.replace('.json', ''));
    } catch (e) {
        lyricsTokens = [];
    }

// Load artist search files
try {
    searchArtistFiles = fs.readdirSync(SEARCH_ARTISTS_DIR)
        .filter(f => f.endsWith('.json') && f !== 'default.json')
        .map(f => f.replace('.json', ''));
} catch (e) {
    searchArtistFiles = [];
}

// Load artist tokens
try {
    artistTokens = fs.readdirSync(DETAILS_ARTISTS_DIR)
        .filter(f => f.endsWith('.json'))
        .map(f => f.replace('.json', ''));
} catch (e) {
    artistTokens = [];
}

console.log('[Mock] Cache loaded:');
console.log('  - Song search files:', searchSongFiles.length);
console.log('  - Album search files:', searchAlbumFiles.length);
console.log('  - Playlist search files:', searchPlaylistFiles.length);
console.log('  - Artist search files:', searchArtistFiles.length);  // NEW
console.log('  - Song tokens:', songTokens.length);
console.log('  - Album tokens:', albumTokens.length);
console.log('  - Playlist tokens:', playlistTokens.length);
console.log('  - Artist tokens:', artistTokens.length);  // NEW
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
    
    let files;
    let searchDir;
    if (type === 'song') {
        files = searchSongFiles;
        searchDir = SEARCH_SONGS_DIR;
    } else if (type === 'album') {
        files = searchAlbumFiles;
        searchDir = SEARCH_ALBUMS_DIR;
    } else if (type === 'playlist') {
        files = searchPlaylistFiles;
        searchDir = SEARCH_PLAYLISTS_DIR;
    } else if (type === 'artist') {
        files = searchArtistFiles;
        searchDir = SEARCH_ARTISTS_DIR;
    } else {
        files = [];
        searchDir = null;
    }
    
    let matchedFile = null;
    for (const file of files) {
        if (query.includes(file.toLowerCase())) {
            matchedFile = file;
            break;
        }
    }
    
    if (!matchedFile || !searchDir) {
        const defaultPath = path.join(searchDir || '.', 'default.json');
        const data = loadJSON(defaultPath);
        return data || { total: 0, start: 0, results: [] };
    }
    
    const filePath = path.join(searchDir, matchedFile + '.json');
    const data = loadJSON(filePath);
    return data || { total: 0, start: 0, results: [] };
}

function getDetailsResponse(token, type, page, limit) {
    let dir;
    let tokens;

   if (type === 'song') {
        dir = DETAILS_SONGS_DIR;
        tokens = songTokens;
    } else if (type === 'album') {
        dir = DETAILS_ALBUMS_DIR;
        tokens = albumTokens;
    } else if (type === 'playlist') {
        dir = DETAILS_PLAYLISTS_DIR;
        tokens = playlistTokens;
    } else if (type === 'artist') {
        dir = DETAILS_ARTISTS_DIR;
        tokens = artistTokens;
    } else if (type === 'lyrics') {
        dir = DETAILS_LYRICS_DIR;
        tokens = lyricsTokens;
    } else {
        return null;
    }
    
    if (!tokens.includes(token)) {
        return null;
    }
    
    const filePath = path.join(dir, token + '.json');
    const data = loadJSON(filePath);
    if (!data) return null;
    
    // For playlist, apply pagination
    if (type === 'playlist') {
        return paginatePlaylist(data, page, limit);
    }
    
    return data;
}

// ============ PAGINATION HELPERS ============

function paginatePlaylist(data, page, limit) {
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 50;
    
    var totalSongs = parseInt(data.list_count) || (data.list ? data.list.length : 0);
    var start = (page - 1) * limit;
    var end = Math.min(start + limit, totalSongs);
    
    if (start >= totalSongs) {
        return {
            ...data,
            list: []
        };
    }
    
    var paginatedList = data.list ? data.list.slice(start, end) : [];
    
    return {
        id: data.id,
        title: data.title,
        subtitle: data.subtitle,
        header_desc: data.header_desc || '',
        type: 'playlist',
        perma_url: data.perma_url || '',
        image: data.image || 'http://127.0.0.1:3000/mock/images/mock_image-150x150.jpg',
        language: data.language || 'english',
        year: data.year || '',
        play_count: data.play_count || '',
        explicit_content: data.explicit_content || '0',
        song_count: String(totalSongs),
        list_count: String(totalSongs),
        list_type: data.list_type || '',
        list: paginatedList
    };
}

function paginateSearchResults(data, page, limit) {
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 20;
    
    var total = parseInt(data.total) || (data.results ? data.results.length : 0);
    var start = (page - 1) * limit;
    var end = Math.min(start + limit, total);
    
    if (start >= total) {
        return {
            total: total,
            start: start + 1,
            results: []
        };
    }
    
    var paginatedResults = data.results ? data.results.slice(start, end) : [];
    
    return {
        total: total,
        start: start + 1,
        results: paginatedResults
    };
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
    const page = params.get('p') || 1;
    const limit = params.get('n') || 20;

    let responseData = null;

    if (call === 'search.getResults' || call === 'search.getAlbumResults' || call === 'search.getPlaylistResults' || call === 'search.getArtistResults') {
        let searchType;
        if (call === 'search.getResults') {
            searchType = 'song';
        } else if (call === 'search.getAlbumResults') {
            searchType = 'album';
        } else if (call === 'search.getPlaylistResults') {
            searchType = 'playlist';
        } else if (call === 'search.getArtistResults') {
            searchType = 'artist';
        }
        var rawData = getSearchResponse(query, searchType);
        responseData = paginateSearchResults(rawData, page, limit);
    } else if (call === 'webapi.get') {
        responseData = getDetailsResponse(token, type, page, limit);
} else if (call === 'artist.getArtistMoreSong') {
    // Return mock songs with pagination
    var artistId = params.get('artistId');
    var pag = parseInt(params.get('page')) || 1;
    var category = params.get('category') || 'popular';
    var limi = 10;
    
    var totalSongs = 25; // Mock total
    var start = (pag - 1) * limi;
    var end = Math.min(start + limi, totalSongs);
    var songs = [];
    
    for (var i = start; i < end; i++) {
        songs.push({
            id: 'mock_song_' + String(i + 1).padStart(3, '0'),
            title: 'Mock Song ' + (i + 1),
            subtitle: 'Mock Artist ' + (i + 1),
            type: 'song',
            perma_url: 'https://music.example.com/song/mock-song-' + (i + 1) + '/mock_song_' + String(i + 1).padStart(3, '0'),
            image: 'http://127.0.0.1:3000/mock/images/mock_image-150x150.jpg',
            language: 'english',
            year: '2024',
            more_info: {
                duration: '180',
                has_lyrics: Math.random() > 0.5 ? 'true' : 'false',
                album: 'Mock Album ' + (i + 1),
                encrypted_media_url: 'JKcIGVL+NOVwdDWakCj6fWGE8WcC+2iTTmjcVY5gjZcb6MwSnJjGC0KIVQL/LeFRb5cctSKeEIo='
            }
        });
    }
    
    responseData = {
        topSongs: {
            songs: songs,
            total: totalSongs,
            last_page: end >= totalSongs
        }
    };
    
} else if (call === 'artist.getArtistMoreAlbum') {
    // Return mock albums with pagination
    var artistId = params.get('artistId');
    var pag = parseInt(params.get('page')) || 1;
    var category = params.get('category') || 'popular';
    var limi = 10;
    
    var totalAlbums = 15; // Mock total
    var start = (pag - 1) * limi;
    var end = Math.min(start + limi, totalAlbums);
    var albums = [];
    
    for (var i = start; i < end; i++) {
        albums.push({
            id: 'mock_album_' + String(i + 1).padStart(3, '0'),
            title: 'Mock Album ' + (i + 1),
            subtitle: 'Mock Artist ' + (i + 1),
            type: 'album',
            perma_url: 'https://music.example.com/album/mock-album-' + (i + 1) + '/mock_album_' + String(i + 1).padStart(3, '0'),
            image: 'http://127.0.0.1:3000/mock/images/mock_image-150x150.jpg',
            language: 'english',
            year: '2024',
            more_info: {
                song_count: String(Math.floor(Math.random() * 10) + 1)
            }
        });
    }
    
    responseData = {
        topAlbums: {
            albums: albums,
            total: totalAlbums,
            last_page: end >= totalAlbums
        }
    };
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