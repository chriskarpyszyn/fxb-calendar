# Stream Overlay - Quick Start Guide

## 📋 Overview

This guide will help you set up your complete stream overlay with all widgets, borders, and background in OBS.

**Total Setup Time**: ~30 minutes
**Difficulty**: Beginner-Friendly

---

## 🎯 What You'll Get

A complete 16:9 (1920x1080) stream overlay with:
- ✅ Animated background
- ✅ Stream timer
- ✅ Current task display
- ✅ Viewer goals panel
- ✅ Dynamic borders for camera and game window
- ✅ Professional retro/cyberpunk aesthetic

---

## 📁 Documentation Index

### Layout & Planning
- **`STREAM_OVERLAY_LAYOUT.md`** - Complete layout design and positioning guide

### Widget Implementation Plans
- **`WIDGET_CURRENT_TASK.md`** - Current kanban task widget (needs implementation)
- **`WIDGET_VIEWER_GOALS.md`** - Viewer engagement panel (needs implementation)
- **`WIDGET_DYNAMIC_BORDERS.md`** - Border overlay system (needs implementation)
- **`WIDGET_BACKGROUND.md`** - Animated background system (needs implementation)

### Existing Widgets (Already Working)
- **`WIDGET_SETUP.md`** - Stream schedule widget setup
- Timer widget (`/widget-timer`) - Already implemented

---

## 🚀 Implementation Roadmap

### Phase 1: Background (15 minutes)
**Status**: Needs implementation

1. Create `src/components/OverlayBackground.jsx` (see WIDGET_BACKGROUND.md)
2. Add route to `src/App.js`
3. Add to OBS as Browser Source at **bottom layer**

**OBS Setup**:
```
URL: http://localhost:3000/overlay-background?theme=cyber
Width: 1920
Height: 1080
FPS: 60
```

---

### Phase 2: Timer Widget (Already Done ✅)
**Status**: Working

**OBS Setup**:
```
URL: http://localhost:3000/widget-timer
Width: 200
Height: 80
Position: (20, 20) - Top-left corner
```

---

### Phase 3: Current Task Widget (20 minutes)
**Status**: Needs implementation

1. Create `src/components/CurrentTaskWidget.jsx` (see WIDGET_CURRENT_TASK.md)
2. Create public API endpoint `/api/kanban-public.js`
3. Add route to `src/App.js`
4. Add to OBS

**OBS Setup**:
```
URL: http://localhost:3000/widget-current-task/yourchannelname
Width: 500
Height: 100
Position: (710, 20) - Top-center
```

---

### Phase 4: Viewer Goals Widget (30 minutes)
**Status**: Needs implementation

1. Create `src/components/ViewerGoalsWidget.jsx` (see WIDGET_VIEWER_GOALS.md)
2. Create API endpoint `/api/viewer-stats.js`
3. Set up Twitch EventSub subscriptions (sub, follow, cheer, channel points)
4. Add route to `src/App.js`
5. Add to OBS

**OBS Setup**:
```
URL: http://localhost:3000/widget-viewer-goals/yourchannelname
Width: 320
Height: 900
Position: (1580, 140) - Right side
```

---

### Phase 5: Dynamic Borders (25 minutes)
**Status**: Needs implementation

1. Create `src/components/DynamicBorder.jsx` (see WIDGET_DYNAMIC_BORDERS.md)
2. Add route to `src/App.js`
3. Add borders in OBS for camera and game window

**Camera Border OBS Setup**:
```
URL: http://localhost:3000/widget-border?width=400&height=300&style=cyber
Width: 400
Height: 300
Position: Exactly over camera (300, 640)
Layer: Above camera source
```

**Game Window Border OBS Setup**:
```
URL: http://localhost:3000/widget-border?width=1200&height=700&style=gaming
Width: 1200
Height: 700
Position: Exactly over game window (360, 120)
Layer: Above game capture
```

---

## 🎨 Complete OBS Scene Setup

### Layer Order (Top to Bottom)

