// build.js
var fs = require('fs');
var path = require('path');

// Read version from package.json
var pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
var VERSION = pkg.version;

var ROOT_DIR = path.join(__dirname, 'src');
var CSS_DIR = path.join(ROOT_DIR, 'css');
var OUTPUT_DIR = path.join(__dirname, 'dist');
var OUTPUT_FILE = path.join(OUTPUT_DIR, 'song-downloader.user.js');

function readFile(filePath) {
    if (!fs.existsSync(filePath)) {
        console.error('❌ File not found: ' + filePath);
        process.exit(1);
    }
    return fs.readFileSync(filePath, 'utf8');
}

function getScriptFilesFromHTML() {
    var appScripts = require(path.join(ROOT_DIR, 'js', 'app-scripts.js')).scripts;
    return appScripts;
}

function build() {
    console.log('========================================');
    console.log('📦 Building Userscript');
    console.log('========================================\n');

    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR);
    }



    // Get files from index.html
    var files = getScriptFilesFromHTML();
    console.log('📋 Found ' + files.length + ' scripts in app-scripts.js:');
    for (var i = 0; i < files.length; i++) {
        console.log('   ' + (i + 1) + '. /js/' + files[i]);
    }
    console.log('');

    var combined = '';

    combined += '// ==UserScript==\n' +
        '// @name         Song Downloader\n' +
        '// @namespace    Violentmonkey\n' +
        '// @version      ' + VERSION + '\n' +
        '// @description  Download songs and albums with metadata\n' +
        '// @author       Hemanth\n' +
        '// @match        https://www.mymusic.com/*\n' +
        '// @grant        GM_xmlhttpRequest\n' +
        '// @connect      aac.musiccdn.com\n' +
        '// @connect      musiccdn.com\n' +
        '// ==/UserScript==\n\n' +
        '(function() {\n' +
        '    \'use strict\';\n\n' +
        '    console.log(\'[Userscript] Song Downloader loaded\');\n' +
        '    console.log(\'[Userscript] Click the 🎵 button or press Alt+J to open\');\n\n';



    for (var i = 0; i < files.length; i++) {
        var file = files[i];
        var content = readFile(path.join(ROOT_DIR, 'js', file));

        // Remove userscript headers
        content = content.replace(/\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==\n/, '');
        content =
            content.replace(/\/\/ @(grant|connect|match|require|name|namespace|version|description|author).*\n/g, '');

        combined += '\n    // ============================================================\n';
        combined += '    // FILE: ' + file + '\n';
        combined += '    // ============================================================\n\n';
        combined += content;
        combined += '\n';
    }

    combined += '\n})();\n';

    fs.writeFileSync(OUTPUT_FILE, combined);

    var stats = fs.statSync(OUTPUT_FILE);
    console.log('\n========================================');
    console.log('✅ Build complete!');
    console.log('📁 Output: ' + OUTPUT_FILE);
    console.log('📦 Size: ' + (stats.size / 1024).toFixed(1) + ' KB');
    console.log('📄 Files included: ' + files.length);
    console.log('========================================\n');
}

build();