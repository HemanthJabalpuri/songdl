// ============ CREATE PLAYLIST CARD ============
function createPlaylistCard(playlist) {
    var songCount = playlist.more_info?.song_count || playlist.song_count || '0';
    
    var html = `
        <div class="playlist-card" data-token="${playlist.token}">
            <img src="${playlist.image || 'https://via.placeholder.com/100'}" alt="${playlist.title}" />
            <div class="playlist-info">
                <div class="playlist-title">${escapeHtml(playlist.title)}</div>
                <div class="playlist-artist">${escapeHtml(playlist.subtitle || '')}</div>
                <div class="playlist-details">
                    ${songCount} songs • 
                    ${escapeHtml(playlist.language || 'Unknown')}
                </div>
                <button class="btn-view-playlist" data-token="${playlist.token}">
                    📂 View Playlist
                </button>
            </div>
        </div>
    `;
    
    return html;
}

// ============ ATTACH PLAYLIST EVENTS ============
function attachPlaylistEvents(container) {
    // Playlist card click (open playlist)
    container.querySelectorAll('.playlist-card').forEach(function(card) {
        card.addEventListener('click', function() {
            var token = this.dataset.token;
            if (token && typeof window.viewPlaylist === 'function') {
                window.viewPlaylist(token);
            }
        });
    });
    
    // View playlist button click
    container.querySelectorAll('.btn-view-playlist').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            var token = this.dataset.token;
            if (token && typeof window.viewPlaylist === 'function') {
                window.viewPlaylist(token);
            }
        });
    });
}
