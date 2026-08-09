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
- Cross-platform: Userscript browser extension OR standalone Node.js CLI tool

### Target Environment
- **Primary:** Firefox Android + Violentmonkey (or Chrome Desktop + Tampermonkey)
- **Development:** Any modern browser with Node.js server
- **Command-Line:** Terminal shell with Node.js v0.9.5, v0.11.8, or v22+

---

## Architecture

### Directory Structure

```
Refactored/
├── build.js                 # Build script for userscript generation
├── server.js                # Development server with CORS proxy
├── package.json             # Dependencies and scripts
├── songdl-cli.js            # Node CLI tool runner
├── run-tests.js             # Test runner orchestrator
├── dist/                    # Build output
│   └── song-downloader.user.js
├── tests/                   # Automated unit testing suite
│   ├── bootstrap.js         # Loads split scripts in Node globally
│   ├── mock-fetch.js        # Mocks global.fetch in-memory during tests
│   ├── url-helper.test.js   # Tests for URL parsing
│   ├── decrypt.test.js      # Tests for DES decryption
│   ├── formatters.test.js   # Tests for data formatters keys/types
│   └── services.test.js     # Tests for services API operations
└── src/                     # Source code (served as root in dev)
    ├── app-scripts.js       # Main load order script catalog
    ├── index.html           # Main HTML (split mode) + script scoper
    ├── api/                 # Raw API calls (no formatting)
    │   ├── constants.js     # API endpoints, headers, defaults
    │   ├── fetch.js         # Low-level HTTP + callAPI wrapper
    │   ├── songs.js         # Song API endpoints
    │   ├── albums.js        # Album API endpoints
    │   ├── playlists.js     # Playlist API endpoints
    │   └── artists.js       # Artist API endpoints
    │
    ├── utils/               # Pure utility functions (no side effects)
    │   ├── logger.js            # Global logging interceptor controller
    │   ├── ui-loader.js         # Unified HTML/CSS register scoper loader
    │   ├── promise.js           # Unified Promise wrapper (ES5 compat fallback)
    │   ├── decrypt.js           # supported music platform URL decryption
    │   ├── resource.js          # Fetch audio, album art
    │   ├── formatters.js        # Data formatting
    │   ├── url-helper.js        # URL parsing
    │   └── download-helper.js   # File download, metadata
    │
    ├── libs/                # Third-party libraries
    │   ├── des.js           # Pure DES implementation (low-level)
    │   └── writem4a.js      # M4A metadata writer
    │
    ├── services/            # Business logic (orchestrates API + Utils)
    │   ├── song.js          # Song operations (search, get, decrypt)
    │   ├── album.js         # Album operations (search, get details)
    │   ├── playlist.js      # Playlist operations (search, get details)
    │   ├── artist.js        # Artist operations (search, get, popular/latest pagination)
    │   └── download.js      # Download operations (single, album, playlist)
    │
    └── ui/                  # UI rendering and interaction
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
| `window.Utils` | Pure utilities (formatters, resource, download-helper, url-helper, cache) |
| `window.UI` | MAIN UI View Controllers & Operation Handlers (toggleUI, search, player, etc.) |
| `window.UI.DOM` | UI DOM node elements references cache |
| `window.UI.Nav` | Browser-like navigation panel history stack |
| `window.isProxy` | Sandbox HTTP proxy mode detection flag |
| `window.Cache` | Direct convenience alias to window.Utils.Cache |

---

## The 3 Development Modes

### Mode Comparison

| Feature | Split Mode | Bundle Mode | Userscript |
|---------|------------|-------------|------------|
| **Purpose** | Development | Testing | Production |
| **URL** | `http://localhost:3000/` | `http://localhost:3000/bundle` | supported music platform |
| **Files** | Dynamic list registry | Single embedded script | Single userscript file |
| **CSS** | Inbound CSS-in-JS | Embedded in JS | Embedded in JS |
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
- `index.html` loads `app-scripts.js` catalog which dynamically loads all files synchronously in order.
- `window.isProxy = true` set in `index.html`
- All API calls go through `/proxy` endpoint
- CDN resources fetched directly (CORS allowed)

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