1. **Alerts** (if any) - Z: 200
2. **Camera Border** - Z: 150
   - Browser Source: `/widget-border?width=400&height=300&style=cyber`
3. **Game Border** - Z: 100
   - Browser Source: `/widget-border?width=1200&height=700&style=gaming`
4. **Viewer Goals Widget** - Z: 90
   - Browser Source: `/widget-viewer-goals/yourchannelname`
5. **Current Task Widget** - Z: 85
   - Browser Source: `/widget-current-task/yourchannelname`
6. **Timer Widget** - Z: 80
   - Browser Source: `/widget-timer`
7. **Camera** - Z: 50
   - Video Capture Device
8. **Game Capture** - Z: 40
   - Game Capture or Window Capture
9. **Background** - Z: 1
   - Browser Source: `/overlay-background?theme=cyber`

---

## 📐 Positioning Reference (1920x1080)

```
╔═══════════════════════════════════════════════════════════════════╗
║ [Timer]              [Current Task]                     [Goals]   ║
║ 20,20                710,20                              1580,140 ║
║ 200x80               500x100                             320x900  ║
║                                                                    ║
║                                                                    ║
║         ┌─────────────────────────────┐                           ║
║         │                             │              ┌──────────┐ ║
║         │    GAME WINDOW              │              │ Last Sub │ ║
║         │    360,120                  │              │──────────│ ║
║         │    1200x700                 │              │ Streaks  │ ║
║         │  ┌─────────────┐            │              │──────────│ ║
║         │  │  CAMERA     │            │              │Leaderboard║
║         └──│  300,640    │────────────┘              │──────────│ ║
║            │  400x300    │  (Overlapping)            │  Goals   │ ║
║            └─────────────┘                            └──────────┘ ║
║                                                                    ║
║                     [Animated Background]                         ║
╚═══════════════════════════════════════════════════════════════════╝
```

---

## 🔧 Development Setup

### Start Local Server
```bash
npm install
npm start
```

Server runs at: `http://localhost:3000`

### Test Widget URLs
Open these URLs in browser to preview:
- Background: `http://localhost:3000/overlay-background?theme=cyber`
- Timer: `http://localhost:3000/widget-timer`
- Current Task: `http://localhost:3000/widget-current-task/yourchannelname`
- Viewer Goals: `http://localhost:3000/widget-viewer-goals/yourchannelname`
- Border: `http://localhost:3000/widget-border?width=400&height=300&style=cyber`

---

## 🎬 OBS Browser Source Settings

### Recommended Settings for All Widgets
- ✅ **Shutdown source when not visible**: Enabled (except background)
- ✅ **Refresh browser when scene becomes active**: Disabled
- ✅ **Custom CSS**: `body { margin: 0; overflow: hidden; background: transparent; }`
- ✅ **FPS**: 30 (60 for background if performance allows)
- ✅ **Use hardware acceleration**: Enabled

### Performance Tips
- Start with 30 FPS for all browser sources
- Increase to 60 FPS only if system can handle it
- Monitor CPU/GPU usage in OBS stats
- Use "minimal" theme for background if performance is an issue

---

## 🎨 Customization Options

### Change Colors
All widgets support custom colors via query parameters:

```
?color=A855F7  (Purple)
?color=EC4899  (Pink)
?color=22C55E  (Green)
```

**Example**:
```
/overlay-background?theme=cyber&color=A855F7
/widget-border?width=400&height=300&style=cyber&color=EC4899
```

### Adjust Opacity
```
?opacity=40  (40% opacity)
?opacity=80  (80% opacity)
```

### Disable Animations
```
?animate=false  (No animations)
?intensity=25   (Reduce animation intensity)
```

---

## ✅ Testing Checklist

### Before Going Live
- [ ] All widgets load without errors
- [ ] Background is transparent (no black boxes)
- [ ] Timer updates every second
- [ ] Current task displays from kanban
- [ ] Viewer goals fetch from API
- [ ] Borders positioned correctly over content
- [ ] All text is readable
- [ ] No performance issues (check OBS stats)
- [ ] Test at 1920x1080 resolution
- [ ] Test with actual game running

