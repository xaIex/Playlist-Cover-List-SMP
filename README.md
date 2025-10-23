## Playlist-Cover
Playlist Cover Manager for foobar2000

A lightweight Spider Monkey Panel script that adds custom cover art, scrollable playlists, and persistent settings to your foobar2000 player.

## Overview

Playlist Cover Manager enhances your foobar2000 experience by providing a sleek, thumbnail-based playlist viewer with the ability to:

Display playlist thumbnails with album art or custom images

Set custom cover art for each playlist (persists after restart)

Scroll through playlists with smooth mouse wheel navigation

Resize cover thumbnails dynamically with right-click options

Automatically clean up saved covers when playlists are deleted or renamed

Fully integrated into the Spider Monkey Panel (SMP) scripting engine

This project is written entirely in JavaScript (SMP) and optimized for performance, achieving a ~40% reduction in CPU usage compared to previous builds.

## Features

- Persistent custom covers

- Smart cache management

- Scrollable playlist view

- Dynamic cover size adjustment

- Automatic cleanup of deleted playlists

- Lightweight, efficient, and visually clean

## Installation

Install foobar2000
 (v1.6 or later).

Install Spider Monkey Panel
 (v1.6.1 or later).

Right-click in a Spider Monkey Panel → Configure → Edit script.

Paste the contents of main.js (this repository).

Click OK to load the panel.

Restart foobar2000. Your playlists should now appear with dynamic covers.

## Usage

Right-click on a playlist cover:

 - Add Custom Art Cover – choose a custom image for that playlist.

-  Rename Playlist – rename and preserve your custom art.

-  Delete Playlist – removes the playlist and its saved cover data.

- Scroll with your mouse wheel to browse long lists.

- Right-click empty space to adjust cover art size (+/- 5px or 10px).

 ## Data Management

All cover settings are stored as SMP properties.

The script automatically cleans up unused properties when playlists are deleted or renamed.

Custom covers are stored by playlist name, so renaming preserves your artwork
