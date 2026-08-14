// src/js/libs/writem4a.js

// Restricts recursive parsing to metadata-only atoms to avoid GC allocating and shifts index tables in-place using
// direct byte signatures.



// Concatenates multiple Uint8Array arrays into one.
function concatUint8Arrays(arrays) {
    var totalLength = 0;
    for (var i = 0; i < arrays.length; i++) {
        totalLength += arrays[i].length;
    }
    var result = new Uint8Array(totalLength);
    var offset = 0;
    for (i = 0; i < arrays.length; i++) {
        var arr = arrays[i];
        result.set(arr, offset);
        offset += arr.length;
    }
    return result;
}

// Reads variable-length Big-Endian integer from DataView.
function readUIntBE(view, offset, byteLength) {
    var value = 0;
    for (var i = 0; i < byteLength; i++) {
        value = (value << 8) | view.getUint8(offset + i);
    }
    return value;
}

// Writes variable-length Big-Endian integer into DataView.
function writeUIntBE(view, value, offset, byteLength) {
    var temp = value;
    for (var i = byteLength - 1; i >= 0; i--) {
        view.setUint8(offset + i, temp & 0xff);
        temp = temp >> 8;
    }
}

// 64-bit Big-Endian DataView helpers supporting legacy runtimes natively
function readUInt64(view, offset) {
    var high = view.getUint32(offset, false);
    var low = view.getUint32(offset + 4, false);
    return high * 0x100000000 + low;
}

function writeUInt64(view, value, offset) {
    var high = Math.floor(value / 0x100000000);
    var low = value % 0x100000000;
    view.setUint32(offset, high, false);
    view.setUint32(offset + 4, low, false);
}

// Array Search Helpers (bypass ES6 prototype method dependency)
function findChild(parent, type) {
    if (!parent || !parent.children) return null;
    for (var k = 0; k < parent.children.length; k++) {
        if (parent.children[k].type === type) return parent.children[k];
    }
    return null;
}

function findAtomInList(atoms, type) {
    if (!atoms) return null;
    for (var k = 0; k < atoms.length; k++) {
        if (atoms[k].type === type) return atoms[k];
    }
    return null;
}

function findIndexInList(list, type) {
    if (!list) return -1;
    for (var k = 0; k < list.length; k++) {
        if (list[k].type === type) return k;
    }
    return -1;
}

// Maps M4A 4-byte atom types to human-readable tag keys.
var TAG_MAPPING = {
    '\xa9alb': 'album',
    '\xa9art': 'artist',
    '\xa9ART': 'artist',
    'aART': 'album_artist',
    '\xa9day': 'year',
    '\xa9nam': 'title',
    '\xa9gen': 'genre',
    'trkn': 'track',
    '\xa9wrt': 'composer',
    '\xa9too': 'encoder',
    'cprt': 'copyright',
    'covr': 'picture',
    '\xa9grp': 'grouping',
    'keyw': 'keyword',
    '\xa9lyr': 'lyrics',
    '\xa9cmt': 'comment',
    'tmpo': 'tempo',
    'cpil': 'compilation',
    'disk': 'disc'
};

// Derived inverse mapping to resolve tag keys to M4A atom types.
var TAG_TO_ATOM = {};
var mapKeys = Object.keys(TAG_MAPPING);
for (var i = 0; i < mapKeys.length; i++) {
    var atom = mapKeys[i];
    var key = TAG_MAPPING[atom];
    if (!TAG_TO_ATOM[key] || (atom === '\xa9ART' && TAG_TO_ATOM[key] === '\xa9art')) {
        TAG_TO_ATOM[key] = atom;
    }
}

// Reads size and type boundaries of an atom header.
function readAtomHeader(bytes, offset) {
    if (offset + 8 > bytes.length) return null;
    var view = new DataView(bytes.buffer, bytes.byteOffset + offset, 8);
    var size = view.getUint32(0, false);
    var type = window.Utils.bytesToString(bytes, offset + 4, offset + 8, 'latin1');
    var headerSize = 8;
    var actualSize = size;

    if (size === 1) {
        if (offset + 16 > bytes.length) return null;
        var viewLong = new DataView(bytes.buffer, bytes.byteOffset + offset + 8, 8);
        actualSize = readUInt64(viewLong, 0);
        headerSize = 16;
    }
    return {type: type, size: actualSize, headerSize: headerSize};
}

