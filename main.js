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
let coverArtSize = 60; // default thumbnail size

function getThumbSize() {
    const count = plman.PlaylistCount || 1;
    const maxThumb = 120;
    const minThumb = 30;
    let availableHeight = (wh - padding * (count + 1)) / count;
    return Math.max(minThumb, Math.min(maxThumb, availableHeight, coverArtSize));
}

function on_paint(gr) {
    gr.FillSolidRect(0, 0, ww, wh, 0xFF191919);

    const count = plman.PlaylistCount;
    const thumbSize = getThumbSize();
    let y = padding;

    for (let i = 0; i < count; i++) {
        gr.FillSolidRect(padding, y, thumbSize, thumbSize, 0xFF555555);

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

        if (coverCache[i]) {
            gr.DrawImage(coverCache[i], padding, y, thumbSize, thumbSize, 0, 0, thumbSize, thumbSize);
        }

        if (hoverIndex === i) {
            gr.DrawRect(padding - 2, y - 2, thumbSize + 4, thumbSize + 4, 2, 0xFFFFFFFF);
        }

        y += thumbSize + padding;
    }

    if (hoverIndex >= 0) {
        const name = plman.GetPlaylistName(hoverIndex);
        const thumbY = padding + hoverIndex * (thumbSize + padding);
        const labelWidth = thumbSize * 3;
        const labelHeight = 100;

        let labelX;
        if (padding + thumbSize + 5 + labelWidth <= ww) {
            labelX = padding + thumbSize + 5;
        } else {
            labelX = Math.max(0, padding - labelWidth - 5);
        }

        gr.FillSolidRect(labelX, thumbY, labelWidth, labelHeight, 0xAA000000);
        gr.GdiDrawText(name, gdi.Font("Segoe UI", Math.max(12, Math.floor(thumbSize / 4))),
            0xFFFFFFFF, labelX + 5, thumbY, labelWidth, labelHeight, DT_VCENTER | DT_NOPREFIX | DT_WORDBREAK);
    }
}

function on_size(w, h) { ww = w; wh = h; }

function on_mouse_move(x, y) {
    mouseX = x; mouseY = y;
    const count = plman.PlaylistCount;
    const thumbSize = getThumbSize();
    let yPos = padding;
    let newHover = -1;

    for (let i = 0; i < count; i++) {
        if (x >= padding && x <= padding + thumbSize && y >= yPos && y <= yPos + thumbSize) {
            newHover = i; break;
        }
        yPos += thumbSize + padding;
    }

    if (newHover !== hoverIndex) {
        if (hoverIndex >= 0) {
            let yPrev = padding + hoverIndex * (thumbSize + padding);
            window.RepaintRect(padding - 2, yPrev - 2, thumbSize + 200, thumbSize + 4);
        }
        if (newHover >= 0) {
            let yCur = padding + newHover * (thumbSize + padding);
            window.RepaintRect(padding - 2, yCur - 2, thumbSize + 200, thumbSize + 4);
        }
        lastHover = hoverIndex;
        hoverIndex = newHover;
    }
}

function on_mouse_lbtn_up(x, y) {
    if (hoverIndex >= 0) {
        plman.ActivePlaylist = hoverIndex;
        window.Repaint();
    }
}

// Playlist size menu
function increaseSize(px = 5) { coverArtSize = Math.min(200, coverArtSize + px); coverCache = {}; window.Repaint(); }
function decreaseSize(px = 5) { coverArtSize = Math.max(30, coverArtSize - px); coverCache = {}; window.Repaint(); }

// Right-click menu
function on_mouse_rbtn_up(x, y) {
    const thumbSize = getThumbSize();
    let clickedPlaylist = -1;
    let yPos = padding;
    const count = plman.PlaylistCount;

    for (let i = 0; i < count; i++) {
        if (x >= padding && x <= padding + thumbSize && y >= yPos && y <= yPos + thumbSize) {
            clickedPlaylist = i; break;
        }
        yPos += thumbSize + padding;
    }

    const menu = window.CreatePopupMenu();
    if (clickedPlaylist >= 0) {
        menu.AppendMenuItem(0, 1, "Load Playlist");
        menu.AppendMenuItem(0, 2, "Rename Playlist");
        menu.AppendMenuItem(0, 3, "Delete Playlist");
    } else if (x <= 80 && y <= 80) {
        menu.AppendMenuItem(0, 4, "Increase Cover Art Size (+5px)");
        menu.AppendMenuItem(0, 5, "Decrease Cover Art Size (-5px)");
        menu.AppendMenuItem(0, 6, "Increase Cover Art Size (+10px)");
        menu.AppendMenuItem(0, 7, "Decrease Cover Art Size (-10px)");
        menu.AppendMenuItem(0, 8, "Add Playlist");
    } else {
        // empty space → SMP default menu
        window.DefinePopupMenu && window.DefinePopupMenu(x, y);
        return;
    }

    const idx = menu.TrackPopupMenu(x, y);

    switch(idx) {
            // inside on_mouse_rbtn_up switch:
    case 1: // Load Playlist (make active, not file dialog)
        if (clickedPlaylist >= 0) {
            plman.ActivePlaylist = clickedPlaylist;
        }
        break;

    case 2: // Rename Playlist
        if (clickedPlaylist >= 0) {
            let newName = utils.InputBox(0, "Enter new playlist name:", "Rename Playlist", plman.GetPlaylistName(clickedPlaylist), "");
            if (newName && newName.length > 0) {
                plman.RenamePlaylist(clickedPlaylist, newName);
                coverCache = {}; window.Repaint();
            }
        }
        break;

    case 3: // Delete Playlist
        if (clickedPlaylist >= 0) {
            const confirmed = utils.MessageBox ? utils.MessageBox("Delete this playlist?", "Confirm", 4) : 6;
            if (confirmed === 6) {
                plman.RemovePlaylist(clickedPlaylist);
                coverCache = {}; window.Repaint();
            }
        }
        break;

    case 4: increaseSize(5); break;
    case 5: decreaseSize(5); break;
    case 6: increaseSize(10); break;
    case 7: decreaseSize(10); break;

    case 8: // Add Playlist
        let name = utils.InputBox(0, "New playlist name:", "Add Playlist", "New Playlist", "");
        if (name) plman.CreatePlaylist(plman.PlaylistCount, name);
        break;

    }
}