
## Playlist Tab Cover Manager for foobar2000

Want a Spotify like playlist panel? Tired of boring looking tabs? Sick of walls of texts? Look no further!

A lightweight Spider Monkey Panel script that adds custom cover art, essential playlist functions, customizable features all in one. 

<img width="1573" height="1066" alt="image" src="https://github.com/user-attachments/assets/14fa1ee7-655d-426c-8a8f-0c5c9b218bc5" />



## Features
### Playback & Navigation
- Quick Playback - Double-click any playlist to instantly play a random track
- Scrollable View - Smooth scrolling through your entire playlist collection
- Dual Layout Modes - Switch between horizontal and vertical layouts to fit your theme

### Visual Customization 
- Dynamic Wallpaper Background - Display album art from the currently playing track as a blurred background 
- Extensive Blur Controls - Adjust blur intensity (1-90) and overlay darkness (0-255) for perfect readability 
- Custom Color Scheme - Personalize background, font, hover, and selection border colors to match your theme

### Display Options
- Flexible Info Display - Toggle between two viewing modes:
  - Hover mode (covers only, info appears upon hover)
  - Text mode (names and track counts below covers)

 ### Playlist Management
 - Essential Functions - Add, Save, Load, Delete, Duplicate, Rename and Reorder playlists


## Install

Install Spider Monkey Panel
 (v1.6.1 or later).

Right-click in a Spider Monkey Panel → Edit script.

Paste the contents of main.js or PlaylistCoverTabManaer.txt in releases tab.

Click OK to load the panel.

## Usage

### Right-click on a playlist cover:
#### General Functions
<img width="284" height="225" alt="image" src="https://github.com/user-attachments/assets/9df75183-06a5-4ecc-b0fc-483a755db4d7" />


##### Load Playlist 
- Must first specify the full file path
  
  <img width="418" height="166" alt="image" src="https://github.com/user-attachments/assets/3a508435-9f2e-46c6-942b-8cb68a227d6b" />

##### Rename Playlist
- Rename your playlist like normal

  <img width="413" height="166" alt="image" src="https://github.com/user-attachments/assets/e07b03b5-23f7-4389-bc0d-8c52ee66edf7" />


##### Delete Playlist 
- removes the playlist and its saved cover data.


##### Add Playlist 
- Adds a new playlist
  
   <img width="409" height="166" alt="image" src="https://github.com/user-attachments/assets/385a6b46-0ae3-44f4-bbf2-569b0cf7d0df" />

##### Duplicate Playlist
- Duplicates selected playlist with custom cover saved
- Will be renamed 'Copy of (playlist name)'

##### Save Playlist
  - Must first specifiy a folder location to save your playlist in panel properties.
  - First, right-click on an empty space to access the panel properties menu
  - Specify your selected folder to save your playlist in.

<img width="593" height="23" alt="image" src="https://github.com/user-attachments/assets/9cda5681-6544-4628-b926-ff66ef302f80" />

  - With the folder location saved, you can now quickly and easily save your playlist.

##### Move Up/Down 
- Can move playlist cover tabs up or down similar to foobar's playlist tabs
  
   <img width="153" height="294" alt="image" src="https://github.com/user-attachments/assets/8932e7cd-9b2d-4c7d-87c0-fecd7f13fa8c" />
   

   <img width="152" height="298" alt="image" src="https://github.com/user-attachments/assets/f4db3b59-bd16-414e-bfaa-eb900fbf784b" />



## Customization:
<img width="266" height="211" alt="image" src="https://github.com/user-attachments/assets/658b85a1-2219-48a8-8a2d-c44960e733dc" />

#### Changing Playlist Tab Cover Size
- In panel properties, adjust cover size

<img width="419" height="21" alt="image" src="https://github.com/user-attachments/assets/195044e4-be5f-4b90-935f-bd65946fd03c" />

#### Adding Cover Art:

- Click 'Add Custom Art' to change the cover art for your playlist tab
- Specify the file path for your image
  
<img width="416" height="173" alt="image" src="https://github.com/user-attachments/assets/86c04ab9-6a25-49d4-940f-90a586539844" />

#### Changing Fonts
<img width="411" height="165" alt="image" src="https://github.com/user-attachments/assets/23b04a4a-3f49-499e-9118-7b0ab3161789" />

****
<img width="82" height="37" alt="image" src="https://github.com/user-attachments/assets/657687aa-1f30-494e-a182-70d37e1271bb" />

#### Changing Hover/Selected Color
- Can change color in RGB format when hovering over your playlist tab covers
- Background and font colors can also be changed the same way

<img width="409" height="168" alt="image" src="https://github.com/user-attachments/assets/c1198475-2e88-4940-8dbf-c6897f76e1d2" />

****
<img width="150" height="158" alt="image" src="https://github.com/user-attachments/assets/6f65ade0-c2d5-481e-9d5c-27deb02451f8" />


### Layout modes
- Can select two layout modes via right click on cover art.

#### Hover mode:
- Text elements are hidden until mouse hovers over desired playlist cover
- Offers a clean look
- Displays playlist name and track count within that playlist on hover

<img width="154" height="297" alt="image" src="https://github.com/user-attachments/assets/365fead9-6cdb-42ce-9659-5d9ea33590bd" />


#### Text Mode:
- Playlist name and track count are displayed below the playlist cover arts.
- Recommended for those with a lot of playlists

<img width="149" height="577" alt="image" src="https://github.com/user-attachments/assets/0ce18804-33a5-4784-bb81-acafe3b13071" />

### Wallpaper Settings
<img width="272" height="107" alt="image" src="https://github.com/user-attachments/assets/5fb89641-e975-4777-8e85-b9ffbe897fa9" />

- Enable dynamic album art for the background
- Once enabled, you can further customize with blur settings to fine tune to your liking:

<img width="297" height="110" alt="image" src="https://github.com/user-attachments/assets/ce5949d8-e2d1-4ebb-8657-7c156420e785" />

- Blur amount determine how strong you want the blur to be
- Blur Overlay Darkness will adjust the brightness settings

 ## Data Management
Single JSON storage - All custom covers stored in `DATA:CustomCovers_JSON`

Automatic cleanup - Deleted playlists are automatically removed from the JSON object

The script automatically cleans up unused properties when playlists are deleted or renamed.

