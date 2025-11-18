# Dynamic Borders Widget - Implementation Plan

## Overview
A flexible border overlay system that can be applied to any rectangular area in OBS (camera feed, game capture, etc.) with animated effects and customizable themes.

## Widget Specifications

### Visual Design
- **Size**: Variable (query parameters)
- **Position**: Overlay on top of content
- **Transparency**: Transparent center, only border visible
- **Themes**: Multiple pre-built styles
- **Animation**: Configurable effects (glow, pulse, scan)

---

## Use Cases

### 1. Camera Border
```
OBS Setup:
- Camera source: 400x300
- Border overlay: 400x300 (positioned exactly over camera)
- URL: /widget-border?width=400&height=300&style=cyber&thickness=4
```

### 2. Game Window Border
```
OBS Setup:
- Game capture: 1200x700
- Border overlay: 1200x700
- URL: /widget-border?width=1200&height=700&style=minimal&thickness=3
```

### 3. Full Screen Border (Frame)
```
OBS Setup:
- Full canvas: 1920x1080
- Border overlay: 1920x1080
- URL: /widget-border?width=1920&height=1080&style=retro&thickness=6
```

---

## Border Styles

### 1. Cyber (Default)
```css
- Solid cyan (#22d3ee) border
- Animated corner accents (glowing lines)
- Scanline effect overlay
- Pulsing glow (3s cycle)
```

### 2. Retro
```css
- Dual-color border (cyan + magenta)
- 8-bit corner brackets
- CRT screen effect
- Pixel-perfect edges
```

### 3. Minimal
```css
- Thin solid line
- Subtle glow
- No animations (performance-friendly)
- Clean and professional
```

### 4. Gaming
```css
- Thick angular border
- RGB gradient animation
- Sharp corners with bevels
- High contrast
```

### 5. Neon
```css
- Glowing neon tubes effect
- Multiple colored layers
- Bloom effect
- Breathing animation (slow pulse)
```

---

## Query Parameters

### Required
- `width` - Width in pixels (e.g., 400)
- `height` - Height in pixels (e.g., 300)

### Optional
- `style` - Border style name (cyber, retro, minimal, gaming, neon) - Default: cyber
- `thickness` - Border thickness in pixels (1-20) - Default: 4
- `color` - Hex color override (e.g., FF00FF) - Default: theme color
- `animate` - Enable animations (true/false) - Default: true
- `glow` - Enable glow effect (true/false) - Default: true
- `corners` - Corner style (square, rounded, beveled) - Default: square

### Example URLs
```
/widget-border?width=400&height=300&style=cyber
/widget-border?width=1200&height=700&style=minimal&thickness=2
/widget-border?width=400&height=300&color=FF00FF&animate=false
/widget-border?width=1920&height=1080&style=neon&glow=true
```

---

## Component Structure

### File: `src/components/DynamicBorder.jsx`

```jsx
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import './DynamicBorder.css';

const DynamicBorder = () => {
  const [searchParams] = useSearchParams();

  // Parse parameters
  const width = parseInt(searchParams.get('width')) || 400;
  const height = parseInt(searchParams.get('height')) || 300;
  const style = searchParams.get('style') || 'cyber';
  const thickness = parseInt(searchParams.get('thickness')) || 4;
  const color = searchParams.get('color') || null;
  const animate = searchParams.get('animate') !== 'false';
  const glow = searchParams.get('glow') !== 'false';
  const corners = searchParams.get('corners') || 'square';

  // Generate border style
  const containerStyle = {
    width: `${width}px`,
    height: `${height}px`,
    border: `${thickness}px solid ${color ? `#${color}` : 'var(--border-color)'}`,
    borderRadius: corners === 'rounded' ? '8px' : '0',
    boxShadow: glow ? `0 0 20px var(--glow-color)` : 'none'
  };

  return (
    <div
      className={`dynamic-border style-${style} ${animate ? 'animated' : ''} ${glow ? 'glowing' : ''}`}
      style={containerStyle}
    >
      {/* Corner Accents (for cyber/gaming styles) */}
      {(style === 'cyber' || style === 'gaming') && (
        <>
          <div className="corner-accent top-left"></div>
          <div className="corner-accent top-right"></div>
          <div className="corner-accent bottom-left"></div>
          <div className="corner-accent bottom-right"></div>
        </>
      )}

      {/* Scanline Overlay (for cyber/retro styles) */}
      {(style === 'cyber' || style === 'retro') && animate && (
        <div className="scanline-overlay"></div>
      )}

      {/* Edge Glow Layers (for neon style) */}
      {style === 'neon' && (
        <>
          <div className="neon-layer layer-1"></div>
          <div className="neon-layer layer-2"></div>
          <div className="neon-layer layer-3"></div>
        </>
      )}
    </div>
  );
};

export default DynamicBorder;
```

---

## Styling