### CLI Mode (Terminal Developer Tool)
```
node songdl-cli.js [--mock] [command]
```
- Fits developers running queries or automated checks inside terminal shells (Node.js v22+ required).
- Dynamic in-memory script loader parser imports from `src/app-scripts.js` directly (no userscript compiling needed).
- Direct connections: If `--mock` is not defined, query calls bypass the local proxy server entirely and connect directly to the target platform HTTPS API (since Node has no browser CORS restrictions).
- In-memory mock mapping: If `--mock` is present, it intercepts global raw fetch calls in-process, querying `mock-server.js` offline and reading assets directly from disk (0% ports or TCP sockets used).
- Outputs `.m4a` audio files directly inside the `/downloads` folder.

---

## How to Build and Run

```bash
# Build userscript
node build.js

# Start development server
node server.js

# Run automated tests
node run-tests.js

# Run CLI commands (with mock)
node songdl-cli.js --mock search songs jingle

# Test modes:
# Split mode: http://localhost:3000/
# Bundle mode: http://localhost:3000/bundle
# Userscript: Install dist/song-downloader.user.js in Violentmonkey
```

---

## Automated Testing

The project includes a robust, modular automated testing suite located in the `/tests` directory that runs natively in Node.js (version 22+) without requiring any external testing packages (like Jest or Mocha).

To run the entire test suite, execute:
```bash
node run-tests.js
```

### Testing Architecture

- **[tests/bootstrap.js](./tests/bootstrap.js)**: Imports the script array directly from `src/app-scripts.js`, reads their split contents, and executes them globally inside a single V8 context sandbox using `new Function()()`. This guarantees the tests always evaluate the latest modifications without needing userscript build steps.
- **[tests/mock-fetch.js](./tests/mock-fetch.js)**: Intercepts `global.fetch` calls:
  - Proxy requests (`/proxy`) are routed programmatically to `mock-server.js`'s request handler in-memory.
  - CDN media files are routed to filesystem readers, loading assets directly from the `mock/assets/` directory.
  This allows tests to run fully offline without opening network ports or firing TCP sockets.

### Test Specifications

1. **URL helper ([`tests/url-helper.test.js`](./tests/url-helper.test.js))**: Validates token and format parsing across songs, albums, playlists, and artists URLs.
2. **Decryption ([`tests/decrypt.test.js`](./tests/decrypt.test.js))**: Validates the cryptographic DES decryption maths on a mock song record.
3. **Formatters ([`tests/formatters.test.js`](./tests/formatters.test.js))**: Strictly asserts keys and data types (strings, arrays, booleans) returned by all formatters.
4. **Services ([`tests/services.test.js`](./tests/services.test.js))**: Validates high-level business logic workflows (decrypted URLs, lyric formatting, track search) offline using mock fetch intercepts.

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

### Why `window.Utils.Promise` Namespace Instead of Global Polyfills

**Before (intrusive):**
```javascript
global.Promise = global.Promise || PromisePolyfill;
```
- ❌ Pollutes global namespaces in modern engines.
- ❌ Forces modern browser extensions to evaluate custom polyfills or risk scope collisions.

**After (clean wrapper):**
```javascript
window.Utils.Promise = window.Promise || FallbackPromise;
```
- ✅ Binds environment-specific Promise references under the `window.Utils` namespace.
- ✅ In modern browsers and Node v22+, resolves directly to the native V8 Promise class.
- ✅ In Node v0.9.5/v0.11.8, falls back programmatically to `FallbackPromise` without polluting global.

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

### Why CSS-in-JS Loading Strategy

All visual styling rules are directly co-located inside their corresponding JavaScript files using `window.Utils.registerStyle([lines], scope)` and dynamically injected into a single `<style>` block at runtime via `window.Utils.injectAllStyles()`.

