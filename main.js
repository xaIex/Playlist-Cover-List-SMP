"use strict";

const DT_VCENTER   = 0x00000004;
const DT_NOPREFIX  = 0x00000800;

let ww = 0, wh = 0;
const thumbSize = 60;
const padding = 10;
let mouseX = 0, mouseY = 0;
let hoverIndex = -1;
let lastHover = -1;

let coverCache = {};

function on_paint(gr) {
    gr.FillSolidRect(0, 0, ww, wh, 0xFF191919);

    const count = plman.PlaylistCount;
    let y = padding;

    for (let i = 0; i < count; i++) {
        // default grey box
        gr.FillSolidRect(padding, y, thumbSize, thumbSize, 0xFF555555);

        // load and cache album art
        if (!coverCache[i] && plman.PlaylistItemCount(i) > 0) {
            try {
                const track = plman.GetPlaylistItems(i)[0];
                const art = utils.GetAlbumArtV2(track, 0);
                if (art) {
                    coverCache[i] = gdi.CreateImage(thumbSize, thumbSize);
                    let tmpGr = coverCache[i].GetGraphics();
                    tmpGr.DrawImage(art, 0, 0, thumbSize, thumbSize, 0, 0, art.Width, art.Height);
                    tmpGr.ReleaseGraphics();
                }
            } catch (e) {}
        }

        // draw cached art
        if (coverCache[i]) {
            gr.DrawImage(coverCache[i], padding, y, thumbSize, thumbSize, 0, 0, thumbSize, thumbSize);
        }

        // hover border
        if (hoverIndex === i) {
            gr.DrawRect(padding-2, y-2, thumbSize+4, thumbSize+4, 2, 0xFFFFFFFF);
        }

        y += thumbSize + padding;
    }

    // hover label
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

    const count = plman.PlaylistCount;
    let yPos = padding;
    let newHover = -1;

    for (let i = 0; i < count; i++) {
        if (x >= padding && x <= padding + thumbSize &&
            y >= yPos && y <= yPos + thumbSize) {
            newHover = i;
            break;
        }
        yPos += thumbSize + padding;
    }

    if (newHover !== hoverIndex) {
        // repaint previous and new hover
        if (hoverIndex >= 0) {
            let yPrev = padding + hoverIndex * (thumbSize + padding);
            window.RepaintRect(padding-2, yPrev-2, thumbSize+200, thumbSize+4);
        }
        if (newHover >= 0) {
            let yCur = padding + newHover * (thumbSize + padding);
            window.RepaintRect(padding-2, yCur-2, thumbSize+200, thumbSize+4);
        }

        lastHover = hoverIndex;
        hoverIndex = newHover;
    }
}

function on_mouse_lbtn_up(x, y) {
    if (hoverIndex >= 0) {
        plman.ActivePlaylist = hoverIndex;
        // repaint clicked thumbnail + previous if necessary
        let yCur = padding + hoverIndex * (thumbSize + padding);
        window.RepaintRect(padding-2, yCur-2, thumbSize+200, thumbSize+4);
        if (lastHover >= 0 && lastHover !== hoverIndex) {
            let yPrev = padding + lastHover * (thumbSize + padding);
            window.RepaintRect(padding-2, yPrev-2, thumbSize+200, thumbSize+4);
        }
    }
}
