#!/usr/bin/env node

var fs = require('fs');
var path = require('path');

global.window = global;
window.Cache = {
    store: {},
    get: function(key) {
        return this.store[key];
    },
    set: function(key, val) {
        this.store[key] = val;
    }
};

// Parse command line arguments at startup
var args = process.argv.slice(2);
var mockIndex = args.indexOf('--mock');
var isMockEnabled = mockIndex !== -1;
if (isMockEnabled) {
    args.splice(mockIndex, 1);
}

// Configure global mock objects for Node environments
global.isProxy = isMockEnabled;
global.document = undefined;
global.require = require;

// Load script listings from app-scripts.js and evaluate in correct order
try {
    var scripts = require(path.join(__dirname, 'src', 'js', 'app-scripts.js')).scripts;
    scripts.forEach(function(scriptPath) {
        if (scriptPath.indexOf('ui/') === 0) {
            return; // Skip browser-only UI display elements!
        }
        var filePath = path.join(__dirname, 'src', 'js', scriptPath);
        var content = fs.readFileSync(filePath, 'utf8');
        try {
            // Evaluate dynamically
            var FunctionConstructor = Function;
            new FunctionConstructor(content)();
        } catch (e) {
            console.error('Error in file: ' + scriptPath);
            throw e;
        }
    });
} catch (e) {
    console.error('Error: Failed to dynamically load codebase sources:', e.message);
    process.exit(1);
}

// Override browser download dumper to write decrypted M4A files to local downloads folder
window.Utils.downloadFile = function(data, filename) {
    var downloadDir = path.join(__dirname, 'downloads');
    if (!fs.existsSync(downloadDir)) {
        fs.mkdirSync(downloadDir);
    }
    var outputPath = path.join(downloadDir, filename);
    // Node 0.11 Buffer conversion
    var buf;
    if (typeof Buffer.from === 'function') {
        buf = Buffer.from(data);
    } else {
        buf = new Buffer(data.length);
        for (var i = 0; i < data.length; i++) {
            buf[i] = data[i];
        }
    }
    fs.writeFileSync(outputPath, buf);
    console.log('\n💾 Saved: downloads/' + filename + ' (' + (data.byteLength / 1024 / 1024).toFixed(2) + ' MB)');
};

// Set up in-memory mock server routing if --mock flag is present
if (isMockEnabled) {
    var mockServer = require('./mock/mock-server.js');
    var originalFetch = global.fetch;

    global.fetch = function(url, options) {
        var urlStr = url.toString();

        // 1. Intercept asset CDN file calls:
        if (urlStr.indexOf('/mock/audio/') !== -1 || urlStr.indexOf('/mock/images/') !== -1) {
            var relPath =
                urlStr.split('/mock/')[1].replace('images/', 'assets/images/').replace('audio/', 'assets/audio/');
            var fullPath = path.join(__dirname, 'mock', relPath);
            if (fs.existsSync(fullPath)) {
                var buffer = fs.readFileSync(fullPath);
                return window.Utils.Promise.resolve({
                    ok: true,
                    status: 200,
                    arrayBuffer: function() {
                        var ab = new ArrayBuffer(buffer.length);
                        var view = new Uint8Array(ab);
                        for (var i = 0; i < buffer.length; i++) {
                            view[i] = buffer[i];
                        }
                        return window.Utils.Promise.resolve(ab);
                    },
                    json: function() {
                        return window.Utils.Promise.resolve(JSON.parse(buffer.toString('utf8')));
                    }
                });
            }
        }

        // 2. Intercept proxy requests (/proxy):
        if (urlStr.indexOf('/proxy') !== -1) {
            return new window.Utils.Promise(function(resolve, reject) {
                var mockRes = {
                    writeHead: function(status, headers) {
                        this.status = status;
                        this.headers = headers;
                    },
                    end: function(data) {
                        resolve({
                            ok: true,
                            status: this.status || 200,
                            json: function() {
                                return window.Utils.Promise.resolve(JSON.parse(data));
                            }
                        });
                    }
                };

                // Lowercase mock headers to align with Node's native HTTP parser
                var lowerHeaders = {};
                if (options.headers) {
                    Object.keys(options.headers).forEach(function(key) {
                        lowerHeaders[key.toLowerCase()] = options.headers[key];
                    });
                }

                var mockReq = {url: '/proxy', method: 'POST', headers: lowerHeaders};

                mockServer.handleRequest(mockReq, mockRes);
            });
        }

        // Fallback to original fetch
        return originalFetch(url, options);
    };
}

