// src/js/api/artists.js
// Pure API calls - no formatting or business logic

window.API = window.API || {};

/**
 * Search for artists - returns raw API response
 */
window.API.searchArtists = async function(query, limit, page) {
    return await window.API.callAPI('search.getArtistResults', {
        q: query,
        p: page || 1,
        n: limit || 20
    });
};

/**
 * Get artist details by token - returns raw API response
 * @param {string} token - Artist token from perma_url
 * @param {string} category - 'popular' or 'latest'
 */
window.API.getArtist = async function(token, category) {
    return await window.API.callAPI('webapi.get', {
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

/**
 * Get more songs by artist - returns raw API response
 * @param {string} artistId - Artist ID (not token)
 * @param {number} page - Page number
 * @param {string} category - 'popular' or 'latest'
 */
window.API.getArtistMoreSongs = async function(artistId, page, category) {
    return await window.API.callAPI('artist.getArtistMoreSong', {
        artistId: artistId,
        page: page || 1,
        category: category || 'popular',
        sort_order: category === 'latest' ? 'desc' : 'asc'
    });
};

/**
 * Get more albums by artist - returns raw API response
 * @param {string} artistId - Artist ID (not token)
 * @param {number} page - Page number
 * @param {string} category - 'popular' or 'latest'
 */
window.API.getArtistMoreAlbums = async function(artistId, page, category) {
    return await window.API.callAPI('artist.getArtistMoreAlbum', {
        artistId: artistId,
        page: page || 1,
        category: category || 'popular',
        sort_order: category === 'latest' ? 'desc' : 'asc'
    });
};

console.log('[API] Artists loaded');
