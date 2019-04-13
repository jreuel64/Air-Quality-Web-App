var app;
var auth_data = {};

function Init()
{
    app = new Vue({
        el: "#app",
        data: {
            spotify_search: "",
            spotify_type: "artist",
            spotify_type_options: [
                { value: "album", text: "Album" },
                { value: "artist", text: "Artist" },
                { value: "playlist", text: "Playlist" },
                { value: "track", text: "Track" }
            ],
            search_results: []
        }
    });
}
