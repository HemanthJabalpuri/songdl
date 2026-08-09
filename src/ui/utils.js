// src/js/ui/utils.js

function escapeHtml(text) {
    if (!text) return '';
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
window.UI.escapeHtml = escapeHtml;



// Get a standard SVG vector placeholder matching the component type
function getDefaultImage(type) {
    var emoji = '🎵';
    if (type === 'artist') {
        emoji = '🎤';
    } else if (type === 'album') {
        emoji = '💿';
    } else if (type === 'playlist') {
        emoji = '🎶';
    }

    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">' +
        '<rect width="200" height="200" fill="#282828"/>' +
        '<text x="50%" y="60%" font-size="80" text-anchor="middle" dominant-baseline="middle">' + emoji +
        '</text></svg>';

    return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
}

// Expose getDefaultImage to utility scope
window.Utils.getDefaultImage = getDefaultImage;

function buildCard(options) {
    var type = options.type;
    var token = options.token;
    var image = options.image;
    if (!image || image.indexOf('placeholder.com') !== -1) {
        image = getDefaultImage(type);
    }
    var title = options.title || '';
    var subtitle = options.subtitle || '';
    var details = options.details || '';
    var buttonText = options.buttonText || '';

    // Map class names to fit existing CSS selectors in ui.css
    var titleClass = type === 'artist' ? 'artist-name' : type + '-title';
    var subtitleClass = type === 'artist' ? 'artist-role' : type + '-subtitle';
    if (type !== 'artist') {
        subtitleClass = type === 'album' ? 'album-artist' : 'playlist-artist';
    }

    /* clang-format off */
    return window.Utils.compileHTML([
        '<div class="' + type + '-card" data-token="' + token + '">',
        '    <img src="' + image + '" alt="' + escapeHtml(title) + '" />',
        '    <div class="' + type + '-info">',
        '        <div class="' + titleClass + '">' + escapeHtml(title) + '</div>',
        '        <div class="' + subtitleClass + '">' + escapeHtml(subtitle) + '</div>',
        details ? '        <div class="' + type + '-details">' + details + '</div>' : '',
        '        <button class="btn-view-' + type + '" data-token="' + token + '">',
        '            ' + buttonText,
        '        </button>',
        '    </div>',
        '</div>'
    ]);
    /* clang-format on */
}

// Create HTML representations for album cards
function createAlbumCard(album) {
    var songCount = (album.more_info && album.more_info.song_count) || 0;
    return buildCard({
        type: 'album',
        token: album.token,
        image: album.image,
        title: album.title,
        subtitle: album.subtitle,
        details: songCount + ' songs • ' + escapeHtml(album.language || 'Unknown') + ' • ' + (album.year || 'N/A'),
        buttonText: '📂 View Album'
    });
}

// Create HTML representations for playlist cards
function createPlaylistCard(playlist) {
    var songCount = (playlist.more_info && playlist.more_info.song_count) || playlist.song_count || '0';
    return buildCard({
        type: 'playlist',
        token: playlist.token,
        image: playlist.image,
        title: playlist.title,
        subtitle: playlist.subtitle || '',
        details: songCount + ' songs • ' + escapeHtml(playlist.language || 'Unknown'),
        buttonText: '📂 View Playlist'
    });
}

// Create HTML representations for artist cards
function createArtistCard(artist) {
    return buildCard({
        type: 'artist',
        token: artist.token,
        image: artist.image,
        title: artist.name,
        subtitle: artist.role || 'Artist',
        buttonText: '🎤 View Artist'
    });
}

// Expose card creators to global window scope
window.UI.createArtistCard = createArtistCard;
window.UI.createAlbumCard = createAlbumCard;
window.UI.createPlaylistCard = createPlaylistCard;