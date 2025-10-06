"use strict";

const DT_VCENTER   = 0x00000004;
const DT_NOPREFIX  = 0x00000800;
const DT_WORDBREAK = 0x00000010;

const DT_CENTER      = 0x00000001;
const DT_END_ELLIPSIS = 0x00008000;

let ww = 0, wh = 0;
const padding = 10;
let mouseX = 0, mouseY = 0;

let hoverIndex = -1;     
let selectedIndex = -1;  
const coverKeyPrefix = "SMP_CustomCoverByName_";

let coverCache = {}; // keyed by playlist name
let coverArtSize = window.GetProperty("SMP_CoverArtSize", 60);
let showNameBelowCover = window.GetProperty("SMP_ShowNameBelowCover", false);


// --- SCROLLING ---
let scrollY = 0;
const scrollSpeed = 50;
const coverListKey = "SMP_CustomCoverList";

// Load covers on startup
loadSavedCovers();

function coverKeyForName(name) {
    return coverKeyPrefix + encodeURIComponent(name);
}

function loadSavedCovers() {
    const savedList = window.GetProperty(coverListKey, "").split("|").filter(s => s);
    const count = plman.PlaylistCount;

    for (let i = 0; i < count; i++) {
        const name = plman.GetPlaylistName(i);
        const key = coverKeyForName(name);
        const path = window.GetProperty(key, "");
        if (path) {
            try {
                let img = gdi.Image(path);
                const thumbSize = getThumbSize();
                coverCache[name] = gdi.CreateImage(thumbSize, thumbSize);
                let tmpGr = coverCache[name].GetGraphics();
                tmpGr.DrawImage(img, 0, 0, thumbSize, thumbSize, 0, 0, img.Width, img.Height);
            } catch (e) {
                window.SetProperty(key, "");
            }
        }
    }
}

function saveCustomCover(i, path) {
    const name = plman.GetPlaylistName(i);
    const key = coverKeyForName(name);
    window.SetProperty(key, path);

    // update master list
    let savedList = window.GetProperty(coverListKey, "").split("|").filter(s => s);
    if (!savedList.includes(name)) savedList.push(name);
    window.SetProperty(coverListKey, savedList.join("|"));

    // update cache
    const thumbSize = getThumbSize();
    coverCache[name] = gdi.CreateImage(thumbSize, thumbSize);
    let tmpGr = coverCache[name].GetGraphics();
    let img = gdi.Image(path);
    tmpGr.DrawImage(img, 0, 0, thumbSize, thumbSize, 0, 0, img.Width, img.Height);
}

function cleanupOldCovers() {
    let savedList = window.GetProperty(coverListKey, "").split("|").filter(s => s);
    const existingNames = [];
    const count = plman.PlaylistCount;
    for (let i = 0; i < count; i++) existingNames.push(plman.GetPlaylistName(i));

    savedList.forEach(name => {
        if (!existingNames.includes(name)) {
            window.SetProperty(coverKeyForName(name), "");
            if (coverCache[name]) delete coverCache[name];
        }
    });

    // update master list
    savedList = savedList.filter(name => existingNames.includes(name));
    window.SetProperty(coverListKey, savedList.join("|"));
}

// --- THUMBNAIL / LAYOUT ---
function getThumbSize() {
    const maxThumb = 200;
    const minThumb = 30;
    return Math.max(minThumb, Math.min(maxThumb, coverArtSize));
}

function getBoxRect(i) {
    const thumbSize = getThumbSize();
    const extra = showNameBelowCover ? 22 : 0; // reserve 22px for the label
    const y = padding + i * (thumbSize + padding + extra);
    return { x: padding, y: y, w: thumbSize, h: thumbSize };
}


function getTotalContentHeight() {
    return plman.PlaylistCount * (getThumbSize() + padding) + padding;
}

