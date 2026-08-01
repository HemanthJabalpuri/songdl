# Mock Server for JioSaavn API

A fully offline mock server that mimics JioSaavn's API behavior for development and testing.

## Features

- 🔍 **Search** - Song and album search with keyword matching
- 🎵 **Song Details** - Full song metadata with artistMap, lyrics, and more
- 💿 **Album Details** - Album metadata with song lists
- 📜 **Lyrics** - Lyrics with `<br>` tags (mimics real API)
- 🖼️ **Album Art** - 150x150 and 500x500 images
- 🎧 **Audio** - Mock audio files for playback and download
- ⚡ **Cached** - File mappings loaded once at startup for performance

## Directory Structure

```
mock/
├── mock-server.js          # Main mock server
├── assets/
│   ├── audio/              # Mock audio files (.mp4)
│   │   ├── mock_audio_12.mp4
│   │   ├── mock_audio_48.mp4
│   │   ├── mock_audio_96.mp4
│   │   ├── mock_audio_160.mp4
│   │   └── mock_audio_320.mp4
│   └── images/             # Mock album art
│       ├── mock_image-150x150.jpg
│       └── mock_image-500x500.jpg
└── data/
    ├── search/
    │   ├── songs/          # Search responses for songs
    │   │   ├── jingle.json
    │   │   ├── mary.json
    │   │   ├── home.json
    │   │   ├── saints.json
    │   │   ├── amazing.json
    │   │   └── default.json
    │   └── albums/         # Search responses for albums
    │       ├── holiday.json
    │       ├── nursery.json
    │       ├── folk.json
    │       ├── hymn.json
    │       └── default.json
    └── details/
        ├── songs/          # Full song details
        │   ├── mock_song_001.json
        │   ├── mock_song_002.json
        │   ├── mock_song_003.json
        │   ├── mock_song_004.json
        │   └── mock_song_005.json
        ├── albums/         # Full album details
        │   ├── mock_album_001.json
        │   ├── mock_album_002.json
        │   ├── mock_album_003.json
        │   └── mock_album_004.json
        └── lyrics/         # Lyrics for songs
            ├── mock_song_001.json
            ├── mock_song_002.json
            ├── mock_song_003.json
            ├── mock_song_004.json
            └── mock_song_005.json
```

## How It Works

### API Endpoints

The mock server intercepts requests through the `/proxy` endpoint and responds with mock data.

| Request | Response |
|---------|----------|
| `search.getResults?q=jingle` | Returns Jingle Bells song |
| `search.getAlbumResults?q=holiday` | Returns Holiday Classics album |
| `webapi.get?token=mock_song_001&type=song` | Returns full song details |
| `webapi.get?token=mock_album_001&type=album` | Returns full album details |
| `webapi.get?token=mock_song_001&type=lyrics` | Returns lyrics |

### Search Matching

The server matches search queries against filenames:

| Search Query | Returns |
|--------------|---------|
| `jingle` | Jingle Bells |
| `mary` | Mary Had A Little Lamb |
| `home` | Home on the Range |
| `saints` | When the Saints Go Marching In |
| `amazing` | Amazing Grace |
| `holiday` | Holiday Classics album |
| `nursery` | Nursery Rhymes album |
| `folk` | American Folk Songs album |
| `hymn` | Hymns of Faith album |
| Anything else | Empty results (`default.json`) |

### Asset URLs

| Asset Type | URL Pattern | File Location |
|------------|-------------|---------------|
| Album Art | `http://127.0.0.1:3000/mock/images/mock_image-150x150.jpg` | `assets/images/mock_image-150x150.jpg` |
| Album Art (500x500) | `http://127.0.0.1:3000/mock/images/mock_image-500x500.jpg` | `assets/images/mock_image-500x500.jpg` |
| Audio | `http://127.0.0.1:3000/mock/audio/mock_audio_96.mp4` | `assets/audio/mock_audio_96.mp4` |

### Encrypted Audio URLs

The mock uses real encryption to mimic JioSaavn's behavior:

1. **JSON contains** encrypted string: `"encrypted_media_url": "JKcIGVL+NOVwdDWakCj6fWGE8WcC+2iTTmjcVY5gjZcb6MwSnJjGC0KIVQL/LeFRb5cctSKeEIo="`
2. **Browser decrypts** using `decryptMediaUrl()` → `http://127.0.0.1:3000/mock/audio/mock_audio_96.mp4`
3. **Browser fetches** the audio from local server

## Mock Songs

| ID | Title | Artist | Album | Has Lyrics |
|----|-------|--------|-------|------------|
| `mock_song_001` | Jingle Bells | James Pierpont | Holiday Classics | ✅ |
| `mock_song_002` | Mary Had A Little Lamb | Traditional | Nursery Rhymes | ✅ |
| `mock_song_003` | Home on the Range | Daniel E. Kelley | American Folk Songs | ✅ |
| `mock_song_004` | When the Saints Go Marching In | Traditional | American Folk Songs | ✅ |
| `mock_song_005` | Amazing Grace | John Newton | Hymns of Faith | ✅ |

## Mock Albums

| ID | Title | Artist | Songs |
|----|-------|--------|-------|
| `mock_album_001` | Holiday Classics | James Pierpont | 1 |
| `mock_album_002` | Nursery Rhymes | Traditional | 1 |
| `mock_album_003` | American Folk Songs | Various Artists | 2 |
| `mock_album_004` | Hymns of Faith | John Newton | 1 |

## Adding New Mock Data

### Add a New Song

1. **Create song details**: `data/details/songs/mock_song_XXX.json`
2. **Create search response**: `data/search/songs/name.json`
3. **Create lyrics**: `data/details/lyrics/mock_song_XXX.json`
4. **Add audio file**: `assets/audio/mock_audio_XXX.mp4`
5. **Add album art**: `assets/images/mock_image-XXX-150x150.jpg` and `500x500.jpg`
6. **Restart the server**

### Add a New Album

1. **Create album details**: `data/details/albums/mock_album_XXX.json`
2. **Create search response**: `data/search/albums/name.json`
3. **Add album art**: `assets/images/mock_image-XXX-150x150.jpg` and `500x500.jpg`
4. **Restart the server**

## Running the Mock Server

```bash
# Start with mock mode
node server.js --mock
```

## Dependencies

- Node.js (built-in modules only: `fs`, `path`)

## Notes

- The mock server is fully offline - no external API calls are made
- All audio and image files are served from the `mock/assets/` directory
- CORS headers are set for all mock asset requests
- The mock uses real encryption/decryption to mimic JioSaavn's behavior
