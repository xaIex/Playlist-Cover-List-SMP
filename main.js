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

// Store all custom covers in one JSON property instead of multiple properties
let customCovers = {}; // Object: { playlistName: imagePath }
const customCoversKey = "DATA:CustomCovers_JSON";

// Save folder location
 let saveFolder = window.GetProperty("DATA:PlaylistSavePath", "");

let coverCache = {}; // keyed by playlist name
let coverArtSize = window.GetProperty("DISPLAY:CoverArtSize(30-200)", 140);
let showNameBelowCover = window.GetProperty("DISPLAY:ShowNameBelowCover", false);
let layoutMode = window.GetProperty("DISPLAY:LayoutMode", "vertical"); // "vertical" or "horizontal"

// Color Customization 
let bgColor = window.GetProperty("COLOR:BGColor", 0xFF191919);
let fontColor  = window.GetProperty("COLOR:FontColor", 0xFFFFFFFF);
let hoverBorderColor   = window.GetProperty("COLOR:HoverBorderColor", 0xFFFFFFFF);
let selectedBorderColor = window.GetProperty("COLOR:SelectedBorderColor", 0xFF00FF00);

// === WALLPAPER & BLUR SETTINGS ===
let showWallpaper = window.GetProperty("WALLPAPER:ShowWallpaper", false);
let wallpaperBlurred = window.GetProperty("WALLPAPER:WallpaperBlurred", true);
let wallpaperBlurValue = window.GetProperty("WALLPAPER:WallpaperBlurValue", 15); // 1-90, lower = more blur
let wallpaperOverlayAlpha = window.GetProperty("WALLPAPER:WallpaperOverlayAlpha", 180); // 0-255

let wallpaperImg = null;
let lastPlayingPath = "";

// --- SCROLLING ---
let scrollY = 0;
let scrollX = 0;
const scrollSpeed = 70;

// Load custom covers from JSON on startup
loadCustomCovers();

function loadCustomCovers() {
    try {
        const json = window.GetProperty(customCoversKey, "{}");
        customCovers = JSON.parse(json);
    } catch (e) {
        customCovers = {};
    }
}

function saveCustomCovers() {
    try {
        window.SetProperty(customCoversKey, JSON.stringify(customCovers));
    } catch (e) {
        fb.ShowPopupMessage("Failed to save custom covers.", "Error");
    }
}

function loadSavedCovers() {
    const count = plman.PlaylistCount;

    for (let i = 0; i < count; i++) {
        const name = plman.GetPlaylistName(i);
        const path = customCovers[name];
        
        if (path) {
            try {
                let img = gdi.Image(path);
                const thumbSize = getThumbSize();
                coverCache[name] = gdi.CreateImage(thumbSize, thumbSize);
                let tmpGr = coverCache[name].GetGraphics();
                tmpGr.DrawImage(img, 0, 0, thumbSize, thumbSize, 0, 0, img.Width, img.Height);
                coverCache[name].ReleaseGraphics(tmpGr);
            } catch (e) {
                // Remove invalid path
                delete customCovers[name];
                saveCustomCovers();
            }
        }
    }
}

function saveCustomCover(i, path) {
    const name = plman.GetPlaylistName(i);
    customCovers[name] = path;
    saveCustomCovers();

    // Update cache
    try {
        const thumbSize = getThumbSize();
        coverCache[name] = gdi.CreateImage(thumbSize, thumbSize);
        let tmpGr = coverCache[name].GetGraphics();
        let img = gdi.Image(path);
        tmpGr.DrawImage(img, 0, 0, thumbSize, thumbSize, 0, 0, img.Width, img.Height);
        coverCache[name].ReleaseGraphics(tmpGr);
    } catch (e) {
        fb.ShowPopupMessage("Failed to load image.", "Error");
    }
}

function cleanupOldCovers() {
    const existingNames = [];
    const count = plman.PlaylistCount;
    for (let i = 0; i < count; i++) existingNames.push(plman.GetPlaylistName(i));

    // Remove covers for deleted playlists
    Object.keys(customCovers).forEach(name => {
        if (!existingNames.includes(name)) {
            delete customCovers[name];
            if (coverCache[name]) delete coverCache[name];
        }
    });

    saveCustomCovers();
}

