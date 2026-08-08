# Song Downloader - Developer Documentation

## Project Summary

**Song Downloader** is a userscript designed for Firefox Android with Violentmonkey. It provides a clean UI for searching, playing, and downloading songs and albums from supported music platform with full metadata (ID3 tags, album art, lyrics).

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
        │   ├── albums.js    # Album API endpoints
        │   ├── playlists.js # Playlist API endpoints
        │   └── artists.js   # Artist API endpoints
        │
        ├── utils/           # Pure utility functions (no side effects)
        │   ├── logger.js            # Global logging interceptor controller
        │   ├── decrypt.js           # supported music platform URL decryption
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
        │   ├── playlist.js  # Playlist operations (search, get details)
        │   ├── artist.js    # Artist operations (search, get, popular/latest pagination)
        │   └── download.js  # Download operations (single, album, playlist)
        │
        └── ui/              # UI rendering and interaction
            ├── utils.js             # UI template utils and cards templates
            ├── builder.js           # UI core construction (overlay dialog)
            ├── core.js              # State initialization, Cache, Navigation stack
            ├── handlers.js          # Click event delegation, hotkeys
            ├── search.js            # Search coordinator (URL vs Text)
            ├── player.js            # Audio player controls
            ├── download.js          # Download UI logic (progress buttons)
            └── display/             # Specific rendering views
                ├── song-card.js         # Song line formatting
                ├── display-results.js   # Render search results
                ├── album-view.js        # Render album details
                ├── playlist-view.js     # Render playlist details
                ├── artist-view.js       # Render artist details popular/latest paging
                ├── lyrics.js            # Render lyrics overlays
                └── navigation.js        # Restore views from stack data
```


### Module Responsibilities

| Folder | Responsibility | Examples |
|--------|---------------|----------|
| **api/** | Raw HTTP calls to supported music platform API | `searchSongs()`, `getAlbum()` |
| **utils/** | Pure functions, no side effects | `formatSong()`, `decode()`, `fetchResource()` |
| **libs/** | Third-party libraries | DES decryption, M4A writer |
| **services/** | Business logic, orchestrates API + Utils | `downloadSong()`, `getDecryptedSong()` |
| **ui/** | UI rendering and event delegation | Display cards, player, handlers |

### Key Global Objects

| Object | Purpose |
|--------|---------|
| `window.API` | Raw API calls (constants, fetch, songs, albums, playlists, artists) |
| `window.Services` | Business logic (song, album, playlist, artist, download) |
| `window.Utils` | Pure utilities (formatters, resource, download-helper, url-helper) |
| `window.DOM` | UI DOM references |
| `window.isProxy` | Mode detection flag |
| `window.currentQuality` | Selected bitrate (12, 48, 96, 160, 320) |
| `window.Cache` | Unified runtime cache for search results, lyrics, and details |
| `window.Nav` | Browser-like navigation history stack |

---

## The 3 Development Modes

### Mode Comparison

| Feature | Split Mode | Bundle Mode | Userscript |
|---------|------------|-------------|------------|
| **Purpose** | Development | Testing | Production |
| **URL** | `http://localhost:3000/` | `http://localhost:3000/bundle` | supported music platform |
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
Installed in Violentmonkey on supported music platform
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
- Supported music platform API servers don't send CORS headers
- CDN servers do send CORS headers

### The Solutions

| Resource Type | Mode | Method | Why |
|---------------|------|--------|-----|
| API Calls | Split/Bundle | `/proxy` | CORS blocked, need server proxy |
| API Calls | Userscript | `GM_xmlhttpRequest` | Tampermonkey bypasses CORS |
| CDN Audio/Art | Split/Bundle | Direct `fetch()` | CDN sends CORS headers |
| CDN Audio/Art | Userscript | `GM_xmlhttpRequest` or `fetch` | Consistent with other requests |

### How `/proxy` Works

```
Browser → fetch('/proxy') → server.js → supported music platform API
        ← JSON response ←           ←
```

1. Browser requests `/proxy` on same origin (`localhost:3000`)
2. No CORS restriction (same-origin)
3. Server forwards request to supported music platform API
4. Server adds required headers (User-Agent, Cookie, Referer)
5. Server returns response with CORS headers

