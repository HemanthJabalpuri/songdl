// ============ CREATE ALBUM CARD ============
function createAlbumCard(album) {
    var songCount = album.more_info?.song_count || 0;
    
    var html = `
        <div class="album-card" data-token="${album.token}">
            <img src="${album.image || 'https://via.placeholder.com/100'}" alt="${album.title}" />
            <div class="album-info">
                <div class="album-title">${escapeHtml(album.title)}</div>
                <div class="album-artist">${escapeHtml(album.subtitle)}</div>
                <div class="album-details">
                    ${songCount} songs • 
                    ${escapeHtml(album.language || 'Unknown')} • 
                    ${album.year || 'N/A'}
                </div>
                <button class="btn-view-album" data-token="${album.token}">
                    📂 View Album
                </button>
            </div>
        </div>
    `;
    
    return html;
}

// ============ ATTACH ALBUM EVENTS ============
function attachAlbumEvents(container) {
    // Album card click (open album)
    container.querySelectorAll('.album-card').forEach(function(card) {
        card.addEventListener('click', function() {
            var token = this.dataset.token;
            if (token && typeof window.viewAlbum === 'function') {
                window.viewAlbum(token);
            }
        });
    });
    
    // View album button click
    container.querySelectorAll('.btn-view-album').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            var token = this.dataset.token;
            if (token && typeof window.viewAlbum === 'function') {
                window.viewAlbum(token);
            }
        });
    });
}
