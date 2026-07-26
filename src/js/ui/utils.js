// ui/js/utils.js

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDuration(seconds) {
    if (!seconds) return 'N/A';
    const secs = parseInt(seconds);
    if (isNaN(secs) || secs === 0) return 'N/A';
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs.toString().padStart(2, '0')}`;
}

function getSongId(song) {
    return song.id || song.token || Math.random().toString(36);
}

function hasStream(song) {
    return !!(song.more_info?.encrypted_media_url || song.encrypted_media_url);
}