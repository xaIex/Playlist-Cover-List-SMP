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
let coverArtSize = window.GetProperty("SMP_CoverArtSize", 140);
let showNameBelowCover = window.GetProperty("SMP_ShowNameBelowCover", false);

// Color Customization 
let bgColor = window.GetProperty("SMP_BGColor", 0xFF191919); // default Foobar dark
let fontColor  = window.GetProperty("SMP_FontColor", 0xFFFFFFFF); // default white
let hoverBorderColor   = window.GetProperty("SMP_HoverBorderColor", 0xFFFFFFFF); // default white
let selectedBorderColor = window.GetProperty("SMP_SelectedBorderColor", 0xFF00FF00); // default green



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
    const extra = showNameBelowCover ? 44 : 0; // reserve 22px for the label
    const y = padding + i * (thumbSize + padding + extra);
    return { x: padding, y: y, w: thumbSize, h: thumbSize };
}


function getTotalContentHeight() {
    const thumbSize = getThumbSize();
    const extra = showNameBelowCover ? 44 : 0; // same as in getBoxRect
    return plman.PlaylistCount * (thumbSize + padding + extra) + padding;
}


// --- USER FONT ---
// Default font
let userFontName = window.GetProperty("Font Family", "Segoe UI");

function getUserFont(size, style = 0) {
    try {
        // Try DUI first
        return window.GetFontDUI(size, style, 0);
    } catch (e) {
        // Fallback to user-selected font in CUI
        return gdi.Font(userFontName, size, style);
    }
}

