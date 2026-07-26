// ui/js/core/download-helper.js

window.Utils = window.Utils || {};

/**
 * Trigger a file download in the browser
 */
window.Utils.downloadFile = function(data, filename) {
    var blob = new Blob([data], { type: 'audio/mp4' });
    var blobUrl = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    
    setTimeout(function() {
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
    }, 5000);
    
    return true;
};

/**
 * Build a filename from song metadata
 */
window.Utils.buildFilename = function(song, quality) {
    var artist = song.primary_artist || 'Unknown Artist';
    var safeTitle = (song.title || 'song').replace(/[^a-zA-Z0-9\s-]/g, '').trim();
    var safeArtist = artist.replace(/[^a-zA-Z0-9\s-]/g, '').trim();
    var filename = safeTitle + ' - ' + safeArtist;
    if (quality) {
        filename += ' (' + quality + ')';
    }
    return filename + '.m4a';
};


/**
 * Build metadata object for M4A
 */
window.Utils.buildMetadata = function(song, albumArt, lyrics) {
    var allArtists = song.all_artists || song.subtitle || '';

    var metadata = {
        title: song.title || '',
        artist: allArtists,
        album: song.album || '',
        year: song.year || '',
        genre: song.language || '',
        copyright: song.copyright || '',
        comment: 'ID: ' + (song.token || ''),
        album_artist: allArtists,
    };
    
    if (albumArt && albumArt.data && albumArt.data.length > 0) {
        metadata.picture = albumArt;
    }

    if (lyrics) {
        metadata.lyrics = lyrics;
    }

    return metadata;
};

console.log('[Utils] Download helper loaded');