**Benefits**:
- ✅ **Co-location**: CSS rules are kept in the same file as the markup layout generation code.
- ✅ **Automatic Scoping**: Selector rules are automatically scoped to `#ui-overlay` by default in the style scoper parser, preventing global host website style pollution.
- ✅ **Custom Scopes**: Low-level overlay screens (like `.lyrics-overlay` in `lyrics.js`) can register rules with a custom scope (such as an empty scope `''`) to support body-appended components.

### Why Build System Reads `app-scripts.js`

```javascript
// build.js - queries script catalog directly
var files = require(path.join(ROOT_DIR, 'app-scripts.js')).scripts;
```

**Benefits:**
- Single source of truth.
- No duplication of script list.
- Build always matches split mode loading order.

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
    ├── Fetches album art via Utils.fetchResource()
    ├── Fetches lyrics via Services.Song.getLyrics() (if has_lyrics is true)
    ├── Writes M4A tags via writeM4ABytes()
    └── Triggers download via Utils.downloadFile()
    ↓
Services: song.js
    ├── Calls API.getSong(token)
    ├── Decrypts URL via decryptMediaUrl()
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

// Add to src/app-scripts.js in the services block
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

### 3. Player close button must use event delegation or addEventListener

```javascript
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

The order in `src/app-scripts.js` defines the load order. Dependencies must load before dependents:
-   `utils/ui-loader.js` (defining `compileHTML`) must load before `ui/utils.js` (calling `compileHTML`).
-   `api/` (defining constants, fetcher, endpoints) must load before `services/`.

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

## File Loading Order (from src/app-scripts.js)

1.  `api/constants.js` - API domains and configuration constants
2.  `api/fetch.js` - Dynamic polymorphic mock/HTTP query wrapper
3.  `api/songs.js` - Song detail API calls
4.  `api/albums.js` - Album detail API calls
5.  `api/playlists.js` - Playlist detail API calls
6.  `api/artists.js` - Artist detail API calls
7.  `libs/des.js` - Pure DES block cipher implementation
8.  `libs/writem4a.js` - Binary M4A metadata container writer
9.  `utils/promise.js` - Unified isomorphic Promise wrapper
10. `utils/ui-loader.js` - Unified HTML/CSS register style loader scoper
11. `utils/logger.js` - Global logging controller interceptor
12. `ui/utils.js` - Card generator factories and default SVG placeholders (uses `compileHTML`)
13. `utils/decrypt.js` - Media URL decryption helper (uses `libs/des.js`)
14. `utils/resource.js` - Fetch audio/art CDN requests
15. `utils/formatters.js` - Normalizing formatters in ES5
16. `utils/url-helper.js` - URL pattern parsers
17. `utils/download-helper.js` - Filename and file metadata writers
18. `services/song.js` - Song business operations
19. `services/album.js` - Album business operations
20. `services/download.js` - Download compilation manager
21. `services/playlist.js` - Playlist business operations
22. `services/artist.js` - Artist profile business operations
23. `ui/display/song-card.js` - Song card template (CSS-in-JS registerStyle)
24. `ui/display/display-results.js` - Render search results list
25. `ui/display/album-view.js` - Render album detail panels
26. `ui/display/playlist-view.js` - Render playlist detail panels
27. `ui/display/artist-view.js` - Render artist detail panels popular/latest paging
28. `ui/display/lyrics.js` - Render lyrics modal overlay
29. `ui/display/navigation.js` - Navigation view state restorer
30. `ui/search.js` - Search coordinator
31. `ui/player.js` - Audio player controls and autoplay queue
32. `ui/download.js` - Download progress buttons
33. `ui/core.js` - Bootstrapper split/bundle initializer coordinator
34. `ui/builder.js` - Dialog container template assembler
35. `ui/handlers.js` - Click event delegation and keyboard hotkeys

---

## Testing

### Manual Testing
1. **Split Mode:** `node server.js` → http://localhost:3000/
2. **Bundle Mode:** `node build.js` → `node server.js` → http://localhost:3000/bundle
3. **Userscript:** `node build.js` → Install in Violentmonkey → supported music platform
