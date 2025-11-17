
## Playlist Tab Cover Manager for foobar2000

Want a Spotify like playlist panel? Tired of boring looking tabs? Sick of walls of texts? Look no further!

A lightweight Spider Monkey Panel script that adds custom cover art, essential playlist functions, customizable features all in one. 

<img width="2558" height="1387" alt="image" src="https://github.com/user-attachments/assets/24a390ee-d024-4aef-a30f-60230ed08c92" />


## Features

- Persistent custom covers

- Scrollable playlist view

- Adjustable cover size 

- Two Viewing modes

- Add, Save, Load, Delete, Move Functions

- Customizable fonts and colors

## Installation

Install Spider Monkey Panel
 (v1.6.1 or later).

Right-click in a Spider Monkey Panel → Edit script.

Paste the contents of main.js or releases tab.

Click OK to load the panel.

## Usage

### Right-click on a playlist cover:
#### General Functions
<img width="282" height="227" alt="image" src="https://github.com/user-attachments/assets/889217fd-249f-497f-9e38-08979293a124" />


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

##### Save Playlist
  - Must first specifiy a folder location to save your playlist in panel properties.
  - First, right-click on an empty space to access the panel properties menu
  - Specify your selected folder to save your playlist in.

    <img width="606" height="20" alt="image" src="https://github.com/user-attachments/assets/75302c4e-3351-4c43-8e1b-f0f56b78a278" />
  - With the folder location saved, you can now quickly and easily save your playlist.

##### Move Up/Down 
- Can move playlist cover tabs up or down similar to foobar's playlist tabs
  
   <img width="153" height="294" alt="image" src="https://github.com/user-attachments/assets/8932e7cd-9b2d-4c7d-87c0-fecd7f13fa8c" />
   

   <img width="152" height="298" alt="image" src="https://github.com/user-attachments/assets/f4db3b59-bd16-414e-bfaa-eb900fbf784b" />



#### Customization:
<img width="266" height="211" alt="image" src="https://github.com/user-attachments/assets/658b85a1-2219-48a8-8a2d-c44960e733dc" />

#### Changing Playlist Tab Cover Size
- In panel properties, adjust the px size:

<img width="701" height="19" alt="image" src="https://github.com/user-attachments/assets/a854c4ca-39eb-4fb7-9a19-adbf92286ed8" />


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

<img width="149" height="577" alt="image" src="https://github.com/user-attachments/assets/0ce18804-33a5-4784-bb81-acafe3b13071" />


  
 ## Data Management

All cover settings are stored as SMP properties.

The script automatically cleans up unused properties when playlists are deleted or renamed.

Custom covers are stored by playlist name, so renaming preserves your artwork
