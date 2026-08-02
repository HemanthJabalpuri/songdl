// mock/generate-mock-data.js
// Generate mock data for testing pagination

const fs = require('fs');
const path = require('path');

// ============ PATHS ============
const DATA_DIR = path.join(__dirname, 'data');
const SEARCH_SONGS_DIR = path.join(DATA_DIR, 'search', 'songs');
const SEARCH_ALBUMS_DIR = path.join(DATA_DIR, 'search', 'albums');
const SEARCH_PLAYLISTS_DIR = path.join(DATA_DIR, 'search', 'playlists');
const DETAILS_SONGS_DIR = path.join(DATA_DIR, 'details', 'songs');
const DETAILS_ALBUMS_DIR = path.join(DATA_DIR, 'details', 'albums');
const DETAILS_PLAYLISTS_DIR = path.join(DATA_DIR, 'details', 'playlists');

// ============ HELPERS ============
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function generateSongId() {
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    var result = '';
    for (var i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function getLanguage() {
    var languages = ['english', 'hindi', 'telugu', 'tamil', 'kannada', 'malayalam', 'bengali', 'punjabi'];
    return randomItem(languages);
}

function getYear() {
    return String(randomInt(2010, 2024));
}

function getDuration() {
    return String(randomInt(120, 320));
}

function getHasLyrics() {
    return Math.random() > 0.4 ? 'true' : 'false';
}

// ============ GENERATE SONG ============
function generateSong(index, prefix, type) {
    var num = String(index + 1).padStart(3, '0');
    var id = generateSongId();
    var hasLyrics = getHasLyrics();
    var language = getLanguage();
    var year = getYear();
    var duration = getDuration();
    var titlePrefix = prefix.charAt(0).toUpperCase() + prefix.slice(1);
    
    return {
        id: id,
        title: titlePrefix + ' Song ' + (index + 1),
        subtitle: 'Artist ' + (index + 1),
        header_desc: '',
        type: 'song',
        perma_url: 'https://music.example.com/song/' + prefix + '-song-' + (index + 1) + '/' + id,
        image: 'http://127.0.0.1:3000/mock/images/mock_image-150x150.jpg',
        language: language,
        year: year,
        play_count: String(randomInt(100000, 5000000)),
        explicit_content: '0',
        list_count: '0',
        list_type: '',
        list: '',
        more_info: {
            music: 'Music Producer ' + (index + 1),
            album_id: 'mock_album_' + prefix + '_' + num,
            album: titlePrefix + ' Album ' + (index + 1),
            label: 'Mock Records',
            label_id: null,
            origin: type === 'album' ? 'album' : 'playlist',
            is_dolby_content: false,
            '320kbps': 'true',
            encrypted_media_url: 'JKcIGVL+NOVwdDWakCj6fWGE8WcC+2iTTmjcVY5gjZcb6MwSnJjGC0KIVQL/LeFRb5cctSKeEIo=',
            encrypted_cache_url: '',
            encrypted_drm_cache_url: '',
            encrypted_drm_media_url: '',
            album_url: 'https://music.example.com/album/' + prefix + '-album-' + (index + 1) + '/mock_album_' + prefix + '_' + num,
            duration: duration,
            rights: {
                code: '0',
                cacheable: 'true',
                delete_cached_object: 'false',
                reason: ''
            },
            cache_state: '',
            has_lyrics: hasLyrics,
            lyrics_snippet: hasLyrics === 'true' ? 'Mock lyrics snippet for song ' + (index + 1) : '',
            has_trivia: '0',
            trivia: [],
            starred: 'false',
            copyright_text: '© ' + year + ' Mock Records',
            artistMap: {
                primary_artists: [
                    {
                        id: 'mock_artist_' + num,
                        name: 'Artist ' + (index + 1),
                        role: 'primary_artists',
                        image: '',
                        type: 'artist',
                        perma_url: 'https://music.example.com/artist/artist-' + (index + 1)
                    }
                ],
                featured_artists: [],
                artists: [
                    {
                        id: 'mock_artist_' + num,
                        name: 'Artist ' + (index + 1),
                        role: 'music',
                        image: '',
                        type: 'artist',
                        perma_url: 'https://music.example.com/artist/artist-' + (index + 1)
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
    };
}

// ============ GENERATE SEARCH RESULT ============
function generateSearchResult(index, prefix, type, songCount) {
    var titlePrefix = prefix.charAt(0).toUpperCase() + prefix.slice(1);
    var id = 'mock_' + type + '_' + prefix + '_' + index;
    
    var result = {
        id: id,
        title: titlePrefix + ' ' + type.charAt(0).toUpperCase() + type.slice(1) + ' ' + (index + 1),
        subtitle: 'Artist ' + (index + 1),
        type: type,
        image: 'http://127.0.0.1:3000/mock/images/mock_image-150x150.jpg',
        perma_url: 'https://music.example.com/' + type + '/' + prefix + '-' + type + '-' + (index + 1) + '/' + id,
        language: getLanguage(),
        year: getYear(),
        explicit_content: '0'
    };
    
    if (type === 'song') {
        result.more_info = {
            duration: getDuration(),
            has_lyrics: getHasLyrics(),
            album: titlePrefix + ' Album ' + (index + 1)
        };
    } else if (type === 'album') {
        result.more_info = {
            song_count: String(songCount || randomInt(1, 10)),
            language: getLanguage()
        };
    } else if (type === 'playlist') {
        result.more_info = {
            song_count: String(songCount || randomInt(5, 80)),
            language: getLanguage()
        };
        result.subtitle = result.more_info.song_count + ' Songs';
    }
    
    return result;
}

// ============ GENERATE PLAYLIST/ALBUM DETAIL ============
function generateDetail(type, prefix, index, songCount) {
    var titlePrefix = prefix.charAt(0).toUpperCase() + prefix.slice(1);
    var id = 'mock_' + type + '_' + prefix + '_' + index;
    var songs = [];
    
    for (var i = 0; i < songCount; i++) {
        songs.push(generateSong(i, prefix, type));
    }
    
    var result = {
        id: id,
        title: titlePrefix + ' ' + type.charAt(0).toUpperCase() + type.slice(1) + ' ' + (index + 1),
        subtitle: 'Artist ' + (index + 1),
        header_desc: songCount + ' songs from various artists',
        type: type,
        perma_url: 'https://music.example.com/' + type + '/' + prefix + '-' + type + '-' + (index + 1) + '/' + id,
        image: 'http://127.0.0.1:3000/mock/images/mock_image-150x150.jpg',
        language: getLanguage(),
        year: getYear(),
        play_count: '',
        explicit_content: '0',
        list_count: String(songCount),
        list_type: '',
        list: songs
    };
    
    return result;
}

// ============ GENERATE SEARCH RESPONSE ============
function generateSearchResponse(type, prefix, count, songCounts) {
    var results = [];
    for (var i = 0; i < count; i++) {
        var songCount = type === 'song' ? 0 : (songCounts[i] || randomInt(type === 'album' ? 1 : 5, type === 'album' ? 10 : 80));
        results.push(generateSearchResult(i, prefix, type, songCount));
    }
    
    return {
        total: count,
        start: 1,
        results: results
    };
}

// ============ DELETE FILES ============
function deleteFiles(prefix) {
    console.log('🗑️  Deleting files with prefix:', prefix);
    console.log('');
    
    var deleted = 0;
    var dirs = [
        { path: SEARCH_SONGS_DIR, pattern: prefix + '.json' },
        { path: SEARCH_ALBUMS_DIR, pattern: prefix + '.json' },
        { path: SEARCH_PLAYLISTS_DIR, pattern: prefix + '.json' },
        { path: DETAILS_SONGS_DIR, pattern: 'mock_song_' + prefix + '_' },
        { path: DETAILS_ALBUMS_DIR, pattern: 'mock_album_' + prefix + '_' },
        { path: DETAILS_PLAYLISTS_DIR, pattern: 'mock_playlist_' + prefix + '_' }
    ];
    
    dirs.forEach(function(dir) {
        if (!fs.existsSync(dir.path)) return;
        var files = fs.readdirSync(dir.path);
        files.forEach(function(file) {
            if (file.includes(dir.pattern)) {
                var filePath = path.join(dir.path, file);
                fs.unlinkSync(filePath);
                console.log('  - ' + filePath);
                deleted++;
            }
        });
    });
    
    console.log('');
    console.log('✅ Deleted ' + deleted + ' files');
}

// ============ GENERATE ALL ============
function generateAll(prefix) {
    console.log('========================================');
    console.log('📦 Generating Mock Data');
    console.log('========================================');
    console.log('  Prefix:', prefix);
    console.log('');
    
    var totalFiles = 0;
    
    // ============ SONGS ============
    var songCount = randomInt(20, 40);
    console.log('🎵 Generating Songs...');
    console.log('  - ' + songCount + ' songs');
    
    var songSearch = generateSearchResponse('song', prefix, songCount, []);
    var songSearchPath = path.join(SEARCH_SONGS_DIR, prefix + '.json');
    ensureDir(SEARCH_SONGS_DIR);
    fs.writeFileSync(songSearchPath, JSON.stringify(songSearch, null, 2));
    console.log('  ✅ search/songs/' + prefix + '.json');
    totalFiles++;
    
    // Generate individual song details
    ensureDir(DETAILS_SONGS_DIR);
    for (var i = 0; i < songCount; i++) {
        var song = generateSong(i, prefix, 'song');
        var songPath = path.join(DETAILS_SONGS_DIR, 'mock_song_' + prefix + '_' + i + '.json');
        fs.writeFileSync(songPath, JSON.stringify({ songs: [song] }, null, 2));
        totalFiles++;
    }
    console.log('  ✅ details/songs/mock_song_' + prefix + '_*.json (' + songCount + ' files)');
    console.log('');
    
    // ============ ALBUMS ============
    var albumCount = randomInt(20, 40);
    console.log('💿 Generating Albums...');
    console.log('  - ' + albumCount + ' albums');
    
    var albumSongCounts = [];
    var albumSearchResults = [];
    for (var i = 0; i < albumCount; i++) {
        var songs = randomInt(1, 10);
        albumSongCounts.push(songs);
        albumSearchResults.push(generateSearchResult(i, prefix, 'album', songs));
    }
    
    var albumSearch = {
        total: albumCount,
        start: 1,
        results: albumSearchResults
    };
    var albumSearchPath = path.join(SEARCH_ALBUMS_DIR, prefix + '.json');
    ensureDir(SEARCH_ALBUMS_DIR);
    fs.writeFileSync(albumSearchPath, JSON.stringify(albumSearch, null, 2));
    console.log('  ✅ search/albums/' + prefix + '.json');
    totalFiles++;
    
    // Generate individual album details
    ensureDir(DETAILS_ALBUMS_DIR);
    for (var i = 0; i < albumCount; i++) {
        var album = generateDetail('album', prefix, i, albumSongCounts[i]);
        var albumPath = path.join(DETAILS_ALBUMS_DIR, 'mock_album_' + prefix + '_' + i + '.json');
        fs.writeFileSync(albumPath, JSON.stringify(album, null, 2));
        totalFiles++;
    }
    console.log('  ✅ details/albums/mock_album_' + prefix + '_*.json (' + albumCount + ' files)');
    console.log('');
    
    // ============ PLAYLISTS ============
    var playlistCount = randomInt(20, 40);
    console.log('📋 Generating Playlists...');
    console.log('  - ' + playlistCount + ' playlists');
    
    var playlistSongCounts = [];
    var playlistSearchResults = [];
    for (var i = 0; i < playlistCount; i++) {
        var songs = randomInt(5, 80);
        playlistSongCounts.push(songs);
        playlistSearchResults.push(generateSearchResult(i, prefix, 'playlist', songs));
    }
    
    var playlistSearch = {
        total: playlistCount,
        start: 1,
        results: playlistSearchResults
    };
    var playlistSearchPath = path.join(SEARCH_PLAYLISTS_DIR, prefix + '.json');
    ensureDir(SEARCH_PLAYLISTS_DIR);
    fs.writeFileSync(playlistSearchPath, JSON.stringify(playlistSearch, null, 2));
    console.log('  ✅ search/playlists/' + prefix + '.json');
    totalFiles++;
    
    // Generate individual playlist details
    ensureDir(DETAILS_PLAYLISTS_DIR);
    for (var i = 0; i < playlistCount; i++) {
        var playlist = generateDetail('playlist', prefix, i, playlistSongCounts[i]);
        var playlistPath = path.join(DETAILS_PLAYLISTS_DIR, 'mock_playlist_' + prefix + '_' + i + '.json');
        fs.writeFileSync(playlistPath, JSON.stringify(playlist, null, 2));
        totalFiles++;
    }
    console.log('  ✅ details/playlists/mock_playlist_' + prefix + '_*.json (' + playlistCount + ' files)');
    console.log('');
    
    // ============ SUMMARY ============
    console.log('========================================');
    console.log('✅ Done!');
    console.log('  Songs:     ' + songCount);
    console.log('  Albums:    ' + albumCount);
    console.log('  Playlists: ' + playlistCount);
    console.log('  Total files: ' + totalFiles);
    console.log('========================================');
}

function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

// ============ MAIN ============
function main() {
    var args = process.argv.slice(2);
    
    // Check for delete flag
    if (args[0] === '--delete') {
        var prefix = args[1];
        if (!prefix) {
            console.log('Usage: node mock/generate-mock-data.js --delete <prefix>');
            process.exit(1);
        }
        deleteFiles(prefix);
        return;
    }
    
    // Generate mode
    var prefix = args[0];
    if (!prefix) {
        console.log('Usage: node mock/generate-mock-data.js <prefix>');
        console.log('       node mock/generate-mock-data.js --delete <prefix>');
        process.exit(1);
    }
    
    generateAll(prefix);
}

main();