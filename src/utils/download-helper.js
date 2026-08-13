// src/js/utils/download-helper.js
// Trigger a file download in the browser
window.Utils.downloadFile = function(data, filename) {
    var blob = new Blob([data], {type: 'audio/mp4'});
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

// Build a filename from song metadata
window.Utils.buildFilename = function(song, quality) {
    var artists = window.Utils.formatters.extractArtists(song);
    var artist = artists.primaryArtist || song.subtitle || 'Unknown Artist';
    var safeTitle = (song.title || 'song').replace(/[^a-zA-Z0-9\s-]/g, '').trim();
    var safeArtist = artist.replace(/[^a-zA-Z0-9\s-]/g, '').trim();
    var filename = safeTitle + ' - ' + safeArtist;
    if (quality) {
        filename += ' (' + quality + ')';
    }
    return filename + '.m4a';
};


// Build metadata object for M4A
window.Utils.buildMetadata = function(song, albumArt, lyrics) {
    var artists = window.Utils.formatters.extractArtists(song);
    var allArtists = artists.allArtists || song.subtitle || '';

    var album = window.Utils.formatters.getAlbumName(song);
    var copyright = song.more_info ? song.more_info.copyright_text : '';

    var metadata = {
        title: song.title || '',
        artist: allArtists,
        album: album,
        year: song.year || '',
        genre: song.language || '',
        copyright: copyright,
        comment: 'Token: ' + (song.token || ''),
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
