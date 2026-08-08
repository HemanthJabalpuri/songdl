// src/js/ui/display/display-results.js

// ============ DISPLAY SONGS ============
function displaySongs(songs) {
    var html = '<div class="results">';

    songs.forEach(function(song, index) {
        html += createSongCard(song, index);
    });

    html += '</div>';
    DOM.results.innerHTML = html;

    // Attach song data to cards
    var cards = DOM.results.querySelectorAll('.song-card');
    cards.forEach(function(card, index) {
        if (songs[index]) {
            card._songData = songs[index];
        }
    });
}

// ============ DISPLAY ALBUMS ============
function displayAlbums(albums) {
    var html = '<div class="results">';

    albums.forEach(function(album) {
        html += createAlbumCard(album);
    });

    html += '</div>';
    DOM.results.innerHTML = html;
}

// ============ DISPLAY PLAYLISTS ============
function displayPlaylists(playlists) {
    var html = '<div class="results">';

    playlists.forEach(function(playlist) {
        html += createPlaylistCard(playlist);
    });

    html += '</div>';
    DOM.results.innerHTML = html;
}

// ============ DISPLAY ARTISTS ============
function displayArtists(artists) {
    var html = '<div class="results">';

    artists.forEach(function(artist) {
        html += createArtistCard(artist);
    });

    html += '</div>';
    DOM.results.innerHTML = html;
}

// ============ DISPLAY SEARCH RESULTS ============
function displaySearchResults(results, type) {
    if (type === 'songs') {
        displaySongs(results);
    } else if (type === 'albums') {
        displayAlbums(results);
    } else if (type === 'playlists') {
        displayPlaylists(results);
    } else if (type === 'artists') {
        displayArtists(results);
    }
}

// ============ EXPOSE ============
window.displaySongs = displaySongs;
window.displayAlbums = displayAlbums;
window.displayPlaylists = displayPlaylists;
window.displayArtists = displayArtists;
