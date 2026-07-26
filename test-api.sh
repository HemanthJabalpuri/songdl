#!/bin/sh

# ============================================================
# API CONFIG & CORE CLIENT
# ============================================================

API_URL="https://www.jiosaavn.com/api.php"
DEFAULTS="_format=json&_marker=0&api_version=4&ctx=wap6dot0"

check_dependencies() {
    missing=""
    for cmd in curl jq openssl; do
        if ! command -v "$cmd" >/dev/null 2>&1; then
            missing="${missing}  - $cmd\n"
        fi
    done

    if [ -n "$missing" ]; then
        printf '❌ Missing required dependencies:\n%s\n' "$missing"
        printf 'Install them using your package manager (e.g., apk, apt, pkg, pacman).\n'
        exit 1
    fi
}

# Make API request
api_request() {
    url="${API_URL}?${DEFAULTS}&${1}"
    response=$(curl -s "$url")

    if ! echo "$response" | jq -e . >/dev/null 2>&1; then
        printf '❌ Error: Failed to parse API response\n'
        printf '%s' "$response" | head -c 200
        printf '...\n'
        return 1
    fi
    printf '%s\n' "$response"
}


# ============================================================
# UTILITIES & HELPERS
# ============================================================

extract_token() {
    url="${1:-}"
    [ -z "$url" ] && { echo ""; return 1; }
    echo "$url" | sed 's#.*/##'
}

decrypt_url() {
    printf '%s' "$1" | base64 -d | openssl enc -provider legacy -d -des-ecb -K "3338333436353931" 2>/dev/null
}

get_high_res_album_art() {
    url="${1:-}"
    [ -z "$url" ] && { echo ""; return 1; }
    printf '%s\n' "$url" | sed 's/150x150/500x500/g'
}

url_encode() {
    printf '%s' "$1" | sed 's/ /%20/g'
}

# Helper to query JSON with a fallback (defaults to "N/A")
# Usage: json_val "$json_data" ".path.to.field" "Custom Fallback"
json_val() {
    data="$1"
    query="$2"
    fallback="${3:-N/A}"
    echo "$data" | jq -r "$query // \"$fallback\""
}


# ============================================================
# RENDER / FORMATTERS (DRY Layers)
# ============================================================

print_song_details() {
    json_data="$1"
    index="${2:-}"

    if [ -n "$index" ]; then
        p=".results[$index]"
        mp=".results[$index].more_info"
    else
        p=".songs[0]"
        mp=".songs[0].more_info"
    fi

    title=$(json_val "$json_data" "$p.title")
    album=$(json_val "$json_data" "$mp.album")
    artist=$(json_val "$json_data" "$p.subtitle")
    genre=$(json_val "$json_data" "$p.language")
    image=$(json_val "$json_data" "$p.image")
    hi_res_img=$(get_high_res_album_art "$image")
    encrypted_url=$(json_val "$json_data" "$mp.encrypted_media_url")
    media_url=$(decrypt_url "$encrypted_url")
    perma_url=$(json_val "$json_data" "$p.perma_url" "")
    token=$(extract_token "$perma_url")

    year=$(json_val "$json_data" "$p.year" "")
    duration=$(json_val "$json_data" "$mp.duration" "")
    has_lyrics=$(json_val "$json_data" "$mp.has_lyrics" "")

    if [ -n "$index" ]; then
        printf '=== Song %d ===\n' "$((index + 1))"
    else
        printf '=== Song Details ===\n'
    fi

    printf 'Title:    %s\n' "$title"
    printf 'Album:    %s\n' "$album"
    printf 'Artist:   %s\n' "$artist"
    printf 'Genre:    %s\n' "$genre"
    [ -n "$year" ] && [ "$year" != "N/A" ] && printf 'Year:     %s\n' "$year"
    [ -n "$duration" ] && [ "$duration" != "N/A" ] && printf 'Duration: %s\n' "$duration"
    [ -n "$has_lyrics" ] && [ "$has_lyrics" != "N/A" ] && printf 'Has Lyrics: %s\n' "$has_lyrics"
    printf 'Art URL:  %s\n' "$hi_res_img"
    printf 'Stream:   %s\n' "$media_url"
    printf 'Token:    %s\n\n' "$token"
}


# ============================================================
# COMMAND LOGIC (API ACTIONS)
# ============================================================

search_songs() {
    query="${1:-}"
    limit="${2:-5}"
    [ -z "$query" ] && { printf '❌ Error: Missing search query\n'; return 1; }

    printf '🔍 Searching for songs: "%s" (limit: %s)\n\n' "$query" "$limit"
    response=$(api_request "__call=search.getResults&q=$(url_encode "$query")&n=$limit") || return 1

    total=$(echo "$response" | jq -r '.total // 0')
    [ "$total" -eq 0 ] && { printf '❌ No songs found\n'; return 1; }

    count=$(echo "$response" | jq '.results | length')
    printf '📊 Found %s songs\n\n' "$count"

    i=0
    while [ "$i" -lt "$count" ] && [ "$i" -lt "$limit" ]; do
        print_song_details "$response" "$i"
        i=$((i + 1))
    done
}