### File: `src/components/DynamicBorder.css`

```css
/* Base Border Container */
.dynamic-border {
  position: relative;
  box-sizing: border-box;
  pointer-events: none;
  background: transparent;
}

/* Color Variables for Each Style */
.style-cyber {
  --border-color: #22d3ee;
  --glow-color: rgba(34, 211, 238, 0.5);
  --accent-color: #06b6d4;
}

.style-retro {
  --border-color: #22d3ee;
  --glow-color: rgba(34, 211, 238, 0.5);
  --accent-color: #ec4899;
}

.style-minimal {
  --border-color: #94a3b8;
  --glow-color: rgba(148, 163, 184, 0.3);
  --accent-color: #cbd5e1;
}

.style-gaming {
  --border-color: #a855f7;
  --glow-color: rgba(168, 85, 247, 0.6);
  --accent-color: #ec4899;
}

.style-neon {
  --border-color: #22d3ee;
  --glow-color: rgba(34, 211, 238, 0.8);
  --accent-color: #a855f7;
}

/* Pulsing Glow Animation */
.dynamic-border.animated.glowing {
  animation: pulse-glow 3s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 20px var(--glow-color);
  }
  50% {
    box-shadow: 0 0 40px var(--glow-color), 0 0 60px var(--glow-color);
  }
}

/* Corner Accents (Cyber/Gaming Styles) */
.corner-accent {
  position: absolute;
  width: 20px;
  height: 20px;
  border: 2px solid var(--accent-color);
  pointer-events: none;
}

.corner-accent.top-left {
  top: -2px;
  left: -2px;
  border-right: none;
  border-bottom: none;
}

.corner-accent.top-right {
  top: -2px;
  right: -2px;
  border-left: none;
  border-bottom: none;
}

.corner-accent.bottom-left {
  bottom: -2px;
  left: -2px;
  border-right: none;
  border-top: none;
}

.corner-accent.bottom-right {
  bottom: -2px;
  right: -2px;
  border-left: none;
  border-top: none;
}

.animated .corner-accent {
  animation: corner-pulse 2s ease-in-out infinite;
}

@keyframes corner-pulse {
  0%, 100% {
    opacity: 1;
    filter: drop-shadow(0 0 5px var(--accent-color));
  }
  50% {
    opacity: 0.6;
    filter: drop-shadow(0 0 10px var(--accent-color));
  }
}

/* Scanline Overlay (Cyber/Retro Styles) */
.scanline-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.1) 0px,
    rgba(0, 0, 0, 0.1) 1px,
    transparent 1px,
    transparent 2px
  );
  pointer-events: none;
  animation: scanline-move 8s linear infinite;
  opacity: 0.3;
}

@keyframes scanline-move {
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(20px);
  }
}

/* Neon Style - Multiple Glow Layers */
.neon-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: inherit;
  border-radius: inherit;
  pointer-events: none;
}

.neon-layer.layer-1 {
  filter: blur(4px);
  opacity: 0.6;
}

.neon-layer.layer-2 {
  filter: blur(8px);
  opacity: 0.4;
  animation: neon-pulse 2s ease-in-out infinite;
}

.neon-layer.layer-3 {
  filter: blur(16px);
  opacity: 0.2;
  animation: neon-pulse 2s ease-in-out infinite reverse;
}

@keyframes neon-pulse {
  0%, 100% {
    opacity: 0.2;
  }
  50% {
    opacity: 0.5;
  }
}

/* Retro Style - Dual Border Effect */
.style-retro.animated {
  border-image: linear-gradient(
    45deg,
    var(--border-color) 0%,
    var(--accent-color) 50%,
    var(--border-color) 100%
  ) 1;
  animation: retro-gradient 4s linear infinite;
}

@keyframes retro-gradient {
  0% {
    border-image-source: linear-gradient(
      45deg,
      var(--border-color) 0%,
      var(--accent-color) 50%,
      var(--border-color) 100%
    );
  }
  50% {
    border-image-source: linear-gradient(
      45deg,
      var(--accent-color) 0%,
      var(--border-color) 50%,
      var(--accent-color) 100%
    );
  }
  100% {
    border-image-source: linear-gradient(
      45deg,
      var(--border-color) 0%,
      var(--accent-color) 50%,
      var(--border-color) 100%
    );
  }
}

/* Gaming Style - RGB Gradient */
.style-gaming.animated {
  border-image: linear-gradient(
    90deg,
    #ff0000 0%,
    #00ff00 33%,
    #0000ff 66%,
    #ff0000 100%
  ) 1;
  animation: rgb-rotate 3s linear infinite;
}

@keyframes rgb-rotate {
  0% {
    border-image-source: linear-gradient(90deg, #ff0000, #00ff00, #0000ff, #ff0000);
  }
  33% {
    border-image-source: linear-gradient(90deg, #0000ff, #ff0000, #00ff00, #0000ff);
  }
  66% {
    border-image-source: linear-gradient(90deg, #00ff00, #0000ff, #ff0000, #00ff00);
  }
  100% {
    border-image-source: linear-gradient(90deg, #ff0000, #00ff00, #0000ff, #ff0000);
  }
}

/* Minimal Style - Static, Clean */
.style-minimal {
  border-color: var(--border-color);
  box-shadow: 0 0 10px var(--glow-color);
}

.style-minimal.animated {
  animation: none; /* No animation for minimal style */
}
```

