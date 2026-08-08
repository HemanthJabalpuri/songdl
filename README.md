# 🎵 Song Downloader

Download songs, albums, artists, and playlists from supported music platform with full metadata, right in your browser.

---

## Why This Exists

I built this project mainly to learn JavaScript and practice pair programming with GenAI (DeepSeek and Gemini). The entire development was done on Android, proving that you can build serious projects on mobile.

This userscript solves common problems:
- ✅ **No server needed** - Runs entirely in your browser
- ✅ **Cross-platform** - Works on any device with Violentmonkey (Android, Desktop, etc.)

---

## Features

- 🔍 **Search** - Find songs, albums, playlists, and artists
- ⬇️ **Download** - Save songs with full metadata (M4A format)
- 📜 **Lyrics** - View and embed lyrics (when available)
- 🎵 **Player** - Listen to songs right in the UI
- 🎚️ **Quality** - Choose from 12, 48, 96, 160, 320 kbps
- 🔗 **URL Detection** - Paste any supported music platform URL (song, album, playlist, artist) and the UI resolves it automatically
- 📀 **Details Views**:
  - **Albums**: View tracklists and download individual tracks or the entire album at once.
  - **Playlists**: View curations and download tracks with dynamic "Load More" pagination support.
  - **Artists**: Explore artist details, switch between Popular and Latest tabs, and load more relative songs/albums.
- 🖼️ **Album Art** - Embedded in downloaded files
- 🏷️ **Full Metadata** - Title, artist, album, year, genre, lyrics, cover art
- ⚡ **Unified Session Cache** - Instant loading of previously fetched tracks and search results.
- 🧭 **Navigation History Memory** - Back and forward navigation stack that recalls exact scroll settings and pagination pages.

---

## Installation

### 1. Install Violentmonkey
- **Firefox Android:** Install from [addons.mozilla.org](https://addons.mozilla.org/en-US/firefox/addon/violentmonkey/)
- **Other Browsers:** Visit [violentmonkey.github.io](https://violentmonkey.github.io/)

### 2. Install the Userscript
- Open `song-downloader.user.js` from the userscript branch and click "Install" when Violentmonkey page appears
- Or install directly from the `userscript` branch in GitHub repo 

### 3. Visit supported music platform
- Go to supported music platform
- Click the 🎵 button or press `Alt+J` to open the UI

---

## How to Use

### Opening the UI
- Click the **🎵** floating button in the bottom-right corner
- Or press **Alt+J** on your keyboard

### Searching
1. Type a song, album, playlist, or artist name in the search box
2. Click the **Search** button
3. Switch between **Songs**, **Albums**, **Playlists**, and **Artists** tabs

### Playing
- Click the **▶ Play** button on any song
- The player appears below the song card
- Use the audio controls to play/pause, seek, adjust volume

### Downloading
- Click the **⬇ Download** button on any song
- The song downloads with full metadata (M4A format)
- Album downloads: Click **View Album** → Download individual songs or the whole list

### Quality Selection
- Use the **Quality** dropdown in the header
- Choose from: 12, 48, 96, 160, 320 kbps
- Default: 96 kbps
- Applies to both playing and downloading

### Lyrics
- If a song has lyrics, a **📜 Lyrics** button appears
- Click to view lyrics in a scrollable overlay
- Lyrics are also embedded in downloaded files

### URL Detection
- **Paste any supported music platform URL** in the search box:
  - Song URL: `https://www.mymusic.com/song/...`
  - Album URL: `https://www.mymusic.com/album/...`
  - Playlist URL: `https://www.mymusic.com/featured/...`
  - Artist URL: `https://www.mymusic.com/artist/...`
- **Auto-detect:** If you're on a song/album page and open the UI, the URL is auto-filled

---

## Technical Details

### Navigation History Memory
The client maintains a local navigation history stack:
- **Back Button**: Restores previous views instantly.
- **State Preservation**: Persists loaded pages and quality settings, avoiding redundant backend requests when navigating between cards.

### Unified caching
All audio files, decryptions, search pages, and details records are stored in a unified session cache (`window.Cache`). This guarantees instantaneous transitions back and forth.

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Alt+J` | Open/Close UI |
| `Escape` | Close UI |
| `Enter` | Search (when focused on search box) |

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Script not showing | Make sure Violentmonkey is enabled on supported music platform |
| UI doesn't open | Check the console (F12) for errors |
| Downloads failing | Try a different quality setting |
| Player not working | Make sure you're on supported music platform (not a different site) |
| Lyrics not showing | Not all songs have lyrics available |

---

## Disclaimer

- ⚠️ **For personal use only** - This tool is for learning and personal enjoyment
- 📝 **Respect content rights** - Only download content you have rights to
- 🔗 **Not affiliated** - This project is not affiliated with or endorsed by supported music platform

---

## Built With

- 💻 **DeepSeek & Gemini** - AI pair programming
- 📱 **Android** - Entirely developed on mobile
- 🟢 **JavaScript** - Vanilla JS, no frameworks

---

## License

MIT License - See [LICENSE](./LICENSE) file for details.
