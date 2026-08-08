#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Parse command line arguments at startup
const args = process.argv.slice(2);
const mockIndex = args.indexOf('--mock');
const isMockEnabled = mockIndex !== -1;
if (isMockEnabled) {
    args.splice(mockIndex, 1);
}

// Configure global mock objects for Node environments
global.isProxy = isMockEnabled;
global.document = undefined;

// Prepend Node.js safety wrapper
let combinedCode = `
    if (typeof window === 'undefined') {
        global.window = global;
    }
`;

// Parse script listings dynamically from index.html in correct load order
try {
    const html = fs.readFileSync(path.join(__dirname, 'src', 'index.html'), 'utf8');
    const regex = /src="(\/js\/[^"]+)"/g;
    let match;
    while ((match = regex.exec(html)) !== null) {
        const filePath = path.join(__dirname, 'src', match[1]);
        const content = fs.readFileSync(filePath, 'utf8');
        combinedCode += '\n// FILE: ' + match[1] + '\n' + content + '\n';
    }

    // Evaluate combined source code globally
    const FunctionConstructor = Function;
    new FunctionConstructor(combinedCode)();
} catch (e) {
    console.error('Error: Failed to dynamically load codebase sources:', e.message);
    process.exit(1);
}

// Override browser download dumper to write decrypted M4A files to local downloads folder
window.Utils.downloadFile = function(data, filename) {
    const downloadDir = path.join(__dirname, 'downloads');
    if (!fs.existsSync(downloadDir)) {
        fs.mkdirSync(downloadDir);
    }
    const outputPath = path.join(downloadDir, filename);
    fs.writeFileSync(outputPath, Buffer.from(data));
    console.log(`\n💾 Saved: downloads/${filename} (${(data.length / 1024 / 1024).toFixed(2)} MB)`);
};

// Set up in-memory mock server routing if --mock flag is present
if (isMockEnabled) {
    const mockServer = require('./mock/mock-server.js');
    const originalFetch = global.fetch;

    global.fetch = async function(url, options) {
        var urlStr = url.toString();

        // 1. Intercept asset CDN file calls:
        if (urlStr.includes('/mock/audio/') || urlStr.includes('/mock/images/')) {
            const relPath =
                urlStr.split('/mock/')[1].replace('images/', 'assets/images/').replace('audio/', 'assets/audio/');
            const fullPath = path.join(__dirname, 'mock', relPath);
            if (fs.existsSync(fullPath)) {
                const buffer = fs.readFileSync(fullPath);
                return {
                    ok: true,
                    status: 200,
                    arrayBuffer: async () =>
                        buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
                    json: async () => JSON.parse(buffer.toString())
                };
            }
        }

        // 2. Intercept proxy requests (/proxy):
        if (urlStr.includes('/proxy')) {
            return new Promise((resolve, reject) => {
                const mockRes = {
                    writeHead: function(status, headers) {
                        this.status = status;
                        this.headers = headers;
                    },
                    end: function(data) {
                        resolve({ok: true, status: this.status || 200, json: async () => JSON.parse(data)});
                    }
                };

                // Lowercase mock headers to align with Node's native HTTP parser
                const lowerHeaders = {};
                if (options.headers) {
                    Object.keys(options.headers).forEach(key => {
                        lowerHeaders[key.toLowerCase()] = options.headers[key];
                    });
                }

                const mockReq = {url: '/proxy', method: 'POST', headers: lowerHeaders};

                mockServer.handleRequest(mockReq, mockRes);
            });
        }

        // Fallback to original fetch
        return originalFetch(url, options);
    };
}

const command = args[0];

if (!command || command === '--help' || command === '-h') {
    console.log('Usage:');
    console.log(
        '  node songdl-cli.js [--mock] search <type> <query>             # Type: songs|albums|playlists|artists');
    console.log('  node songdl-cli.js [--mock] details [type] <url|token>        # View tracklists & details');
    console.log('  node songdl-cli.js [--mock] download [type] <url|token> [-y]  # Type optional, defaults to song');
    process.exit(0);
}

