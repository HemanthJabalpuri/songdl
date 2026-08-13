// src/js/ui/display/display-results.js

// ============ DISPLAY SONGS ============
function displaySongs(songs) {
    var container = document.createElement('div');
    container.className = 'results';

    songs.forEach(function(song, index) {
        var card = createSongCard(song, index);
        if (card) {
            container.appendChild(card);
        }
    });

    window.Utils.render(DOM.results, container);
}

// ============ DISPLAY ALBUMS ============
function displayAlbums(albums) {
    var container = document.createElement('div');
    container.className = 'results';

    albums.forEach(function(album) {
        var card = createAlbumCard(album);
        if (card) {
            container.appendChild(card);
        }
    });

    window.Utils.render(DOM.results, container);
}

// ============ DISPLAY PLAYLISTS ============
function displayPlaylists(playlists) {
    var container = document.createElement('div');
    container.className = 'results';

    playlists.forEach(function(playlist) {
        var card = createPlaylistCard(playlist);
        if (card) {
            container.appendChild(card);
        }
    });

    window.Utils.render(DOM.results, container);
}

// ============ DISPLAY ARTISTS ============
function displayArtists(artists) {
    var container = document.createElement('div');
    container.className = 'results';

    artists.forEach(function(artist) {
        var card = createArtistCard(artist);
        if (card) {
            container.appendChild(card);
        }
    });

    window.Utils.render(DOM.results, container);
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
window.UI.displaySongs = displaySongs;
window.UI.displayAlbums = displayAlbums;
window.UI.displayPlaylists = displayPlaylists;
window.UI.displayArtists = displayArtists;
window.UI.displaySearchResults = displaySearchResults;