var readline = require('readline');

// Dynamic confirmation prompt helper
function askConfirmation(message) {
    return new window.Utils.Promise(function(resolve) {
        var rl = readline.createInterface({input: process.stdin, output: process.stdout});
        rl.question(message, function(answer) {
            rl.close();
            var trimmed = answer.toLowerCase().trim();
            resolve(trimmed === 'y' || trimmed === 'yes');
        });
    });
}

var command = args[0];

if (!command || command === '--help' || command === '-h') {
    console.log('Usage:');
    console.log(
        '  node songdl-cli.js [--mock] search <type> <query>             # Type: songs|albums|playlists|artists');
    console.log('  node songdl-cli.js [--mock] details [type] <url|token>        # View tracklists & details');
    console.log('  node songdl-cli.js [--mock] download [type] <url|token> [-y]  # Type optional, defaults to song');
    process.exit(0);
}

if (command === 'search') {
    var type = args[1] || 'songs';
    var query = args[2];
    if (!query) {
        console.error('Error: Please provide a search query.');
        process.exit(1);
    }

    // Set search type context
    global.currentSearchType = type;

    console.log('Searching for "' + query + '" of type "' + type + '"...');
    var service;
    if (type === 'songs') {
        service = Services.Song;
    } else if (type === 'albums') {
        service = Services.Album;
    } else if (type === 'playlists') {
        service = Services.Playlist;
    } else if (type === 'artists') {
        service = Services.Artist;
    }

    if (!service) {
        console.error('Error: Unknown search type "' + type + '". Use songs|albums|playlists|artists.');
        process.exit(1);
    }

    service.search(query, 5, 1)
        .then(function(data) {
            console.log('\nResults:');
            if (data.results && data.results.length > 0) {
                data.results.forEach(function(item, i) {
                    console.log('[' + (i + 1) + '] ' + (item.title || item.name || 'Unknown'));

                    if (type === 'songs') {
                        if (item.subtitle) console.log('    Artist/Subtitle: ' + item.subtitle);
                        if (item.more_info && item.more_info.album) console.log('    Album: ' + item.more_info.album);
                        console.log(
                            '    Language: ' + (item.language || 'N/A') + ' | Year: ' + (item.year || 'N/A') +
                            ' | Plays: ' + parseInt(item.play_count || 0).toLocaleString());
                    } else if (type === 'albums') {
                        if (item.subtitle) console.log('    Artist: ' + item.subtitle);
                        console.log(
                            '    Tracks: ' + (item.more_info ? item.more_info.song_count || 0 : 0) +
                            ' | Year: ' + (item.year || 'N/A') + ' | Language: ' + (item.language || 'N/A'));
                    } else if (type === 'playlists') {
                        if (item.subtitle) console.log('    Detail/Subtitle: ' + item.subtitle);
                        console.log(
                            '    Tracks: ' + (item.more_info ? item.more_info.song_count || 0 : 0) +
                            ' | Language: ' + (item.language || 'N/A'));
                    } else if (type === 'artists') {
                        if (item.role) console.log('    Role: ' + item.role);
                    }

                    console.log('    Token: ' + item.token);
                });
            } else {
                console.log('No results found.');
            }
        })
        .catch(function(err) {
            console.error('Error: Search failed:', err);
        });

} else if (command === 'download') {
    var inputArg1 = args[1];  // type OR url OR token
    var inputArg2 = args[2];  // token

    if (!inputArg1) {
        console.error('Error: Please provide a token, platform URL, or type parameter.');
        process.exit(1);
    }

    // Check for auto-approve flag anywhere in arguments list
    var hasYesFlag = args.indexOf('-y') !== -1 || args.indexOf('--yes') !== -1 || process.argv.indexOf('-y') !== -1 ||
        process.argv.indexOf('--yes') !== -1;

    var supportedTypes = ['song', 'album', 'playlist'];
    var type = 'song';
    var token = '';

    if (supportedTypes.indexOf(inputArg1) !== -1) {
        type = inputArg1;
        token = inputArg2;
        if (!token || token.indexOf('-') === 0) {
            console.error('Error: Please provide a token after the type.');
            process.exit(1);
        }
    } else {
        token = inputArg1;
        if (token.indexOf('http://') === 0 || token.indexOf('https://') === 0) {
            var parsed = window.Utils.parseUrl(token);
            if (parsed) {
                type = parsed.type;
                token = parsed.token;
                console.log('[CLI] Resolved URL: type=' + type + ', token=' + token);
            } else {
                console.warn('[CLI] Warning: URL could not be parsed. Defaulting to type=song.');
            }
        }
    }

    // Interactive downloads runner
    var startDownload = function() {
        if (type === 'song') {
            console.log('Fetching track details for token: ' + token + '...');
            return Services.Song.getDecrypted(token).then(function(song) {
                console.log('Starting download: ' + song.title + ' - ' + song.artist);
                return Services.Download.songFromData(song);
            });
        } else if (type === 'album') {
            console.log('Fetching album details for token: ' + token + '...');
            var currentAlbum;
            return Services.Album.getDetails(token)
                .then(function(album) {
                    currentAlbum = album;
                    var count = album.songs.length;
                    console.log('Album: "' + album.title + '" contains ' + count + ' tracks.');

                    if (count > 3 && !hasYesFlag) {
                        return askConfirmation('Proceed with downloading ' + count + ' songs? (y/N): ')
                            .then(function(proceed) {
                                if (!proceed) {
                                    console.log('Cancelled.');
                                    process.exit(0);
                                }
                            });
                    }
                })
                .then(function() {
                    var count = currentAlbum.songs.length;
                    var downloadNext = function(index) {
                        if (index >= count) return window.Utils.Promise.resolve();
                        var song = currentAlbum.songs[index];
                        console.log('\n[' + (index + 1) + '/' + count + '] Fetching: ' + song.title);
                        return Services.Song.getDecrypted(song.token)
                            .then(function(decryptedSong) {
                                return Services.Download.songFromData(decryptedSong);
                            })
                            .catch(function(e) {
                                console.error('❌ Failed to download track "' + song.title + '":', e.message);
                            })
                            .then(function() {
                                return downloadNext(index + 1);
                            });
                    };
                    return downloadNext(0);
                });
        } else if (type === 'playlist') {
            console.log('Fetching playlist details for token: ' + token + '...');
            var currentPlaylist;
            return Services.Playlist.getDetails(token, 1, 50)
                .then(function(playlist) {
                    currentPlaylist = playlist;
                    var count = playlist.songs.length;
                    console.log('Playlist: "' + playlist.title + '" contains ' + count + ' tracks.');

                    if (count > 3 && !hasYesFlag) {
                        return askConfirmation('Proceed with downloading ' + count + ' songs? (y/N): ')
                            .then(function(proceed) {
                                if (!proceed) {
                                    console.log('Cancelled.');
                                    process.exit(0);
                                }
                            });
                    }
                })
                .then(function() {
                    var count = currentPlaylist.songs.length;
                    var downloadNext = function(index) {
                        if (index >= count) return window.Utils.Promise.resolve();
                        var song = currentPlaylist.songs[index];
                        console.log('\n[' + (index + 1) + '/' + count + '] Fetching: ' + song.title);
                        return Services.Song.getDecrypted(song.token)
                            .then(function(decryptedSong) {
                                return Services.Download.songFromData(decryptedSong);
                            })
                            .catch(function(e) {
                                console.error('❌ Failed to download track "' + song.title + '":', e.message);
                            })
                            .then(function() {
                                return downloadNext(index + 1);
                            });
                    };
                    return downloadNext(0);
                });
        } else {
            console.error('Error: Dynamic downloads not supported for type "' + type + '".');
            process.exit(1);
        }
    };

    startDownload().catch(function(err) {
        console.error('Error: Download task failed:', err);
    });

} else if (command === 'details') {
    var inputArg1 = args[1];  // type OR url OR token
    var inputArg2 = args[2];  // token

    if (!inputArg1) {
        console.error('Error: Please provide a token, platform URL, or type parameter.');
        process.exit(1);
    }

    var supportedTypes = ['song', 'album', 'playlist', 'artist'];
    var type = '';
    var token = '';

    if (supportedTypes.indexOf(inputArg1) !== -1) {
        type = inputArg1;
        token = inputArg2;
        if (!token) {
            console.error('Error: Please provide a token after the type.');
            process.exit(1);
        }
    } else {
        token = inputArg1;
        if (token.indexOf('http://') === 0 || token.indexOf('https://') === 0) {
            var parsed = window.Utils.parseUrl(token);
            if (parsed) {
                type = parsed.type;
                token = parsed.token;
                console.log('[CLI] Resolved URL: type=' + type + ', token=' + token);
            } else {
                console.warn('[CLI] Warning: URL could not be parsed. Defaulting to type=song.');
                type = 'song';
            }
        } else {
            type = 'song';
        }
    }

    var showDetails = function() {
        if (type === 'song') {
            console.log('Fetching track details for token: ' + token + '...');
            return Services.Song.getDecrypted(token).then(function(song) {
                console.log('\n🎵 Song: ' + song.title);
                console.log('    Artist: ' + song.artist);
                console.log('    Album: ' + (song.album || 'N/A'));
                console.log('    Year: ' + (song.year || 'N/A') + ' | Language: ' + (song.language || 'N/A'));
                console.log('    Lyrics: ' + (song.has_lyrics ? 'Yes' : 'No'));
                console.log('    Token: ' + song.token);
            });
        } else if (type === 'album') {
            console.log('Fetching album details for token: ' + token + '...');
            return Services.Album.getDetails(token).then(function(album) {
                console.log('\n📀 Album: ' + album.title);
                console.log('    Artist/Subtitle: ' + (album.subtitle || 'N/A'));
                console.log(
                    '    Language: ' + (album.language || 'N/A') + ' | Year: ' + (album.year || 'N/A') +
                    ' | Tracks: ' + album.songs.length);
                console.log('\nTracklist:');
                album.songs.forEach(function(song, i) {
                    console.log('  [' + (i + 1) + '] ' + song.title);
                    console.log('      Token: ' + song.token);
                });
            });
        } else if (type === 'playlist') {
            console.log('Fetching playlist details for token: ' + token + '...');
            return Services.Playlist.getDetails(token, 1, 50).then(function(playlist) {
                console.log('\n🎶 Playlist: ' + playlist.title);
                console.log('    Description: ' + (playlist.description || 'N/A'));
                console.log(
                    '    Language: ' + (playlist.language || 'N/A') + ' | Tracks Available: ' + playlist.songs.length);
                console.log('\nTracklist:');
                playlist.songs.forEach(function(song, i) {
                    console.log('  [' + (i + 1) + '] ' + song.title + ' (' + (song.subtitle || 'N/A') + ')');
                    console.log('      Token: ' + song.token);
                });
            });
        } else if (type === 'artist') {
            console.log('Fetching artist details for token: ' + token + '...');
            return Services.Artist.getDetails(token).then(function(artist) {
                console.log('\n🎤 Artist: ' + artist.name + ' ' + (artist.isVerified ? '✅' : ''));
                console.log('    Biography: ' + (artist.bio || 'N/A'));
                console.log('\nPopular Songs:');
                artist.songs.slice(0, 10).forEach(function(song, i) {
                    console.log('  [' + (i + 1) + '] ' + song.title);
                    console.log('      Token: ' + song.token);
                });
                if (artist.albums && artist.albums.length > 0) {
                    console.log('\nAlbums:');
                    artist.albums.slice(0, 5).forEach(function(album, i) {
                        console.log('  [' + (i + 1) + '] ' + album.title + ' (' + (album.year || 'N/A') + ')');
                        console.log('      Token: ' + album.token);
                    });
                }
            });
        } else {
            console.error('Error: Details view not supported for type "' + type + '".');
            process.exit(1);
        }
    };

    showDetails().catch(function(err) {
        console.error('Error: Details lookup failed:', err);
    });
} else {
    console.error('Error: Unknown command "' + command + '". Use search or download.');
    process.exit(1);
}
