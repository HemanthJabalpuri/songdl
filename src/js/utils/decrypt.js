// ui/js/core/decrypt.js

(function() {
    'use strict';

    const KEY = new Uint32Array([
        36443656, 338827529, 170141697, 338826299,
        170272797, 875566612, 170276616, 941097494,
        153487137, 941103620, 154281006, 940128288,
        221380890, 688468270, 621941049, 688727305,
        622007300, 151861785, 890309646, 184882698,
        874054925, 50799890, 874062625, 117842443,
        805908001, 119942188, 839720978, 102894652,
        302780946, 103954180, 302782501, 338829583
    ]);

    /**
     * Decrypt media URL
     * @param {string} encrypted - Base64 encrypted URL
     * @returns {string} Decrypted URL
     */
    function decryptMediaUrl(encrypted) {
        // Get the DES implementation
        const desDecrypt = window.desDecrypt;
        
        if (!desDecrypt) {
            throw new Error('DES decryption library not available');
        }

        const plain = desDecrypt(atob(encrypted), KEY);
        return plain.slice(0, -plain.charCodeAt(plain.length - 1));
    }

    // Expose to browser
    if (typeof window !== 'undefined') {
        window.decryptMediaUrl = decryptMediaUrl;
    }
})();
