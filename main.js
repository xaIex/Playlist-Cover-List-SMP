"use strict";

const DT_VCENTER   = 0x00000004;
const DT_NOPREFIX  = 0x00000800;
const DT_WORDBREAK = 0x00000010;

let ww = 0, wh = 0;
const padding = 10;
let mouseX = 0, mouseY = 0;
let hoverIndex = -1;
let lastHover = -1;

let coverCache = {};
let coverArtSize = 60; // default size

// Functions to adjust size
function increaseSize() {
    coverArtSize = Math.min(coverArtSize + 10, 200); // max 200px
    coverCache = {}; // redraw images at new size
    window.Repaint();
}

function decreaseSize() {
    coverArtSize = Math.max(30, coverArtSize - 10); // min 30px
    coverCache = {};
    window.Repaint();
}

function on_paint(gr) {
    gr.FillSolidRect(0, 0, ww, wh, 0xFF191919);

    const count = plman.PlaylistCount;
    let y = padding;

    for (let i = 0; i < count; i++) {
        // grey placeholder
        gr.FillSolidRect(padding, y, coverArtSize, coverArtSize, 0xFF555555);

        // load and cache album art
        if (!coverCache[i] && plman.PlaylistItemCount(i) > 0) {
            try {
                const track = plman.GetPlaylistItems(i)[0];
                const art = utils.GetAlbumArtV2(track, 0);
                if (art) {
                    coverCache[i] = gdi.CreateImage(coverArtSize, coverArtSize);
                    let tmpGr = coverCache[i].GetGraphics();
                    tmpGr.DrawImage(art, 0, 0, coverArtSize, coverArtSize, 0, 0, art.Width, art.Height);
                    tmpGr.ReleaseGraphics();
                }
            } catch (e) {}
        }

        // draw cached art
        if (coverCache[i]) {
            gr.DrawImage(coverCache[i], padding, y, coverArtSize, coverArtSize, 0, 0, coverArtSize, coverArtSize);
        }

        // hover border
        if (hoverIndex === i) {
            gr.DrawRect(padding-2, y-2, coverArtSize+4, coverArtSize+4, 2, 0xFFFFFFFF);
        }

        y += coverArtSize + padding;
    }

    // hover label
    if (hoverIndex >= 0) {
        const name = plman.GetPlaylistName(hoverIndex);
        const thumbY = padding + hoverIndex * (coverArtSize + padding);
        const labelWidth = coverArtSize * 3; // scale label with cover size
        const labelHeight = 100; // enough height for wrapping

        // decide which side to draw label
        let labelX;
        if (padding + coverArtSize + 5 + labelWidth <= ww) {
            labelX = padding + coverArtSize + 5; // right side
        } else {
            labelX = Math.max(0, padding - labelWidth - 5); // left side
        }

        gr.FillSolidRect(labelX, thumbY, labelWidth, labelHeight, 0xAA000000);

        gr.GdiDrawText(
            name,
            gdi.Font("Segoe UI", Math.max(12, Math.floor(coverArtSize / 4))),
            0xFFFFFFFF,
            labelX + 5,
            thumbY,
            labelWidth,
            labelHeight,
            DT_VCENTER | DT_NOPREFIX | DT_WORDBREAK
        );
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
        if (x >= padding && x <= padding + coverArtSize &&
            y >= yPos && y <= yPos + coverArtSize) {
            newHover = i;
            break;
        }
        yPos += coverArtSize + padding;
    }

    if (newHover !== hoverIndex) {
        if (hoverIndex >= 0) {
            let yPrev = padding + hoverIndex * (coverArtSize + padding);
            window.RepaintRect(padding-2, yPrev-2, coverArtSize+200, coverArtSize+4);
        }
        if (newHover >= 0) {
            let yCur = padding + newHover * (coverArtSize + padding);
            window.RepaintRect(padding-2, yCur-2, coverArtSize+200, coverArtSize+4);
        }

        lastHover = hoverIndex;
        hoverIndex = newHover;
    }
}

function on_mouse_lbtn_up(x, y) {
    if (hoverIndex >= 0) {
        plman.ActivePlaylist = hoverIndex;

        let yCur = padding + hoverIndex * (coverArtSize + padding);
        window.RepaintRect(padding-2, yCur-2, coverArtSize+200, coverArtSize+4);

        if (lastHover >= 0 && lastHover !== hoverIndex) {
            let yPrev = padding + lastHover * (coverArtSize + padding);
            window.RepaintRect(padding-2, yPrev-2, coverArtSize+200, coverArtSize+4);
        }
    }
}

// Right-click menu
function on_mouse_rbtn_up(x, y) {
    const menu = window.CreatePopupMenu();
    menu.AppendMenuItem(0, 1, "Increase Cover Art Size");
    menu.AppendMenuItem(0, 2, "Decrease Cover Art Size");

    const idx = menu.TrackPopupMenu(x, y);
    if (idx === 1) increaseSize();
    if (idx === 2) decreaseSize();
}