// --- PAINT ---
function on_paint(gr) {
    gr.FillSolidRect(0, 0, ww, wh, 0xFF191919);

    const count = plman.PlaylistCount;
    const thumbSize = getThumbSize();

    for (let i = 0; i < count; i++) {
    const box = getBoxRect(i);
    const y = box.y - scrollY;

    if (y + box.h < 0 || y > wh) continue;

    // Draw default grey box
    gr.FillSolidRect(box.x, y, box.w, box.h, 0xFF555555);

    const name = plman.GetPlaylistName(i);

    // Load album art if not cached
    if (!coverCache[name] && plman.PlaylistItemCount(i) > 0) {
        try {
            const track = plman.GetPlaylistItems(i)[0];
            const art = utils.GetAlbumArtV2(track, 0);
            if (art) {
                coverCache[name] = gdi.CreateImage(box.w, box.h);
                let tmpGr = coverCache[name].GetGraphics();
                tmpGr.DrawImage(art, 0, 0, box.w, box.h, 0, 0, art.Width, art.Height);
            }
        } catch (e) {}
    }

    if (coverCache[name]) {
        gr.DrawImage(coverCache[name], box.x, y, box.w, box.h, 0, 0, coverCache[name].Width, coverCache[name].Height);
    }

    // Hover and selection highlights
    if (i === hoverIndex) gr.DrawRect(box.x - 1, y - 1, box.w + 2, box.h + 2, 2, 0xFFFFFFFF);
    if (i === selectedIndex) gr.DrawRect(box.x - 3, y - 3, box.w + 6, box.h + 6, 2, 0xFF00FF00);

    // --- Playlist name drawing ---
    if (showNameBelowCover) {
        // Always show below cover
        const labelHeight = 20;
        gr.FillSolidRect(box.x, y + box.h + 2, box.w, labelHeight, 0xAA000000);
        gr.GdiDrawText(name, gdi.Font("Segoe UI", 12),
            0xFFFFFFFF, box.x + 2, y + box.h + 2, box.w - 4, labelHeight, DT_CENTER | DT_VCENTER | DT_END_ELLIPSIS);
    } else if (i === hoverIndex && hoverIndex !== selectedIndex) {
        // Hover tooltip
        const labelWidth = Math.min(box.w * 4, ww - 2 * padding);
        const labelHeight = Math.min(120, wh - y);

        let labelX;
        if (box.x + box.w + 5 + labelWidth <= ww) {
            labelX = box.x + box.w + 5;
        } else {
            labelX = Math.max(0, box.x - labelWidth - 5);
        }

        gr.FillSolidRect(labelX, y, labelWidth, labelHeight, 0xAA000000);
        gr.GdiDrawText(name, gdi.Font("Segoe UI", Math.max(12, Math.floor(box.w / 4))),
            0xFFFFFFFF, labelX + 5, y, labelWidth, labelHeight, DT_VCENTER | DT_NOPREFIX | DT_WORDBREAK);
    }
}

}

// --- SIZE ---
function on_size(w, h) { ww = w; wh = h; }


// --- HIT TEST ---
function hitTest(x, y) {
    const count = plman.PlaylistCount;
    for (let i = 0; i < count; i++) {
        const box = getBoxRect(i);
        const yPos = box.y - scrollY;
        if (x >= box.x && x <= box.x + box.w && y >= yPos && y <= yPos + box.h) {
            return i;
        }
    }
    return -1;
}

// --- MOUSE ---
function on_mouse_move(x, y) {
    mouseX = x; mouseY = y;
    const newHover = hitTest(x, y);
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
    const idx = hitTest(x, y);
    if (idx >= 0) {
        selectedIndex = idx;
        hoverIndex = -1;
        plman.ActivePlaylist = idx;
        window.Repaint();
    }
}

// --- MOUSE WHEEL (SCROLL) ---
function on_mouse_wheel(delta) {
    const totalHeight = getTotalContentHeight();
    scrollY -= delta * scrollSpeed;
    scrollY = Math.max(0, Math.min(totalHeight - wh, scrollY));
    window.Repaint();
}

// --- SIZE ADJUSTMENT ---
function increaseSize(px = 5) {
    coverArtSize = Math.min(200, coverArtSize + px);
    window.SetProperty("SMP_CoverArtSize", coverArtSize);
    coverCache = {};
    loadSavedCovers();
    window.Repaint();
}

