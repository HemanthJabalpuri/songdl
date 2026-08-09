require('./bootstrap.js');
require('./mock-fetch.js')();  // Enable offline mock fetch in-memory

var test;
try {
    test = require('node:test');
} catch (e) {
    test = global.test;
}
var assert;
try {
    assert = require('node:assert');
} catch (e) {
    assert = require('assert');
}

test('Services.Song.search resolves results from mock data store', function() {
    return Services.Song.search('jingle', 5, 1).then(function(data) {
        assert.ok(data.results.length > 0);
        assert.strictEqual(data.results[0].title, 'Jingle Bells');
        assert.strictEqual(data.results[0].token, 'mock_song_001');
    });
});

test('Services.Song.getDecrypted resolves details from mock data store', function() {
    return Services.Song.getDecrypted('mock_song_001').then(function(song) {
        assert.strictEqual(song.title, 'Jingle Bells');
        assert.strictEqual(song.artist, 'James Pierpont');
        assert.ok(song.url);
    });
});

test('Services.Song.getLyrics resolves formatted lyrics text', function() {
    return Services.Song.getLyrics('mock_song_001').then(function(lyrics) {
        assert.ok(lyrics);
        assert.notStrictEqual(lyrics, 'No lyrics available');
    });
});

test('Services.Album.getDetails resolves album details tracklist', function() {
    return Services.Album.getDetails('mock_album_001').then(function(album) {
        assert.strictEqual(album.title, 'Holiday Classics');
        assert.ok(album.songs.length > 0);
    });
});

test('Services.Playlist.getDetails resolves playlist details songs list', function() {
    return Services.Playlist.getDetails('mock_playlist_001', 1, 50).then(function(playlist) {
        assert.strictEqual(playlist.title, 'Telugu 2000s');
        assert.ok(playlist.songs.length > 0);
    });
});

test('Services.Artist.getDetails resolves artist profile details', function() {
    return Services.Artist.getDetails('LlRWpHzy3Hk_').then(function(artist) {
        assert.strictEqual(artist.name, 'Arijit Singh');
    });
});
