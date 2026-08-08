require('./bootstrap.js');
const test = require('node:test');
const assert = require('node:assert');

test('Utils.getDecryptedUrl decrypts mock tokens', () => {
    const song = {
        more_info: {
            encrypted_media_url:
                'JKcIGVL+NOVwdDWakCj6fWGE8WcC+2iTTmjcVY5gjZcb6MwSnJjGC0KIVQL/LeFRb5cctSKeEIo='  // encrypted mock token
        }
    };
    const decrypted = window.Utils.getDecryptedUrl(song, 96);
    assert.ok(decrypted);
    assert.match(decrypted, /^http.*\.mp4/);
});