// Load covers after custom covers are initialized
loadSavedCovers();

// === WALLPAPER FUNCTIONS ===
function drawImage(gr, img, src_x, src_y, src_w, src_h, auto_fill) {
    if (!img || !src_w || !src_h) return;
    
    gr.SetInterpolationMode(7);
    
    if (auto_fill) {
        if (img.Width / img.Height < src_w / src_h) {
            var dst_w = img.Width;
            var dst_h = Math.round(src_h * img.Width / src_w);
            var dst_x = 0;
            var dst_y = Math.round((img.Height - dst_h) / 4);
        } else {
            var dst_w = Math.round(src_w * img.Height / src_h);
            var dst_h = img.Height;
            var dst_x = Math.round((img.Width - dst_w) / 2);
            var dst_y = 0;
        }
        gr.DrawImage(img, src_x, src_y, src_w, src_h, dst_x + 3, dst_y + 3, dst_w - 6, dst_h - 6, 0, 255);
    }
}

function draw_blurred_image(image, ix, iy, iw, ih, bx, by, bw, bh, blur_value, overlay_color) {
    var blurValue = blur_value;
    try {
        var imgA = image.Resize(iw * blurValue / 100, ih * blurValue / 100, 2);
        var imgB = imgA.Resize(iw, ih, 2);
    } catch (e) {
        return null;
    }

    var bbox = gdi.CreateImage(bw, bh);
    var gb = bbox.GetGraphics();
    var offset = 90 - blurValue;
    gb.DrawImage(imgB, 0 - offset, 0 - (ih - bh) - offset, iw + offset * 2, ih + offset * 2, 0, 0, imgB.Width, imgB.Height, 0, 255);
    bbox.ReleaseGraphics(gb);

    var newImg = gdi.CreateImage(iw, ih);
    var gb = newImg.GetGraphics();

    if (ix != bx || iy != by || iw != bw || ih != bh) {
        gb.DrawImage(image, ix, iy, iw, ih, 0, 0, image.Width, image.Height, 0, 255);
        gb.FillSolidRect(bx, by, bw, bh, 0xffffffff);
    }
    gb.DrawImage(bbox, bx, by, bw, bh, 0, 0, bbox.Width, bbox.Height, 0, 255);

    if (overlay_color != null) {
        gb.FillSolidRect(bx, by, bw, bh, overlay_color);
    }

    if (ix != bx || iy != by || iw != bw || ih != bh) {
        gb.FillSolidRect(bx, by, bw, 1, 0x22ffffff);
        gb.FillSolidRect(bx, by - 1, bw, 1, 0x22000000);
    }
    newImg.ReleaseGraphics(gb);

    return newImg;
}

function FormatWallpaper(img) {
    if (!img || !ww || !wh) return img;

    var tmp_img = gdi.CreateImage(ww, wh);
    var gp = tmp_img.GetGraphics();
    gp.SetInterpolationMode(7);
    drawImage(gp, img, 0, 0, ww, wh, 1);
    tmp_img.ReleaseGraphics(gp);

    if (wallpaperBlurred) {
        tmp_img = draw_blurred_image(tmp_img, 0, 0, tmp_img.Width, tmp_img.Height, 0, 0, tmp_img.Width, tmp_img.Height, wallpaperBlurValue, 
            (wallpaperOverlayAlpha << 24) | 0x00000000);
    }

    return tmp_img;
}

function setWallpaperImg() {
    if (!fb.IsPlaying || !showWallpaper) {
        wallpaperImg = null;
        return;
    }

    try {
        var nowPlaying = fb.GetNowPlaying();
        var currentPath = fb.TitleFormat("%path%").Eval();
        
        // Only update if song changed
        if (currentPath === lastPlayingPath && wallpaperImg) return;
        lastPlayingPath = currentPath;

        var tmp = utils.GetAlbumArtV2(nowPlaying, 0);
        if (tmp) {
            wallpaperImg = FormatWallpaper(tmp);
        } else {
            wallpaperImg = null;
        }
    } catch (e) {
        wallpaperImg = null;
    }
}

