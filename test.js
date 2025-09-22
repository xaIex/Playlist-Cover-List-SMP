"use strict";

let ww = 0, wh = 0;
const row_height = 50; // bigger to fit thumbnails

function on_paint(gr) {
    // Background
    gr.FillSolidRect(0, 0, ww, wh, 0xFF191919);

    const count = plman.PlaylistCount;
    let y = 10;

    for (let i = 0; i < count; i++) {
        const name = plman.GetPlaylistName(i);

        // Default grey box in case no art
        gr.FillSolidRect(10, y, 40, 40, 0xFF555555);

        // Try to get cover art from first track
        if (plman.PlaylistItemCount(i) > 0) {
            try {
                const track = plman.GetPlaylistItems(i)[0];
                const art = utils.GetAlbumArtV2(track, 0); // 0 = front cover
                if (art) {
                    gr.DrawImage(art, 10, y, 40, 40, 0, 0, art.Width, art.Height);
                }
            } catch (e) {
                // ignore missing art
            }
        }

        // Playlist name
        gr.GdiDrawText(name, gdi.Font("Segoe UI", 14), 0xFFC8C8C8, 60, y, ww-70, row_height);

        y += row_height;
    }
}

function on_size(w, h) {
    ww = w;
    wh = h;
}
