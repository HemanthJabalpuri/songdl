const fs = require('fs');
const path = require('path');

// Read version from package.json
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
const VERSION = pkg.version;

const ROOT_DIR = path.join(__dirname, 'src');
const CSS_DIR = path.join(ROOT_DIR, 'css');
const OUTPUT_DIR = path.join(__dirname, 'dist');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'song-downloader.user.js');

function readFile(filePath) {
    if (!fs.existsSync(filePath)) {
        console.error(`❌ File not found: ${filePath}`);
        process.exit(1);
    }
    return fs.readFileSync(filePath, 'utf8');
}

function getScriptFilesFromHTML() {
    const html = readFile(path.join(ROOT_DIR, 'index.html'));
    const scripts = [];
    
    // Match src="/js/..." - capture full path with leading slash
    const regex = /src="(\/js\/[^"]+)"/g;
    let match;
    while ((match = regex.exec(html)) !== null) {
        scripts.push(match[1]);
    }
    
    return scripts;
}

function build() {
    console.log('========================================');
    console.log('📦 Building Tampermonkey Userscript');
    console.log('========================================\n');

    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR);
    }

    // Read CSS
    let cssContent = '';
    try {
        cssContent = readFile(path.join(CSS_DIR, 'ui.css'));
        console.log('✅ Read ui.css (' + cssContent.length + ' bytes)');
    } catch (e) {
        console.warn('⚠️ ui.css not found, proceeding without CSS');
    }

    // Get files from index.html
    const files = getScriptFilesFromHTML();
    console.log('📋 Found ' + files.length + ' scripts in index.html:');
    files.forEach((f, i) => {
        console.log('   ' + (i+1) + '. ' + f);
    });
    console.log('');

    let combined = '';

    combined += `// ==UserScript==
// @name         Song Downloader
// @namespace    Violentmonkey
// @version      ${VERSION}
// @description  Download songs and albums with metadata
// @author       Hemanth
// @match        https://www.mymusic.com/*
// @grant        GM_xmlhttpRequest
// @connect      aac.musiccdn.com
// @connect      musiccdn.com
// ==/UserScript==

(function() {
    'use strict';
    
    console.log('[Userscript] Song Downloader loaded');
    console.log('[Userscript] Click the 🎵 button or press Alt+J to open');
    
`;

    if (cssContent) {
        combined += `    // ============================================================
    // EMBEDDED CSS
    // ============================================================
    var UI_CSS = ${JSON.stringify(cssContent)};
    
    // Add CSS to page
    var styleEl = document.createElement('style');
    styleEl.textContent = UI_CSS;
    document.head.appendChild(styleEl);
    console.log('[Userscript] CSS injected');
    
`;
    }

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        let content = readFile(path.join(ROOT_DIR, file));

        // Remove userscript headers
        content = content.replace(/\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==\n/, '');
        content = content.replace(/\/\/ @(grant|connect|match|require|name|namespace|version|description|author).*\n/g, '');

        combined += '\n    // ============================================================\n';
        combined += '    // FILE: ' + file + '\n';
        combined += '    // ============================================================\n\n';
        combined += content;
        combined += '\n';
    }

    combined += '\n})();\n';

    fs.writeFileSync(OUTPUT_FILE, combined);

    const stats = fs.statSync(OUTPUT_FILE);
    console.log('\n========================================');
    console.log('✅ Build complete!');
    console.log('📁 Output: ' + OUTPUT_FILE);
    console.log('📦 Size: ' + (stats.size / 1024).toFixed(1) + ' KB');
    console.log('📄 Files included: ' + files.length);
    console.log('========================================\n');
}

build();