// --- THUMBNAIL / LAYOUT ---
function getThumbSize() {
    const maxThumb = 200;
    const minThumb = 30;
    return Math.max(minThumb, Math.min(maxThumb, coverArtSize));
}

function getBoxRect(i) {
    const thumbSize = getThumbSize();
    const extra = showNameBelowCover ? 44 : 0;
    
    if (layoutMode === "horizontal") {
        const x = padding + i * (thumbSize + padding);
        return { x: x, y: padding, w: thumbSize, h: thumbSize };
    } else {
        // Vertical layout
        const y = padding + i * (thumbSize + padding + extra);
        return { x: padding, y: y, w: thumbSize, h: thumbSize };
    }
}

function getTotalContentHeight() {
    const thumbSize = getThumbSize();
    const extra = showNameBelowCover ? 44 : 0;
    
    if (layoutMode === "horizontal") {
        return thumbSize + padding * 2 + extra;
    } else {
        return plman.PlaylistCount * (thumbSize + padding + extra) + padding;
    }
}

function getTotalContentWidth() {
    const thumbSize = getThumbSize();
    return plman.PlaylistCount * (thumbSize + padding) + padding;
}

// --- USER FONT ---
let userFontName = window.GetProperty("DATA:FontFamily", "Segoe UI");

function getUserFont(size, style = 0) {
    try {
        return window.GetFontDUI(size, style, 0);
    } catch (e) {
        return gdi.Font(userFontName, size, style);
    }
}

function on_font_property_change() {
    const input = utils.InputBox(0, "Enter font family:", "DATA:FontFamily", userFontName, "");
    if (input && input.length > 0) {
        userFontName = input;
        window.SetProperty("Data:FontFamily", userFontName);
        window.Repaint();
    }
}

