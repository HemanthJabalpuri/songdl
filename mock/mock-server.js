// mock/mock-server.js
// Mock server for JioSaavn API - Dynamic with Cache

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

// ============ CACHE (loaded once at startup) ============

let searchSongFiles = [];
let searchAlbumFiles = [];
let searchPlaylistFiles = [];
let songTokens = [];
let albumTokens = [];
let lyricsTokens = [];
let playlistTokens = [];

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
    
    // Load playlist search files
    try {
        searchPlaylistFiles = fs.readdirSync(SEARCH_PLAYLISTS_DIR)
            .filter(f => f.endsWith('.json') && f !== 'default.json')
            .map(f => f.replace('.json', ''));
    } catch (e) {
        searchPlaylistFiles = [];
    }
    
    // Load playlist tokens
    try {
        playlistTokens = fs.readdirSync(DETAILS_PLAYLISTS_DIR)
            .filter(f => f.endsWith('.json'))
            .map(f => f.replace('.json', ''));
    } catch (e) {
        playlistTokens = [];
    }
    
    console.log('[Mock] Cache loaded:');
    console.log('  - Song search files:', searchSongFiles.length);
    console.log('  - Album search files:', searchAlbumFiles.length);
    console.log('  - Playlist search files:', searchPlaylistFiles.length);
    console.log('  - Song tokens:', songTokens.length);
    console.log('  - Album tokens:', albumTokens.length);
    console.log('  - Playlist tokens:', playlistTokens.length);
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
    } else {
        files = [];
        searchDir = null;
    }
    
    // Find matching file
    let matchedFile = null;
    for (const file of files) {
        if (query.includes(file.toLowerCase())) {
            matchedFile = file;
            break;
        }
    }
    
    // If no match, return default
    if (!matchedFile || !searchDir) {
        const defaultPath = path.join(searchDir || '.', 'default.json');
        const data = loadJSON(defaultPath);
        return data || { total: 0, start: 0, results: [] };
    }
    
    const filePath = path.join(searchDir, matchedFile + '.json');
    const data = loadJSON(filePath);
    return data || { total: 0, start: 0, results: [] };
}

// ============ GENERATE PLAYLIST RESPONSE ============
function generatePlaylistResponse(token, page, limit) {
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 50;
    
    // Load base playlist data
    const basePath = path.join(DETAILS_PLAYLISTS_DIR, token + '.json');
    const baseData = loadJSON(basePath);
    if (!baseData) return null;
    
    // Total songs (use existing count or default)
    var totalSongs = parseInt(baseData.list_count) || 100;
    var start = (page - 1) * limit;
    var end = Math.min(start + limit, totalSongs);
    
    // Generate songs for this page
    var songs = [];
    for (var i = start; i < end; i++) {
        var num = String(i + 1).padStart(3, '0');
        songs.push({
            id: 'mock_song_' + num,
            title: 'Mock Song ' + (i + 1),
            subtitle: 'Mock Artist ' + (i + 1),
            header_desc: '',
            type: 'song',
            perma_url: 'https://music.example.com/song/mock-song-' + (i + 1) + '/mock_song_' + num,
            image: 'http://127.0.0.1:3000/mock/images/mock_image-150x150.jpg',
            language: 'english',
            year: '2024',
            play_count: String(Math.floor(Math.random() * 1000000)),
            explicit_content: '0',
            list_count: '0',
            list_type: '',
            list: '',
            more_info: {
                music: 'Mock Music Producer',
                album_id: 'mock_album_' + num,
                album: 'Mock Album ' + (i + 1),
                label: 'Mock Records',
                label_id: null,
                origin: 'playlist',
                is_dolby_content: false,
                '320kbps': 'true',
                encrypted_media_url: 'JKcIGVL+NOVwdDWakCj6fWGE8WcC+2iTTmjcVY5gjZcb6MwSnJjGC0KIVQL/LeFRb5cctSKeEIo=',
                encrypted_cache_url: '',
                encrypted_drm_cache_url: '',
                encrypted_drm_media_url: '',
                album_url: 'https://music.example.com/album/mock-album-' + (i + 1) + '/mock_album_' + num,
                duration: String(Math.floor(Math.random() * 200) + 120),
                rights: {
                    code: '0',
                    cacheable: 'true',
                    delete_cached_object: 'false',
                    reason: ''
                },
                cache_state: '',
                has_lyrics: Math.random() > 0.5 ? 'true' : 'false',
                lyrics_snippet: 'Mock lyrics snippet for song ' + (i + 1),
                has_trivia: '0',
                trivia: [],
                starred: 'false',
                copyright_text: '© 2024 Mock Records',
                artistMap: {
                    primary_artists: [
                        {
                            id: 'mock_artist_' + num,
                            name: 'Mock Artist ' + (i + 1),
                            role: 'primary_artists',
                            image: '',
                            type: 'artist',
                            perma_url: 'https://music.example.com/artist/mock-artist-' + (i + 1)
                        }
                    ],
                    featured_artists: [],
                    artists: [
                        {
                            id: 'mock_artist_' + num,
                            name: 'Mock Artist ' + (i + 1),
                            role: 'music',
                            image: '',
                            type: 'artist',
                            perma_url: 'https://music.example.com/artist/mock-artist-' + (i + 1)
                        }
                    ]
                },
                release_date: null,
                label_url: '',
                vcode: '',
                vlink: '',
                triller_available: false,
                request_jiotune_flag: false,
                webp: 'true',
                lyrics_id: ''
            },
            button_tooltip_info: [],
            pro_hva_campaigns: []
        });
    }
    
    // Return playlist with paginated songs
    return {
        id: baseData.id,
        title: baseData.title,
        subtitle: baseData.subtitle,
        header_desc: baseData.header_desc || '',
        type: 'playlist',
        perma_url: baseData.perma_url || 'https://music.example.com/featured/mock-playlist/mock_playlist_001',
        image: baseData.image || 'http://127.0.0.1:3000/mock/images/mock_image-150x150.jpg',
        language: baseData.language || 'english',
        year: '',
        play_count: '',
        explicit_content: '0',
        song_count: String(totalSongs),
        list_count: String(totalSongs),
        list_type: '',
        list: songs
    };
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
    
    // For playlist, handle pagination dynamically
    if (type === 'playlist') {
        return generatePlaylistResponse(token, page, limit);
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
    const page = params.get('p') || 1;
    const limit = params.get('n') || 50;

    let responseData = null;

    if (call === 'search.getResults' || call === 'search.getAlbumResults' || call === 'search.getPlaylistResults') {
        let searchType;
        if (call === 'search.getResults') {
            searchType = 'song';
        } else if (call === 'search.getAlbumResults') {
            searchType = 'album';
        } else if (call === 'search.getPlaylistResults') {
            searchType = 'playlist';
        }
        responseData = getSearchResponse(query, searchType);
    } else if (call === 'webapi.get') {
        responseData = getDetailsResponse(token, type, page, limit);
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