#!/usr/bin/env node

// src/js/node-loader.js

const fs = require('fs');
const path = require('path');

// Configure global mock objects for Node environments
global.isProxy = true;
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

// Override browser download dumper to write decrypted M4A files to local disk
window.Utils.downloadFile = function(data, filename) {
    fs.writeFileSync(filename, Buffer.from(data));
    console.log(`\n💾 Saved: ${filename} (${(data.length / 1024 / 1024).toFixed(2)} MB)`);
};

// Parse command line arguments
const args = process.argv.slice(2);
const mockIndex = args.indexOf('--mock');
const isMockEnabled = mockIndex !== -1;
if (isMockEnabled) {
    args.splice(mockIndex, 1);
}

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
    console.log('  node songdl-cli.js [--mock] search <type> <query>   # Type: songs|albums|playlists|artists');
    console.log('  node songdl-cli.js [--mock] download <token>        # Download a song by token');
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
                    console.log(`[${i + 1}] ${item.title || item.name}`);
                    console.log(`    Token: ${item.token}`);
                    if (item.artist) console.log(`    Artist: ${item.artist}`);
                    if (item.songs) console.log(`    Tracks Count: ${item.songs.length}`);
                });
            } else {
                console.log('No results found.');
            }
        })
        .catch(err => {
            console.error('Error: Search failed:', err);
        });

} else if (command === 'download') {
    const token = args[1];
    if (!token) {
        console.error('Error: Please provide a track token.');
        process.exit(1);
    }

    console.log(`Fetching track details for token: ${token}...`);
    Services.Song.getDecrypted(token)
        .then(async song => {
            console.log(`Starting download for: ${song.title} - ${song.artist}`);
            await Services.Download.songFromData(song);
        })
        .catch(err => {
            console.error('Error: Download failed:', err);
        });
} else {
    console.error(`Error: Unknown command "${command}". Use search or download.`);
    process.exit(1);
}
