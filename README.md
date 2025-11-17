## Playlist-Cover
Playlist Cover Manager for foobar2000

- Want a Spotify like playlist panel? Look no further!

A lightweight Spider Monkey Panel script that adds custom cover art, scrollable playlists, and persistent settings to your foobar2000 player. 


<img width="2558" height="1387" alt="image" src="https://github.com/user-attachments/assets/24a390ee-d024-4aef-a30f-60230ed08c92" />





## Overview

Playlist Cover Manager enhances your foobar2000 experience by providing a sleek, thumbnail-based playlist viewer with the ability to:

Display playlist thumbnails with album art or custom images

Set custom cover art for each playlist (persists after restart)

Scroll through playlists with smooth mouse wheel navigation

Resize cover thumbnails 

## Features

- Persistent custom covers

- Scrollable playlist view

- Dynamic cover size adjustment

- Two Viewing modes

- Add, Save, Load, Delete, Move Functions

## Installation

Install Spider Monkey Panel
 (v1.6.1 or later).

Right-click in a Spider Monkey Panel → Edit script.

Paste the contents of main.js or releases tab.

Click OK to load the panel.

## Usage

### Right-click on a playlist cover:
<img width="282" height="227" alt="image" src="https://github.com/user-attachments/assets/889217fd-249f-497f-9e38-08979293a124" />

- Load Playlist - Must first specify the full file path
  
<img width="418" height="166" alt="image" src="https://github.com/user-attachments/assets/3a508435-9f2e-46c6-942b-8cb68a227d6b" />



- Add Custom Art Cover – choose a custom image for that playlist.

- Rename Playlist – rename playlist name

- Delete Playlist – removes the playlist and its saved cover data.

- Can move playlist up or down similar to foobar's playlist tabs

#### Customization:
<img width="266" height="211" alt="image" src="https://github.com/user-attachments/assets/658b85a1-2219-48a8-8a2d-c44960e733dc" />

#### Adding Cover Art:

- Click 'Add Custom Art' to change the cover art for your playlist tab
- Specify the file path for your image
<img width="416" height="173" alt="image" src="https://github.com/user-attachments/assets/86c04ab9-6a25-49d4-940f-90a586539844" />

## Layout modes
- Can select two layout modes via right click on cover art.

### Hover mode:
- Text elements are hidden until mouse hovers over desired playlist cover
- Offers a clean look
- Displays playlist name and track count within that playlist on hover

<img width="154" height="297" alt="image" src="https://github.com/user-attachments/assets/365fead9-6cdb-42ce-9659-5d9ea33590bd" />


### Text Mode:
- Playlist name and track count are displayed below the playlist cover arts.
- Recommended for those with a lot of playlists

  <img width="156" height="584" alt="image" src="https://github.com/user-attachments/assets/21669028-d09d-4c9f-a480-9449201c0aac" />

  
 ## Data Management

All cover settings are stored as SMP properties.

The script automatically cleans up unused properties when playlists are deleted or renamed.

Custom covers are stored by playlist name, so renaming preserves your artwork
