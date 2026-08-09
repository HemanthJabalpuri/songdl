// src/js/api/artists.js
// Pure API calls - no formatting or business logic

window.API = window.API || {};

// Search for artists - returns raw API response
window.API.searchArtists = function(query, limit, page) {
    return window.API.callAPI('search.getArtistResults', {q: query, p: page || 1, n: limit || 20});
};

// Get artist details by token - returns raw API response
window.API.getArtist = function(token, category) {
    return window.API.callAPI('webapi.get', {
        token: token,
        type: 'artist',
        p: 1,
        n_song: 10,
        n_album: 10,
        sub_type: '',
        category: category || 'popular',
        sort_order: category === 'latest' ? 'desc' : 'asc'
    });
};

// Get more songs by artist - returns raw API response
window.API.getArtistMoreSongs = function(artistId, page, category) {
    return window.API.callAPI('artist.getArtistMoreSong', {
        artistId: artistId,
        page: page || 1,
        category: category || 'popular',
        sort_order: category === 'latest' ? 'desc' : 'asc'
    });
};

// Get more albums by artist - returns raw API response
window.API.getArtistMoreAlbums = function(artistId, page, category) {
    return window.API.callAPI('artist.getArtistMoreAlbum', {
        artistId: artistId,
        page: page || 1,
        category: category || 'popular',
        sort_order: category === 'latest' ? 'desc' : 'asc'
    });
};
