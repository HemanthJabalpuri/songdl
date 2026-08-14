// src/js/libs/compat.js
// Centralized environment-agnostic binary, encoding, and Base64 conversion shims
window.Utils = window.Utils || {};

// Converts Uint8Array to string (UTF-8 or Latin-1) in pure ES5
function bytesToString(bytes, offset, endOffset, encoding) {
    if (encoding === undefined) encoding = 'latin1';
    var slice = bytes.subarray(offset, endOffset);
    var str = '';
    for (var i = 0; i < slice.length; i++) {
        str += String.fromCharCode(slice[i]);
    }
    if (encoding === 'utf8') {
        return decodeURIComponent(escape(str));
    }
    return str;
}

// Converts string to Uint8Array in pure ES5
function stringToBytes(str, encoding) {
    if (encoding === undefined) encoding = 'utf8';
    var srcString = (encoding === 'utf8') ? unescape(encodeURIComponent(str)) : str;
    var bytes = new Uint8Array(srcString.length);
    for (var i = 0; i < srcString.length; i++) {
        bytes[i] = srcString.charCodeAt(i) & 0xff;
    }
    return bytes;
}

// Universal Base64 to Binary String decoder
function base64ToBinaryString(str) {
    if (typeof atob === 'function') return atob(str);
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    str = str.replace(/=+$/, '');
    var binary = '';
    var len = str.length;
    for (var i = 0; i < len; i += 4) {
        var c1 = chars.indexOf(str.charAt(i));
        var c2 = chars.indexOf(str.charAt(i + 1));
        var c3 = chars.indexOf(str.charAt(i + 2));
        var c4 = chars.indexOf(str.charAt(i + 3));

        var byte1 = (c1 << 2) | (c2 >> 4);
        var byte2 = ((c2 & 15) << 4) | (c3 >> 2);
        var byte3 = ((c3 & 3) << 6) | c4;

        binary += String.fromCharCode(byte1);
        if (c3 !== -1 && i + 2 < len) binary += String.fromCharCode(byte2);
        if (c4 !== -1 && i + 3 < len) binary += String.fromCharCode(byte3);
    }
    return binary;
}

window.Utils.bytesToString = bytesToString;
window.Utils.stringToBytes = stringToBytes;
window.Utils.base64ToBinaryString = base64ToBinaryString;