// --- PANEL PROPERTIES HANDLER ---
function on_font_property_change() {
    const input = utils.InputBox(0, "Enter font family:", "Font Family", userFontName, "");
    if (input && input.length > 0) {
        userFontName = input;
        window.SetProperty("Font Family", userFontName);
        window.Repaint();
    }
}
// --- PAINT ---
function on_paint(gr) {
    const totalHeight = getTotalContentHeight();

    // Clamp scrollY
    if (scrollY > totalHeight - wh) scrollY = Math.max(0, totalHeight - wh);

    gr.FillSolidRect(0, 0, ww, wh, bgColor);

    const count = plman.PlaylistCount;
    const thumbSize = getThumbSize();

    for (let i = 0; i < count; i++) {
        const box = getBoxRect(i);
        const y = box.y - scrollY;

        if (y + box.h < 0 || y > wh) continue;

        // Default grey box
        gr.FillSolidRect(box.x, y, box.w, box.h, 0xFF555555);

        const name = plman.GetPlaylistName(i);
        const trackCount = plman.PlaylistItemCount(i);

        // Load album art if not cached
        if (!coverCache[name] && trackCount > 0) {
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
        if (i === hoverIndex) gr.DrawRect(box.x - 1, y - 1, box.w + 2, box.h + 2, 2, hoverBorderColor);
        if (i === selectedIndex) gr.DrawRect(box.x - 3, y - 3, box.w + 6, box.h + 6, 2, selectedBorderColor);

        // --- Playlist name + track count drawing ---
        if (showNameBelowCover) {
        const font = getUserFont(12, 1); // Bold Playlist Name (1)
        const fontTrack = getUserFont(12, 2); // Change 2 to 1 if you want the track number bolded as well
        const maxNameHeight = 20; // single line height

        // Draw playlist name (truncated if too long)
        gr.GdiDrawText(
            name,
            font,
            fontColor,
            box.x + 2,
            y + box.h + 4,
            box.w - 4,
            maxNameHeight,
            DT_CENTER | DT_VCENTER | DT_END_ELLIPSIS | DT_NOPREFIX
        );

        // Draw track count below name
        const trackText = `${trackCount} tracks`;
        gr.GdiDrawText(
            trackText,
            fontTrack,
            fontColor,
            box.x + 2,
            y + box.h + 2 + maxNameHeight,
            box.w - 4,
            20,
            DT_CENTER | DT_VCENTER | DT_NOPREFIX
        );
    } else if (i === hoverIndex && hoverIndex !== selectedIndex) {
        const dynamicSize = Math.max(10, Math.min(14, Math.floor(box.w / 6)));
        const font = getUserFont(dynamicSize, 1);
        const fontTrack = getUserFont(dynamicSize, 2);
        const trackText = `${trackCount} tracks`;
        const paddingX = 6;

        // Measure text sizes
        const nameMetrics = gr.MeasureString(name, font, 0, 0, box.w * 3, 50, DT_END_ELLIPSIS | DT_NOPREFIX);
        const trackMetrics = gr.MeasureString(trackText, font, 0, 0, box.w * 3, 50, DT_NOPREFIX);

        // Calculate background size
        const bgWidth = Math.min(Math.max(nameMetrics.Width, trackMetrics.Width) + paddingX * 2, ww - 2 * padding);
        const bgHeight = nameMetrics.Height + trackMetrics.Height + paddingX * 3;

        const bgX = box.x + (box.w - bgWidth) / 2;
        const bgY = y + (box.h - bgHeight) / 2;

        // Draw rounded semi-transparent background
        gr.FillRoundRect(bgX, bgY, bgWidth, bgHeight, 9, 9, 0x80000000);

        // Draw playlist name (top line, truncated)
        gr.GdiDrawText(
            name,
            font,
            fontColor,
            bgX + paddingX,
            bgY + paddingX,
            bgWidth - paddingX * 2,
            nameMetrics.Height,
            DT_CENTER | DT_VCENTER | DT_END_ELLIPSIS | DT_NOPREFIX
        );

        // Draw track count (bottom line)
        gr.GdiDrawText(
            trackText,
            fontTrack,
            fontColor,
            bgX + paddingX,
            bgY + paddingX + nameMetrics.Height + 2,
            bgWidth - paddingX * 2,
            trackMetrics.Height,
            DT_CENTER | DT_VCENTER | DT_NOPREFIX
        );
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

    // Clamp scrollY robustly
    scrollY = Math.max(0, Math.min(scrollY, Math.max(0, totalHeight - wh)));
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
        menu.AppendMenuItem(0, 6, "Add Custom Art Cover");
        menu.AppendMenuSeparator();
        menu.AppendMenuItem(0, 1, "Load Playlist");
        menu.AppendMenuItem(0, 2, "Rename Playlist");
        menu.AppendMenuItem(0, 3, "Delete Playlist");
        menu.AppendMenuItem(0, 4, "Add Playlist");
        menu.AppendMenuItem(0, 5, "Save as");
        menu.AppendMenuSeparator();
        menu.AppendMenuItem(clickedPlaylist > 0 ? 0 : 4, 13, "Move Up");
        menu.AppendMenuItem(clickedPlaylist < plman.PlaylistCount - 1 ? 0 : 4, 14, "Move Down");

        menu.AppendMenuSeparator();
        menu.AppendMenuItem(0, 6, "Add Custom Art Cover");
        menu.AppendMenuItem(0, 8, "Set Font Family");
        menu.AppendMenuItem(0, 9, "Set Background Color");
        menu.AppendMenuItem(0, 10, "Set Font Color");
        menu.AppendMenuItem(0, 11, "Set Hover Border Color");
        menu.AppendMenuItem(0, 12, "Set Selected Border Color");
        menu.AppendMenuSeparator();
        menu.AppendMenuItem(0, 7, "Toggle Layout: Hover/Text"); 

    } else return;

    const idx = menu.TrackPopupMenu(x, y);

    switch(idx) {
        case 1: { // Load
            const filePath = utils.InputBox(window.ID,
                "Enter the path to the playlist file (.fpl / .m3u / .m3u8):",
                "Load Playlist",
                ""
            );

            if (filePath && utils.FileTest(filePath, "e")) {
                const name = utils.SplitFilePath(filePath)[1];
                const newIndex = plman.CreatePlaylist(plman.PlaylistCount, name);
                plman.ActivePlaylist = newIndex;
                plman.AddLocations(newIndex, [filePath]);
                window.Repaint();
            } else if (filePath) {
                fb.ShowPopupMessage("File not found or inaccessible.", "Load Playlist");
            }
            break;
        }

        case 2: // Rename
            if (clickedPlaylist >= 0) {
                const oldName = plman.GetPlaylistName(clickedPlaylist);
                const newName = utils.InputBox(0, "Enter new playlist name:", "Rename Playlist", oldName, "");
                if (newName && newName !== oldName) {
                    plman.RenamePlaylist(clickedPlaylist, newName);
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

        case 3: // Delete
            if (clickedPlaylist >= 0) {
                const name = plman.GetPlaylistName(clickedPlaylist);
                const confirmed = utils.MessageBox ? utils.MessageBox("Delete this playlist?", "Confirm", 4) : 6;
                if (confirmed === 6) {
                    plman.RemovePlaylist(clickedPlaylist);
                    cleanupOldCovers();
                    loadSavedCovers();
                    window.Repaint();
                }
            }
            break;

        case 4: // Add Playlist
            const name = utils.InputBox(0, "New playlist name:", "Add Playlist", "New Playlist", "");
            if (name) {
                plman.CreatePlaylist(plman.PlaylistCount, name);
            }
            break;
            
        case 5: { // Save playlist
            if (clickedPlaylist >= 0) {
                let saveFolder = window.GetProperty("SMP_PlaylistSavePath", "");
                if (!saveFolder || saveFolder.length === 0) {
                    fb.ShowPopupMessage("No save folder defined.\nSet SMP_PlaylistSavePath in panel properties.", "Save Playlist");
                    break;
                }
                try {
                    const fso = new ActiveXObject("Scripting.FileSystemObject");
                    if (!fso.FolderExists(saveFolder)) fso.CreateFolder(saveFolder);
                    const playlistName = plman.GetPlaylistName(clickedPlaylist).replace(/[\\\/:\*\?"<>\|]/g, "_");
                    const finalPath = saveFolder + "\\" + playlistName + ".fpl";
                    fb.SavePlaylist(finalPath, clickedPlaylist);
                    fb.ShowPopupMessage("Playlist saved:\n" + finalPath, "Save Playlist");
                } catch (e) {
                    fb.ShowPopupMessage("Failed to save playlist.\n" + e.message, "Save Playlist");
                }
            }
            break;
        }

        case 6: // Custom cover
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

        case 7: // Toggle layout
            showNameBelowCover = !showNameBelowCover;
            window.SetProperty("SMP_ShowNameBelowCover", showNameBelowCover);
            window.Repaint();
            break;

        case 8: on_font_property_change(); break;

        case 9: // Background color using RGB format (R-G-B)
            let input = utils.InputBox(0, "Enter background color in RGB format (R-G-B, e.g., 255-25-100):", "Set Background Color", "");
            if (input) {
                const parts = input.split('-');
                if (parts.length === 3) {
                    let r = parseInt(parts[0], 10);
                    let g = parseInt(parts[1], 10);
                    let b = parseInt(parts[2], 10);

                    if (!isNaN(r) && !isNaN(g) && !isNaN(b) &&
                        r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255) {

                        // Build ARGB value with full alpha (0xFF)
                        bgColor = (0xFF << 24) | (r << 16) | (g << 8) | b;
                        window.SetProperty("SMP_BGColor", bgColor);
                        window.Repaint();
                    } else {
                        fb.ShowPopupMessage("Invalid RGB values. Each value must be 0-255.", "Error");
                    }
                } else {
                    fb.ShowPopupMessage("Invalid format. Use R-G-B (e.g., 255-25-100).", "Error");
                }
            }
            break;


        case 10: // Font color 
            var fontInput = utils.InputBox(0, "Enter font color in RGB format (R-G-B, e.g., 255-25-100):", "Set Font Color", "");
            if (fontInput) {
                const parts = fontInput.split('-');
                if (parts.length === 3) {
                    let r = parseInt(parts[0], 10);
                    let g = parseInt(parts[1], 10);
                    let b = parseInt(parts[2], 10);

                    if (!isNaN(r) && !isNaN(g) && !isNaN(b) &&
                        r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255) {

                        // Build ARGB value with full alpha (0xFF)
                        fontColor = (0xFF << 24) | (r << 16) | (g << 8) | b;
                        window.SetProperty("SMP_FontColor", fontColor);
                        window.Repaint();
                    } else {
                        fb.ShowPopupMessage("Invalid RGB values. Each value must be 0-255.", "Error");
                    }
                } else {
                    fb.ShowPopupMessage("Invalid format. Use R-G-B (e.g., 255-25-100).", "Error");
                }
            }
            break;


        case 11: // Hover border color
            var hoverInput = utils.InputBox(0, "Enter hover border color in RGB format (R-G-B, e.g., 255-0-0 for red):", "Set Hover Border Color", "");
            if (hoverInput) {
                const parts = hoverInput.split('-');
                if (parts.length === 3) {
                    let r = parseInt(parts[0], 10);
                    let g = parseInt(parts[1], 10);
                    let b = parseInt(parts[2], 10);

                    if (!isNaN(r) && !isNaN(g) && !isNaN(b) &&
                        r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255) {

                        // Build ARGB value with full alpha (0xFF)
                        hoverBorderColor = (0xFF << 24) | (r << 16) | (g << 8) | b;
                        window.SetProperty("SMP_HoverBorderColor", hoverBorderColor);
                        window.Repaint();
                    } else {
                        fb.ShowPopupMessage("Invalid RGB values. Each value must be 0-255.", "Error");
                    }
                } else {
                    fb.ShowPopupMessage("Invalid format. Use R-G-B (e.g., 255-0-0).", "Error");
                }
            }
            break;


      case 12: // Selected border color using RGB format (R-G-B)
            var selInput = utils.InputBox(0, "Enter selected border color in RGB format (R-G-B, e.g., 0-0-255 for blue):", "Set Selected Border Color", "");
            if (selInput) {
                const parts = selInput.split('-');
                if (parts.length === 3) {
                    let r = parseInt(parts[0], 10);
                    let g = parseInt(parts[1], 10);
                    let b = parseInt(parts[2], 10);

                    if (!isNaN(r) && !isNaN(g) && !isNaN(b) &&
                        r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255) {

                        // Build ARGB value with full alpha (0xFF)
                        selectedBorderColor = (0xFF << 24) | (r << 16) | (g << 8) | b;
                        window.SetProperty("SMP_SelectedBorderColor", selectedBorderColor);
                        window.Repaint();
                    } else {
                        fb.ShowPopupMessage("Invalid RGB values. Each value must be 0-255.", "Error");
                    }
                } else {
                    fb.ShowPopupMessage("Invalid format. Use R-G-B (e.g., 0-0-255).", "Error");
                }
            }
            break;


        case 13: // Move Up
            if (clickedPlaylist > 0) {
                plman.MovePlaylist(clickedPlaylist, clickedPlaylist - 1);
                selectedIndex = clickedPlaylist - 1;
                plman.ActivePlaylist = selectedIndex;
                window.Repaint();
            }
            break;

        case 14: // Move Down
            if (clickedPlaylist < plman.PlaylistCount - 1) {
                plman.MovePlaylist(clickedPlaylist, clickedPlaylist + 1);
                selectedIndex = clickedPlaylist + 1;
                plman.ActivePlaylist = selectedIndex;
                window.Repaint();
            }
            break;


    }
}



// --- PLAYLIST CHANGES ---
function on_playlists_changed() {
    cleanupOldCovers();
    loadSavedCovers();
    window.Repaint();
}