// --- PAINT ---
function on_paint(gr) {
    const totalHeight = getTotalContentHeight();
    const totalWidth = getTotalContentWidth();

    // Clamp scroll positions
    if (layoutMode === "horizontal") {
        if (scrollX > totalWidth - ww) scrollX = Math.max(0, totalWidth - ww);
    } else {
        if (scrollY > totalHeight - wh) scrollY = Math.max(0, totalHeight - wh);
    }

    // Draw wallpaper background if enabled
    if (showWallpaper && wallpaperImg) {
        gr.DrawImage(wallpaperImg, 0, 0, ww, wh, 0, 0, wallpaperImg.Width, wallpaperImg.Height, 0, 255);
    } else {
        gr.FillSolidRect(0, 0, ww, wh, bgColor);
    }

    const count = plman.PlaylistCount;
    const thumbSize = getThumbSize();

    for (let i = 0; i < count; i++) {
        const box = getBoxRect(i);
        
        // Calculate position based on layout mode
        let x, y;
        if (layoutMode === "horizontal") {
            x = box.x - scrollX;
            y = box.y;
            // Skip if outside horizontal viewport
            if (x + box.w < 0 || x > ww) continue;
        } else {
            x = box.x;
            y = box.y - scrollY;
            // Skip if outside vertical viewport
            if (y + box.h < 0 || y > wh) continue;
        }

        gr.FillSolidRect(x, y, box.w, box.h, 0xFF555555);

        const name = plman.GetPlaylistName(i);
        const trackCount = plman.PlaylistItemCount(i);

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
            gr.DrawImage(coverCache[name], x, y, box.w, box.h, 0, 0, coverCache[name].Width, coverCache[name].Height);
        }

        if (i === hoverIndex) gr.DrawRect(x - 1, y - 1, box.w + 2, box.h + 2, 2, hoverBorderColor);
        if (i === selectedIndex) gr.DrawRect(x - 3, y - 3, box.w + 6, box.h + 6, 2, selectedBorderColor);

        if (showNameBelowCover && layoutMode === "vertical") {
            const font = getUserFont(12, 1);
            const fontTrack = getUserFont(12, 2);
            const maxNameHeight = 20;

            gr.GdiDrawText(name, font, fontColor, x + 2, y + box.h + 6, box.w - 4, maxNameHeight,
                DT_CENTER | DT_VCENTER | DT_END_ELLIPSIS | DT_NOPREFIX);

            const trackText = `${trackCount} tracks`;
            gr.GdiDrawText(trackText, fontTrack, fontColor, x + 2, y + box.h + 2 + maxNameHeight, 
                box.w - 4, 20, DT_CENTER | DT_VCENTER | DT_NOPREFIX);
        } else if (i === hoverIndex && hoverIndex !== selectedIndex) {
            const dynamicSize = Math.max(10, Math.min(14, Math.floor(box.w / 6)));
            const font = getUserFont(dynamicSize, 1);
            const fontTrack = getUserFont(dynamicSize, 2);
            const trackText = `${trackCount} tracks`;
            const paddingX = 6;

            const nameMetrics = gr.MeasureString(name, font, 0, 0, box.w * 3, 50, DT_END_ELLIPSIS | DT_NOPREFIX);
            const trackMetrics = gr.MeasureString(trackText, font, 0, 0, box.w * 3, 50, DT_NOPREFIX);

            const bgWidth = Math.min(Math.max(nameMetrics.Width, trackMetrics.Width) + paddingX * 2, ww - 2 * padding);
            const bgHeight = nameMetrics.Height + trackMetrics.Height + paddingX * 3;

            const bgX = x + (box.w - bgWidth) / 2;
            const bgY = y + (box.h - bgHeight) / 2;

            gr.FillRoundRect(bgX, bgY, bgWidth, bgHeight, 9, 9, 0x80000000);

            gr.GdiDrawText(name, font, fontColor, bgX + paddingX, bgY + paddingX, bgWidth - paddingX * 2,
                nameMetrics.Height, DT_CENTER | DT_VCENTER | DT_END_ELLIPSIS | DT_NOPREFIX);

            gr.GdiDrawText(trackText, fontTrack, fontColor, bgX + paddingX, bgY + paddingX + nameMetrics.Height + 2,
                bgWidth - paddingX * 2, trackMetrics.Height, DT_CENTER | DT_VCENTER | DT_NOPREFIX);
        }
    }
}

// --- SIZE ---
function on_size(w, h) { 
    ww = w; 
    wh = h;
    if (showWallpaper && fb.IsPlaying) {
        setWallpaperImg();
    }
}

