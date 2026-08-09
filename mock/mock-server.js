// mock/mock-server.js
// Mock server for supported music platform API - Static JSON with Pagination

var fs = require('fs');
var path = require('path');
var querystring = require('querystring');

var DATA_DIR = path.join(__dirname, 'data');
var SEARCH_SONGS_DIR = path.join(DATA_DIR, 'search', 'songs');
var SEARCH_ALBUMS_DIR = path.join(DATA_DIR, 'search', 'albums');
var SEARCH_PLAYLISTS_DIR = path.join(DATA_DIR, 'search', 'playlists');
var DETAILS_SONGS_DIR = path.join(DATA_DIR, 'details', 'songs');
var DETAILS_ALBUMS_DIR = path.join(DATA_DIR, 'details', 'albums');
var DETAILS_LYRICS_DIR = path.join(DATA_DIR, 'details', 'lyrics');
var DETAILS_PLAYLISTS_DIR = path.join(DATA_DIR, 'details', 'playlists');
var SEARCH_ARTISTS_DIR = path.join(DATA_DIR, 'search', 'artists');
var DETAILS_ARTISTS_DIR = path.join(DATA_DIR, 'details', 'artists');

// ============ CACHE (loaded once at startup) ============
var searchSongFiles = [];
var searchAlbumFiles = [];
var searchPlaylistFiles = [];
var songTokens = [];
var albumTokens = [];
var lyricsTokens = [];
var playlistTokens = [];
var searchArtistFiles = [];
var artistTokens = [];

function loadCache() {
    try {
        var files = fs.readdirSync(SEARCH_SONGS_DIR);
        searchSongFiles = [];
        for (var i = 0; i < files.length; i++) {
            var f = files[i];
            if (f.indexOf('.json') !== -1 && f !== 'default.json') {
                searchSongFiles.push(f.replace('.json', ''));
            }
        }
    } catch (e) {
        searchSongFiles = [];
    }

    try {
        var files = fs.readdirSync(SEARCH_ALBUMS_DIR);
        searchAlbumFiles = [];
        for (var i = 0; i < files.length; i++) {
            var f = files[i];
            if (f.indexOf('.json') !== -1 && f !== 'default.json') {
                searchAlbumFiles.push(f.replace('.json', ''));
            }
        }
    } catch (e) {
        searchAlbumFiles = [];
    }

    try {
        var files = fs.readdirSync(SEARCH_PLAYLISTS_DIR);
        searchPlaylistFiles = [];
        for (var i = 0; i < files.length; i++) {
            var f = files[i];
            if (f.indexOf('.json') !== -1 && f !== 'default.json') {
                searchPlaylistFiles.push(f.replace('.json', ''));
            }
        }
    } catch (e) {
        searchPlaylistFiles = [];
    }

    try {
        var files = fs.readdirSync(DETAILS_SONGS_DIR);
        songTokens = [];
        for (var i = 0; i < files.length; i++) {
            var f = files[i];
            if (f.indexOf('.json') !== -1) {
                songTokens.push(f.replace('.json', ''));
            }
        }
    } catch (e) {
        songTokens = [];
    }

    try {
        var files = fs.readdirSync(DETAILS_ALBUMS_DIR);
        albumTokens = [];
        for (var i = 0; i < files.length; i++) {
            var f = files[i];
            if (f.indexOf('.json') !== -1) {
                albumTokens.push(f.replace('.json', ''));
            }
        }
    } catch (e) {
        albumTokens = [];
    }

    try {
        var files = fs.readdirSync(DETAILS_PLAYLISTS_DIR);
        playlistTokens = [];
        for (var i = 0; i < files.length; i++) {
            var f = files[i];
            if (f.indexOf('.json') !== -1) {
                playlistTokens.push(f.replace('.json', ''));
            }
        }
    } catch (e) {
        playlistTokens = [];
    }

    try {
        var files = fs.readdirSync(DETAILS_LYRICS_DIR);
        lyricsTokens = [];
        for (var i = 0; i < files.length; i++) {
            var f = files[i];
            if (f.indexOf('.json') !== -1) {
                lyricsTokens.push(f.replace('.json', ''));
            }
        }
    } catch (e) {
        lyricsTokens = [];
    }

    // Load artist search files
    try {
        var files = fs.readdirSync(SEARCH_ARTISTS_DIR);
        searchArtistFiles = [];
        for (var i = 0; i < files.length; i++) {
            var f = files[i];
            if (f.indexOf('.json') !== -1 && f !== 'default.json') {
                searchArtistFiles.push(f.replace('.json', ''));
            }
        }
    } catch (e) {
        searchArtistFiles = [];
    }

    // Load artist tokens
    try {
        var files = fs.readdirSync(DETAILS_ARTISTS_DIR);
        artistTokens = [];
        for (var i = 0; i < files.length; i++) {
            var f = files[i];
            if (f.indexOf('.json') !== -1) {
                artistTokens.push(f.replace('.json', ''));
            }
        }
    } catch (e) {
        artistTokens = [];
    }

    console.log('[Mock] Cache loaded:');
    console.log('  - Song search files:', searchSongFiles.length);
    console.log('  - Album search files:', searchAlbumFiles.length);
    console.log('  - Playlist search files:', searchPlaylistFiles.length);
    console.log('  - Artist search files:', searchArtistFiles.length);
    console.log('  - Song tokens:', songTokens.length);
    console.log('  - Album tokens:', albumTokens.length);
    console.log('  - Playlist tokens:', playlistTokens.length);
    console.log('  - Artist tokens:', artistTokens.length);
    console.log('  - Lyrics tokens:', lyricsTokens.length);
}

