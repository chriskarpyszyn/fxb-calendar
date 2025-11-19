# Stream Overlay Layout Design

## Overview
This document outlines the comprehensive stream overlay layout for a 16:9 aspect ratio (1920x1080) OBS scene.

## Layout Zones (1920x1080)

```
┌─────────────────────────────────────────────────────────────────┐
│  TIMER (Top Left)          KANBAN TASK (Top Center)             │
│  200x80                    500x100                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│         ┌─────────────────────────────┐                          │
│         │                             │              ┌──────────┐│
│         │    GAME WINDOW              │              │Last Sub  ││
│         │    360,120                  │              │──────────││
│         │    1200x700                 │              │Streaks   ││
│         │  ┌─────────────┐            │              │──────────││
│         │  │  CAMERA     │            │              │Leaderboard│
│         └──│  300,640    │────────────┘              │──────────││
│            │  400x300    │  (Overlapping)            │Goals     ││
│            └─────────────┘                            └──────────┘│
├─────────────────────────────────────────────────────────────────┤
│                    BACKGROUND (Full 1920x1080)                   │
└─────────────────────────────────────────────────────────────────┘
```

## Detailed Zone Specifications

### 1. Background Layer
- **Position**: Full screen (0, 0)
- **Size**: 1920x1080
- **Z-Index**: -1 (lowest layer)
- **Features**:
  - Animated gradient or particles
  - Retro/cyberpunk aesthetic matching existing theme
  - Semi-transparent overlay for readability
  - Customizable colors/themes

**OBS Setup**: Browser Source at bottom of scene
**Implementation**: `/overlay-background/:channelName`

---

### 2. Timer Widget (Top Left)
- **Position**: (20, 20)
- **Size**: 200x80
- **Z-Index**: 100
- **Features**:
  - Stream duration countdown
  - 24-hour challenge timer
  - Cyan glow effects
  - Auto-updating (1s interval)

**OBS Setup**:
```
URL: /widget-timer
Width: 200px | Height: 80px
Position: Top-left corner
```

**Status**: ✅ Already implemented (`StreamTimerWidget.jsx`)

---

### 3. Current Task Widget (Top Center)
- **Position**: (860, 20)
- **Size**: 500x100
- **Z-Index**: 100
- **Features**:
  - Shows current "In Progress" kanban item
  - Title + brief description
  - Auto-rotates if multiple tasks
  - Category color coding

**OBS Setup**:
```
URL: /widget-current-task/:channelName
Width: 500px | Height: 100px
Position: Top-center
```

**Status**: ⚠️ Needs implementation (see WIDGET_CURRENT_TASK.md)

---

### 4. Main Content Area (Center)
- **Position**: (360, 120)
- **Size**: 1200x700 (or adjust based on game window)
- **Z-Index**: 10
- **Features**:
  - Transparent passthrough (no widget needed)
  - Game capture/window capture goes here
  - Dynamic border applied via separate overlay

**OBS Setup**: Game Capture or Window Capture source
**Border**: See Dynamic Borders section below

---

### 5. Camera Feed (Bottom Left, Overlapping Game Window)
- **Position**: (300, 640)
- **Size**: 400x300
- **Z-Index**: 50
- **Features**:
  - Webcam capture
  - Chroma key if needed
  - Dynamic border overlay
  - Overlaps bottom-left corner of game window (~180px overlap)

**OBS Setup**: Video Capture Device + Border Overlay
**Border**: See Dynamic Borders section below

**Note**: Camera is positioned to overlap the game window for a modern, professional streaming layout. Adjust overlap amount by changing Y position (lower = more overlap).

---

### 6. Viewer Goals Panel (Right Side)
- **Position**: (1600, 140)
- **Size**: 300x900
- **Z-Index**: 100
- **Features**:
  - **Last Events** (Top Section - 300x250)
    - Last Subscriber (username + timestamp)
    - Last Follower
    - Last Cheer (username + bits)

  - **Reward Streaks** (Mid Section - 300x150)
    - "First" reward redemption streak counter
    - Streak reset timer

  - **Check-in Leaderboard** (Mid Section - 300x200)
    - Top 5 viewers with most check-ins
    - Daily/weekly toggle

  - **Progress Goals** (Bottom Section - 300x250)
    - Subscriber goal (progress bar)
    - Follower goal (progress bar)
    - Current vs target numbers