// --- HIT TEST ---
function hitTest(x, y) {
    const count = plman.PlaylistCount;
    for (let i = 0; i < count; i++) {
        const box = getBoxRect(i);
        
        let xPos, yPos;
        if (layoutMode === "horizontal") {
            xPos = box.x - scrollX;
            yPos = box.y;
        } else {
            xPos = box.x;
            yPos = box.y - scrollY;
        }
        
        if (x >= xPos && x <= xPos + box.w && y >= yPos && y <= yPos + box.h) {
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

function on_mouse_lbtn_dblclk(x, y) {
    const idx = hitTest(x, y);
    if (idx >= 0) {
        const trackCount = plman.PlaylistItemCount(idx);
        if (trackCount > 0) {
            // Set as active playlist
            plman.ActivePlaylist = idx;
            
            // Play random track from this playlist
            const randomTrack = Math.floor(Math.random() * trackCount);
            plman.ExecutePlaylistDefaultAction(idx, randomTrack);
            
            selectedIndex = idx;
            window.Repaint();
        } else {
            fb.ShowPopupMessage("This playlist is empty", "Cannot Play");
        }
    }
}

function on_mouse_wheel(delta) {
    if (layoutMode === "horizontal") {
        const totalWidth = getTotalContentWidth();
        scrollX -= delta * scrollSpeed;
        scrollX = Math.max(0, Math.min(scrollX, Math.max(0, totalWidth - ww)));
    } else {
        const totalHeight = getTotalContentHeight();
        scrollY -= delta * scrollSpeed;
        scrollY = Math.max(0, Math.min(scrollY, Math.max(0, totalHeight - wh)));
    }
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
        menu.AppendMenuItem(0, 4, "Add Playlist");
        menu.AppendMenuItem(0, 21, "Duplicate Playlist");
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
        menu.AppendMenuItem(0, 15, showWallpaper ? "✓ Show Wallpaper" : "Show Wallpaper");
        menu.AppendMenuItem(showWallpaper ? 0 : 4, 16, wallpaperBlurred ? "✓ Blur Wallpaper" : "Blur Wallpaper");
        menu.AppendMenuItem(showWallpaper ? 0 : 4, 17, "Set Blur Amount (1-90)");
        menu.AppendMenuItem(showWallpaper ? 0 : 4, 18, "Set Overlay Darkness (0-255)");
        menu.AppendMenuSeparator();
        menu.AppendMenuItem(0, 19, layoutMode === "horizontal" ? "✓ Horizontal Layout" : "Horizontal Layout");
        menu.AppendMenuItem(0, 20, layoutMode === "vertical" ? "✓ Vertical Layout" : "Vertical Layout");
        menu.AppendMenuSeparator();
        menu.AppendMenuItem(0, 7, "Toggle Layout: Hover/Text");
    } else return;

    const idx = menu.TrackPopupMenu(x, y);

    switch(idx) {
        case 1: {
            const filePath = utils.InputBox(window.ID,
                "Enter the path to the playlist file (.fpl / .m3u / .m3u8):",
                "Load Playlist", "");

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

        case 2:
            if (clickedPlaylist >= 0) {
                const oldName = plman.GetPlaylistName(clickedPlaylist);
                const newName = utils.InputBox(0, "Enter new playlist name:", "Rename Playlist", oldName, "");
                if (newName && newName !== oldName) {
                    plman.RenamePlaylist(clickedPlaylist, newName);
                    
                    // Update custom cover mapping
                    if (customCovers[oldName]) {
                        customCovers[newName] = customCovers[oldName];
                        delete customCovers[oldName];
                        saveCustomCovers();
                    }
                    
                    coverCache = {};
                    loadSavedCovers();
                    window.Repaint();
                }
            }
            break;

        case 3:
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

        case 4:
            const name = utils.InputBox(0, "New playlist name:", "Add Playlist", "New Playlist", "");
            if (name) {
                plman.CreatePlaylist(plman.PlaylistCount, name);
            }
            break;
            
        case 5: {
            if (clickedPlaylist >= 0) {
             
                if (!saveFolder || saveFolder.length === 0) {
                    fb.ShowPopupMessage("No save folder defined.\nSet DATA:PlaylistSavePath in panel properties.", "Save Playlist");
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

        case 6:
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

        case 7:
            showNameBelowCover = !showNameBelowCover;
            window.SetProperty("DISPLAY:ShowNameBelowCover", showNameBelowCover);
            window.Repaint();
            break;

        case 8: on_font_property_change(); break;

        case 9: {
            let input = utils.InputBox(0, "Enter background color in RGB format (R-G-B, e.g., 255-25-100):", "Set Background Color", "");
            if (input) {
                const parts = input.split('-');
                if (parts.length === 3) {
                    let r = parseInt(parts[0], 10);
                    let g = parseInt(parts[1], 10);
                    let b = parseInt(parts[2], 10);

                    if (!isNaN(r) && !isNaN(g) && !isNaN(b) &&
                        r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255) {
                        bgColor = (0xFF << 24) | (r << 16) | (g << 8) | b;
                        window.SetProperty("COLOR:BGColor", bgColor);
                        window.Repaint();
                    } else {
                        fb.ShowPopupMessage("Invalid RGB values. Each value must be 0-255.", "Error");
                    }
                } else {
                    fb.ShowPopupMessage("Invalid format. Use R-G-B (e.g., 255-25-100).", "Error");
                }
            }
            break;
        }

        case 10: {
            var fontInput = utils.InputBox(0, "Enter font color in RGB format (R-G-B, e.g., 255-25-100):", "Set Font Color", "");
            if (fontInput) {
                const parts = fontInput.split('-');
                if (parts.length === 3) {
                    let r = parseInt(parts[0], 10);
                    let g = parseInt(parts[1], 10);
                    let b = parseInt(parts[2], 10);

                    if (!isNaN(r) && !isNaN(g) && !isNaN(b) &&
                        r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255) {
                        fontColor = (0xFF << 24) | (r << 16) | (g << 8) | b;
                        window.SetProperty("COLOR:FontColor", fontColor);
                        window.Repaint();
                    } else {
                        fb.ShowPopupMessage("Invalid RGB values. Each value must be 0-255.", "Error");
                    }
                } else {
                    fb.ShowPopupMessage("Invalid format. Use R-G-B (e.g., 255-25-100).", "Error");
                }
            }
            break;
        }

        case 11: {
            var hoverInput = utils.InputBox(0, "Enter hover border color in RGB format (R-G-B, e.g., 255-0-0 for red):", "Set Hover Border Color", "");
            if (hoverInput) {
                const parts = hoverInput.split('-');
                if (parts.length === 3) {
                    let r = parseInt(parts[0], 10);
                    let g = parseInt(parts[1], 10);
                    let b = parseInt(parts[2], 10);

                    if (!isNaN(r) && !isNaN(g) && !isNaN(b) &&
                        r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255) {
                        hoverBorderColor = (0xFF << 24) | (r << 16) | (g << 8) | b;
                        window.SetProperty("COLOR:HoverBorderColor", hoverBorderColor);
                        window.Repaint();
                    } else {
                        fb.ShowPopupMessage("Invalid RGB values. Each value must be 0-255.", "Error");
                    }
                } else {
                    fb.ShowPopupMessage("Invalid format. Use R-G-B (e.g., 255-0-0).", "Error");
                }
            }
            break;
        }

        case 12: {
            var selInput = utils.InputBox(0, "Enter selected border color in RGB format (R-G-B, e.g., 0-0-255 for blue):", "Set Selected Border Color", "");
            if (selInput) {
                const parts = selInput.split('-');
                if (parts.length === 3) {
                    let r = parseInt(parts[0], 10);
                    let g = parseInt(parts[1], 10);
                    let b = parseInt(parts[2], 10);

                    if (!isNaN(r) && !isNaN(g) && !isNaN(b) &&
                        r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255) {
                        selectedBorderColor = (0xFF << 24) | (r << 16) | (g << 8) | b;
                        window.SetProperty("COLOR:SelectedBorderColor", selectedBorderColor);
                        window.Repaint();
                    } else {
                        fb.ShowPopupMessage("Invalid RGB values. Each value must be 0-255.", "Error");
                    }
                } else {
                    fb.ShowPopupMessage("Invalid format. Use R-G-B (e.g., 0-0-255).", "Error");
                }
            }
            break;
        }

        case 13:
            if (clickedPlaylist > 0) {
                plman.MovePlaylist(clickedPlaylist, clickedPlaylist - 1);
                selectedIndex = clickedPlaylist - 1;
                plman.ActivePlaylist = selectedIndex;
                window.Repaint();
            }
            break;

        case 14:
            if (clickedPlaylist < plman.PlaylistCount - 1) {
                plman.MovePlaylist(clickedPlaylist, clickedPlaylist + 1);
                selectedIndex = clickedPlaylist + 1;
                plman.ActivePlaylist = selectedIndex;
                window.Repaint();
            }
            break;

        case 15: // Toggle Wallpaper
            showWallpaper = !showWallpaper;
            window.SetProperty("WALLPAPER:ShowWallpaper", showWallpaper);
            if (showWallpaper && fb.IsPlaying) {
                setWallpaperImg();
            } else {
                wallpaperImg = null;
            }
            window.Repaint();
            break;

        case 16: // Toggle Blur
            wallpaperBlurred = !wallpaperBlurred;
            window.SetProperty("WALLPAPER:WallpaperBlurred", wallpaperBlurred);
            if (showWallpaper && fb.IsPlaying) {
                lastPlayingPath = ""; // Force refresh
                setWallpaperImg();
            }
            window.Repaint();
            break;

        case 17: // Set Blur Amount
            var blurInput = utils.InputBox(0, 
                "Enter blur amount (1-90)\nLower = more blur, Higher = less blur\nRecommended: 10-20", 
                "Set Blur Amount", 
                wallpaperBlurValue.toString(), "");
            if (blurInput) {
                var blurVal = parseInt(blurInput, 10);
                if (!isNaN(blurVal) && blurVal >= 1 && blurVal <= 90) {
                    wallpaperBlurValue = blurVal;
                    window.SetProperty("WALLPAPER:WallpaperBlurValue", wallpaperBlurValue);
                    if (showWallpaper && fb.IsPlaying) {
                        lastPlayingPath = "";
                        setWallpaperImg();
                    }
                    window.Repaint();
                } else {
                    fb.ShowPopupMessage("Invalid value. Enter a number between 1 and 90.", "Error");
                }
            }
            break;

        case 18: // Set Overlay Darkness
            var overlayInput = utils.InputBox(0, 
                "Enter overlay darkness (0-255)\n0 = transparent, 255 = black\nRecommended: 150-200", 
                "Set Overlay Darkness", 
                wallpaperOverlayAlpha.toString(), "");
            if (overlayInput) {
                var overlayVal = parseInt(overlayInput, 10);
                if (!isNaN(overlayVal) && overlayVal >= 0 && overlayVal <= 255) {
                    wallpaperOverlayAlpha = overlayVal;
                    window.SetProperty("WALLPAPER:WallpaperOverlayAlpha", wallpaperOverlayAlpha);
                    if (showWallpaper && fb.IsPlaying) {
                        lastPlayingPath = "";
                        setWallpaperImg();
                    }
                    window.Repaint();
                } else {
                    fb.ShowPopupMessage("Invalid value. Enter a number between 0 and 255.", "Error");
                }
            }
            break;
            
        case 19: // Horizontal Layout
            layoutMode = "horizontal";
            window.SetProperty("DISPLAY:LayoutMode", layoutMode);
            scrollX = 0;
            scrollY = 0;
            window.Repaint();
            break;
            
        case 20: // Vertical Layout
            layoutMode = "vertical";
            window.SetProperty("DISPLAY:LayoutMode", layoutMode);
            scrollX = 0;
            scrollY = 0;
            window.Repaint();
            break;
            
         case 21: // Duplicate Playlist
            if (clickedPlaylist >= 0) {
                const originalName = plman.GetPlaylistName(clickedPlaylist);
                const newName = "Copy of " + originalName;
                
                // Create new playlist with the "Copy of" name
                const newIndex = plman.CreatePlaylist(plman.PlaylistCount, newName);
                
                // Get all items from the original playlist
                const items = plman.GetPlaylistItems(clickedPlaylist);
                
                // Insert them into the new playlist
                plman.InsertPlaylistItems(newIndex, 0, items, false);
                
                // Copy custom cover if it exists
                if (customCovers[originalName]) {
                    customCovers[newName] = customCovers[originalName];
                    saveCustomCovers();
                }
                
                // Reload covers and repaint
                coverCache = {};
                loadSavedCovers();
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

// --- PLAYBACK CALLBACKS ---
function on_playback_new_track(metadb) {
    if (showWallpaper) {
        setWallpaperImg();
        window.Repaint();
    }
}

function on_playback_stop(reason) {
    if (reason !== 2 && showWallpaper) { // reason 2 = starting another track
        wallpaperImg = null;
        lastPlayingPath = "";
        window.Repaint();
    }
}

function on_playback_starting(cmd, is_paused) {
    if (showWallpaper) {
        setWallpaperImg();
        window.Repaint();
    }
}