### During Test Stream
- [ ] Widgets visible on stream preview
- [ ] No visual glitches or stuttering
- [ ] CPU usage acceptable (< 80%)
- [ ] Frame drops minimal (< 1%)
- [ ] All animations smooth
- [ ] API polling works (check browser console)

---

## 🐛 Troubleshooting

### Widget Not Showing
1. Check browser console for errors (Right-click source > Interact > F12)
2. Verify server is running (`npm start`)
3. Check URL is correct (including http://)
4. Ensure widget is above other sources in layer order

### Black Background Instead of Transparent
1. Add custom CSS: `body { background: transparent; }`
2. Check widget CSS doesn't set opaque background
3. Refresh browser source (Right-click > Refresh)

### Poor Performance / Lag
1. Reduce FPS to 30 for all browser sources
2. Use "minimal" theme for background
3. Disable animations: `?animate=false`
4. Lower intensity: `?intensity=25`
5. Close unnecessary sources

### API Data Not Loading
1. Check API endpoints are responding (visit in browser)
2. Verify Redis is connected
3. Check browser console for 404/500 errors
4. Ensure CORS is configured (should be by default)

### Widget Not Updating
1. Check update interval (default 5s)
2. Verify API is returning new data
3. Refresh browser source
4. Check network tab in browser console

---

## 🔐 Security Considerations

### Public Endpoints
Widgets use public read-only endpoints that don't require authentication:
- `/api/kanban-public` - Read kanban data
- `/api/viewer-stats` - Read viewer stats
- `/widget-*` routes - Public widgets

### Admin-Only Endpoints
These require authentication (not used by widgets):
- `/api/admin` - Admin operations
- POST endpoints for modifying data

### Environment Variables
Ensure these are set in Vercel:
- `TWITCH_CLIENT_ID`
- `TWITCH_CLIENT_SECRET`
- `REDIS_URL`
- `ADMIN_PASSWORD`

---

## 📊 Performance Benchmarks

### Expected CPU Usage (OBS)
- Background widget: 1-3%
- Timer widget: < 0.5%
- Current task widget: < 0.5%
- Viewer goals widget: < 1%
- Border widgets (2x): < 1%
- **Total**: ~5-7% CPU overhead

### Optimization Targets
- Maintain 60 FPS in OBS
- Keep CPU usage under 80% total
- No frame drops during stream
- Smooth animations at 30+ FPS

---

## 🎓 Next Steps

### After Basic Setup
1. **Customize colors** to match your brand
2. **Adjust positions** for your camera/game size
3. **Test with actual stream** to verify everything works
4. **Get feedback** from viewers on readability

### Advanced Features
1. Implement event-reactive borders (flash on sub/follow)
2. Add audio-reactive background animations
3. Create seasonal themes (holidays, events)
4. Build admin panel for live customization
5. Add more viewer engagement features

---

## 📚 Additional Resources

### Documentation
- [OBS Studio Guide](https://obsproject.com/wiki/)
- [Twitch EventSub Docs](https://dev.twitch.tv/docs/eventsub)
- [React Documentation](https://react.dev)

### Project Docs
- `TWITCH_EVENTSUB_SETUP.md` - Set up Twitch webhooks
- `WIDGET_SETUP.md` - Existing widget setup
- `DEVELOPMENT.md` - Development environment

---

## 🆘 Support

### Issues?
1. Check documentation files listed above
2. Review browser console for errors
3. Test widgets individually before combining
4. Verify server logs for API errors

### Feature Requests
Document new widget ideas in:
- Kanban board (create new card)
- Ideas submission system
- GitHub issues (if public repo)

---

## 🎉 You're Ready!

Follow the implementation roadmap above to build each widget, then set up your OBS scene with the provided coordinates and settings.

**Good luck with your stream!** 🚀
