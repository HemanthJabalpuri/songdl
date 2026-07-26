# JioSaavn Song Downloader - Developer Documentation

## Project Summary

**JioSaavn Song Downloader** is a userscript designed for Firefox Android with Violentmonkey. It provides a clean UI for searching, playing, and downloading songs and albums from JioSaavn with full metadata (ID3 tags, album art, lyrics).

### Key Features
- Search songs and albums
- Download individual songs with metadata (M4A format)
- Download entire albums
- In-browser audio player with inline player below song
- Quality selection (12, 48, 96, 160, 320 kbps)
- Lyrics fetching and embedding
- URL detection (paste song/album/lyrics URLs)
- Cross-platform: Userscript, Browser (split/bundle), Node.js (proxy only)

### Target Environment
- **Primary:** Firefox Android + Violentmonkey
- **Development:** Any modern browser with Node.js server
- **Testing:** Browser with bundled userscript

---

## Architecture

### Directory Structure

```
Refactored/
├── build.js                 # Build script for userscript generation
├── server.js                # Development server with CORS proxy
├── package.json             # Dependencies and scripts
├── dist/                    # Build output
│   └── song-downloader.user.js
└── src/                     # Source code (served as root in dev)
    ├── index.html           # Main HTML (split mode) + script order
    ├── css/
    │   └── ui.css           # All UI styles
    └── js/
        ├── api/             # Raw API calls (no formatting)
        │   ├── constants.js # API endpoints, headers, defaults
        │   ├── fetch.js     # Low-level HTTP + callAPI wrapper
        │   ├── songs.js     # Song API endpoints
        │   └── albums.js    # Album API endpoints
        │
        ├── utils/           # Pure utility functions (no side effects)
        │   ├── decrypt.js           # JioSaavn URL decryption
        │   ├── resource.js          # Fetch audio, album art
        │   ├── formatters.js        # Data formatting
        │   ├── url-helper.js        # URL parsing
        │   └── download-helper.js   # File download, metadata
        │
        ├── libs/            # Third-party libraries
        │   ├── des.js       # Pure DES implementation (low-level)
        │   └── writem4a.js  # M4A metadata writer
        │
        ├── services/        # Business logic (orchestrates API + Utils)
        │   ├── song.js      # Song operations (search, get, decrypt)
        │   ├── album.js     # Album operations (search, get details)
        │   └── download.js  # Download operations (single, album)
        │
        └── ui/              # UI rendering and interaction
            ├── core.js      # State management, DOM references
            ├── builder.js   # UI construction (overlay, toggle button)
            ├── handlers.js  # Event listeners (keyboard, clicks)
            ├── display.js   # Render songs, albums, album view
            ├── search.js    # Search logic + URL detection
            ├── player.js    # Audio player (play, close)
            ├── download.js  # Download UI logic (progress, buttons)
            └── utils.js     # UI utilities (escapeHtml, formatDuration)
```

### Module Responsibilities