**OBS Setup**:
```
URL: /widget-viewer-goals/:channelName
Width: 320px | Height: 900px
Position: Right side
```

**Status**: ⚠️ Needs implementation (see WIDGET_VIEWER_GOALS.md)

---

## Dynamic Borders System

### Concept
Animated/themed borders that can be applied to any rectangular area (camera, game window, etc.)

### Implementation Approach

#### Option 1: SVG Border Overlays
Create transparent browser sources with SVG borders that sit on top of content.

**OBS Setup**:
```
URL: /widget-border?width=400&height=300&style=cyber
Width: 400px | Height: 300px
Position: Overlay on camera
```

#### Option 2: Image Sequence Borders
Use PNG image sequences for animated borders (frames).

**Features**:
- Multiple themes (cyber, retro, minimal, gaming)
- Color customization (matches stream brand)
- Animation effects (pulse, glow, scan)
- Reactive to events (flash on sub/follow)

**Status**: ⚠️ Needs implementation (see WIDGET_DYNAMIC_BORDERS.md)

---

## Responsive Layout Considerations

### 16:9 Variants
- **1920x1080** (Full HD) - Primary design
- **1280x720** (HD) - Scale all widgets proportionally
- **2560x1440** (2K) - 1.33x scale

### Positioning Strategy
Use percentage-based positioning in OBS for different canvas sizes:
- Timer: 1% from left, 2% from top
- Current Task: Center-aligned, 2% from top
- Viewer Goals: 83% from left, 13% from top
- Camera: 1% from left, 68% from top

---

## Color Scheme (Matching Existing Theme)

### Primary Colors
- **Cyan Accent**: `#22d3ee` (text-cyan-400)
- **Dark Background**: `#0f172a` (slate-900)
- **Border Glow**: `rgba(34, 211, 238, 0.5)`
- **Card Background**: `rgba(15, 23, 42, 0.8)`

### Category Colors (from existing system)
- **Code**: Purple (`#9333ea`)
- **Modding**: Blue (`#3b82f6`)
- **Graphic Design**: Pink (`#ec4899`)
- **Testing**: Yellow (`#eab308`)
- **Community**: Green (`#22c55e`)

---

## Performance Optimization

### Browser Source Settings (OBS)
- **FPS**: 30 (sufficient for smooth animations)
- **CSS**: `body { margin: 0; overflow: hidden; }`
- **Shutdown source when not visible**: Enabled
- **Refresh browser when scene becomes active**: Disabled (unless debugging)

### Widget Update Intervals
- **Timer**: 1000ms (1 second)
- **Current Task**: 8000ms (8 seconds rotation)
- **Viewer Goals**: 5000ms (5 seconds)
- **Last Events**: Event-driven (EventSub webhooks)

---

## Implementation Priority

### Phase 1: Core Layout ✅
- [x] Background system
- [x] Timer widget (already exists)
- [x] Position all existing elements

### Phase 2: New Widgets
- [ ] Current Task widget
- [ ] Viewer Goals panel
- [ ] Last events tracking

### Phase 3: Polish
- [ ] Dynamic borders
- [ ] Event-driven animations
- [ ] Twitch EventSub integration for real-time updates

---

## Testing Checklist

- [ ] Test all widgets at 1920x1080
- [ ] Verify transparency (no unwanted backgrounds)
- [ ] Check z-index layering
- [ ] Test auto-refresh intervals
- [ ] Verify color contrast/readability
- [ ] Test with actual stream content (game + camera)
- [ ] Mobile responsiveness (for preview on phone)
- [ ] Performance check (CPU/GPU usage in OBS)

---

## Next Steps

1. Review this layout design
2. Adjust positions/sizes based on your preferences
3. Implement missing widgets (see widget plan documents)
4. Test in OBS with actual content
5. Iterate and refine

---

## Related Documentation

- `WIDGET_CURRENT_TASK.md` - Current task widget implementation plan
- `WIDGET_VIEWER_GOALS.md` - Viewer goals panel implementation plan
- `WIDGET_DYNAMIC_BORDERS.md` - Dynamic borders system plan
- `WIDGET_BACKGROUND.md` - Animated background system plan
- `WIDGET_SETUP.md` - Existing widget setup guide
