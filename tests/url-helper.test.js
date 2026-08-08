require('./bootstrap.js');
const test = require('node:test');
const assert = require('node:assert');

test('Utils.parseUrl matches platform URLs', () => {
    const urls = [
        {
            url: 'https://www.mymusic.com/song/jingle-bells/mock_song_001',
            expected: {type: 'song', token: 'mock_song_001'}
        },
        {
            url: 'https://www.mymusic.com/album/holiday-classics/mock_album_001',
            expected: {type: 'album', token: 'mock_album_001'}
        },
        {
            url: 'https://www.mymusic.com/featured/holiday-favorites/mock_playlist_001',
            expected: {type: 'playlist', token: 'mock_playlist_001'}
        },
        {
            url: 'https://www.mymusic.com/artist/james-pierpont/mock_artist_001',
            expected: {type: 'artist', token: 'mock_artist_001'}
        }
    ];

    urls.forEach(({url, expected}) => {
        const parsed = window.Utils.parseUrl(url);
        assert.ok(parsed, `Failed to parse: ${url}`);
        assert.strictEqual(parsed.type, expected.type);
        assert.strictEqual(parsed.token, expected.token);
    });
});
