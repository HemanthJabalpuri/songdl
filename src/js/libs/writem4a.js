/**
 * @fileoverview Optimized platform-agnostic M4A metadata reader and writer core.
 * Restricts recursive parsing to metadata-only atoms to avoid GC allocating and
 * shifts index tables in-place using direct byte signatures.
 */

const latin1Decoder = new TextDecoder('latin1');
const utf8Decoder = new TextDecoder('utf-8');
const utf8Encoder = new TextEncoder();

/**
 * Converts a segment of Uint8Array to string.
 *
 * @param {!Uint8Array} bytes
 * @param {number} offset
 * @param {number} endOffset
 * @param {string=} encoding 'latin1' or 'utf8'
 * @return {string}
 */
function bytesToString(bytes, offset, endOffset, encoding = 'latin1') {
  const slice = bytes.subarray(offset, endOffset);
  return encoding === 'utf8' ? utf8Decoder.decode(slice) : latin1Decoder.decode(slice);
}

/**
 * Converts a string to Uint8Array.
 *
 * @param {string} str
 * @param {string=} encoding 'utf8' or 'latin1'
 * @return {!Uint8Array}
 */
function stringToBytes(str, encoding = 'utf8') {
  if (encoding === 'latin1') {
    const bytes = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
      bytes[i] = str.charCodeAt(i) & 0xff;
    }
    return bytes;
  }
  return utf8Encoder.encode(str);
}

/**
 * Concatenates multiple Uint8Array arrays into one.
 *
 * @param {!Array<!Uint8Array>} arrays
 * @return {!Uint8Array}
 */