| Folder | Responsibility | Examples |
|--------|---------------|----------|
| **api/** | Raw HTTP calls to JioSaavn API | `searchSongs()`, `getAlbum()` |
| **utils/** | Pure functions, no side effects | `formatSong()`, `decode()`, `fetchResource()` |
| **libs/** | Third-party libraries | DES decryption, M4A writer |
| **services/** | Business logic, orchestrates API + Utils | `downloadSong()`, `getDecryptedSong()` |
| **ui/** | UI rendering and interaction | Display results, player, event handlers |

### Key Global Objects

| Object | Purpose |
|--------|---------|
| `window.API` | Raw API calls (constants, fetch, songs, albums) |
| `window.Services` | Business logic (song, album, download) |
| `window.Utils` | Pure utilities (formatters, resource, download-helper, url-helper) |
| `window.DOM` | UI DOM references |
| `window.isProxy` | Mode detection flag |
| `window.currentQuality` | Selected bitrate (12, 48, 96, 160, 320) |
| `window.decryptedUrlCache` | Cache for decrypted URLs |

---

## The 3 Development Modes

### Mode Comparison

| Feature | Split Mode | Bundle Mode | Userscript |
|---------|------------|-------------|------------|
| **Purpose** | Development | Testing | Production |
| **URL** | `http://localhost:3000/` | `http://localhost:3000/bundle` | `https://www.jiosaavn.com/*` |
| **Files** | Individual `<script>` tags | Single embedded script | Single userscript file |
| **CSS** | `<link>` tag | Embedded in JS | Embedded in JS |
| **isProxy** | `true` (set in index.html) | `true` (set in server response) | `undefined` |
| **API Calls** | via `/proxy` | via `/proxy` | via `GM_xmlhttpRequest` |
| **CDN Fetch** | Direct `fetch()` | Direct `fetch()` | `GM_xmlhttpRequest` |
| **Server Required** | Yes | Yes | No |
| **Build Required** | No (edit files directly) | Yes (rebuild on changes) | Yes (rebuild on changes) |

### Split Mode (Default Development)
```
http://localhost:3000/
```
- `server.js` serves files from `src/` directory
- `index.html` loads each JS file individually
- `window.isProxy = true` set in `index.html`
- All API calls go through `/proxy` endpoint
- CDN resources fetched directly (CORS allowed)
- CSS loaded via `<link>` tag

### Bundle Mode (Testing)
```
http://localhost:3000/bundle
```
- `server.js` reads built userscript from `dist/`
- Script embedded directly into HTML
- `window.isProxy = true` set in server response
- Same behavior as split mode with bundled code

### Userscript Mode (Production)
```
Installed in Violentmonkey on https://www.jiosaavn.com/*
```
- Single file: `dist/song-downloader.user.js`
- CSS embedded in the script
- No server dependency
- Uses `GM_xmlhttpRequest` for cross-origin requests
- `window.isProxy` is `undefined` (falls through to GM)

---

## How to Build and Run

```bash
# Build userscript
node build.js

# Start development server
node server.js

# Test modes:
# Split mode: http://localhost:3000/
# Bundle mode: http://localhost:3000/bundle
# Userscript: Install dist/song-downloader.user.js in Violentmonkey
```

---

## Key Technical Decisions

### Why `window.isProxy` Instead of Port Detection

**Before (brittle):**
```javascript
window.API._isProxy = window.location.port === '3000';
```
- ❌ Breaks if server runs on different port
- ❌ Assumes port 3000

**After (explicit):**
```javascript
// index.html (split mode)
<script>window.isProxy = true;</script>

// server.js (bundle mode)
<script>window.isProxy = true;</script>
```
- ✅ Works on any port
- ✅ Clear intent
- ✅ Explicit control

### Why Event Listeners Instead of `onclick`

**Problem:** In Firefox userscript context, `onclick` executes in page context, not userscript context.

```html
<!-- ❌ Fails in Firefox userscript -->
<button onclick="closePlayer()">Close</button>
```

**Solution:** Always use `addEventListener` in JavaScript.

```javascript
// ✅ Works in all browsers
var closeBtn = document.getElementById('player-close-btn');
if (closeBtn) {
    closeBtn.addEventListener('click', function() {
        closePlayer();
    });
}
```

### Why CSS Loading Strategy

| Mode | Method | Why |
|------|--------|-----|
| Userscript | Embedded in JS | Self-contained, no external requests |
| Split Mode | `<link>` tag | Easy to edit and reload |
| Bundle Mode | Embedded in JS | Matches userscript behavior |

### Why Build System Reads `index.html`

```javascript
// build.js - parses index.html for script order
const regex = /src="(\/js\/[^"]+)"/g;
while ((match = regex.exec(html)) !== null) {
    scripts.push(match[1]);
}
```

**Benefits:**
- Single source of truth
- No duplication of file list
- Build always matches split mode

---

## CORS Handling

### The Problem
- JioSaavn API servers (`api.jiosaavn.com`) don't send CORS headers
- CDN servers (`aac.saavncdn.com`, `saavncdn.com`) do send CORS headers

### The Solutions

| Resource Type | Mode | Method | Why |
|---------------|------|--------|-----|
| API Calls | Split/Bundle | `/proxy` | CORS blocked, need server proxy |
| API Calls | Userscript | `GM_xmlhttpRequest` | Tampermonkey bypasses CORS |
| CDN Audio/Art | Split/Bundle | Direct `fetch()` | CDN sends CORS headers |
| CDN Audio/Art | Userscript | `GM_xmlhttpRequest` or `fetch` | Consistent with other requests |

### How `/proxy` Works

```
Browser → fetch('/proxy') → server.js → JioSaavn API
        ← JSON response ←           ←
```

1. Browser requests `/proxy` on same origin (`localhost:3000`)
2. No CORS restriction (same-origin)
3. Server forwards request to JioSaavn API
4. Server adds required headers (User-Agent, Cookie, Referer)
5. Server returns response with CORS headers

### Headers Added by Proxy
- `User-Agent`: Mimics real browser
- `Cookie`: Required for JioSaavn API
- `Referer`: Required for JioSaavn API
- `Access-Control-Allow-Origin`: `*` - Allows browser to use response
- `Access-Control-Allow-Headers`: `*`
- `Access-Control-Allow-Methods`: `*`

---

## Data Flow

### Song Download Flow

```
User clicks Download
    ↓
UI: download.js → Calls Services.Download.song(token)
    ↓
Services: download.js
    ├── Calls Services.Song.getDecrypted(token)
    ├── Fetches lyrics if has_lyrics is true
    ├── Fetches audio via Utils.fetchResource()
    ├── Fetches album art via Utils.fetchAlbumArt()
    ├── Builds metadata via Utils.buildMetadata()
    ├── Writes M4A via writeM4ABytes()
    └── Triggers download via Utils.downloadFile()
    ↓
Services: song.js
    ├── Calls API.getSong(token)
    ├── Decrypts URL via decryptMediaUrl()
    ├── Formats via Utils.formatters.formatDecryptedSong()
    └── Applies quality via Utils.formatters.formatUrlWithQuality()
    ↓
API: songs.js → Calls API.callAPI('webapi.get', { token: token })
    ↓
API: fetch.js
    ├── Builds URL with parameters
    └── Calls API._fetchAPI() → Checks window.isProxy → Proxy or Direct
    ↓
Response → Audio file with metadata → Downloads
```

### URL Detection Flow

```
User pastes URL or opens UI on song page
    ↓
Utils.parseUrl(url) checks:
    ├── Contains jiosaavn.com?
    ├── Contains /song/? → type: 'song'
    ├── Contains /album/? → type: 'album'
    ├── Contains /lyrics/? → type: 'lyrics'
    └── Extracts token (last part after /)
    ↓
If type is 'song' or 'lyrics':
    ├── Switch to Songs tab
    ├── Call API.getSong(token)
    └── Display song
If type is 'album':
    ├── Switch to Albums tab
    ├── Call API.getAlbum(token)
    └── Display album
```

---

## Common Patterns

### Adding a New API Endpoint

```javascript
// api/songs.js or api/albums.js
window.API.getNewEndpoint = async function(token) {
    return await window.API.callAPI('webapi.get', {
        token: token,
        type: 'newtype'
    });
};
```

### Adding a New Formatter

```javascript
// utils/formatters.js
window.Utils.formatters.formatNewData = function(data) {
    return {
        id: data.id,
        name: window.Utils.formatters.decode(data.name)
    };
};
```

### Adding a New Service

```javascript
// services/newservice.js
window.Services = window.Services || {};

window.Services.NewService = {
    getData: async function(token) {
        var rawData = await window.API.getNewEndpoint(token);
        return window.Utils.formatters.formatNewData(rawData);
    }
};

// Add to index.html
<script src="/js/services/newservice.js"></script>
```

### Adding a New UI Component

```javascript
// ui/newcomponent.js
function renderNewComponent(data) {
    // Use existing display functions
    displaySongs(data);
}

// Add event listener in handlers.js (not onclick)
var newBtn = document.getElementById('new-btn');
if (newBtn) {
    newBtn.addEventListener('click', function() {
        renderNewComponent();
    });
}
```

---

## Gotchas & Edge Cases

### 1. `has_lyrics` is a string, not boolean

```javascript
// ❌ Wrong - always true because "false" is truthy
has_lyrics: !!(song.more_info && song.more_info.has_lyrics)

// ✅ Correct - check string value
has_lyrics: !!(song.more_info && song.more_info.has_lyrics === 'true')
```

### 2. Lyrics contain `<br>` tags

```javascript
// Raw lyrics: "Line 1<br>Line 2<br>"
// Need to replace with \n for metadata
var cleanLyrics = rawLyrics.replace(/<br>/g, '\n');
```

### 3. Player close button must use addEventListener

```javascript
// ❌ Fails in Firefox userscript
<button onclick="closePlayer()">Close</button>

// ✅ Works everywhere
closeBtn.addEventListener('click', function() {
    closePlayer();
});
```

### 4. Audio must be paused before removing from DOM

```javascript
// ❌ Audio continues playing
DOM.player.innerHTML = '';

// ✅ Stop audio first
if (window.currentAudio) {
    window.currentAudio.pause();
    window.currentAudio.src = '';
    window.currentAudio.load();
    window.currentAudio = null;
}
DOM.player.innerHTML = '';
```

### 5. Script order is critical

The order in `index.html` defines the load order. Dependencies must load before dependents:
- `utils/formatters.js` must load before `services/song.js`
- `api/constants.js` must load before `api/fetch.js`
- `api/fetch.js` must load before `api/songs.js`

---

## Common Commands

```bash
# Build userscript
node build.js

# Start development server (split + bundle modes)
node server.js
```

---

## File Loading Order (from index.html)

1. `ui/utils.js` - UI utilities
2. `libs/des.js` - Pure DES implementation
3. `libs/writem4a.js` - M4A metadata writer
4. `utils/decrypt.js` - JioSaavn URL decryption
5. `utils/resource.js` - Fetch audio, album art
6. `utils/formatters.js` - Data formatting
7. `utils/url-helper.js` - URL parsing
8. `utils/download-helper.js` - File download, metadata
9. `api/constants.js` - API endpoints, headers
10. `api/fetch.js` - HTTP requests, callAPI
11. `api/songs.js` - Song API calls
12. `api/albums.js` - Album API calls
13. `services/song.js` - Song business logic
14. `services/album.js` - Album business logic
15. `services/download.js` - Download business logic
16. `ui/search.js` - Search logic
17. `ui/display.js` - Render songs/albums
18. `ui/player.js` - Audio player
19. `ui/download.js` - Download UI logic
20. `ui/core.js` - State management
21. `ui/builder.js` - UI construction
22. `ui/handlers.js` - Event listeners

---

## Testing

### Manual Testing
1. **Split Mode:** `node server.js` → http://localhost:3000/
2. **Bundle Mode:** `node build.js` → `node server.js` → http://localhost:3000/bundle
3. **Userscript:** `node build.js` → Install in Violentmonkey → https://www.jiosaavn.com/
