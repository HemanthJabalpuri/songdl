// ui/js/search.js

async function search() {
    var searchInput = document.getElementById('searchInput');
    var resultsDiv = document.getElementById('results');
    var statsDiv = document.getElementById('stats');
    var playerDiv = document.getElementById('player');
    
    if (!searchInput || !resultsDiv) {
        console.error('[Search] Required DOM elements not found');
        return;
    }
    
    var query = searchInput.value.trim();
    if (!query) {
        alert('Please enter a search term');
        return;
    }

// Check if it's a valid URL
var parsed = window.Utils.parseUrl(query);
if (parsed && parsed.token) {
    // Clear previous results
    resultsDiv.innerHTML = '<div class="loading">🔍 Loading...</div>';
    if (statsDiv) statsDiv.innerHTML = '';
    if (playerDiv) playerDiv.innerHTML = '';
    
    try {
        if (parsed.type === 'song' || parsed.type === 'lyrics') {
            // Switch to Songs tab if needed
            if (window.currentSearchType !== 'songs') {
                switchTab('songs');
            }
            
            // Get song details
            var songData = await window.API.getSong(parsed.token);
            var song = songData.songs ? songData.songs[0] : null;
            
            if (song) {
                var formattedSong = window.Utils.formatters.formatSong(song);
                if (statsDiv) statsDiv.innerHTML = 'Found 1 song';
                displaySongs([formattedSong]);
            } else {
                resultsDiv.innerHTML = '<div class="no-results">😕 Song not found</div>';
            }
            
        } else if (parsed.type === 'album') {
            // Switch to Albums tab if needed
            if (window.currentSearchType !== 'albums') {
                switchTab('albums');
            }
            
            // Get album details
            var albumData = await window.API.getAlbum(parsed.token);
            
            if (albumData && albumData.id) {
                if (statsDiv) statsDiv.innerHTML = 'Found 1 album';
                viewAlbum(parsed.token);
            } else {
                resultsDiv.innerHTML = '<div class="no-results">😕 Album not found</div>';
            }
        }
    } catch (error) {
        console.error('[Search] URL fetch error:', error);
        resultsDiv.innerHTML = '<div class="error">❌ Failed to load: ' + error.message + '</div>';
    }
    
    return; // Exit after handling URL
}

    var searchType = window.currentSearchType || 'songs';
    console.log('[Search] Searching for:', query, 'Type:', searchType);

    resultsDiv.innerHTML = '<div class="loading">🔍 Searching</div>';
    if (statsDiv) statsDiv.innerHTML = '';
    if (playerDiv) playerDiv.innerHTML = '';

    try {
        var data;
        if (searchType === 'songs') {
            data = await window.Services.Song.search(query, 20);
        } else {
            data = await window.Services.Album.search(query, 20);
        }

        if (data.results && data.results.length > 0) {
            if (statsDiv) statsDiv.innerHTML = 'Found ' + data.results.length + ' ' + searchType;
            if (searchType === 'songs') {
                displaySongs(data.results);
            } else {
                displayAlbums(data.results);
            }
        } else {
            resultsDiv.innerHTML = '<div class="no-results">😕 No results found. Try a different search term.</div>';
        }
    } catch (error) {
        console.error('[Search] Error:', error);
        resultsDiv.innerHTML = '<div class="error">❌ Error: ' + error.message + '</div>';
        if (statsDiv) statsDiv.innerHTML = '';
    }
}

window.search = search;