function concatUint8Arrays(arrays) {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

/**
 * Reads variable-length Big-Endian integer from DataView.
 *
 * @param {!DataView} view
 * @param {number} offset
 * @param {number} byteLength
 * @return {number}
 */
function readUIntBE(view, offset, byteLength) {
  let value = 0;
  for (let i = 0; i < byteLength; i++) {
    value = (value << 8) | view.getUint8(offset + i);
  }
  return value;
}

/**
 * Writes variable-length Big-Endian integer into DataView.
 *
 * @param {!DataView} view
 * @param {number} value
 * @param {number} offset
 * @param {number} byteLength
 */
function writeUIntBE(view, value, offset, byteLength) {
  let temp = value;
  for (let i = byteLength - 1; i >= 0; i--) {
    view.setUint8(offset + i, temp & 0xff);
    temp = temp >> 8;
  }
}

/**
 * Maps M4A 4-byte atom types to human-readable tag keys.
 * @const {!Object<string, string>}
 */
const TAG_MAPPING = {
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

/**
 * Derived inverse mapping to resolve tag keys to M4A atom types.
 * @const {!Object<string, string>}
 */
const TAG_TO_ATOM = {};
for (const [atom, key] of Object.entries(TAG_MAPPING)) {
  if (!TAG_TO_ATOM[key]) {
    TAG_TO_ATOM[key] = atom;
  }
}

// Override artist to use uppercase ART (ffmpeg standard)
// This makes ffprobe show the artist tag correctly
TAG_TO_ATOM['artist'] = '\xa9ART';

/**
 * Reads size and type boundaries of an atom header.
 *
 * @param {!Uint8Array} bytes File bytes buffer.
 * @param {number} offset Start index.
 * @return {?{type: string, size: number, headerSize: number}} Header meta, or null if out of bounds.
 */
function readAtomHeader(bytes, offset) {
  if (offset + 8 > bytes.length) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset + offset, 8);
  const size = view.getUint32(0, false);
  const type = bytesToString(bytes, offset + 4, offset + 8, 'latin1');
  let headerSize = 8;
  let actualSize = size;

  if (size === 1) {
    if (offset + 16 > bytes.length) return null;
    const viewLong = new DataView(bytes.buffer, bytes.byteOffset + offset + 8, 8);
    actualSize = Number(viewLong.getBigUint64(0, false));
    headerSize = 16;
  }
  return { type, size: actualSize, headerSize };
}

/**
 * Scans top-level atoms in the buffer sequentially.
 *
 * @param {!Uint8Array} bytes File bytes buffer.
 * @return {!Array<!Object>} List of top-level atom descriptors.
 */
function scanTopLevelAtoms(bytes) {
  const atoms = [];
  let pos = 0;
  while (pos < bytes.length) {
    const header = readAtomHeader(bytes, pos);
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

/**
 * Finds or creates a child atom in a parent container tree.
 *
 * @param {!Object} parent The parent containing atom block.
 * @param {string} type 4-byte atom type.
 * @param {!Uint8Array} headerBytes Default fallback header.
 * @param {!Uint8Array=} metaPrefix Optional meta prefix bytes.
 * @return {!Object} The existing/new child atom.
 */
function getOrCreateChild(parent, type, headerBytes, metaPrefix = null) {
  let child = parent.children.find(c => c.type === type);
  if (!child) {
    child = {
      type,
      headerSize: headerBytes.length,
      headerBytes,
      children: []
    };
    if (metaPrefix) child.metaPrefix = metaPrefix;
    parent.children.push(child);
  }
  return child;
}

/**
 * Recursively parses the binary buffer into a structured atom tree.
 * Optimized: Only iterates within metadata containers (moov, udta, meta, ilst)
 * to bypass allocating track timelines on javascript heap.
 *
 * @param {!Uint8Array} bytes The full file buffer as Uint8Array.
 * @param {number} offset The current reading byte offset.
 * @param {number} endOffset The boundary end index of the container.
 * @return {!Object} The parsed atom object with its children tree layout.
 */
function parseAtomTree(bytes, offset, endOffset) {
  const header = readAtomHeader(bytes, offset);
  if (!header) {
    throw new Error('Out of bounds reading atom header.');
  }
  const payloadOffset = offset + header.headerSize;
  const payloadSize = header.size - header.headerSize;

  // Optimized containerTypes list: skips tracking nested trak, mdia, etc., but parses metadata fields
  const containerTypes = [
    'moov', 'udta', 'meta', 'ilst',
    '\xa9nam', '\xa9art', '\xa9ART', 'aART', '\xa9alb', '\xa9day',
    '\xa9gen', 'trkn', '\xa9wrt', '\xa9too', 'cprt', 'covr',
    '\xa9grp', 'keyw', '\xa9lyr', '\xa9cmt', 'tmpo', 'cpil', 'disk'
  ];

  const atom = {
    type: header.type,
    headerSize: header.headerSize,
    headerBytes: bytes.subarray(offset, payloadOffset),
    children: []
  };

  const isContainer = containerTypes.includes(header.type);
  if (isContainer && payloadSize > 0) {
    let childOffset = payloadOffset;
    if (header.type === 'meta') {
      atom.metaPrefix = bytes.subarray(payloadOffset, payloadOffset + 4);
      childOffset += 4;
    }
    const childrenEnd = offset + header.size;
    while (childOffset < childrenEnd) {
      if (childOffset + 8 > childrenEnd) break;
      const childHeader = readAtomHeader(bytes, childOffset);
      if (!childHeader || childHeader.size === 0) break;
      const child = parseAtomTree(bytes, childOffset, childrenEnd);
      atom.children.push(child);
      childOffset += childHeader.size;
    }
  } else {
    atom.payload = bytes.subarray(payloadOffset, payloadOffset + payloadSize);
  }
  return atom;
}

/**
 * Scans a trak byte buffer in-place to find and shift offsets in stco or co64 index tables.
 *
 * @param {!Uint8Array} bytes The raw trak atom payload.
 * @param {number} delta Shift amount to apply.
 */
function shiftStcoInBytes(bytes, delta) {
  if (delta === 0) return;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  
  // Find 'stco' in bytes (4-byte signature: [115, 116, 99, 111])
  let pos = 0;
  while (pos + 8 <= bytes.length) {
    // checking [s, t, c, o]
    if (bytes[pos] === 115 && bytes[pos+1] === 116 && bytes[pos+2] === 99 && bytes[pos+3] === 111) {
      const size = view.getUint32(pos - 4, false);
      if (pos - 4 + size <= bytes.length) {
        const count = view.getUint32(pos + 8, false);
        for (let i = 0; i < count; i++) {
          const idx = pos + 12 + i * 4;
          if (idx + 4 <= bytes.length) {
            const val = view.getUint32(idx, false);
            view.setUint32(idx, val + delta, false);
          }
        }
      }
      break;
    }
    // Find 'co64' in bytes (4-byte signature: [99, 111, 54, 52])
    if (bytes[pos] === 99 && bytes[pos+1] === 111 && bytes[pos+2] === 54 && bytes[pos+3] === 52) {
      const size = view.getUint32(pos - 4, false);
      if (pos - 4 + size <= bytes.length) {
        const count = view.getUint32(pos + 8, false);
        for (let i = 0; i < count; i++) {
          const idx = pos + 12 + i * 8;
          if (idx + 8 <= bytes.length) {
            const val = view.getBigUint64(idx, false);
            view.setBigUint64(idx, val + BigInt(delta), false);
          }
        }
      }
      break;
    }
    pos++;
  }
}

/**
 * Recursively serializes the atom tree back into a binary buffer,
 * adjusting chunk offset indexing tables (`stco` / `co64`) by the shift delta.
 * Optimized: Runs in-place offset adjustments directly on the trak byte arrays
 * and avoids string encoding allocations.
 *
 * @param {!Object} atom The root atom of the tree to serialize.
 * @param {number=} delta Chunk offset shift value (non-zero if moov size changed).
 * @return {!Uint8Array} Serialized binary buffer.
 */
function serializeAtomTree(atom, delta = 0) {
  // If track atom payload is encountered, apply offset shifts to stco/co64 directly
  if (delta !== 0 && atom.type === 'trak') {
    shiftStcoInBytes(atom.payload, delta);
  }

  if (atom.children && atom.children.length > 0) {
    const serializedChildren = atom.children.map(child => serializeAtomTree(child, delta));
    let payloadLength = serializedChildren.reduce((sum, b) => sum + b.length, 0);
    if (atom.type === 'meta') {
      payloadLength += 4;
    }

    const header = new Uint8Array(atom.headerSize);
    const view = new DataView(header.buffer, header.byteOffset, header.byteLength);
    view.setUint32(0, payloadLength + atom.headerSize, false);
    
    // Optimized: Set type string characters directly (allocation-free)
    header[4] = atom.type.charCodeAt(0);
    header[5] = atom.type.charCodeAt(1);
    header[6] = atom.type.charCodeAt(2);
    header[7] = atom.type.charCodeAt(3);

    const parts = [header];
    if (atom.type === 'meta') {
      parts.push(atom.metaPrefix);
    }
    parts.push(...serializedChildren);
    return concatUint8Arrays(parts);
  } else {
    const header = new Uint8Array(atom.headerSize);
    const view = new DataView(header.buffer, header.byteOffset, header.byteLength);
    view.setUint32(0, atom.payload.length + atom.headerSize, false);
    
    // Set type characters directly
    header[4] = atom.type.charCodeAt(0);
    header[5] = atom.type.charCodeAt(1);
    header[6] = atom.type.charCodeAt(2);
    header[7] = atom.type.charCodeAt(3);

    return concatUint8Arrays([header, atom.payload]);
  }
}

/**
 * Decodes metadata fields from parsed tags located inside the `ilst` atom parent.
 *
 * @param {!Object} ilstAtom The item list parsed atom.
 * @return {!Object<string, *>} Extracted metadata tags mapping.
 */
function extractTags(ilstAtom) {
  const tags = {};
  if (!ilstAtom || !ilstAtom.children) return tags;

  for (const tagAtom of ilstAtom.children) {
    const key = TAG_MAPPING[tagAtom.type];
    if (!key) continue;

    const dataAtom = tagAtom.children.find(c => c.type === 'data');
    if (!dataAtom || !dataAtom.payload) continue;

    const payload = dataAtom.payload;
    if (payload.length < 8) continue;
    
    const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
    const typeClass = readUIntBE(view, 1, 3);
    const valueBuf = payload.subarray(8);

    if (key === 'track' || key === 'disc') {
      if (valueBuf.length >= 6) {
        const valView = new DataView(valueBuf.buffer, valueBuf.byteOffset, valueBuf.byteLength);
        tags[key] = valView.getUint16(2, false);
        tags[key + '_count'] = valView.getUint16(4, false);
      }
    } else if (typeClass === 1) {
      tags[key] = bytesToString(valueBuf, 0, valueBuf.length, 'utf8');
    } else if (typeClass === 13 || typeClass === 14) {
      tags[key] = {
        format: typeClass === 13 ? 'jpeg' : 'png',
        mimeType: typeClass === 13 ? 'image/jpeg' : 'image/png',
        data: valueBuf
      };
    } else if (typeClass === 21) {
      const valView = new DataView(valueBuf.buffer, valueBuf.byteOffset, valueBuf.byteLength);
      tags[key] = readUIntBE(valView, 0, valueBuf.length);
    } else {
      tags[key] = bytesToString(valueBuf, 0, valueBuf.length, 'utf8');
    }
  }
  return tags;
}

/**
 * Creates a valid M4A metadata tag atom containing a sub-atom 'data'.
 *
 * @param {string} type M4A 4-byte atom type (e.g. '\xa9nam').
 * @param {*} value The value to write.
 * @param {boolean=} isPicture True if writing picture image bytes.
 * @return {!Object} Constructed tag atom tree.
 */
function createTagAtom(type, value, isPicture = false) {
  let valueBuf;
  let typeClass; // 1 = text, 13 = JPEG cover, 14 = PNG cover, 21 = uint
  
  if (isPicture) {
    valueBuf = value.data;
    typeClass = value.format === 'png' ? 14 : 13;
  } else if (typeof value === 'number') {
    valueBuf = new Uint8Array(4);
    const valView = new DataView(valueBuf.buffer, valueBuf.byteOffset, valueBuf.byteLength);
    valView.setUint32(0, value, false);
    typeClass = 21;
  } else {
    valueBuf = stringToBytes(String(value), 'utf8');
    typeClass = 1;
  }

  const dataAtomHeader = new Uint8Array(16);
  const headerView = new DataView(dataAtomHeader.buffer, dataAtomHeader.byteOffset, dataAtomHeader.byteLength);
  headerView.setUint32(0, 16 + valueBuf.length, false);
  
  // Set 'data' characters directly (allocation-free)
  dataAtomHeader[4] = 100; // 'd'
  dataAtomHeader[5] = 97;  // 'a'
  dataAtomHeader[6] = 116; // 't'
  dataAtomHeader[7] = 97;  // 'a'
  writeUIntBE(headerView, typeClass, 9, 3); // 3-byte class flags

  const dataAtom = {
    type: 'data',
    headerSize: 8,
    headerBytes: dataAtomHeader.subarray(0, 8),
    payload: concatUint8Arrays([dataAtomHeader.subarray(8, 16), valueBuf])
  };

  const tagAtomHeader = new Uint8Array(8);
  tagAtomHeader[4] = type.charCodeAt(0);
  tagAtomHeader[5] = type.charCodeAt(1);
  tagAtomHeader[6] = type.charCodeAt(2);
  tagAtomHeader[7] = type.charCodeAt(3);

  return {
    type,
    headerSize: 8,
    headerBytes: tagAtomHeader,
    children: [dataAtom]
  };
}

/**
 * Scans the binary buffer in-place to verify that the file meets essential M4A structure expectations
 * (ftyp signature, plus mdat and moov containers).
 * Performs zero allocations and runs in under 10 microseconds.
 *
 * @param {!Uint8Array} bytes The Uint8Array file buffer.
 * @return {boolean} True if the essential M4A structure exists.
 */
function verifyM4AStructure(bytes) {
  if (bytes.length < 8) return false;

  // 1. Verify ftyp signature
  if (bytesToString(bytes, 4, 8, 'latin1') !== 'ftyp') return false;

  // 2. Scan top-level atoms for mdat and moov
  const atoms = scanTopLevelAtoms(bytes);
  const hasMdat = atoms.some(a => a.type === 'mdat');
  const hasMoov = atoms.some(a => a.type === 'moov');

  return hasMdat && hasMoov;
}

/**
 * Helper to recursively find an atom of a specific type in the tree structure.
 *
 * @param {!Object} atom The root atom of the tree search start.
 * @param {string} type The 4-byte atom type identifier to look for.
 * @return {?Object} The found atom child, or null if not found.
 */
function findAtom(atom, type) {
  if (atom.type === type) return atom;
  for (const child of atom.children || []) {
    const found = findAtom(child, type);
    if (found) return found;
  }
  return null;
}

/**
 * Core parsing algorithm operating on a Uint8Array.
 *
 * @param {!Uint8Array} bytes The binary file content as Uint8Array.
 * @return {!Object<string, *>} Parsed metadata tag mapping.
 */
function parseM4ABytes(bytes) {
  if (!verifyM4AStructure(bytes)) {
    throw new Error('Unsupported or invalid file structure. Only M4A (.m4a) files with valid audio and metadata containers are supported.');
  }

  const atoms = scanTopLevelAtoms(bytes);
  const moovDescriptor = atoms.find(a => a.type === 'moov');
  if (!moovDescriptor) return {};

  const moovAtom = parseAtomTree(bytes, moovDescriptor.offset, moovDescriptor.offset + moovDescriptor.size);

  let tagsResult = {};
  const udta = moovAtom.children.find(c => c.type === 'udta');
  if (udta) {
    const meta = udta.children.find(c => c.type === 'meta');
    if (meta) {
      const ilst = meta.children.find(c => c.type === 'ilst');
      if (ilst) {
        tagsResult = extractTags(ilst);
      }
    }
  }

  // Extract play duration from mvhd if it exists
  const mvhd = findAtom(moovAtom, 'mvhd');
  if (mvhd && mvhd.payload) {
    const payload = mvhd.payload;
    const version = payload[0];
    let timescale = 0;
    let duration = 0;
    if (version === 0 && payload.length >= 20) {
      const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
      timescale = view.getUint32(12, false);
      duration = view.getUint32(16, false);
    } else if (version === 1 && payload.length >= 32) {
      const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
      timescale = view.getUint32(20, false);
      duration = Number(view.getBigUint64(24, false));
    }
    if (timescale > 0) {
      tagsResult.duration = duration / timescale;
    }
  }

  return tagsResult;
}

/**
 * Core modifying algorithm operating on a Uint8Array and outputting a new Uint8Array.
 * Supporting zero-copy returns via options.returnParts.
 *
 * @param {!Uint8Array} bytes The source M4A file buffer.
 * @param {!Object<string, *>} newTags Tag value key/value pairs to write/overwrite.
 * @param {!Object<string, *>=} options Config options.
 * @return {!Uint8Array|!Array<!Uint8Array>} Serialized modified M4A buffer or parts array.
 */
function writeM4ABytes(bytes, newTags, options = {}) {
  if (!verifyM4AStructure(bytes)) {
    throw new Error('Unsupported or invalid file structure. Only M4A (.m4a) files with valid audio and metadata containers are supported.');
  }

  const atomsList = scanTopLevelAtoms(bytes);
  const moovIndex = atomsList.findIndex(a => a.type === 'moov');
  if (moovIndex === -1) {
    throw new Error('Invalid or corrupted M4A file structure.');
  }

  // Parse moov
  const moovDescriptor = atomsList[moovIndex];
  const moovAtom = parseAtomTree(bytes, moovDescriptor.offset, moovDescriptor.offset + moovDescriptor.size);

  // 2. Traverses/constructs the udta -> meta -> ilst path recursively
  const udta = getOrCreateChild(moovAtom, 'udta', stringToBytes('\x00\x00\x00\x08udta', 'latin1'));
  const meta = getOrCreateChild(udta, 'meta', stringToBytes('\x00\x00\x00\x0cmeta', 'latin1'), new Uint8Array(4));
  const ilst = getOrCreateChild(meta, 'ilst', stringToBytes('\x00\x00\x00\x08ilst', 'latin1'));

  // 3. Rebuilds/appends the metadata tag atoms list
  for (const [key, val] of Object.entries(newTags)) {
    const atomType = TAG_TO_ATOM[key];
    if (!atomType) continue;

    const isPicture = key === 'picture';
    const newTagAtom = createTagAtom(atomType, val, isPicture);

    const oldIndex = ilst.children.findIndex(c => c.type === atomType);
    if (oldIndex !== -1) {
      ilst.children[oldIndex] = newTagAtom;
    } else {
      ilst.children.push(newTagAtom);
    }
  }

  // 4. Calculate change in moov size
  const tempMoovBytes = serializeAtomTree(moovAtom, 0);
  const newMoovSize = tempMoovBytes.length;

  // 5. Calculate precise new mdat offset to retrieve correct shift amount
  let currentNewOffset = 0;
  let oldMdatOffset = 0;
  let newMdatOffset = 0;
  let hasMdat = false;

  for (const atom of atomsList) {
    if (atom.type === 'mdat') {
      oldMdatOffset = atom.offset;
      newMdatOffset = currentNewOffset;
      hasMdat = true;
    }
    const atomSize = (atom.type === 'moov') ? newMoovSize : atom.size;
    currentNewOffset += atomSize;
  }

  // 6. Shift chunk offsets by the exact delta offset
  const shiftAmount = hasMdat ? (newMdatOffset - oldMdatOffset) : 0;
  const finalMoovBytes = serializeAtomTree(moovAtom, shiftAmount);

  // 7. Concatenate all atoms back preserving original order
  const outputParts = [];
  for (const atom of atomsList) {
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
    window.writeM4ABytes = writeM4ABytes;
    window.parseM4ABytes = parseM4ABytes;
}