### Headers Added by Proxy
- `User-Agent`: Mimics real browser
- `Cookie`: Required for supported music platform API
- `Referer`: Required for supported music platform API
- `Access-Control-Allow-Origin`: `*` - Allows browser to use response
- `Access-Control-Allow-Headers`: `*`
- `Access-Control-Allow-Methods`: `*`

---

## Data Flow

### Song Download Flow

```
User clicks Download
    ↓
UI: download.js
    ├── Decrypts media URL via Utils.getDecryptedUrl()
    ├── Formats decrypted track via Utils.formatters.formatDecryptedSong()
    └── Calls Services.Download.songFromData(song)
    ↓
Services: download.js (songFromData)
    ├── Fetches audio bytes via Utils.fetchResource()
    ├── Fetches album art via Utils.fetchAlbumArt()
    ├── Fetches lyrics via Services.Song.getLyrics() (if has_lyrics is true)
    ├── Builds metadata objects via Utils.buildMetadata()
    ├── Writes M4A tags via writeM4ABytes()
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
User pastes URL or opens UI on page
    ↓
Utils.parseUrl(url) checks:
    ├── Contains supported music platform link?
    ├── Contains /song/? → type: 'song'
    ├── Contains /album/? → type: 'album'
    ├── Contains /featured/? → type: 'playlist'
    ├── Contains /artist/? → type: 'artist'
    └── Extracts token (last part after /)
    ↓
Switches tab, queries endpoint details, and updates the display panel.
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

// Register click event inside handlers.js global click listener delegation (do not use direct addEventListener on elements)
var target = e.target;
var clickBtn = target.closest('#new-btn');
if (clickBtn) {
    e.preventDefault();
    renderNewComponent();
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

### 6. Stats counts on back-navigation
When restoring layouts from cache, stats counts (e.g. `Top Songs (20)`) should be resolved directly by counting corresponding card elements rendered in the DOM, rather than referring to variables in `_artistState`, so they remain cumulative and accurate.

### 7. Dynamic pagination bounds
Since the music platform details API does not return total item count values, pagination triggers dynamically by checking if the last loaded page size is less than the page limit (10). If the size is less than 10, the pager terminates immediately, printing `🏁 End of results`.

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

1. `utils/logger.js` - Global logging controller
2. `ui/utils.js` - UI utilities and card factories
3. `libs/des.js` - Pure DES implementation
4. `libs/writem4a.js` - M4A container writer
5. `utils/decrypt.js` - Media URL decryption helper
6. `utils/resource.js` - Fetch audio/art CDN requests
7. `utils/formatters.js` - JSON normalization formatters
8. `utils/url-helper.js` - URL pattern parsers
9. `utils/download-helper.js` - Filename and file metadata writers
10. `api/constants.js` - API domains and configuration constants
11. `api/fetch.js` - HTTP queries wrapper
12. `api/songs.js` - Song detail API calls
13. `api/albums.js` - Album detail API calls
14. `api/playlists.js` - Playlist detail API calls
15. `api/artists.js` - Artist detail API calls
16. `services/song.js` - Song business logic
17. `services/album.js` - Album business logic
18. `services/download.js` - Download compilation manager
19. `services/playlist.js` - Playlist business logic
20. `services/artist.js` - Artist business logic
21. `ui/display/song-card.js` - Card formatting
22. `ui/display/display-results.js` - Render search results
23. `ui/display/album-view.js` - Render album panels
24. `ui/display/playlist-view.js` - Render playlist panels
25. `ui/display/artist-view.js` - Render artist panels popular/latest paging
26. `ui/display/lyrics.js` - Render scrollable lyrics overlay
27. `ui/display/navigation.js` - Navigation view state restorer
28. `ui/search.js` - Search coordinator (URL vs Text)
29. `ui/player.js` - Audio player controllers
30. `ui/download.js` - Download progress buttons
31. `ui/core.js` - Split/bundle initializer coordinator
32. `ui/builder.js` - Overlay templates assembler
33. `ui/handlers.js` - Shared click event delegation

---

## Testing

### Manual Testing
1. **Split Mode:** `node server.js` → http://localhost:3000/
2. **Bundle Mode:** `node build.js` → `node server.js` → http://localhost:3000/bundle
3. **Userscript:** `node build.js` → Install in Violentmonkey → supported music platform