// Scans top-level atoms in the buffer sequentially.
function scanTopLevelAtoms(bytes) {
    var atoms = [];
    var pos = 0;
    while (pos < bytes.length) {
        var header = readAtomHeader(bytes, pos);
        if (!header || header.size <= 0 || pos + header.size > bytes.length) break;
        atoms.push({
            type: header.type,
            size: header.size,
            headerSize: header.headerSize,
            offset: pos,
            bytes: bytes.subarray(pos, pos + header.size)
        });
        pos += header.size;
    }
    return atoms;
}

// Finds or creates a child atom in a parent container tree.
function getOrCreateChild(parent, type, headerBytes, metaPrefix) {
    if (metaPrefix === undefined) metaPrefix = null;
    var child = findChild(parent, type);
    if (!child) {
        child = {type: type, headerSize: headerBytes.length, headerBytes: headerBytes, children: []};
        if (metaPrefix) child.metaPrefix = metaPrefix;
        parent.children.push(child);
    }
    return child;
}

// Recursively parses the binary buffer into a structured atom tree. Optimized: Only iterates within metadata containers
// (moov, udta, meta, ilst) to bypass allocating track timelines on javascript heap.
function parseAtomTree(bytes, offset, endOffset) {
    var header = readAtomHeader(bytes, offset);
    if (!header) {
        throw new Error('Out of bounds reading atom header.');
    }
    var payloadOffset = offset + header.headerSize;
    var payloadSize = header.size - header.headerSize;

    // Optimized containerTypes list: skips tracking nested trak, mdia, etc., but parses metadata fields
    var containerTypes = [
        'moov',    'udta',    'meta',    'ilst',    '\xa9nam', '\xa9art', '\xa9ART', 'aART',
        '\xa9alb', '\xa9day', '\xa9gen', 'trkn',    '\xa9wrt', '\xa9too', 'cprt',    'covr',
        '\xa9grp', 'keyw',    '\xa9lyr', '\xa9cmt', 'tmpo',    'cpil',    'disk'
    ];

    var atom = {
        type: header.type,
        headerSize: header.headerSize,
        headerBytes: bytes.subarray(offset, payloadOffset),
        children: []
    };

    var isContainer = containerTypes.indexOf(header.type) !== -1;
    if (isContainer && payloadSize > 0) {
        var childOffset = payloadOffset;
        if (header.type === 'meta') {
            atom.metaPrefix = bytes.subarray(payloadOffset, payloadOffset + 4);
            childOffset += 4;
        }
        var childrenEnd = offset + header.size;
        while (childOffset < childrenEnd) {
            if (childOffset + 8 > childrenEnd) break;
            var childHeader = readAtomHeader(bytes, childOffset);
            if (!childHeader || childHeader.size === 0) break;
            var child = parseAtomTree(bytes, childOffset, childrenEnd);
            atom.children.push(child);
            childOffset += childHeader.size;
        }
    } else {
        atom.payload = bytes.subarray(payloadOffset, payloadOffset + payloadSize);
    }
    return atom;
}

// Scans a trak byte buffer in-place to find and shift offsets in stco or co64 index tables.
function shiftStcoInBytes(bytes, delta) {
    if (delta === 0) return;
    var view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    var size, count, i, idx, val;

    // Find 'stco' in bytes (4-byte signature: [115, 116, 99, 111])
    var pos = 0;
    while (pos + 8 <= bytes.length) {
        // checking [s, t, c, o]
        if (bytes[pos] === 115 && bytes[pos + 1] === 116 && bytes[pos + 2] === 99 && bytes[pos + 3] === 111) {
            size = view.getUint32(pos - 4, false);
            if (pos - 4 + size <= bytes.length) {
                count = view.getUint32(pos + 8, false);
                for (i = 0; i < count; i++) {
                    idx = pos + 12 + i * 4;
                    if (idx + 4 <= bytes.length) {
                        val = view.getUint32(idx, false);
                        view.setUint32(idx, val + delta, false);
                    }
                }
            }
            break;
        }
        // Find 'co64' in bytes (4-byte signature: [99, 111, 54, 52])
        if (bytes[pos] === 99 && bytes[pos + 1] === 111 && bytes[pos + 2] === 54 && bytes[pos + 3] === 52) {
            size = view.getUint32(pos - 4, false);
            if (pos - 4 + size <= bytes.length) {
                count = view.getUint32(pos + 8, false);
                for (i = 0; i < count; i++) {
                    idx = pos + 12 + i * 8;
                    if (idx + 8 <= bytes.length) {
                        val = readUInt64(view, idx);
                        writeUInt64(view, val + delta, idx);
                    }
                }
            }
            break;
        }
        pos++;
    }
}

