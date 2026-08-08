# Mock Server & Dataset Generator

A fully offline mock server and automated testing dataset generator that mimics supported music platform's API behavior for local development.

---

## Features

- 🔍 **Search** - Song, album, playlist, and artist search with keyword matching
- 🎵 **Song Details** - Full song metadata with decryptable audio URLs
- 💿 **Album Details** - Album metadata with track listings
- 🎤 **Artist Profiles** - Complete profiles containing Popular and Latest releases, singles, playlists, and bios.
- 🗂️ **Playlists Curations** - Playlist metadata listings
- 📜 **Lyrics** - Lyrics with `<br>` formatting tags (mimics real API)
- 🎧 **Audio CDNs** - Mock audio files served locally for playing and downloading
- ⚡ **Paging support** - Pre-generated paging sub-files for loading more items dynamically (e.g. `_songs_2.json`, `_albums_3.json`, etc.)

---

## Directory Structure

```
mock/
├── generate-mock-data.js    # Automated mock dataset generator
├── mock-server.js           # Request handler logic
├── assets/
│   ├── audio/               # Mock audio files (.mp4) for bitrates
│   └── images/              # Mock album cover art (.jpg)
└── data/                    # Generated mock database files
    ├── search/
    │   ├── songs/           # Search responses for songs
    │   ├── albums/          # Search responses for albums
    │   ├── playlists/       # Search responses for playlists
    │   └── artists/         # Search responses for artists
    └── details/
        ├── songs/           # Full song details
        ├── albums/          # Full album details
        ├── playlists/       # Full playlist details with track segments
        ├── lyrics/          # Lyrics for tracks
        └── artists/         # Artist details, profiles, and page sub-lists
```

---

## How It Works

The local web server (`server.js`) intercepts calls to `/proxy` and delegates them to `mock-server.js` when mock mode is active (`server.js --mock`).

### Mock API Endpoints

The mock server maps requested URLs to files inside `mock/data/`:

| Endpoints Call | Type | Mock Data File resolved |
|----------------|------|------------------------|
| `search.getResults?q=xyz` | search | `data/search/songs/xyz.json` |
| `search.getAlbumResults?q=xyz` | search | `data/search/albums/xyz.json` |
| `search.getPlaylistResults?q=xyz` | search | `data/search/playlists/xyz.json` |
| `search.getArtistResults?q=xyz` | search | `data/search/artists/xyz.json` |
| `webapi.get?token=XYZ&type=song` | details | `data/details/songs/XYZ.json` |
| `webapi.get?token=XYZ&type=album` | details | `data/details/albums/XYZ.json` |
| `webapi.get?token=XYZ&type=playlist` | details | `data/details/playlists/XYZ_page_1.json` |
| `webapi.get?token=XYZ&type=lyrics` | details | `data/details/lyrics/XYZ.json` |
| `webapi.get?token=XYZ&type=artist&category=popular` | details | `data/details/artists/XYZ_popular.json` |
| `webapi.get?token=XYZ&type=artist&category=latest` | details | `data/details/artists/XYZ_latest.json` |

### Artist/Playlist Pagination Requests

Paging requests query specific page indexes:

- **Artist Popular Songs**: `artistId=XYZ&page=2&category=popular` -> Maps to:
  `data/details/artists/XYZ_popular_songs_2.json`
- **Artist Latest Songs**: `artistId=XYZ&page=2&category=latest` -> Maps to:
  `data/details/artists/XYZ_latest_songs_2.json`
- **Artist Albums**: `albumId=XYZ&page=2` (Note: The API queries artist-albums via `albumId` parameter) -> Maps to:
  `data/details/artists/XYZ_albums_2.json`
- **Playlists tracks**: `token=XYZ&type=playlist&page=2` -> Maps to:
  `data/details/playlists/XYZ_page_2.json`

---

## Mock Dataset Generator

The mock dataset is generated automatically by **`generate-mock-data.js`**:
```bash
# Generate the mock database files (with prefix 'test'):
node mock/generate-mock-data.js test

# Purge existing dataset before generating:
node mock/generate-mock-data.js --delete test
```

### Generation Logic:
1. Creates a pool of candidate tracks, artists, and playlists.
2. Formats all permadomains to standard production paths (`https://www.mymusic.com`).
3. Correctly binds `albumToken` values in trace listings, avoiding detail lookup errors.
4. Generates search files matching keywords (`mary`, `jingle`, etc.).
5. Randomly assigns songs to artists, generating paginated secondary files (`_songs_2.json`, `_albums_2.json`, etc.) dynamically for those that have more than 10 allocations, enabling local layout testing.

---

## Running the Mock Server

Start the development server with mock mode enabled:
```bash
node server.js --mock
```
