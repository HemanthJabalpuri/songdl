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

test('desEncrypt and desDecrypt round-trip parity', function() {
    var key = window.Utils.DES_KEY;
    var plaintext = 'Hello World!';
    
    var ciphertext = window.desEncrypt(plaintext, key);
    assert.strictEqual(typeof ciphertext, 'string', 'Ciphertext must be a string');
    assert.ok(ciphertext.length > 0, 'Ciphertext must be non-empty');
    assert.notStrictEqual(ciphertext, plaintext, 'Ciphertext must be different from plaintext');
    
    var decrypted = window.desDecrypt(ciphertext, key);
    // Strip PKCS7 padding just like decryptMediaUrl does
    var cleanDecrypted = decrypted.slice(0, -decrypted.charCodeAt(decrypted.length - 1));
    assert.strictEqual(cleanDecrypted, plaintext, 'Decrypted text must match plaintext');
});
