// src/js/app-scripts.js

/* clang-format off */
var APP_SCRIPTS = [].concat(
    // 1. Combined API Resources Layer (constants, fetcher, resource endpoints)
    [
        'api/constants.js',
        'api/fetch.js',
        'api/songs.js',
        'api/albums.js',
        'api/playlists.js',
        'api/artists.js'
    ],
    // 2. Encryption & Assembly Libraries
    [
        'libs/des.js',
        'libs/writem4a.js'
    ],
    // 3. Infrastructure Utilities & Loaders (provides compileHTML)
    [
        'utils/promise.js',
        'utils/ui-loader.js',
        'utils/cache.js',
        'utils/logger.js'
    ],
    // 4. UI Utilities (depends on compileHTML inside ui-loader)
    [
        'ui/utils.js'
    ],
    // 5. Core Helper Utilities (depends on des.js and writem4a.js)
    [
        'utils/decrypt.js',
        'utils/resource.js',
        'utils/formatters.js',
        'utils/url-helper.js',
        'utils/download-helper.js'
    ],
    // 6. Services Layer (Business logic & orchestrators)
    [
        'services/song.js',
        'services/album.js',
        'services/download.js',
        'services/playlist.js',
        'services/artist.js'
    ],
    // 7. UI Display Views (Song cards & lists templates)
    [
        'ui/display/song-card.js',
        'ui/display/display-results.js',
        'ui/display/album-view.js',
        'ui/display/playlist-view.js',
        'ui/display/artist-view.js',
        'ui/display/lyrics.js',
        'ui/display/navigation.js'
    ],
    // 8. Main UI Controllers & Handlers
    [
        'ui/search.js',
        'ui/player.js',
        'ui/download.js',
        'ui/core.js',
        'ui/builder.js',
        'ui/handlers.js'
    ]
);
/* clang-format on */

if (typeof exports !== 'undefined') {
    exports.scripts = APP_SCRIPTS;
}
