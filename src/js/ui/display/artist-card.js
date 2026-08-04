// ============ CREATE ARTIST CARD ============
function createArtistCard(artist) {
    var html = `
        <div class="artist-card" data-token="${artist.token}">
            <img src="${artist.image || 'https://via.placeholder.com/100'}" alt="${artist.name}" />
            <div class="artist-info">
                <div class="artist-name">${escapeHtml(artist.name)}</div>
                <div class="artist-role">${escapeHtml(artist.role || 'Artist')}</div>
                <button class="btn-view-artist" data-token="${artist.token}">
                    🎤 View Artist
                </button>
            </div>
        </div>
    `;
    
    return html;
}

// ============ ATTACH ARTIST EVENTS ============
function attachArtistEvents(container) {
    // Artist card click (open artist)
    container.querySelectorAll('.artist-card').forEach(function(card) {
        card.addEventListener('click', function() {
            var token = this.dataset.token;
            if (token && typeof window.viewArtist === 'function') {
                window.viewArtist(token);
            }
        });
    });

    // View artist button click
    container.querySelectorAll('.btn-view-artist').forEach(function(btn) {
btn.addEventListener('click', function(e) {
    e.stopPropagation();
    var token = this.dataset.token;
    console.log('[ArtistCard] View Artist clicked, token:', token);
    if (token && typeof window.viewArtist === 'function') {
        window.viewArtist(token);
    } else {
        console.warn('[ArtistCard] viewArtist not found or token missing');
    }
});
    });
}

// ============ EXPOSE ============
window.createArtistCard = createArtistCard;
window.attachArtistEvents = attachArtistEvents;