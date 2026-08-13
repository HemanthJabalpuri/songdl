require('./bootstrap.js');
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

test('formatters.formatDuration parses time strings', function() {
    assert.strictEqual(window.Utils.formatDuration(65), '1:05');
    assert.strictEqual(window.Utils.formatDuration(3600), '60:00');
    assert.strictEqual(window.Utils.formatDuration(0), 'N/A');
});

test('formatters.formatSong maps correct keys & types', function() {
    var rawSong = {
        id: 'mock_song_001',
        title: 'Jingle Bells',
        subtitle: 'James Pierpont',
        image: '',
        language: 'english',
        year: '1857',
        play_count: '150',
        explicit_content: '0',
        duration: '100',
        more_info:
            {encrypted_media_url: 'abc', has_lyrics: 'true', lyrics_snippet: 'Jingle bells', album: 'Christmas Album'}
    };

    var formatted = window.Utils.formatters.formatSong(rawSong);
    assert.ok(formatted);
    assert.strictEqual(formatted.id, 'mock_song_001');
    assert.strictEqual(formatted.title, 'Jingle Bells');
    assert.strictEqual(typeof formatted.more_info.has_lyrics, 'boolean');
    assert.strictEqual(formatted.more_info.album, 'Christmas Album');
});

test('formatters.formatAlbumDetail maps correct keys & types', function() {
    var rawAlbum = {
        id: 'mock_album_001',
        perma_url: 'https://music.example.com/album/holiday-classics/mock_album_001',
        title: 'Holiday Classics',
        image: '',
        list: []
    };

    var formatted = window.Utils.formatters.formatAlbumDetail(rawAlbum);
    assert.ok(formatted);
    assert.strictEqual(formatted.id, 'mock_album_001');
    assert.strictEqual(formatted.title, 'Holiday Classics');
    assert.ok(Array.isArray(formatted.songs));
});

test('formatters.formatPlaylistDetail maps correct keys & types', function() {
    var rawPlaylist = {
        id: 'mock_playlist_001',
        perma_url: 'https://music.example.com/featured/telugu-2000s/mock_playlist_001',
        title: 'Telugu 2000s',
        list: []
    };

    var formatted = window.Utils.formatters.formatPlaylistDetail(rawPlaylist);
    assert.ok(formatted);
    assert.strictEqual(formatted.id, 'mock_playlist_001');
    assert.strictEqual(formatted.title, 'Telugu 2000s');
    assert.ok(Array.isArray(formatted.songs));
});

test('formatters.formatArtistDetail maps correct keys & types', function() {
    var rawArtist = {
        artistId: 'mock_artist_001',
        perma_url: 'https://music.example.com/artist/arijit-singh/LlRWpHzy3Hk_',
        name: 'Arijit Singh',
        bio: '[]'
    };

    var formatted = window.Utils.formatters.formatArtistDetail(rawArtist);
    assert.ok(formatted);
    assert.strictEqual(formatted.id, 'mock_artist_001');
    assert.strictEqual(formatted.name, 'Arijit Singh');
});

test('Utils.getHighResImageUrl replaces dimensions correctly', function() {
    // Test album art replacement
    var albumUrl = 'https://musiccdn.com/cover-150x150.jpg';
    assert.strictEqual(window.Utils.getHighResImageUrl(albumUrl, false), 'https://musiccdn.com/cover-500x500.jpg');

    // Test artist image replacement
    var artistUrl = 'https://musiccdn.com/artist_50x50.jpg';
    assert.strictEqual(window.Utils.getHighResImageUrl(artistUrl, true), 'https://musiccdn.com/artist_150x150.jpg');

    // Test empty fallback
    assert.strictEqual(window.Utils.getHighResImageUrl('', false), '');
});
