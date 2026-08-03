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
const DETAILS_LYRICS_DIR = path.join(DATA_DIR, 'details', 'lyrics');

// ============ GLOBAL COUNTER ============
var globalSongIndex = 0;

// ============ HELPERS ============
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function generateRandomId() {
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    var result = '';
    for (var i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function generateToken(prefix) {
    return prefix + '_' + generateRandomId();
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

function generateLyrics(songTitle) {
    var lines = randomInt(4, 8);
    var lyrics = '';
    var lineCount = 0;
    
    for (var i = 0; i < lines; i++) {
        if (i > 0) lyrics += '<br>';
        if (i === 4 && lines > 4) {
            lyrics += '<br>';
        }
        lyrics += 'This is placeholder lyrics for ' + songTitle + ' line ' + (i + 1) + '.';
        lineCount++;
    }
    
    return lyrics;
}

// ============ ARTIST FUNCTIONS (Future) ============
function generateArtist(index, prefix) {
    var token = generateToken(prefix);
    var name = 'Artist ' + (index + 1);
    return {
        id: generateRandomId(),
        name: name,
        image: '',
        bio: 'Mock artist ' + (index + 1) + ' bio',
        perma_url: 'https://music.example.com/artist/artist-' + (index + 1) + '/' + token
    };
}

// ============ SONG GENERATION ============
function generateSong(albumId, albumTitle, globalIndex, prefix, artists) {
    var id = generateRandomId();
    var token = generateToken(prefix);
    var hasLyrics = getHasLyrics();
    var language = getLanguage();
    var year = getYear();
    var duration = getDuration();
    var titlePrefix = prefix.charAt(0).toUpperCase() + prefix.slice(1);
    var songTitle = titlePrefix + ' Song ' + (globalIndex + 1);
    var lyricsText = hasLyrics === 'true' ? generateLyrics(songTitle) : null;
    
    var primaryArtists = artists && artists.length > 0 ? artists : [generateArtist(globalIndex, prefix)];
    
    var song = {
        id: id,
        title: songTitle,
        subtitle: primaryArtists.map(function(a) { return a.name; }).join(', '),
        header_desc: '',
        type: 'song',
        perma_url: 'https://music.example.com/song/' + prefix + '-song-' + (globalIndex + 1) + '/' + token,
        image: 'http://127.0.0.1:3000/mock/images/mock_image-150x150.jpg',
        language: language,
        year: year,
        play_count: String(randomInt(100000, 5000000)),
        explicit_content: '0',
        list_count: '0',
        list_type: '',
        list: '',
        more_info: {
            music: primaryArtists.map(function(a) { return a.name; }).join(', '),
            album_id: albumId,
            album: albumTitle,
            label: 'Mock Records',
            label_id: null,
            origin: 'album',
            is_dolby_content: false,
            '320kbps': 'true',
            encrypted_media_url: 'JKcIGVL+NOVwdDWakCj6fWGE8WcC+2iTTmjcVY5gjZcb6MwSnJjGC0KIVQL/LeFRb5cctSKeEIo=',
            encrypted_cache_url: '',
            encrypted_drm_cache_url: '',
            encrypted_drm_media_url: '',
            album_url: 'https://music.example.com/album/' + prefix + '-album-' + (globalIndex + 1) + '/' + albumId,
            duration: duration,
            rights: {
                code: '0',
                cacheable: 'true',
                delete_cached_object: 'false',
                reason: ''
            },
            cache_state: '',
            has_lyrics: hasLyrics,
            lyrics_snippet: hasLyrics === 'true' ? 'Lyrics for ' + songTitle : '',
            has_trivia: '0',
            trivia: [],
            starred: 'false',
            copyright_text: '© ' + year + ' Mock Records',
            artistMap: {
                primary_artists: primaryArtists.map(function(a, idx) {
                    return {
                        id: a.id || generateRandomId(),
                        name: a.name,
                        role: 'primary_artists',
                        image: '',
                        type: 'artist',
                        perma_url: a.perma_url || 'https://music.example.com/artist/artist-' + (idx + 1)
                    };
                }),
                featured_artists: [],
                artists: primaryArtists.map(function(a, idx) {
                    return {
                        id: a.id || generateRandomId(),
                        name: a.name,
                        role: 'music',
                        image: '',
                        type: 'artist',
                        perma_url: a.perma_url || 'https://music.example.com/artist/artist-' + (idx + 1)
                    };
                })
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
    
    return {
        song: song,
        lyrics: lyricsText,
        token: token
    };
}

// ============ GENERATE ALBUMS ============
function generateAlbums(count, prefix) {
    var albums = [];
    var allSongs = [];
    var allLyrics = [];
    var albumSearchResults = [];
    var albumSongCounts = [];
    var albumTokens = [];
    
    for (var i = 0; i < count; i++) {
        var songCount = randomInt(1, 10);
        var id = generateRandomId();
        var token = generateToken(prefix);
        var titlePrefix = prefix.charAt(0).toUpperCase() + prefix.slice(1);
        var albumTitle = titlePrefix + ' Album ' + (i + 1);
        var artistName = 'Artist ' + (i + 1);
        var artists = [generateArtist(i, prefix)];
        var songs = [];
        
        for (var j = 0; j < songCount; j++) {
            var result = generateSong(id, albumTitle, globalSongIndex, prefix, artists);
            songs.push(result.song);
            allSongs.push(result.song);
            if (result.lyrics) {
                allLyrics.push({
                    token: result.token,
                    lyrics: result.lyrics
                });
            }
            globalSongIndex++;
        }
        
        var album = {
            id: id,
            title: albumTitle,
            subtitle: artistName,
            header_desc: songCount + ' songs from various artists',
            type: 'album',
            perma_url: 'https://music.example.com/album/' + prefix + '-album-' + (i + 1) + '/' + token,
            image: 'http://127.0.0.1:3000/mock/images/mock_image-150x150.jpg',
            language: getLanguage(),
            year: getYear(),
            play_count: '',
            explicit_content: '0',
            list_count: String(songCount),
            list_type: '',
            list: songs,
            more_info: {
                artistMap: {
                    primary_artists: [
                        {
                            id: generateRandomId(),
                            name: artistName,
                            role: '',
                            image: '',
                            type: 'artist',
                            perma_url: 'https://music.example.com/artist/artist-' + (i + 1) + '/' + generateToken(prefix)
                        }
                    ],
                    featured_artists: [],
                    artists: [
                        {
                            id: generateRandomId(),
                            name: artistName,
                            role: '',
                            image: '',
                            type: 'artist',
                            perma_url: 'https://music.example.com/artist/artist-' + (i + 1) + '/' + generateToken(prefix)
                        }
                    ]
                },
                song_count: String(songCount),
                copyright_text: '© ' + getYear() + ' Mock Records',
                is_dolby_content: false,
                label_url: '/label/mock-records/'
            },
            button_tooltip_info: [],
            pro_hva_campaigns: []
        };
        
        albums.push(album);
        albumSongCounts.push(songCount);
        albumTokens.push(token);
        
        albumSearchResults.push({
            id: id,
            title: albumTitle,
            subtitle: artistName,
            header_desc: '',
            type: 'album',
            perma_url: 'https://music.example.com/album/' + prefix + '-album-' + (i + 1) + '/' + token,
            image: 'http://127.0.0.1:3000/mock/images/mock_image-150x150.jpg',
            language: getLanguage(),
            year: getYear(),
            play_count: '',
            explicit_content: '0',
            list_count: '0',
            list_type: '',
            list: '',
            more_info: {
                query: prefix,
                text: prefix,
                music: artistName,
                song_count: String(songCount),
                artistMap: {
                    primary_artists: [
                        {
                            id: generateRandomId(),
                            name: artistName,
                            role: 'primary_artists',
                            image: '',
                            type: 'artist',
                            perma_url: 'https://music.example.com/artist/artist-' + (i + 1) + '/' + generateToken(prefix)
                        }
                    ],
                    featured_artists: [],
                    artists: [
                        {
                            id: generateRandomId(),
                            name: artistName,
                            role: 'music',
                            image: '',
                            type: 'artist',
                            perma_url: 'https://music.example.com/artist/artist-' + (i + 1) + '/' + generateToken(prefix)
                        }
                    ]
                }
            },
            button_tooltip_info: [],
            pro_hva_campaigns: []
        });
    }
    
    return {
        albums: albums,
        allSongs: allSongs,
        allLyrics: allLyrics,
        albumSearchResults: albumSearchResults,
        albumSongCounts: albumSongCounts,
        albumTokens: albumTokens
    };
}

// ============ GENERATE PLAYLISTS ============
function generatePlaylists(count, prefix, songPool) {
    var playlists = [];
    var playlistSearchResults = [];
    var playlistSongCounts = [];
    var playlistTokens = [];
    
    for (var i = 0; i < count; i++) {
        var songCount = randomInt(5, Math.min(80, songPool.length));
        var id = generateRandomId();
        var token = generateToken(prefix);
        var titlePrefix = prefix.charAt(0).toUpperCase() + prefix.slice(1);
        var playlistTitle = titlePrefix + ' Playlist ' + (i + 1);
        var artistName = 'Artist ' + (i + 1);
        
        var shuffledSongs = shuffleArray(songPool.slice());
        var selectedSongs = shuffledSongs.slice(0, songCount);
        
        var contents = '';
        for (var j = 0; j < selectedSongs.length; j++) {
            if (j > 0) contents += ',';
            contents += selectedSongs[j].id;
        }
        
        var totalDuration = 0;
        for (var j = 0; j < selectedSongs.length; j++) {
            totalDuration += parseInt(selectedSongs[j].more_info.duration) || 180;
        }
        var hours = Math.floor(totalDuration / 3600);
        var minutes = Math.floor((totalDuration % 3600) / 60);
        var durationStr = (hours > 0 ? hours + 'h ' : '') + minutes + 'm';
        
        var playlist = {
            id: id,
            title: playlistTitle,
            subtitle: songCount + ' Songs',
            header_desc: '',
            type: 'playlist',
            perma_url: 'https://music.example.com/featured/' + prefix + '-playlist-' + (i + 1) + '/' + token,
            image: 'http://127.0.0.1:3000/mock/images/mock_image-150x150.jpg',
            language: getLanguage(),
            year: '',
            play_count: '',
            explicit_content: '0',
            list_count: String(songCount),
            list_type: '',
            list: selectedSongs,
            more_info: {
                uid: 'mock_user_' + prefix,
                contents: contents,
                is_dolby_content: false,
                subtype: [],
                last_updated: String(Math.floor(Date.now() / 1000) - randomInt(86400, 604800)),
                username: 'mock_user_' + prefix,
                firstname: 'Mock',
                lastname: '',
                is_followed: '',
                isFY: false,
                follower_count: String(randomInt(1000, 100000)),
                fan_count: String(randomInt(1000, 100000)).replace(/\B(?=(\d{3})+(?!\d))/g, ','),
                playlist_type: 'playlist',
                share: '1',
                sub_types: [],
                images: [],
                H2: null,
                subheading: null,
                user_image: '',
                initials: 'M' + prefix.charAt(0).toUpperCase(),
                custom_username: 'mock_user_' + prefix + '_' + randomInt(1000, 9999),
                video_count: '0',
                artists: [
                    {
                        id: generateRandomId(),
                        name: artistName,
                        role: 'music',
                        image: '',
                        type: 'artist',
                        perma_url: 'https://music.example.com/artist/artist-' + (i + 1) + '/' + generateToken(prefix)
                    }
                ],
                subtitle_desc: [
                    durationStr,
                    songCount + ' Songs',
                    (randomInt(1000, 100000)).toLocaleString() + ' Fans'
                ]
            },
            button_tooltip_info: [],
            pro_hva_campaigns: []
        };
        
        playlists.push(playlist);
        playlistSongCounts.push(songCount);
        playlistTokens.push(token);
        
        playlistSearchResults.push({
            id: id,
            title: playlistTitle,
            subtitle: songCount + ' Songs',
            type: 'playlist',
            image: 'http://127.0.0.1:3000/mock/images/mock_image-150x150.jpg',
            perma_url: 'https://music.example.com/featured/' + prefix + '-playlist-' + (i + 1) + '/' + token,
            more_info: {
                uid: 'mock_user',
                firstname: 'Mock',
                artist_name: [artistName],
                entity_type: 'playlist',
                entity_sub_type: '',
                video_available: false,
                is_dolby_content: null,
                sub_types: null,
                images: null,
                lastname: 'Editor',
                song_count: String(songCount),
                language: getLanguage()
            },
            explicit_content: '0',
            mini_obj: true,
            numsongs: null
        });
    }
    
    return {
        playlists: playlists,
        playlistSearchResults: playlistSearchResults,
        playlistSongCounts: playlistSongCounts,
        playlistTokens: playlistTokens
    };
}

// ============ HELPER: SHUFFLE ARRAY ============
function shuffleArray(array) {
    var shuffled = array.slice();
    for (var i = shuffled.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = shuffled[i];
        shuffled[i] = shuffled[j];
        shuffled[j] = temp;
    }
    return shuffled;
}

// ============ DELETE FILES ============
function deleteFiles(prefix) {
    console.log('🗑️  Deleting files with prefix:', prefix);
    console.log('');
    
    var deleted = 0;
    var patterns = [
        { dir: SEARCH_SONGS_DIR, pattern: prefix + '.json' },
        { dir: SEARCH_ALBUMS_DIR, pattern: prefix + '.json' },
        { dir: SEARCH_PLAYLISTS_DIR, pattern: prefix + '.json' },
        { dir: DETAILS_SONGS_DIR, pattern: prefix + '_' },
        { dir: DETAILS_ALBUMS_DIR, pattern: prefix + '_' },
        { dir: DETAILS_PLAYLISTS_DIR, pattern: prefix + '_' },
        { dir: DETAILS_LYRICS_DIR, pattern: prefix + '_' }
    ];
    
    patterns.forEach(function(item) {
        if (!fs.existsSync(item.dir)) return;
        var files = fs.readdirSync(item.dir);
        files.forEach(function(file) {
            if (file.includes(item.pattern)) {
                var filePath = path.join(item.dir, file);
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
    
    globalSongIndex = 0;
    var totalFiles = 0;
    
    // ============ ALBUMS ============
    var albumCount = randomInt(20, 40);
    console.log('💿 Generating Albums...');
    console.log('  - ' + albumCount + ' albums');
    
    var albumData = generateAlbums(albumCount, prefix);
    var allSongs = albumData.allSongs;
    var albums = albumData.albums;
    var allLyrics = albumData.allLyrics;
    var albumSearchResults = albumData.albumSearchResults;
    var albumTokens = albumData.albumTokens;
    
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
    
    ensureDir(DETAILS_ALBUMS_DIR);
    for (var i = 0; i < albums.length; i++) {
        var album = albums[i];
        var filename = albumTokens[i] + '.json';
        var albumPath = path.join(DETAILS_ALBUMS_DIR, filename);
        fs.writeFileSync(albumPath, JSON.stringify(album, null, 2));
        totalFiles++;
    }
    console.log('  ✅ details/albums/' + prefix + '_*.json (' + albums.length + ' files)');
    console.log('');
    
    // ============ SONGS ============
    console.log('🎵 Generating Songs...');
    console.log('  - ' + allSongs.length + ' songs');
    
    // Build song search results (no token field)
    var songSearchResults = allSongs.map(function(song) {
        return {
            id: song.id,
            title: song.title,
            subtitle: song.subtitle,
            header_desc: '',
            type: 'song',
            perma_url: song.perma_url,
            image: song.image,
            language: song.language,
            year: song.year,
            play_count: song.play_count,
            explicit_content: '0',
            list_count: '0',
            list_type: '',
            list: '',
            more_info: song.more_info,
            button_tooltip_info: [],
            pro_hva_campaigns: []
        };
    });
    
    var songSearch = {
        total: allSongs.length,
        start: 1,
        results: songSearchResults
    };
    var songSearchPath = path.join(SEARCH_SONGS_DIR, prefix + '.json');
    ensureDir(SEARCH_SONGS_DIR);
    fs.writeFileSync(songSearchPath, JSON.stringify(songSearch, null, 2));
    console.log('  ✅ search/songs/' + prefix + '.json');
    totalFiles++;
    
    ensureDir(DETAILS_SONGS_DIR);
    for (var i = 0; i < allSongs.length; i++) {
        var song = allSongs[i];
        // Filename is the token (extracted from perma_url)
        var token = song.perma_url.split('/').pop();
        var filename = token + '.json';
        var songPath = path.join(DETAILS_SONGS_DIR, filename);
        fs.writeFileSync(songPath, JSON.stringify({ songs: [song] }, null, 2));
        totalFiles++;
    }
    console.log('  ✅ details/songs/' + prefix + '_*.json (' + allSongs.length + ' files)');
    
    // ============ LYRICS ============
    console.log('  - ' + allLyrics.length + ' lyrics files');
    ensureDir(DETAILS_LYRICS_DIR);
    for (var i = 0; i < allLyrics.length; i++) {
        var lyricItem = allLyrics[i];
        var lyricsPath = path.join(DETAILS_LYRICS_DIR, lyricItem.token + '.json');
        var lyricsData = {
            lyrics: {
                lyrics: lyricItem.lyrics
            }
        };
        fs.writeFileSync(lyricsPath, JSON.stringify(lyricsData, null, 2));
        totalFiles++;
    }
    console.log('  ✅ details/lyrics/' + prefix + '_*.json (' + allLyrics.length + ' files)');
    console.log('');
    
    // ============ PLAYLISTS ============
    var playlistCount = randomInt(20, 40);
    console.log('📋 Generating Playlists...');
    console.log('  - ' + playlistCount + ' playlists');
    
    var playlistData = generatePlaylists(playlistCount, prefix, allSongs);
    var playlists = playlistData.playlists;
    var playlistSearchResults = playlistData.playlistSearchResults;
    var playlistTokens = playlistData.playlistTokens;
    
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
    
    ensureDir(DETAILS_PLAYLISTS_DIR);
    for (var i = 0; i < playlists.length; i++) {
        var playlist = playlists[i];
        var filename = playlistTokens[i] + '.json';
        var playlistPath = path.join(DETAILS_PLAYLISTS_DIR, filename);
        fs.writeFileSync(playlistPath, JSON.stringify(playlist, null, 2));
        totalFiles++;
    }
    console.log('  ✅ details/playlists/' + prefix + '_*.json (' + playlists.length + ' files)');
    console.log('');
    
    console.log('========================================');
    console.log('✅ Done!');
    console.log('  Albums:    ' + albums.length);
    console.log('  Songs:     ' + allSongs.length);
    console.log('  Playlists: ' + playlists.length);
    console.log('  Lyrics:    ' + allLyrics.length);
    console.log('  Total files: ' + totalFiles);
    console.log('========================================');
}

function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function main() {
    var args = process.argv.slice(2);
    
    if (args[0] === '--delete') {
        var prefix = args[1];
        if (!prefix) {
            console.log('Usage: node mock/generate-mock-data.js --delete <prefix>');
            process.exit(1);
        }
        deleteFiles(prefix);
        return;
    }
    
    var prefix = args[0];
    if (!prefix) {
        console.log('Usage: node mock/generate-mock-data.js <prefix>');
        console.log('       node mock/generate-mock-data.js --delete <prefix>');
        process.exit(1);
    }
    
    generateAll(prefix);
}

main();