# Stream Overlay Setup Guide

## Overview

The Stream Overlay is a comprehensive 16:9 overlay system designed for streaming applications like OBS Studio. It combines multiple widgets into a single overlay including:

- **Background**: Animated galaxy/space theme with stars and nebula effects
- **Timer Widget**: Stream timer display (top-right)
- **Kanban Widget**: Current work items from kanban board (top-left)
- **Viewer Goals Panel**: All viewer goal widgets (bottom-left)
- **Main Content Window**: Reserved space for game/content capture (center-left) with dynamic border
- **Camera Window**: Reserved space for webcam feed (bottom-right) with dynamic border

## Accessing the Overlay

The overlay is accessible at:
```
/overlay/:channelName
```

For example:
- `http://localhost:3000/overlay/itsflannelbeard`
- `https://yourdomain.com/overlay/itsflannelbeard`


## Using in OBS Studio

### Step 1: Add Browser Source

1. Open OBS Studio
2. In your Scene, click the **+** button in Sources
3. Select **Browser Source**
4. Name it (e.g., "Stream Overlay")

### Step 2: Configure Browser Source

1. **URL**: Enter your overlay URL
   - Local: `http://localhost:3000/overlay/itsflannelbeard`
   - Production: `https://yourdomain.com/overlay/itsflannelbeard`

2. **Width**: `1920` (or your stream resolution width)
3. **Height**: `1080` (or your stream resolution height)
4. **Custom CSS**: Leave empty (styling is handled by the component)

### Step 3: Position and Layer

1. The overlay is designed to be full-screen (16:9 aspect ratio)
2. Position other sources (game capture, webcam) on top of the overlay
3. Use the overlay's reserved spaces:
   - **Main Content Window** (center-left): Place your game/content capture here
   - **Camera Window** (bottom-right): Place your webcam feed here

### Step 4: Chroma Key (Optional)

If you want to make the background transparent in certain areas:
1. Right-click the Browser Source
2. Select **Filters**
3. Add **Chroma Key** filter
4. Adjust settings to key out specific colors if needed

Note: The overlay uses transparent backgrounds by default, so chroma keying may not be necessary.

## Widget Positioning

The overlay uses a CSS Grid layout with the following structure:

```
┌─────────────────────────────────────────────────────────┐
│ Timer (top-right)    │  Kanban (top-left)               │
│                       │                                  │
│                       │  Main Content Window             │
│                       │  (center-left, large)            │
│                       │                                  │
│ Viewer Goals          │                                  │
│ (bottom-left)        │  Camera (bottom-right, small)    │
└─────────────────────────────────────────────────────────┘
```

### Widget Details

- **Timer**: Updates every second, shows stream timer countdown
- **Kanban**: Rotates through "In Progress" items every 10 seconds
- **Viewer Goals**: Updates every 5 seconds, shows:
  - Latest Subscriber
  - Latest Follower
  - Last 7 Days Top Cheerer
  - "First" Reward Streak
  - Check-in Leaderboard
  - Subscription Goal (progress bar)
  - Follower Goal (progress bar)

## Customization Options

### Background

The background is an animated CSS-based galaxy theme. To customize:

1. Edit `src/components/StreamOverlayFull.jsx`
2. Modify the `.overlay-background` styles
3. Adjust colors, animations, or add image backgrounds

### Border Colors

Dynamic borders use pink (`#f472b6`) by default. To change:

1. Edit `src/components/StreamOverlayFull.jsx`
2. Find the `DynamicBorder` components
3. Change the `color` prop (e.g., `color="#22d3ee"` for cyan)

### Widget Styling

Each widget component can be customized:
- `src/components/StreamTimerWidget.jsx` - Timer styling
- `src/components/KanbanOverlayWidget.jsx` - Kanban styling
- `src/components/ViewerGoalsPanel.jsx` - Goals panel container
- Individual goal widgets in `src/components/`

## Troubleshooting

### Overlay Not Displaying

1. Check that the URL is correct and accessible
2. Verify the channel name in the URL matches your channel
3. Check browser console for errors (F12 in OBS Browser Source)

### Widgets Not Updating

1. Verify API endpoints are accessible:
   - `/api/data?type=viewer-goals&channelName=...`
   - `/api/admin?action=kanban`
   - `/api/admin?action=get-widget-timer-public`

2. Check network tab in browser console for failed requests

### Layout Issues

1. Ensure OBS Browser Source dimensions match 16:9 aspect ratio
2. Check that other sources aren't covering the overlay
3. Verify browser zoom is at 100%

## Performance Tips

- The overlay uses CSS animations which are GPU-accelerated
- Widgets refresh at different intervals to reduce load:
  - Timer: Every 1 second
  - Kanban: Every 30 seconds
  - Viewer Goals: Every 5 seconds
- For better performance, consider reducing animation complexity or refresh rates

## Next Steps

- See `VIEWER_GOALS_IMPLEMENTATION.md` for setting up viewer goal data
- See `DYNAMIC_BORDERS_GUIDE.md` for customizing border animations

