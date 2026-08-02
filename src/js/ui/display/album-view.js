// Extract rendering logic to a separate function
function renderAlbum(album) {
    var html = `
        <div class="album-header">
            <img src="${album.image || 'https://via.placeholder.com/200'}" alt="${album.title}" />
            <div class="album-header-info">
                <h2>${escapeHtml(album.title)}</h2>
                <p>${escapeHtml(album.subtitle || '')}</p>
                <p>${album.song_count || album.songs?.length || 0} songs • ${escapeHtml(album.language || 'Unknown')} • ${album.year || 'N/A'}</p>
                <div class="album-actions">
                    <button class="btn-back" id="btn-back-search">← Back</button>
                </div>
            </div>
        </div>
        <div class="song-list">
    `;

    var albumContext = {
        type: 'album',
        image: album.image,
        language: album.language,
        year: album.year,
        title: album.title
    };

    if (album.songs && album.songs.length > 0) {
        album.songs.forEach(function(song, index) {
            html += createSongCard(song, index, albumContext);
        });
    } else {
        html += `<div class="no-results">No songs found in this album.</div>`;
    }

    html += '</div>';
    DOM.results.innerHTML = html;
    
    // Attach song data to cards
    var cards = DOM.results.querySelectorAll('.song-card');
    if (album.songs && album.songs.length > 0) {
        cards.forEach(function(card, index) {
            if (album.songs[index]) {
                card._songData = album.songs[index];
            }
        });
    }
    
    // Attach events
    attachSongEvents(DOM.results);

    var backBtn = document.getElementById('btn-back-search');
    backBtn.addEventListener('click', function() {
        console.log('[Back] Button clicked');
    
        // Pop the current view
        var current = window.Nav.pop();
        console.log('[Back] Popped:', current ? current.type : 'none');
    
        // Get the new top (previous view)
        var prev = window.Nav.peek();
        console.log('[Back] Previous view:', prev ? prev.type : 'none');
    
        if (prev) {
            restoreView(prev);
        } else {
            console.log('[Back] No previous view, going to search');
            if (typeof window.search === 'function') {
                window.search();
            }
        }
    });
}

// ============ VIEW ALBUM ============
async function viewAlbum(token) {
    console.log('[View] viewAlbum called, isRestoring:', window._isRestoring);
    
    // Only push if not restoring
    if (!window._isRestoring) {
        window.Nav.push({ type: 'album', data: { token: token } });
    }
    
    var cacheKey = window.Cache.getDetailKey('album', token);
    
    // Check cache first
    if (window.Cache.has(cacheKey)) {
        console.log('[Display] Using cached album:', token);
        var album = window.Cache.get(cacheKey);
        renderAlbum(album);
        return;
    }
    
    DOM.results.innerHTML = '<div class="loading">📂 Loading album...</div>';
    DOM.stats.innerHTML = '';

    try {
        var album = await window.Services.Album.getDetails(token);
        
        // Store in cache
        window.Cache.set(cacheKey, album);
        renderAlbum(album);
        
    } catch (error) {
        DOM.results.innerHTML = `<div class="error">❌ Error loading album: ${error.message}</div>`;
    }
}

// ============ EXPOSE ============
window.viewAlbum = viewAlbum;
