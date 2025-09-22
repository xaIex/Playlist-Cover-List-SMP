"use strict";

let ww = 0, wh = 0;
const row_height = 30;

function on_paint(gr) {
    // Background
    gr.FillSolidRect(0, 0, ww, wh, 0xFF191919);

    const count = plman.PlaylistCount; // number of playlists
    let y = 10;

    for (let i = 0; i < count; i++) {
        const name = plman.GetPlaylistName(i); // get playlist name
        gr.GdiDrawText(name, gdi.Font("Segoe UI", 14), 0xFFC8C8C8, 10, y, ww-20, row_height);
        y += row_height;
    }
}

function on_size(w, h) {
    ww = w;
    wh = h;
}
