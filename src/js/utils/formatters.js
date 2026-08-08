// src/js/utils/formatters.js

window.Utils = window.Utils || {};
window.Utils.formatters = window.Utils.formatters || {};

// ============ DECODE ============
window.Utils.formatters.decode = function(text) {
    if (!text) return '';
    return text.replace(/&amp;/g, '&').replace(/&#039;/g, '\'').replace(/&quot;/g, '"');
};

// ============ EXTRACT TOKEN ============
window.Utils.formatters.extractToken = function(url) {
    if (!url) return '';
    return url.split('/').pop() || '';
};



// ============ HIGH RES ARTIST IMAGE ============
window.Utils.formatters.getHighResArtistImage = function(url) {
    if (!url) return '';
    return url.replace(/_50x50\.jpg$/, '_150x150.jpg');
};

window.Utils.formatters.formatLyrics = function(rawLyrics) {
    return rawLyrics.replace(/<br>/g, '\n');
};

// Replace bitrate in decrypted URL with selected quality Example: https://.../song_96.mp4 -> https://.../song_320.mp4
window.Utils.formatters.formatUrlWithQuality = function(url, quality) {
    if (!url) return url;
    if (!quality) quality = 96;

    // Match pattern like _96.mp4, _160.mp4, _320.mp4
    // Replace with selected quality
    return url.replace(/_(\d+)\.mp4/, '_' + quality + '.mp4');
};

// ============ EXTRACT ARTISTS ============
window.Utils.formatters.extractArtists = function(songData) {
    var artistMap = songData.more_info ? songData.more_info.artistMap : null;

    var primaryArtists = (artistMap && artistMap.primary_artists) ? artistMap.primary_artists : [];
    var featuredArtists = (artistMap && artistMap.featured_artists) ? artistMap.featured_artists : [];

    var primaryNames = primaryArtists.map(function(a) {
        return a.name;
    });
    var featuredNames = featuredArtists.map(function(a) {
        return a.name;
    });
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
    var results = (data.results || []).filter(function(item) {
        return item.type === type;
    });

    if (type === 'song') {
        results = results.map(window.Utils.formatters.formatSong);
    } else if (type === 'album') {
        results = results.map(window.Utils.formatters.formatAlbum);
    } else if (type === 'playlist') {
        results = results.map(window.Utils.formatters.formatPlaylist);
    } else if (type === 'artist') {
        results = results.map(window.Utils.formatters.formatArtistSearch);
    }

    return {total: Number(data.total || 0), start: Number(data.start || 0), results: results};
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
            album: song.more_info ? window.Utils.formatters.decode(song.more_info.album || '') : '',
            album_url: song.more_info ? song.more_info.album_url || '' : '',
            artistMap: song.more_info ? song.more_info.artistMap || null : null
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
        more_info: {song_count: album.more_info ? album.more_info.song_count || '0' : '0'}
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

// ============ PLAYLIST FORMATTER ============
window.Utils.formatters.formatPlaylist = function(playlist) {
    return {
        id: playlist.id,
        token: window.Utils.formatters.extractToken(playlist.perma_url),
        title: window.Utils.formatters.decode(playlist.title),
        subtitle: window.Utils.formatters.decode(playlist.subtitle || ''),
        image: playlist.image || '',
        language: playlist.more_info ? playlist.more_info.language || '' : '',
        year: '',
        more_info: {song_count: playlist.more_info ? playlist.more_info.song_count || '0' : '0'}
    };
};

// ============ PLAYLIST DETAIL FORMATTER ============
window.Utils.formatters.formatPlaylistDetail = function(data) {
    return {
        id: data.id,
        token: window.Utils.formatters.extractToken(data.perma_url),
        title: window.Utils.formatters.decode(data.title),
        image: data.image || '',
        language: data.language || '',
        year: '',
        list_count: parseInt(data.list_count) || 0,
        song_count: parseInt(data.song_count) || parseInt(data.list_count) || data.list ? data.list.length : 0,
        description: data.header_desc || '',
        songs: (data.list || []).map(function(song) {
            return window.Utils.formatters.formatSong(song);
        })
    };
};

// ============ ARTIST SEARCH FORMATTER ============
window.Utils.formatters.formatArtistSearch = function(artist) {
    return {
        id: artist.id,
        token: window.Utils.formatters.extractToken(artist.perma_url),
        name: artist.name || '',
        image: window.Utils.formatters.getHighResArtistImage(artist.image) || '',
        role: artist.role || 'Artist',
        type: 'artist'
    };
};

// ============ ARTIST DETAIL FORMATTER ============
window.Utils.formatters.formatArtistDetail = function(data) {
    // Parse bio
    var bioText = '';
    if (data.bio) {
        try {
            var bioArray = JSON.parse(data.bio);
            if (Array.isArray(bioArray) && bioArray.length > 0) {
                bioText = bioArray[0].text || '';
            }
        } catch (e) {
            bioText = data.bio;
        }
    }

    return {
        id: data.artistId,
        token: window.Utils.formatters.extractToken(data.perma_url),
        name: data.name || '',
        image: data.image || '',
        subtitle: data.subtitle || '',
        // fan_count removed (duplicate of subtitle)
        isVerified: data.isVerified || false,
        bio: bioText,  // Already parsed
        // First page songs and albums
        songs: (data.topSongs || []).map(window.Utils.formatters.formatSong),
        albums: (data.topAlbums || []).map(window.Utils.formatters.formatAlbum),
        // Other sections
        dedicatedPlaylists: (data.dedicated_artist_playlist || []).map(window.Utils.formatters.formatPlaylist),
        featuredPlaylists: (data.featured_artist_playlist || []).map(window.Utils.formatters.formatPlaylist),
        singles: (data.singles || []).map(window.Utils.formatters.formatAlbum),
        latestReleases: (data.latest_release || []).map(window.Utils.formatters.formatAlbum),
        // Store artistId for more API calls
        artistId: data.artistId
    };
};

// ============ DECRYPTED SONG FORMATTER ============
window.Utils.formatters.formatDecryptedSong = function(songData, decryptedUrl) {
    var rawData = songData;

    // Extract artist info from songData
    var artists = window.Utils.formatters.extractArtists(rawData);

    // Get album name from songData
    var albumName = window.Utils.formatters.getAlbumName(rawData);

    // Get copyright from songData
    var copyright = window.Utils.formatters.getCopyright(rawData);

    return {
        title: window.Utils.formatters.decode(rawData.title),
        subtitle: window.Utils.formatters.decode(rawData.subtitle),
        token: window.Utils.formatters.extractToken(rawData.perma_url) || rawData.id,
        image: rawData.image || '',
        year: rawData.year || '',
        language: rawData.language || '',
        has_lyrics: !!(rawData.more_info && rawData.more_info.has_lyrics === 'true'),
        artist: artists.allArtists,
        primary_artist: artists.primaryArtist,
        all_artists: artists.allArtists,
        album: albumName,
        copyright: copyright,
        url: decryptedUrl
    };
};
