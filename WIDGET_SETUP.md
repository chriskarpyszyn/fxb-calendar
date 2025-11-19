# Stream Overlay Widget Setup

## Schedule Widget

### OBS Setup

1. Add a **Browser Source** in OBS
2. Set the **URL** to: `/widget/yourchannelname` (replace with your channel)
3. Set **Width**: `500` and **Height**: `120`
4. Enable **"Refresh browser when scene becomes active"**
5. Position it where you want on your stream

Done! The widget will automatically show your current and upcoming activities.

---

## Nebula Background

### OBS Setup

1. Add a **Browser Source** in OBS
2. Set the **URL** to: `/overlay-background`
3. Set **Width**: `1920` and **Height**: `1080`
4. Set **FPS**: `60` (or `30` for better performance)
5. Position at the **bottom layer** of your scene (below all other sources)
6. Make sure **"Shutdown source when not visible"** is UNCHECKED

Done! You'll have an animated space nebula background with twinkling stars.

### Customization Options

You can customize the background by adding query parameters:

**Change Color:**
```
/overlay-background?color=A855F7  (purple - default)
/overlay-background?color=EC4899  (pink)
/overlay-background?color=22C55E  (green)
```

**Adjust Intensity:**
```
/overlay-background?intensity=70  (faster animation)
/overlay-background?intensity=25  (slower animation)
```

**Change Opacity:**
```
/overlay-background?opacity=40  (more transparent)
/overlay-background?opacity=80  (less transparent)
```

**Better Performance:**
```
/overlay-background?fps=30  (30 FPS instead of 60)
```

**Combine Options:**
```
/overlay-background?color=EC4899&intensity=70&opacity=50&fps=30
```