if (command === 'search') {
    const type = args[1] || 'songs';
    const query = args[2];
    if (!query) {
        console.error('Error: Please provide a search query.');
        process.exit(1);
    }

    // Set search type context
    global.currentSearchType = type;

    console.log(`Searching for "${query}" of type "${type}"...`);
    let service;
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
        console.error(`Error: Unknown search type "${type}". Use songs|albums|playlists|artists.`);
        process.exit(1);
    }

    service.search(query, 5, 1)
        .then(data => {
            console.log('\nResults:');
            if (data.results && data.results.length > 0) {
                data.results.forEach((item, i) => {
                    console.log(`[${i + 1}] ${item.title || item.name || 'Unknown'}`);

                    if (type === 'songs') {
                        if (item.subtitle) console.log(`    Artist/Subtitle: ${item.subtitle}`);
                        if (item.more_info?.album) console.log(`    Album: ${item.more_info.album}`);
                        console.log(`    Language: ${item.language || 'N/A'} | Year: ${item.year || 'N/A'} | Plays: ${
                            parseInt(item.play_count || 0).toLocaleString()}`);
                    } else if (type === 'albums') {
                        if (item.subtitle) console.log(`    Artist: ${item.subtitle}`);
                        console.log(`    Tracks: ${item.more_info?.song_count || 0} | Year: ${
                            item.year || 'N/A'} | Language: ${item.language || 'N/A'}`);
                    } else if (type === 'playlists') {
                        if (item.subtitle) console.log(`    Detail/Subtitle: ${item.subtitle}`);
                        console.log(
                            `    Tracks: ${item.more_info?.song_count || 0} | Language: ${item.language || 'N/A'}`);
                    } else if (type === 'artists') {
                        if (item.role) console.log(`    Role: ${item.role}`);
                    }

                    console.log(`    Token: ${item.token}`);
                });
            } else {
                console.log('No results found.');
            }
        })
        .catch(err => {
            console.error('Error: Search failed:', err);
        });

} else if (command === 'download') {
    const inputArg1 = args[1];  // Could be type (song/album/playlist) OR url OR token
    const inputArg2 = args[2];  // Could be token OR -y flag

    if (!inputArg1) {
        console.error('Error: Please provide a token, platform URL, or type parameter.');
        process.exit(1);
    }

    // Check for auto-approve flag anywhere in arguments list
    const hasYesFlag =
        args.includes('-y') || args.includes('--yes') || process.argv.includes('-y') || process.argv.includes('--yes');

    const supportedTypes = ['song', 'album', 'playlist'];
    let type = 'song';
    let token = '';

    if (supportedTypes.includes(inputArg1)) {
        type = inputArg1;
        token = inputArg2;
        if (!token || token.startsWith('-')) {
            console.error('Error: Please provide a token after the type.');
            process.exit(1);
        }
    } else {
        token = inputArg1;
        if (token.startsWith('http://') || token.startsWith('https://')) {
            const parsed = window.Utils.parseUrl(token);
            if (parsed) {
                type = parsed.type;
                token = parsed.token;
                console.log(`[CLI] Resolved URL: type=${type}, token=${token}`);
            } else {
                console.warn('[CLI] Warning: URL could not be parsed. Defaulting to type=song.');
            }
        }
    }

    // Interactive downloads runner
    async function startDownload() {
        if (type === 'song') {
            console.log(`Fetching track details for token: ${token}...`);
            const song = await Services.Song.getDecrypted(token);
            console.log(`Starting download: ${song.title} - ${song.artist}`);
            await Services.Download.songFromData(song);
        } else if (type === 'album') {
            console.log(`Fetching album details for token: ${token}...`);
            const album = await Services.Album.getDetails(token);
            const count = album.songs.length;
            console.log(`Album: "${album.title}" contains ${count} tracks.`);

            if (count > 3 && !hasYesFlag) {
                const proceed = await askConfirmation(`Proceed with downloading ${count} songs? (y/N): `);
                if (!proceed) {
                    console.log('Cancelled.');
                    process.exit(0);
                }
            }

            for (let i = 0; i < count; i++) {
                const song = album.songs[i];
                console.log(`\n[${i + 1}/${count}] Fetching: ${song.title}`);
                try {
                    const decryptedSong = await Services.Song.getDecrypted(song.token);
                    await Services.Download.songFromData(decryptedSong);
                } catch (e) {
                    console.error(`❌ Failed to download track "${song.title}":`, e.message);
                }
            }
        } else if (type === 'playlist') {
            console.log(`Fetching playlist details for token: ${token}...`);
            const playlist = await Services.Playlist.getDetails(token, 1, 50);
            const count = playlist.songs.length;
            console.log(`Playlist: "${playlist.title}" contains ${count} tracks.`);

            if (count > 3 && !hasYesFlag) {
                const proceed = await askConfirmation(`Proceed with downloading ${count} songs? (y/N): `);
                if (!proceed) {
                    console.log('Cancelled.');
                    process.exit(0);
                }
            }

            for (let i = 0; i < count; i++) {
                const song = playlist.songs[i];
                console.log(`\n[${i + 1}/${count}] Fetching: ${song.title}`);
                try {
                    const decryptedSong = await Services.Song.getDecrypted(song.token);
                    await Services.Download.songFromData(decryptedSong);
                } catch (e) {
                    console.error(`❌ Failed to download track "${song.title}":`, e.message);
                }
            }
        } else {
            console.error(`Error: Dynamic downloads not supported for type "${type}".`);
            process.exit(1);
        }
    }

    startDownload().catch(err => {
        console.error('Error: Download task failed:', err);
    });
} else if (command === 'details') {
    const inputArg1 = args[1];  // type OR url OR token
    const inputArg2 = args[2];  // token

    if (!inputArg1) {
        console.error('Error: Please provide a token, platform URL, or type parameter.');
        process.exit(1);
    }

    const supportedTypes = ['song', 'album', 'playlist', 'artist'];
    let type = '';
    let token = '';

    if (supportedTypes.includes(inputArg1)) {
        type = inputArg1;
        token = inputArg2;
        if (!token) {
            console.error('Error: Please provide a token after the type.');
            process.exit(1);
        }
    } else {
        token = inputArg1;
        if (token.startsWith('http://') || token.startsWith('https://')) {
            const parsed = window.Utils.parseUrl(token);
            if (parsed) {
                type = parsed.type;
                token = parsed.token;
                console.log(`[CLI] Resolved URL: type=${type}, token=${token}`);
            } else {
                console.warn('[CLI] Warning: URL could not be parsed. Defaulting to type=song.');
                type = 'song';
            }
        } else {
            type = 'song';
        }
    }

    async function showDetails() {
        if (type === 'song') {
            console.log(`Fetching track details for token: ${token}...`);
            const song = await Services.Song.getDecrypted(token);
            console.log(`\n🎵 Song: ${song.title}`);
            console.log(`    Artist: ${song.artist}`);
            console.log(`    Album: ${song.album || 'N/A'}`);
            console.log(`    Year: ${song.year || 'N/A'} | Language: ${song.language || 'N/A'}`);
            console.log(`    Lyrics: ${song.has_lyrics ? 'Yes' : 'No'}`);
            console.log(`    Token: ${song.token}`);
        } else if (type === 'album') {
            console.log(`Fetching album details for token: ${token}...`);
            const album = await Services.Album.getDetails(token);
            console.log(`\n📀 Album: ${album.title}`);
            console.log(`    Artist/Subtitle: ${album.subtitle || 'N/A'}`);
            console.log(`    Language: ${album.language || 'N/A'} | Year: ${album.year || 'N/A'} | Tracks: ${
                album.songs.length}`);
            console.log('\nTracklist:');
            album.songs.forEach((song, i) => {
                console.log(`  [${i + 1}] ${song.title}`);
                console.log(`      Token: ${song.token}`);
            });
        } else if (type === 'playlist') {
            console.log(`Fetching playlist details for token: ${token}...`);
            const playlist = await Services.Playlist.getDetails(token, 1, 50);
            console.log(`\n🎶 Playlist: ${playlist.title}`);
            console.log(`    Description: ${playlist.description || 'N/A'}`);
            console.log(`    Language: ${playlist.language || 'N/A'} | Tracks Available: ${playlist.songs.length}`);
            console.log('\nTracklist:');
            playlist.songs.forEach((song, i) => {
                console.log(`  [${i + 1}] ${song.title} (${song.subtitle || 'N/A'})`);
                console.log(`      Token: ${song.token}`);
            });
        } else if (type === 'artist') {
            console.log(`Fetching artist details for token: ${token}...`);
            const artist = await Services.Artist.getDetails(token);
            console.log(`\n🎤 Artist: ${artist.name} ${artist.isVerified ? '✅' : ''}`);
            console.log(`    Biography: ${artist.bio || 'N/A'}`);
            console.log('\nPopular Songs:');
            artist.songs.slice(0, 10).forEach((song, i) => {
                console.log(`  [${i + 1}] ${song.title}`);
                console.log(`      Token: ${song.token}`);
            });
            if (artist.albums && artist.albums.length > 0) {
                console.log('\nAlbums:');
                artist.albums.slice(0, 5).forEach((album, i) => {
                    console.log(`  [${i + 1}] ${album.title} (${album.year || 'N/A'})`);
                    console.log(`      Token: ${album.token}`);
                });
            }
        } else {
            console.error(`Error: Details view not supported for type "${type}".`);
            process.exit(1);
        }
    }

    showDetails().catch(err => {
        console.error('Error: Details lookup failed:', err);
    });
} else {
    console.error(`Error: Unknown command "${command}". Use search or download.`);
    process.exit(1);
}