function decreaseSize(px = 5) {
    coverArtSize = Math.max(30, coverArtSize - px);
    window.SetProperty("SMP_CoverArtSize", coverArtSize);
    coverCache = {};
    loadSavedCovers();
    window.Repaint();
}

// --- RIGHT CLICK MENU ---
function on_mouse_rbtn_up(x, y) {
    const clickedPlaylist = hitTest(x, y);
    const menu = window.CreatePopupMenu();

    if (clickedPlaylist >= 0) {
        menu.AppendMenuItem(0, 1, "Load Playlist");
        menu.AppendMenuItem(0, 2, "Rename Playlist");
        menu.AppendMenuItem(0, 3, "Delete Playlist");
        menu.AppendMenuItem(0, 8, "Add Playlist");
        menu.AppendMenuItem(0, 9, "Add Custom Art Cover");
        menu.AppendMenuSeparator();
        menu.AppendMenuItem(0, 10, showNameBelowCover ? "Hover Label Mode" : "Always Below Cover");

    } else if (x <= 80 && y <= 80) {
        menu.AppendMenuItem(0, 4, "Increase Cover Art Size (+5px)");
        menu.AppendMenuItem(0, 5, "Decrease Cover Art Size (-5px)");
        menu.AppendMenuItem(0, 6, "Increase Cover Art Size (+10px)");
        menu.AppendMenuItem(0, 7, "Decrease Cover Art Size (-10px)"); 
        
    } else return;

    const idx = menu.TrackPopupMenu(x, y);

    switch(idx) {
        case 1:
            if (clickedPlaylist >= 0) plman.ActivePlaylist = clickedPlaylist;
            break;
        case 2:
            if (clickedPlaylist >= 0) {
                const oldName = plman.GetPlaylistName(clickedPlaylist);
                const newName = utils.InputBox(0, "Enter new playlist name:", "Rename Playlist", oldName, "");
                if (newName && newName !== oldName) {
                    plman.RenamePlaylist(clickedPlaylist, newName);

                    // preserve custom cover if it exists
                    const oldKey = coverKeyForName(oldName);
                    const oldPath = window.GetProperty(oldKey, "");
                    if (oldPath && oldPath.length > 0) {
                        window.SetProperty(coverKeyForName(newName), oldPath);
                        window.SetProperty(oldKey, "");
                    }

                    coverCache = {};
                    loadSavedCovers();
                    window.Repaint();
                }
            }
            break;
        case 3: // Delete Playlist
            if (clickedPlaylist >= 0) {
                const name = plman.GetPlaylistName(clickedPlaylist);
                const confirmed = utils.MessageBox ? utils.MessageBox("Delete this playlist?", "Confirm", 4) : 6;
                if (confirmed === 6) {
                    plman.RemovePlaylist(clickedPlaylist);
                    cleanupOldCovers();   // remove old properties
                    loadSavedCovers();    // reload remaining covers
                    window.Repaint();
                }
            }
            break;
        case 4: increaseSize(5); break;
        case 5: decreaseSize(5); break;
        case 6: increaseSize(10); break;
        case 7: decreaseSize(10); break;
        case 8:
            const name = utils.InputBox(0, "New playlist name:", "Add Playlist", "New Playlist", "");
            if (name) {
                plman.CreatePlaylist(plman.PlaylistCount, name);
            }
            break;
        case 9: // Set Custom Cover
            if (clickedPlaylist >= 0) {
                let path = utils.InputBox(0, "Enter full path to image file for custom cover:", "Custom Cover", "");
                if (path && path.length > 0) {
                    try {
                        saveCustomCover(clickedPlaylist, path);
                        window.Repaint();
                    } catch (e) {
                        fb.ShowPopupMessage("Failed to load image.", "Error");
                    }
                }
            }
            break;
        case 10:
            showNameBelowCover = !showNameBelowCover;
            window.SetProperty("SMP_ShowNameBelowCover", showNameBelowCover);
            window.Repaint(); 
            break;

    }
}

// --- PLAYLIST CHANGES ---
function on_playlists_changed() {
    cleanupOldCovers();
    loadSavedCovers();
    window.Repaint();
}