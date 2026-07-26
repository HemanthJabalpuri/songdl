# 🎵 JioSaavn Song Downloader

Download songs and albums from JioSaavn with full metadata, right in your browser.

---

## Why This Exists

I built this project mainly to learn JavaScript and practice pair programming with GenAI (DeepSeek). The entire development was done on Android, proving that you can build serious projects on mobile.

With the sunset of the Blackhole Android app, I needed a way to listen to songs from JioSaavn again. I found projects like **saavn-dl** (website) and **Melotune** (Android app), but they had limitations:
- Required hosted APIs (ongoing cost)
- Platform-specific (not cross-platform)

This userscript solves both problems:
- ✅ **No server needed** - Runs entirely in your browser
- ✅ **Cross-platform** - Works on any device with Violentmonkey (Android, Desktop, etc.)

---

## Features

- 🔍 **Search** - Find songs and albums
- ⬇️ **Download** - Save songs with full metadata (M4A format)
- 📜 **Lyrics** - View and embed lyrics (when available)
- 🎵 **Player** - Listen to songs right in the UI
- 🎚️ **Quality** - Choose from 12, 48, 96, 160, 320 kbps
- 🔗 **URL Detection** - Paste any JioSaavn URL or open UI on a song/album page and it's auto-filled
- 💿 **Album Downloads** - Download entire albums at once
- 🖼️ **Album Art** - Embedded in downloaded files
- 🏷️ **Full Metadata** - Title, artist, album, year, genre, lyrics, cover art

---

## Installation

### 1. Install Violentmonkey
- **Firefox Android:** Install from [addons.mozilla.org](https://addons.mozilla.org/en-US/firefox/addon/violentmonkey/)
- **Other Browsers:** Visit [violentmonkey.github.io](https://violentmonkey.github.io/)

### 2. Install the Userscript
- Download `song-downloader.user.js` from the [dist folder](./dist/song-downloader.user.js)
- Or install directly from the GitHub repo

### 3. Visit JioSaavn
- Go to [jiosaavn.com](https://www.jiosaavn.com/)
- Click the 🎵 button or press `Alt+J` to open the UI

---

## How to Use

### Opening the UI
- Click the **🎵** floating button in the bottom-right corner
- Or press **Alt+J** on your keyboard

### Searching
1. Type a song or album name in the search box
2. Click the **Search** button
3. Switch between **Songs** and **Albums** tabs

### Playing
- Click the **▶ Play** button on any song
- The player appears below the song card
- Use the audio controls to play/pause, seek, adjust volume

### Downloading
- Click the **⬇ Download** button on any song
- The song downloads with full metadata (M4A format)
- Album downloads: Click **View Album** → Download individual songs

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
- **Paste any JioSaavn URL** in the search box:
  - Song URL: `https://www.jiosaavn.com/song/...`
  - Album URL: `https://www.jiosaavn.com/album/...`
  - Lyrics URL: `https://www.jiosaavn.com/lyrics/...`
- **Auto-detect:** If you're on a song/album page and open the UI, the URL is auto-filled

---

## What Happens on Song/Album Pages

When you're on a JioSaavn song or album page and open the UI:
- The URL is automatically prefilled in the search box
- Click **Search** to load the song/album
- No need to copy-paste URLs manually

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
| Script not showing | Make sure Violentmonkey is enabled on jiosaavn.com |
| UI doesn't open | Check the console (F12) for errors |
| Downloads failing | Try a different quality setting |
| Player not working | Make sure you're on jiosaavn.com (not a different site) |
| Lyrics not showing | Not all songs have lyrics available |

---

## Disclaimer

- ⚠️ **For personal use only** - This tool is for learning and personal enjoyment
- 📝 **Respect content rights** - Only download content you have rights to
- 🔗 **Not affiliated** - This project is not affiliated with or endorsed by JioSaavn

---

## Built With

- 💻 **DeepSeek** - AI pair programming
- 📱 **Android** - Entirely developed on mobile
- 🟢 **JavaScript** - Vanilla JS, no frameworks

---

## License

MIT License - See [LICENSE](./LICENSE) file for details.
