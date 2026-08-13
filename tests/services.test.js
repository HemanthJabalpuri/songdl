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
        assert.strictEqual(song.subtitle, 'James Pierpont');
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

test('Services.Download.songFromData fetches and embeds metadata & lyrics in downloaded M4A', function() {
    var rawSongData = {
        id: 'mock_song_001',
        token: 'mock_song_001',
        title: 'Jingle Bells',
        subtitle: 'James Pierpont',
        image: 'http://127.0.0.1:3000/mock/images/mock_image-150x150.jpg',
        language: 'english',
        year: '1857',
        play_count: '1500000',
        more_info: {
            duration: '180',
            encrypted_media_url: 'abc',
            album: 'Holiday Classics',
            album_url: 'https://music.example.com/album/holiday-classics/mock_album_001',
            artistMap: {
                primary_artists: [{ name: 'James Pierpont', perma_url: 'https://music.example.com/artist/james-pierpont' }],
                featured_artists: [],
                artists: []
            },
            copyright_text: 'Mock Copyright 2026',
            has_lyrics: true
        },
        url: 'http://127.0.0.1:3000/mock/audio/mock_audio_96.mp4'
    };

    var originalDownloadFile = window.Utils.downloadFile;
    var downloadedData = null;
    var downloadedFilename = null;

    window.Utils.downloadFile = function(data, filename) {
        downloadedData = data;
        downloadedFilename = filename;
        return true;
    };

    return Services.Download.songFromData(rawSongData)
        .then(function() {
            // Restore stub after resolution
            window.Utils.downloadFile = originalDownloadFile;

            assert.ok(downloadedData, 'M4A payload should be populated');
            assert.ok(downloadedData.length > 0, 'M4A payload should be non-empty');
            assert.strictEqual(downloadedFilename, 'Jingle Bells - James Pierpont (96).m4a');

            // Parse metadata atoms using native library
            var parsedTags = window.Utils.parseM4ABytes(downloadedData);
            assert.ok(parsedTags, 'Parsed M4A tags must be resolved');

            assert.strictEqual(parsedTags.title, 'Jingle Bells', 'Title tag matches');
            assert.strictEqual(parsedTags.artist, 'James Pierpont', 'Artist tag matches');
            assert.strictEqual(parsedTags.album, 'Holiday Classics', 'Album tag matches');
            assert.strictEqual(parsedTags.year, '1857', 'Year tag matches');
            assert.strictEqual(parsedTags.genre, 'english', 'Genre tag matches');
            assert.strictEqual(parsedTags.copyright, 'Mock Copyright 2026', 'Copyright tag matches');
            assert.ok(parsedTags.lyrics && parsedTags.lyrics.indexOf('Dashing through the snow') === 0, 'Lyrics tag matches');
        })
        .catch(function(e) {
            window.Utils.downloadFile = originalDownloadFile;
            throw e;
        });
});
