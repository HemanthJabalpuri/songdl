// src/js/utils/decrypt.js

const KEY = new Uint32Array([
    36443656,  338827529, 170141697, 338826299, 170272797, 875566612, 170276616, 941097494,
    153487137, 941103620, 154281006, 940128288, 221380890, 688468270, 621941049, 688727305,
    622007300, 151861785, 890309646, 184882698, 874054925, 50799890,  874062625, 117842443,
    805908001, 119942188, 839720978, 102894652, 302780946, 103954180, 302782501, 338829583
]);

// Decrypt media URL
function decryptMediaUrl(encrypted) {
    // Get the DES implementation
    const desDecrypt = window.desDecrypt;

    if (!desDecrypt) {
        throw new Error('DES decryption library not available');
    }

    var binaryString;
    if (typeof atob === 'function') {
        binaryString = atob(encrypted);
    } else {
        binaryString = new Buffer(encrypted, 'base64').toString('binary');
    }

    const plain = desDecrypt(binaryString, KEY);
    return plain.slice(0, -plain.charCodeAt(plain.length - 1));
}

// Get decrypted URL from song object and format it with quality
function getDecryptedUrl(songData, quality) {
    var encrypted = songData.more_info ? songData.more_info.encrypted_media_url : null;
    if (!encrypted) throw new Error('No encrypted URL found');

    var decryptedUrl = decryptMediaUrl(encrypted);
    if (!decryptedUrl) throw new Error('Decryption failed');

    if (typeof window.Utils !== 'undefined' && window.Utils.formatters &&
        typeof window.Utils.formatters.formatUrlWithQuality === 'function') {
        return window.Utils.formatters.formatUrlWithQuality(decryptedUrl, quality || window.currentQuality || 96);
    }
    return decryptedUrl;
}

// Expose to browser
if (typeof window !== 'undefined') {
    window.decryptMediaUrl = decryptMediaUrl;
    window.Utils = window.Utils || {};
    window.Utils.getDecryptedUrl = getDecryptedUrl;
}