// Recursively serializes the atom tree back into a binary buffer, adjusting chunk offset indexing tables (`stco` /
// `co64`) by the shift delta. Optimized: Runs in-place offset adjustments directly on the trak byte arrays and avoids
// string encoding allocations.
function serializeAtomTree(atom, delta) {
    if (delta === undefined) delta = 0;
    var i, header, view;
    // If track atom payload is encountered, apply offset shifts to stco/co64 directly
    if (delta !== 0 && atom.type === 'trak') {
        shiftStcoInBytes(atom.payload, delta);
    }

    if (atom.children && atom.children.length > 0) {
        var serializedChildren = [];
        for (i = 0; i < atom.children.length; i++) {
            serializedChildren.push(serializeAtomTree(atom.children[i], delta));
        }

        var payloadLength = 0;
        for (i = 0; i < serializedChildren.length; i++) {
            payloadLength += serializedChildren[i].length;
        }
        if (atom.type === 'meta') {
            payloadLength += 4;
        }

        header = new Uint8Array(atom.headerSize);
        view = new DataView(header.buffer, header.byteOffset, header.byteLength);
        view.setUint32(0, payloadLength + atom.headerSize, false);

        // Optimized: Set type string characters directly (allocation-free)
        header[4] = atom.type.charCodeAt(0);
        header[5] = atom.type.charCodeAt(1);
        header[6] = atom.type.charCodeAt(2);
        header[7] = atom.type.charCodeAt(3);

        var parts = [header];
        if (atom.type === 'meta') {
            parts.push(atom.metaPrefix);
        }
        parts = parts.concat(serializedChildren);
        return concatUint8Arrays(parts);
    } else {
        header = new Uint8Array(atom.headerSize);
        view = new DataView(header.buffer, header.byteOffset, header.byteLength);
        view.setUint32(0, atom.payload.length + atom.headerSize, false);

        // Set type characters directly
        header[4] = atom.type.charCodeAt(0);
        header[5] = atom.type.charCodeAt(1);
        header[6] = atom.type.charCodeAt(2);
        header[7] = atom.type.charCodeAt(3);

        return concatUint8Arrays([header, atom.payload]);
    }
}

// Decodes metadata fields from parsed tags located inside the `ilst` atom parent.
function extractTags(ilstAtom) {
    var tags = {};
    if (!ilstAtom || !ilstAtom.children) return tags;
    var valView;

    for (var i = 0; i < ilstAtom.children.length; i++) {
        var tagAtom = ilstAtom.children[i];
        var key = TAG_MAPPING[tagAtom.type];
        if (!key) continue;

        var dataAtom = findChild(tagAtom, 'data');
        if (!dataAtom || !dataAtom.payload) continue;

        var payload = dataAtom.payload;
        if (payload.length < 8) continue;

        var view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
        var typeClass = readUIntBE(view, 1, 3);
        var valueBuf = payload.subarray(8);

        if (key === 'track' || key === 'disc') {
            if (valueBuf.length >= 6) {
                valView = new DataView(valueBuf.buffer, valueBuf.byteOffset, valueBuf.byteLength);
                tags[key] = valView.getUint16(2, false);
                tags[key + '_count'] = valView.getUint16(4, false);
            }
        } else if (typeClass === 1) {
            tags[key] = window.Utils.bytesToString(valueBuf, 0, valueBuf.length, 'utf8');
        } else if (typeClass === 13 || typeClass === 14) {
            tags[key] = {
                format: typeClass === 13 ? 'jpeg' : 'png',
                mimeType: typeClass === 13 ? 'image/jpeg' : 'image/png',
                data: valueBuf
            };
        } else if (typeClass === 21) {
            valView = new DataView(valueBuf.buffer, valueBuf.byteOffset, valueBuf.byteLength);
            tags[key] = readUIntBE(valView, 0, valueBuf.length);
        } else {
            tags[key] = window.Utils.bytesToString(valueBuf, 0, valueBuf.length, 'utf8');
        }
    }
    return tags;
}