---

## Route Setup

### File: `src/App.js`

```jsx
import DynamicBorder from './components/DynamicBorder';

// In Routes section:
<Route
  path="/widget-border"
  element={<DynamicBorder />}
/>
```

---

## Advanced Features

### Event-Reactive Borders

Borders that react to stream events (subs, follows, raids):

```jsx
// In DynamicBorder.jsx
const [eventFlash, setEventFlash] = useState(false);

useEffect(() => {
  // Listen for custom events
  const handleEvent = (e) => {
    setEventFlash(true);
    setTimeout(() => setEventFlash(false), 1000);
  };

  window.addEventListener('stream-event', handleEvent);
  return () => window.removeEventListener('stream-event', handleEvent);
}, []);

// In render
<div className={`dynamic-border ${eventFlash ? 'event-flash' : ''}`}>
```

```css
/* Event Flash Animation */
.dynamic-border.event-flash {
  animation: event-flash 0.5s ease-out;
}

@keyframes event-flash {
  0% {
    box-shadow: 0 0 60px rgba(34, 211, 238, 1);
    border-color: #ffffff;
  }
  100% {
    box-shadow: 0 0 20px rgba(34, 211, 238, 0.5);
    border-color: var(--border-color);
  }
}
```

### Performance Optimization

```jsx
// Disable animations when window is hidden
useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.hidden) {
      // Pause animations
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, []);
```

---

## OBS Setup Guide

### Step 1: Add Border Overlay
1. In OBS, add a **Browser Source**
2. Set URL: `http://localhost:3000/widget-border?width=400&height=300&style=cyber`
3. Set Width: 400 (match content)
4. Set Height: 300 (match content)
5. Enable **Shutdown source when not visible**

### Step 2: Position Over Content
1. Ensure border source is **above** content source in layer stack
2. Position border exactly over content (use Transform > Edit Transform for precision)
3. Lock both sources together (right-click > Group)

### Step 3: Test Transparency
- Ensure content shows through center
- Only border should be visible
- No black background or artifacts

---

## Border Presets

### Camera Border (Small)
```
URL: /widget-border?width=400&height=300&style=cyber&thickness=4
Use Case: Webcam overlay
```

### Game Window Border (Medium)
```
URL: /widget-border?width=1200&height=700&style=gaming&thickness=3
Use Case: Game capture
```

### Full Screen Frame (Large)
```
URL: /widget-border?width=1920&height=1080&style=neon&thickness=6
Use Case: Entire canvas border
```

### Alert Box Border (Dynamic)
```
URL: /widget-border?width=600&height=200&style=minimal&animate=false
Use Case: Alert overlays
```

---

## Testing Checklist

- [ ] Border renders with transparent center
- [ ] All 5 styles display correctly
- [ ] Animations play smoothly (30 FPS)
- [ ] Query parameters work as expected
- [ ] Custom colors apply correctly
- [ ] Corner accents position properly
- [ ] Scanlines animate without stuttering
- [ ] Neon glow layers blend smoothly
- [ ] Works at various sizes (small, medium, large)
- [ ] No performance issues (check CPU usage)
- [ ] Compatible with OBS chroma key

---

## Customization Examples

### Purple Theme
```
/widget-border?width=400&height=300&style=cyber&color=A855F7
```

### No Animation (Performance)
```
/widget-border?width=1200&height=700&style=minimal&animate=false&glow=false
```

### Rounded Corners
```
/widget-border?width=400&height=300&style=neon&corners=rounded
```

### Thick Border
```
/widget-border?width=1920&height=1080&style=retro&thickness=10
```

---

## Future Enhancements

1. **Image-Based Borders**: Upload custom PNG frames
2. **Video Borders**: Animated GIF/WEBM border sequences
3. **Particle Effects**: Floating particles along border edges
4. **Audio Reactivity**: Border pulses with music
5. **Twitch Integration**: Border changes color based on chat sentiment
6. **Admin Panel**: GUI for border customization
7. **Seasonal Themes**: Holiday-specific border styles
8. **SVG Borders**: Vector-based for infinite scaling

---

## Related Documentation
- `STREAM_OVERLAY_LAYOUT.md` - Overall layout design
- `WIDGET_BACKGROUND.md` - Background system
- `WIDGET_SETUP.md` - General widget setup
