// ui/js/core/formatters.js

window.Utils = window.Utils || {};
window.Utils.formatters = window.Utils.formatters || {};

// ============ DECODE ============
window.Utils.formatters.decode = function(text) {
    if (!text) return '';
    return text
        .replace(/&amp;/g, '&')
        .replace(/&#039;/g, "'")
        .replace(/&quot;/g, '"');
};

// ============ EXTRACT TOKEN ============
window.Utils.formatters.extractToken = function(url) {
    if (!url) return '';
    return url.split('/').pop() || '';
};

// ============ HIGH RES ALBUM ART ============
window.Utils.formatters.getHighResAlbumArt = function(url) {
    if (!url) return null;
    return url.replace(/\d+x\d+\.jpg$/, '500x500.jpg');
};


window.Utils.formatters.formatLyrics = function(rawLyrics) {
    return rawLyrics.replace(/<br>/g, '\n');
};

/**
 * Replace bitrate in decrypted URL with selected quality
 * Example: https://.../song_96.mp4 -> https://.../song_320.mp4
 */
window.Utils.formatters.formatUrlWithQuality = function(url, quality) {
    if (!url) return url;
    if (!quality) quality = 96;
    
    // Match pattern like _96.mp4, _160.mp4, _320.mp4
    // Replace with selected quality
    return url.replace(/_(\d+)\.mp4/, '_' + quality + '.mp4');
};

// ============ EXTRACT ARTISTS ============
window.Utils.formatters.extractArtists = function(songData) {
    var primaryArtists = (songData.more_info && songData.more_info.artistMap) 
        ? songData.more_info.artistMap.primary_artists || [] 
        : [];
    var featuredArtists = (songData.more_info && songData.more_info.artistMap) 
        ? songData.more_info.artistMap.featured_artists || [] 
        : [];
    
    var primaryNames = primaryArtists.map(function(a) { return a.name; });
    var featuredNames = featuredArtists.map(function(a) { return a.name; });
    var allNames = primaryNames.concat(featuredNames);
    var primaryArtist = primaryNames[0] || '';
    var allArtists = allNames.join(', ');
    
    return {
        primary: primaryArtists,
        featured: featuredArtists,
        primaryNames: primaryNames,
        featuredNames: featuredNames,
        allNames: allNames,
        primaryArtist: primaryArtist,
        allArtists: allArtists
    };
};

// ============ GET ALBUM NAME ============
window.Utils.formatters.getAlbumName = function(songData) {
    var albumName = songData.more_info ? window.Utils.formatters.decode(songData.more_info.album || '') : '';
    if (!albumName) {
        var subtitleParts = window.Utils.formatters.decode(songData.subtitle || '').split(' - ');
        if (subtitleParts.length > 1) {
            albumName = subtitleParts[subtitleParts.length - 1];
        }
    }
    return albumName;
};

// ============ GET COPYRIGHT ============
window.Utils.formatters.getCopyright = function(songData) {
    return songData.more_info ? window.Utils.formatters.decode(songData.more_info.copyright_text || '') : '';
};

// ============ FORMAT SEARCH RESULTS ============
window.Utils.formatters.formatSearchResults = function(data, type) {
    var results = (data.results || [])
        .filter(function(item) { return item.type === type; });
    
    if (type === 'song') {
        results = results.map(window.Utils.formatters.formatSong);
    } else if (type === 'album') {
        results = results.map(window.Utils.formatters.formatAlbum);
    }
    
    return {
        total: Number(data.total || 0),
        start: Number(data.start || 0),
        results: results
    };
};

// ============ SONG FORMATTER ============
window.Utils.formatters.formatSong = function(song) {
    return {
        id: song.id,
        token: window.Utils.formatters.extractToken(song.perma_url),
        title: window.Utils.formatters.decode(song.title),
        subtitle: window.Utils.formatters.decode(song.subtitle),
        image: song.image || '',
        language: song.language,
        year: song.year,
        play_count: song.play_count || '0',
        more_info: {
            duration: song.more_info ? song.more_info.duration || 'N/A' : 'N/A',
            encrypted_media_url: song.more_info ? song.more_info.encrypted_media_url || '' : '',
            album: song.more_info ? window.Utils.formatters.decode(song.more_info.album || '') : ''
        },
        has_stream: song.more_info ? !!song.more_info.encrypted_media_url : false,
        has_lyrics: !!(song.more_info && song.more_info.has_lyrics === 'true')
    };
};

// ============ ALBUM FORMATTER ============
window.Utils.formatters.formatAlbum = function(album) {
    return {
        id: album.id,
        token: window.Utils.formatters.extractToken(album.perma_url),
        title: window.Utils.formatters.decode(album.title),
        subtitle: window.Utils.formatters.decode(album.subtitle),
        image: album.image || '',
        language: album.language,
        year: album.year,
        more_info: {
            song_count: album.more_info ? album.more_info.song_count || '0' : '0'
        }
    };
};

// ============ ALBUM DETAIL FORMATTER ============
window.Utils.formatters.formatAlbumDetail = function(data) {
    return {
        id: data.id,
        token: window.Utils.formatters.extractToken(data.perma_url),
        title: window.Utils.formatters.decode(data.title),
        image: data.image || '',
        language: data.language,
        year: data.year,
        song_count: data.list ? data.list.length : 0,
        songs: (data.list || []).map(function(song) {
            return window.Utils.formatters.formatSong(song);
        })
    };
};

// ============ DECRYPTED SONG FORMATTER ============
window.Utils.formatters.formatDecryptedSong = function(songData, decryptedUrl) {
    // Get base fields from formatSong
    var base = window.Utils.formatters.formatSong(songData);
    
    // Extract artist info
    var artists = window.Utils.formatters.extractArtists(songData);
    
    // Get album name
    var albumName = window.Utils.formatters.getAlbumName(songData);
    
    // Get copyright
    var copyright = window.Utils.formatters.getCopyright(songData);
    
    return {
        title: base.title,
        subtitle: base.subtitle,
        token: base.token,
        image: base.image,
        year: base.year,
        language: base.language,
        has_lyrics: base.has_lyrics,
        artist: artists.allArtists,
        primary_artist: artists.primaryArtist,
        all_artists: artists.allArtists,
        album: albumName,
        copyright: copyright,
        url: decryptedUrl
    };
};

console.log('[Utils] Formatters loaded');