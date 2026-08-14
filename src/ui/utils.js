// src/js/ui/utils.js

window.UI = window.UI || {};

window.UI.icons = {
    music: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:block;"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>',
    close: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:block;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
    play: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="display:inline-block;vertical-align:middle;"><polygon points="5 3 19 12 5 21"></polygon></svg>',
    download: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>',
    lyrics: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>',
    disc: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:6px;"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3"></circle></svg>',
    mic: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:6px;"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v1a7 7 0 0 1-14 0v-1"></path><line x1="12" y1="19" x2="12" y2="22"></line></svg>',
    verified: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#1db954" stroke="currentColor" stroke-width="2.5" style="display:inline-block;vertical-align:middle;margin-left:4px;"><polygon points="20 6 9 17 4 12"></polygon></svg>',
    spinner: '<svg class="spinner" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="display:inline-block;vertical-align:middle;margin-right:4px;"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-dasharray="32" stroke-dashoffset="12" fill="none"></circle></svg>',
    spinnerLarge: '<svg class="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="display:inline-block;vertical-align:middle;margin-right:8px;"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-dasharray="32" stroke-dashoffset="12" fill="none"></circle></svg>',
    back: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:4px;"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>',
    more: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;"><circle cx="12" cy="12" r="1.5"></circle><circle cx="12" cy="5" r="1.5"></circle><circle cx="12" cy="19" r="1.5"></circle></svg>'
};

function escapeHtml(text) {
    if (!text) return '';
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
window.UI.escapeHtml = escapeHtml;

// Get a standard SVG vector placeholder matching the component type
function getDefaultImage(type) {
    var svgContent = '';

    if (type === 'artist') {
        svgContent = 
            '<rect x="94" y="100" width="12" height="60" rx="4" fill="#666"/>' +
            '<rect x="85" y="40" width="30" height="50" rx="15" fill="#888"/>' +
            '<rect x="83" y="75" width="34" height="6" fill="#444"/>' +
            '<path d="M 75 125 A 25 25 0 0 0 125 125" fill="none" stroke="#666" stroke-width="6" stroke-linecap="round"/>' +
            '<rect x="97" y="125" width="6" height="20" fill="#666"/>' +
            '<rect x="85" y="145" width="30" height="6" rx="2" fill="#666"/>';
    } else if (type === 'album') {
        svgContent = 
            '<circle cx="100" cy="100" r="70" fill="none" stroke="#777" stroke-width="6"/>' +
            '<circle cx="100" cy="100" r="50" fill="none" stroke="#444" stroke-width="4" stroke-dasharray="12 6"/>' +
            '<circle cx="100" cy="100" r="30" fill="none" stroke="#777" stroke-width="6"/>' +
            '<circle cx="100" cy="100" r="10" fill="#777"/>';
    } else if (type === 'playlist') {
        svgContent = 
            '<rect x="45" y="55" width="110" height="10" rx="3" fill="#777"/>' +
            '<rect x="45" y="80" width="110" height="10" rx="3" fill="#777"/>' +
            '<rect x="45" y="105" width="65" height="10" rx="3" fill="#777"/>' +
            '<polygon points="125,100 155,115 125,130" fill="#777"/>' +
            '<rect x="45" y="130" width="110" height="10" rx="3" fill="#777"/>';
    } else {
        svgContent = 
            '<ellipse cx="65" cy="130" rx="18" ry="13" fill="#777" transform="rotate(-15, 65, 130)"/>' +
            '<ellipse cx="125" cy="120" rx="18" ry="13" fill="#777" transform="rotate(-15, 125, 120)"/>' +
            '<rect x="80" y="50" width="6" height="80" fill="#777"/>' +
            '<rect x="140" y="40" width="6" height="80" fill="#777"/>' +
            '<polygon points="80,50 146,40 146,55 80,65" fill="#777"/>';
    }

    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">' +
        '<rect width="200" height="200" fill="#282828"/>' +
        svgContent +
        '</svg>';

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
    var node = window.Utils.compileHTMLToNode([
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

    window.Utils.bindClick(node, null, function() {
        if (type === 'album') {
            window.UI.viewAlbum(token);
        } else if (type === 'playlist') {
            window.UI.viewPlaylist(token);
        } else if (type === 'artist') {
            window.UI.viewArtist(token);
        }
    });

    return node;
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
        details: songCount + ' songs | ' + escapeHtml(album.language || 'Unknown') + ' | ' + (album.year || 'N/A'),
        buttonText: 'View Album'
    });
}

// Create HTML representations for playlist cards
function createPlaylistCard(playlist) {
    var songCount = (playlist.more_info && playlist.more_info.song_count) || playlist.song_count || '0';
    var hasSongsText = playlist.subtitle && (playlist.subtitle.toLowerCase().indexOf('song') !== -1 || playlist.subtitle.toLowerCase().indexOf('track') !== -1);
    var details = hasSongsText ? escapeHtml(playlist.language || 'Unknown') : songCount + ' songs | ' + escapeHtml(playlist.language || 'Unknown');

    return buildCard({
        type: 'playlist',
        token: playlist.token,
        image: playlist.image,
        title: playlist.title,
        subtitle: playlist.subtitle || '',
        details: details,
        buttonText: 'View Playlist'
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
        buttonText: 'View Artist'
    });
}

// Expose card creators to global window scope
window.UI.createArtistCard = createArtistCard;
window.UI.createAlbumCard = createAlbumCard;
window.UI.createPlaylistCard = createPlaylistCard;