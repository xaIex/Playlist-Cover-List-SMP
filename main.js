"use strict";

const DT_VCENTER   = 0x00000004;
const DT_NOPREFIX  = 0x00000800;
const DT_WORDBREAK = 0x00000010;

let ww = 0, wh = 0;
const padding = 10;
let mouseX = 0, mouseY = 0;

let hoverIndex = -1;     // currently hovered playlist
let selectedIndex = -1;  // last clicked playlist

let coverCache = {};
let coverArtSize = 60; // default thumbnail size

function getThumbSize() {
    const count = plman.PlaylistCount || 1;
    const maxThumb = 120;
    const minThumb = 30;
    let availableHeight = (wh - padding * (count + 1)) / count;
    return Math.max(minThumb, Math.min(maxThumb, availableHeight, coverArtSize));
}

function getBoxRect(i) {
    const thumbSize = getThumbSize();
    const y = padding + i * (thumbSize + padding);
    return { x: padding, y: y, w: thumbSize, h: thumbSize };
}

function on_paint(gr) {
    gr.FillSolidRect(0, 0, ww, wh, 0xFF191919);

    const count = plman.PlaylistCount;
    const thumbSize = getThumbSize();

    for (let i = 0; i < count; i++) {
        const box = getBoxRect(i);

        gr.FillSolidRect(box.x, box.y, box.w, box.h, 0xFF555555);

        if (!coverCache[i] && plman.PlaylistItemCount(i) > 0) {
            try {
                const track = plman.GetPlaylistItems(i)[0];
                const art = utils.GetAlbumArtV2(track, 0);
                if (art) {
                    coverCache[i] = gdi.CreateImage(box.w, box.h);
                    let tmpGr = coverCache[i].GetGraphics();
                    tmpGr.DrawImage(art, 0, 0, box.w, box.h, 0, 0, art.Width, art.Height);
                    tmpGr.ReleaseGraphics();
                }
            } catch (e) {}
        }

        if (coverCache[i]) {
            gr.DrawImage(coverCache[i], box.x, box.y, box.w, box.h, 0, 0, coverCache[i].Width, coverCache[i].Height);
        }

        // hover highlight
        if (i === hoverIndex) {
            gr.DrawRect(box.x - 1, box.y - 1, box.w + 2, box.h + 2, 2, 0xFFFFFFFF);
        }

        // selection highlight
        if (i === selectedIndex) {
            gr.DrawRect(box.x - 3, box.y - 3, box.w + 6, box.h + 6, 2, 0xFF00FF00); // green box
        }
    }

    // draw label for hovered item
    if (hoverIndex >= 0) {
        const name = plman.GetPlaylistName(hoverIndex);
        const box = getBoxRect(hoverIndex);
        const labelWidth = thumbSize * 3;
        const labelHeight = 100;

        let labelX;
        if (box.x + box.w + 5 + labelWidth <= ww) {
            labelX = box.x + box.w + 5;
        } else {
            labelX = Math.max(0, box.x - labelWidth - 5);
        }

        gr.FillSolidRect(labelX, box.y, labelWidth, labelHeight, 0xAA000000);
        gr.GdiDrawText(name, gdi.Font("Segoe UI", Math.max(12, Math.floor(thumbSize / 4))),
            0xFFFFFFFF, labelX + 5, box.y, labelWidth, labelHeight, DT_VCENTER | DT_NOPREFIX | DT_WORDBREAK);
    }
}

function on_size(w, h) { ww = w; wh = h; }

function hitTest(x, y) {
    const count = plman.PlaylistCount;
    for (let i = 0; i < count; i++) {
        const box = getBoxRect(i);
        if (x >= box.x && x <= box.x + box.w && y >= box.y && y <= box.y + box.h) {
            return i;
        }
    }
    return -1;
}

function on_mouse_move(x, y) {
    mouseX = x; mouseY = y;
    let newHover = hitTest(x, y);
    if (newHover !== hoverIndex) {
        hoverIndex = newHover;
        window.Repaint();
    }
}

function on_mouse_leave() {
    if (hoverIndex !== -1) {
        hoverIndex = -1;
        window.Repaint();
    }
}

function on_mouse_lbtn_up(x, y) {
    let clicked = hitTest(x, y);
    if (clicked !== -1) {
        selectedIndex = clicked;
        plman.ActivePlaylist = clicked;
        window.Repaint();
    }
}

// Playlist size menu
function increaseSize(px = 5) { coverArtSize = Math.min(200, coverArtSize + px); coverCache = {}; window.Repaint(); }
function decreaseSize(px = 5) { coverArtSize = Math.max(30, coverArtSize - px); coverCache = {}; window.Repaint(); }

// Right-click menu
function on_mouse_rbtn_up(x, y) {
    let clickedPlaylist = hitTest(x, y);

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
        return; // let SMP menu show
    }

    const idx = menu.TrackPopupMenu(x, y);

    switch(idx) {
    case 1: // Load Playlist (just set active for now)
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

function on_playlists_changed() {
    window.Repaint(); 
}