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

test('Utils.getDecryptedUrl decrypts mock tokens', function() {
    var song = {
        more_info: {
            encrypted_media_url:
                'JKcIGVL+NOVwdDWakCj6fWGE8WcC+2iTTmjcVY5gjZcb6MwSnJjGC0KIVQL/LeFRb5cctSKeEIo='  // encrypted mock token
        }
    };
    var decrypted = window.Utils.getDecryptedUrl(song, 96);
    assert.ok(decrypted);

    // Old assert module has no .match method in v0.11!
    // So we use standard RegExp test:
    assert.ok(/^http.*\.mp4/.test(decrypted), 'Decrypted URL did not match expected pattern: ' + decrypted);
});