search_albums() {
    query="${1:-}"
    limit="${2:-5}"
    [ -z "$query" ] && { printf '❌ Error: Missing search query\n'; return 1; }

    printf '🔍 Searching for albums: "%s" (limit: %s)\n\n' "$query" "$limit"
    response=$(api_request "__call=search.getAlbumResults&q=$(url_encode "$query")&n=$limit") || return 1

    total=$(echo "$response" | jq -r '.total // 0')
    [ "$total" -eq 0 ] && { printf '❌ No albums found\n'; return 1; }

    count=$(echo "$response" | jq '.results | length')
    printf '📊 Found %s albums\n\n' "$count"

    i=0
    while [ "$i" -lt "$count" ] && [ "$i" -lt "$limit" ]; do
        title=$(json_val "$response" ".results[$i].title")
        artist=$(json_val "$response" ".results[$i].subtitle")
        year=$(json_val "$response" ".results[$i].year")
        song_count=$(json_val "$response" ".results[$i].more_info.song_count")
        hi_res_img=$(get_high_res_album_art "$(json_val "$response" ".results[$i].image" "")")
        token=$(extract_token "$(json_val "$response" ".results[$i].perma_url" "")")

        printf '=== Album %d ===\n' "$((i+1))"
        printf 'Title:      %s\n' "$title"
        printf 'Artist:     %s\n' "$artist"
        printf 'Year:       %s\n' "$year"
        printf 'Songs:      %s\n' "$song_count"
        printf 'Art URL:    %s\n' "$hi_res_img"
        printf 'Token:      %s\n\n' "$token"
        i=$((i + 1))
    done
}

get_song() {
    token="${1:-}"
    [ -z "$token" ] && { printf '❌ Error: Missing token\n'; return 1; }

    printf '🎵 Fetching song: %s\n\n' "$token"
    response=$(api_request "__call=webapi.get&token=$token&type=song") || return 1

    song=$(echo "$response" | jq -r '.songs[0] // null')
    [ "$song" = "null" ] && { printf '❌ Song not found\n'; return 1; }

    print_song_details "$response"
}

get_album() {
    token="${1:-}"
    [ -z "$token" ] && { printf '❌ Error: Missing token\n'; return 1; }

    printf '💿 Fetching album: %s\n\n' "$token"
    response=$(api_request "__call=webapi.get&token=$token&type=album") || return 1

    title=$(json_val "$response" ".title")
    artist=$(json_val "$response" ".subtitle")
    year=$(json_val "$response" ".year")
    song_count=$(echo "$response" | jq -r '.list // [] | length')
    hi_res_img=$(get_high_res_album_art "$(json_val "$response" ".image" "")")

    printf '=== Album Details ===\n'
    printf 'Title:    %s\n' "$title"
    printf 'Artist:   %s\n' "$artist"
    printf 'Year:     %s\n' "$year"
    printf 'Songs:    %s\n' "$song_count"
    printf 'Art URL:  %s\n\n' "$hi_res_img"

    if [ "$song_count" -gt 0 ]; then
        printf '=== Songs ===\n'
        i=0
        while [ "$i" -lt "$song_count" ]; do
            if [ "$i" -ge 10 ]; then
                printf '... and %d more songs\n' "$((song_count - 10))"
                break
            fi
            s_title=$(json_val "$response" ".list[$i].title")
            s_artist=$(json_val "$response" ".list[$i].subtitle")
            s_token=$(extract_token "$(json_val "$response" ".list[$i].perma_url" "")")

            printf '%d. %s - %s (%s)\n' "$((i+1))" "$s_title" "$s_artist" "$s_token"
            i=$((i + 1))
        done
        printf '\n'
    fi
}

get_lyrics() {
    token="${1:-}"
    [ -z "$token" ] && { printf '❌ Error: Missing token\n'; return 1; }

    printf '📜 Fetching lyrics: %s\n\n' "$token"
    response=$(api_request "__call=webapi.get&token=$token&type=lyrics") || return 1

    lyrics=$(echo "$response" | jq -r '.lyrics.lyrics // null')
    [ "$lyrics" = "null" ] || [ -z "$lyrics" ] && { printf '❌ No lyrics found for this song\n'; return 1; }

    printf '=== Lyrics ===\n'
    printf '%s\n' "$lyrics" | head -c 500
    printf '\n'
    [ "$(printf '%s' "$lyrics" | wc -c)" -gt 500 ] && printf '... (truncated)\n'
    printf '\n'
}

usage() {
    printf '📖 Test JioSaavn API\n\n'
    printf 'Usage: %s [command] [arguments]\n\n' "$0"
    printf 'Commands:\n'
    printf '  search-songs <query> [limit]\n'
    printf '  search-albums <query> [limit]\n'
    printf '  get-song <token>\n'
    printf '  get-album <token>\n'
    printf '  get-lyrics <token>\n'
    printf '  help\n\n'
}

# ============================================================
# ENTRY POINT
# ============================================================

main() {
    check_dependencies
    
    cmd="${1:-help}"
    shift 1
    case "$cmd" in
        search-songs) search_songs "$@" ;;
        search-albums) search_albums "$@" ;;
        get-song) get_song "$@" ;;
        get-album) get_album "$@" ;;
        get-lyrics) get_lyrics "$@" ;;
        help|--help|-h) usage ;;
        *) printf '❌ Unknown command: %s\n\n' "$cmd"; usage; exit 1 ;;
    esac
}

main "$@"
