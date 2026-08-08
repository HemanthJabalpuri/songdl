require('./bootstrap.js');
require('./mock-fetch.js')();  // Enable offline mock fetch in-memory

const test = require('node:test');
const assert = require('node:assert');

test('Services.Song.search resolves results from mock data store', async () => {
    const data = await Services.Song.search('jingle', 5, 1);
    assert.ok(data.results.length > 0);
    assert.strictEqual(data.results[0].title, 'Jingle Bells');
    assert.strictEqual(data.results[0].token, 'mock_song_001');
});

test('Services.Song.getDecrypted resolves details from mock data store', async () => {
    const song = await Services.Song.getDecrypted('mock_song_001');
    assert.strictEqual(song.title, 'Jingle Bells');
    assert.strictEqual(song.artist, 'James Pierpont');
    assert.ok(song.url);
});

test('Services.Song.getLyrics resolves formatted lyrics text', async () => {
    const lyrics = await Services.Song.getLyrics('mock_song_001');
    assert.ok(lyrics);
    assert.notStrictEqual(lyrics, 'No lyrics available');
});

test('Services.Album.getDetails resolves album details tracklist', async () => {
    const album = await Services.Album.getDetails('mock_album_001');
    assert.strictEqual(album.title, 'Holiday Classics');
    assert.ok(album.songs.length > 0);
});

test('Services.Playlist.getDetails resolves playlist details songs list', async () => {
    const playlist = await Services.Playlist.getDetails('mock_playlist_001', 1, 50);
    assert.strictEqual(playlist.title, 'Telugu 2000s');
    assert.ok(playlist.songs.length > 0);
});

test('Services.Artist.getDetails resolves artist profile details', async () => {
    const artist = await Services.Artist.getDetails('LlRWpHzy3Hk_');
    assert.strictEqual(artist.name, 'Arijit Singh');
});
