"use strict";

// Needed constants for GdiDrawText
const DT_VCENTER   = 0x00000004;
const DT_NOPREFIX  = 0x00000800;

let ww = 0, wh = 0;
const thumbSize = 60;
const padding = 10;
let mouseX = 0, mouseY = 0;
let hoverIndex = -1;

function on_paint(gr) {
    gr.FillSolidRect(0, 0, ww, wh, 0xFF191919);

    const count = plman.PlaylistCount;
    let y = padding;
    hoverIndex = -1;

    for (let i = 0; i < count; i++) {
        const name = plman.GetPlaylistName(i);

        // default grey box
        gr.FillSolidRect(padding, y, thumbSize, thumbSize, 0xFF555555);

        // cover art
        if (plman.PlaylistItemCount(i) > 0) {
            try {
                const track = plman.GetPlaylistItems(i)[0];
                const art = utils.GetAlbumArtV2(track, 0);
                if (art) gr.DrawImage(art, padding, y, thumbSize, thumbSize, 0, 0, art.Width, art.Height);
            } catch (e) {}
        }

        // check hover
        if (mouseX >= padding && mouseX <= padding + thumbSize &&
            mouseY >= y && mouseY <= y + thumbSize) {
            hoverIndex = i;
        }

        // draw hover border
        if (hoverIndex === i) {
            gr.DrawRect(padding-2, y-2, thumbSize+4, thumbSize+4, 2, 0xFFFFFFFF); // white border, 2px thick
        }

        y += thumbSize + padding;
    }

    // draw hover label
    if (hoverIndex >= 0) {
        const name = plman.GetPlaylistName(hoverIndex);
        gr.FillSolidRect(padding + thumbSize + 5, hoverIndex * (thumbSize + padding) + padding, 200, 25, 0xAA000000);
        gr.GdiDrawText(name, gdi.Font("Segoe UI", 14), 0xFFFFFFFF,
            padding + thumbSize + 10,
            hoverIndex * (thumbSize + padding) + padding,
            200, 25, DT_VCENTER | DT_NOPREFIX);
    }
}

function on_size(w, h) {
    ww = w;
    wh = h;
}

function on_mouse_move(x, y) {
    mouseX = x;
    mouseY = y;
    window.Repaint();
}

function on_mouse_lbtn_up(x, y) {
    if (hoverIndex >= 0) {
        plman.ActivePlaylist = hoverIndex; // switch playlist
        window.Repaint();
    }
}