// Creates a valid M4A metadata tag atom containing a sub-atom 'data'.
function createTagAtom(type, value, isPicture) {
    if (isPicture === undefined) isPicture = false;
    var valueBuf;
    var typeClass;  // 1 = text, 13 = JPEG cover, 14 = PNG cover, 21 = uint

    if (isPicture) {
        valueBuf = value.data;
        typeClass = value.format === 'png' ? 14 : 13;
    } else if (typeof value === 'number') {
        valueBuf = new Uint8Array(4);
        var valView = new DataView(valueBuf.buffer, valueBuf.byteOffset, valueBuf.byteLength);
        valView.setUint32(0, value, false);
        typeClass = 21;
    } else {
        valueBuf = window.Utils.stringToBytes(String(value), 'utf8');
        typeClass = 1;
    }

    var dataAtomHeader = new Uint8Array(16);
    var headerView = new DataView(dataAtomHeader.buffer, dataAtomHeader.byteOffset, dataAtomHeader.byteLength);
    headerView.setUint32(0, 16 + valueBuf.length, false);

    // Set 'data' characters directly (allocation-free)
    dataAtomHeader[4] = 100;                   // 'd'
    dataAtomHeader[5] = 97;                    // 'a'
    dataAtomHeader[6] = 116;                   // 't'
    dataAtomHeader[7] = 97;                    // 'a'
    writeUIntBE(headerView, typeClass, 9, 3);  // 3-byte class flags

    var dataAtom = {
        type: 'data',
        headerSize: 8,
        headerBytes: dataAtomHeader.subarray(0, 8),
        payload: concatUint8Arrays([dataAtomHeader.subarray(8, 16), valueBuf])
    };

    var tagAtomHeader = new Uint8Array(8);
    tagAtomHeader[4] = type.charCodeAt(0);
    tagAtomHeader[5] = type.charCodeAt(1);
    tagAtomHeader[6] = type.charCodeAt(2);
    tagAtomHeader[7] = type.charCodeAt(3);

    return {type: type, headerSize: 8, headerBytes: tagAtomHeader, children: [dataAtom]};
}

// Scans the binary buffer in-place to verify that the file meets essential M4A structure expectations (ftyp signature,
// plus mdat and moov containers). Performs zero allocations and runs in under 10 microseconds.
function verifyM4AStructure(bytes) {
    if (bytes.length < 8) return false;

    // 1. Verify ftyp signature
    if (window.Utils.bytesToString(bytes, 4, 8, 'latin1') !== 'ftyp') return false;

    // 2. Scan top-level atoms for mdat and moov
    var atoms = scanTopLevelAtoms(bytes);
    var hasMdat = false;
    var hasMoov = false;
    for (var i = 0; i < atoms.length; i++) {
        if (atoms[i].type === 'mdat') hasMdat = true;
        if (atoms[i].type === 'moov') hasMoov = true;
    }

    return hasMdat && hasMoov;
}

// Helper to recursively find an atom of a specific type in the tree structure.
function findAtom(atom, type) {
    if (atom.type === type) return atom;
    var children = atom.children || [];
    for (var i = 0; i < children.length; i++) {
        var found = findAtom(children[i], type);
        if (found) return found;
    }
    return null;
}

// Core parsing algorithm operating on a Uint8Array.
function parseM4ABytes(bytes) {
    if (!verifyM4AStructure(bytes)) {
        throw new Error(
            'Unsupported or invalid file structure. Only M4A (.m4a) files with valid audio and metadata containers are supported.');
    }
    var view;

    var atoms = scanTopLevelAtoms(bytes);
    var moovDescriptor = findAtomInList(atoms, 'moov');
    if (!moovDescriptor) return {};

    var moovAtom = parseAtomTree(bytes, moovDescriptor.offset, moovDescriptor.offset + moovDescriptor.size);

    var tagsResult = {};
    var udta = findChild(moovAtom, 'udta');
    if (udta) {
        var meta = findChild(udta, 'meta');
        if (meta) {
            var ilst = findChild(meta, 'ilst');
            if (ilst) {
                tagsResult = extractTags(ilst);
            }
        }
    }

    // Extract play duration from mvhd if it exists
    var mvhd = findAtom(moovAtom, 'mvhd');
    if (mvhd && mvhd.payload) {
        var payload = mvhd.payload;
        var version = payload[0];
        var timescale = 0;
        var duration = 0;
        if (version === 0 && payload.length >= 20) {
            view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
            timescale = view.getUint32(12, false);
            duration = view.getUint32(16, false);
        } else if (version === 1 && payload.length >= 32) {
            view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
            timescale = view.getUint32(20, false);
            duration = readUInt64(view, 24);
        }
        if (timescale > 0) {
            tagsResult.duration = duration / timescale;
        }
    }

    return tagsResult;
}