function loadJSON(filePath) {
    try {
        var content = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(content);
    } catch (e) {
        return null;
    }
}

function getSearchResponse(query, type) {
    query = query.toLowerCase().trim();

    var files;
    var searchDir;
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

    var matchedFile = null;
    for (var i = 0; i < files.length; i++) {
        var file = files[i];
        if (query.indexOf(file.toLowerCase()) !== -1) {
            matchedFile = file;
            break;
        }
    }

    if (!matchedFile || !searchDir) {
        var defaultPath = path.join(searchDir || '.', 'default.json');
        var data = loadJSON(defaultPath);
        return data || {total: 0, start: 0, results: []};
    }

    var filePath = path.join(searchDir, matchedFile + '.json');
    var data = loadJSON(filePath);
    return data || {total: 0, start: 0, results: []};
}

function getDetailsResponse(token, type, page, limit, category) {
    var dir;
    var tokens;
    var filePath;
    var data;

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

    if (tokens.indexOf(token) === -1) {
        if (type === 'artist') {
            console.log('skip');
        } else {
            return null;
        }
    }

    if (type === 'artist') {
        if (category) {
            filePath = path.join(DETAILS_ARTISTS_DIR, token + '_' + category + '.json');
        } else {
            filePath = path.join(DETAILS_ARTISTS_DIR, token + '.json');
        }
        data = loadJSON(filePath);
        if (!data && category) {
            // Fallback to base file without category
            var fallbackPath = path.join(DETAILS_ARTISTS_DIR, token + '.json');
            data = loadJSON(fallbackPath);
        }
        return data;
    }

    filePath = path.join(dir, token + '.json');
    data = loadJSON(filePath);
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
        var copy = {};
        Object.keys(data).forEach(function(k) {
            copy[k] = data[k];
        });
        copy.list = [];
        return copy;
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
        return {total: total, start: start + 1, results: []};
    }

    var paginatedResults = data.results ? data.results.slice(start, end) : [];

    return {total: total, start: start + 1, results: paginatedResults};
}

// ============ Load cache at startup ============
loadCache();

// ============ Handler ============
function handleRequest(req, res) {
    var target = req.headers['x-proxy-url'];
    if (!target) {
        res.writeHead(400, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({error: 'Missing X-Proxy-URL header'}));
        return;
    }

    var urlParts = target.split('?');
    var params = querystring.parse(urlParts[1] || '');
    var call = params.__call;
    var token = params.token;
    var query = params.q;
    var type = params.type;
    var page = params.p || 1;
    var limit = params.n || 20;

    var responseData = null;

    if (call === 'search.getResults' || call === 'search.getAlbumResults' || call === 'search.getPlaylistResults' ||
        call === 'search.getArtistResults') {
        var searchType;
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
        var category = params.category || '';
        responseData = getDetailsResponse(token, type, page, limit, category);
    } else if (call === 'artist.getArtistMoreSong' || call === 'artist.getArtistMoreAlbum') {
        var artistId = params.artistId;
        var artist_page = parseInt(params.page) || 1;
        var category = params.category || 'popular';

        var filePath = path.join(DETAILS_ARTISTS_DIR, artistId + '_' + category + '_songs_' + artist_page + '.json');
        var fileData = loadJSON(filePath);
        if (fileData) {
            responseData = fileData;
        } else {
            responseData = {topSongs: {songs: [], total: 0, last_page: true}};
        }
    }

    if (responseData) {
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(responseData));
        console.log('[Mock] Returning mock data for:', call, query || token);
    } else {
        res.writeHead(404, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({error: 'Mock data not found'}));
        console.log('[Mock] No mock data found for:', call, query || token);
    }
}

module.exports = {
    handleRequest : handleRequest
};