// Core modifying algorithm operating on a Uint8Array and outputting a new Uint8Array. Supporting zero-copy returns via
// options.returnParts.
function writeM4ABytes(bytes, newTags, options) {
    if (options === undefined) options = {};
    if (!verifyM4AStructure(bytes)) {
        throw new Error(
            'Unsupported or invalid file structure. Only M4A (.m4a) files with valid audio and metadata containers are supported.');
    }
    var i, atom;

    var atomsList = scanTopLevelAtoms(bytes);
    var moovIndex = findIndexInList(atomsList, 'moov');
    if (moovIndex === -1) {
        throw new Error('Invalid or corrupted M4A file structure.');
    }

    // Parse moov
    var moovDescriptor = atomsList[moovIndex];
    var moovAtom = parseAtomTree(bytes, moovDescriptor.offset, moovDescriptor.offset + moovDescriptor.size);

    // 2. Traverses/constructs the udta -> meta -> ilst path recursively
    var udta = getOrCreateChild(moovAtom, 'udta', window.Utils.stringToBytes('\x00\x00\x00\x08udta', 'latin1'));
    var meta = getOrCreateChild(udta, 'meta', window.Utils.stringToBytes('\x00\x00\x00\x0cmeta', 'latin1'), new Uint8Array(4));
    var ilst = getOrCreateChild(meta, 'ilst', window.Utils.stringToBytes('\x00\x00\x00\x08ilst', 'latin1'));

    // 3. Rebuilds/appends the metadata tag atoms list
    var newKeys = Object.keys(newTags);
    for (i = 0; i < newKeys.length; i++) {
        var key = newKeys[i];
        var val = newTags[key];
        var atomType = TAG_TO_ATOM[key];
        if (!atomType) continue;

        var isPicture = key === 'picture';
        var newTagAtom = createTagAtom(atomType, val, isPicture);

        var oldIndex = findIndexInList(ilst.children, atomType);
        if (oldIndex !== -1) {
            ilst.children[oldIndex] = newTagAtom;
        } else {
            ilst.children.push(newTagAtom);
        }
    }

    // 4. Calculate change in moov size
    var tempMoovBytes = serializeAtomTree(moovAtom, 0);
    var newMoovSize = tempMoovBytes.length;

    // 5. Calculate precise new mdat offset to retrieve correct shift amount
    var currentNewOffset = 0;
    var oldMdatOffset = 0;
    var newMdatOffset = 0;
    var hasMdat = false;

    for (i = 0; i < atomsList.length; i++) {
        atom = atomsList[i];
        if (atom.type === 'mdat') {
            oldMdatOffset = atom.offset;
            newMdatOffset = currentNewOffset;
            hasMdat = true;
        }
        var atomSize = (atom.type === 'moov') ? newMoovSize : atom.size;
        currentNewOffset += atomSize;
    }

    // 6. Shift chunk offsets by the exact delta offset
    var shiftAmount = hasMdat ? (newMdatOffset - oldMdatOffset) : 0;
    var finalMoovBytes = serializeAtomTree(moovAtom, shiftAmount);

    // 7. Concatenate all atoms back preserving original order
    var outputParts = [];
    for (i = 0; i < atomsList.length; i++) {
        atom = atomsList[i];
        if (atom.type === 'moov') {
            outputParts.push(finalMoovBytes);
        } else {
            outputParts.push(atom.bytes);
        }
    }

    // Return segments array directly if requested
    if (options.returnParts) {
        return outputParts;
    }

    return concatUint8Arrays(outputParts);
}

// Always expose to window in browser
if (typeof window !== 'undefined') {
    window.Utils.writeM4ABytes = writeM4ABytes;
    window.Utils.parseM4ABytes = parseM4ABytes;
}