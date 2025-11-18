# Overlay Background Widget - Implementation Plan

## Overview
An animated background system for stream overlays with customizable themes, particle effects, and performance-optimized rendering.

## Widget Specifications

### Visual Design
- **Size**: Full screen (1920x1080 default)
- **Position**: Bottom layer (Z-index: -1)
- **Transparency**: Semi-transparent to not overpower content
- **Performance**: 60 FPS capable with GPU acceleration
- **Themes**: Multiple pre-built backgrounds

---

## Background Themes

### 1. Cyber Grid (Default)
```
- Animated grid lines (perspective)
- Tron-style horizon
- Cyan/blue color scheme
- Moving grid effect
- Starfield particles
```

### 2. Particle Flow
```
- Floating particle system
- Gentle drift animation
- Depth layers (parallax)
- Color-coded particles
- Occasional glow bursts
```

### 3. Gradient Wave
```
- Animated gradient waves
- Smooth color transitions
- Liquid/fluid effect
- No particles (clean)
- Low CPU usage
```

### 4. Matrix Rain
```
- Falling characters (code rain)
- Retro terminal aesthetic
- Green phosphor glow
- Random character streams
- High performance variant
```

### 5. Minimal Dark
```
- Static dark gradient
- Subtle texture overlay
- No animation (0% CPU)
- Professional look
- Ultra-lightweight
```

### 6. Nebula
```
- Space/cosmic theme
- Swirling nebula clouds
- Twinkling stars
- Deep space colors
- Medium performance
```

---

## Query Parameters

### Required
- None (defaults to 1920x1080 Cyber Grid)

### Optional
- `theme` - Background theme (cyber, particles, gradient, matrix, minimal, nebula) - Default: cyber
- `width` - Canvas width in pixels - Default: 1920
- `height` - Canvas height in pixels - Default: 1080
- `color` - Primary color (hex) - Default: theme-specific
- `intensity` - Animation intensity (0-100) - Default: 50
- `fps` - Target FPS (30, 60) - Default: 60
- `opacity` - Overall opacity (0-100) - Default: 60

### Example URLs
```
/overlay-background?theme=cyber
/overlay-background?theme=particles&color=A855F7&intensity=70
/overlay-background?theme=minimal&opacity=30
/overlay-background?theme=gradient&width=2560&height=1440
```

---

## Component Structure

### File: `src/components/OverlayBackground.jsx`

```jsx
import React, { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import './OverlayBackground.css';

const OverlayBackground = () => {
  const canvasRef = useRef(null);
  const [searchParams] = useSearchParams();

  // Parse parameters
  const theme = searchParams.get('theme') || 'cyber';
  const width = parseInt(searchParams.get('width')) || 1920;
  const height = parseInt(searchParams.get('height')) || 1080;
  const color = searchParams.get('color') || null;
  const intensity = parseInt(searchParams.get('intensity')) || 50;
  const fps = parseInt(searchParams.get('fps')) || 60;
  const opacity = parseInt(searchParams.get('opacity')) || 60;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = width;
    canvas.height = height;

    // Set overall opacity
    canvas.style.opacity = opacity / 100;

    // Initialize theme renderer
    let animationId;
    let renderer;

    switch (theme) {
      case 'cyber':
        renderer = new CyberGridRenderer(ctx, width, height, color, intensity);
        break;
      case 'particles':
        renderer = new ParticleFlowRenderer(ctx, width, height, color, intensity);
        break;
      case 'gradient':
        renderer = new GradientWaveRenderer(ctx, width, height, color, intensity);
        break;
      case 'matrix':
        renderer = new MatrixRainRenderer(ctx, width, height, color, intensity);
        break;
      case 'nebula':
        renderer = new NebulaRenderer(ctx, width, height, color, intensity);
        break;
      case 'minimal':
        renderer = new MinimalRenderer(ctx, width, height, color);
        break;
      default:
        renderer = new CyberGridRenderer(ctx, width, height, color, intensity);
    }

    // Animation loop
    const frameInterval = 1000 / fps;
    let lastTime = 0;

    const animate = (currentTime) => {
      animationId = requestAnimationFrame(animate);

      // FPS throttling
      if (currentTime - lastTime < frameInterval) return;
      lastTime = currentTime;

      // Render frame
      renderer.render();
    };

    animate(0);

    // Cleanup
    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      if (renderer.cleanup) renderer.cleanup();
    };
  }, [theme, width, height, color, intensity, fps, opacity]);

  // For minimal theme, use CSS only (no canvas)
  if (theme === 'minimal') {
    return (
      <div
        className="overlay-background minimal"
        style={{
          width: `${width}px`,
          height: `${height}px`,
          opacity: opacity / 100,
          background: color
            ? `linear-gradient(135deg, #${color}20 0%, #${color}05 100%)`
            : 'linear-gradient(135deg, #0f172a 0%, #020617 100%)'
        }}
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className={`overlay-background theme-${theme}`}
    />
  );
};

export default OverlayBackground;

// ============================================
// RENDERER CLASSES
// ============================================

// 1. Cyber Grid Renderer
class CyberGridRenderer {
  constructor(ctx, width, height, color, intensity) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
    this.color = color ? `#${color}` : '#22d3ee';
    this.intensity = intensity;
    this.gridOffset = 0;
    this.stars = this.generateStars(100);
  }

  generateStars(count) {
    return Array.from({ length: count }, () => ({
      x: Math.random() * this.width,
      y: Math.random() * this.height * 0.5,
      size: Math.random() * 2,
      opacity: Math.random()
    }));
  }

  render() {
    const ctx = this.ctx;

    // Clear canvas
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, this.width, this.height);

    // Draw stars
    this.stars.forEach((star) => {
      ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
      ctx.fillRect(star.x, star.y, star.size, star.size);
    });

    // Draw grid
    this.drawGrid();

    // Animate grid offset
    this.gridOffset += (this.intensity / 50) * 2;
    if (this.gridOffset > 50) this.gridOffset = 0;
  }

  drawGrid() {
    const ctx = this.ctx;
    const gridSize = 50;
    const vanishY = this.height * 0.7;

    ctx.strokeStyle = this.color;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.3;

    // Vertical lines
    for (let x = -this.width; x < this.width * 2; x += gridSize) {
      const startX = x + this.gridOffset;
      const endX = this.width / 2 + (startX - this.width / 2) * 0.3;

      ctx.beginPath();
      ctx.moveTo(startX, this.height);
      ctx.lineTo(endX, vanishY);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = this.height; y > vanishY; y -= gridSize) {
      const progress = (this.height - y) / (this.height - vanishY);
      const offsetY = y - this.gridOffset;

      ctx.beginPath();
      ctx.moveTo(0, offsetY);
      ctx.lineTo(this.width, offsetY);
      ctx.globalAlpha = 0.1 + progress * 0.2;
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  }
}

// 2. Particle Flow Renderer
class ParticleFlowRenderer {
  constructor(ctx, width, height, color, intensity) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
    this.color = color ? `#${color}` : '#22d3ee';
    this.intensity = intensity;
    this.particles = this.generateParticles(100 + intensity);
  }

  generateParticles(count) {
    return Array.from({ length: count }, () => ({
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      size: Math.random() * 3 + 1,
      opacity: Math.random() * 0.5 + 0.3
    }));
  }

  render() {
    const ctx = this.ctx;

    // Clear with fade effect
    ctx.fillStyle = 'rgba(10, 10, 26, 0.1)';
    ctx.fillRect(0, 0, this.width, this.height);

    // Draw and update particles
    this.particles.forEach((p) => {
      // Draw particle
      const rgb = this.hexToRgb(this.color);
      ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${p.opacity})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();

      // Update position
      p.x += p.vx * (this.intensity / 50);
      p.y += p.vy * (this.intensity / 50);

      // Wrap around edges
      if (p.x < 0) p.x = this.width;
      if (p.x > this.width) p.x = 0;
      if (p.y < 0) p.y = this.height;
      if (p.y > this.height) p.y = 0;
    });
  }

  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        }
      : { r: 34, g: 211, b: 238 };
  }
}

// 3. Gradient Wave Renderer
class GradientWaveRenderer {
  constructor(ctx, width, height, color, intensity) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
    this.color = color ? `#${color}` : '#22d3ee';
    this.intensity = intensity;
    this.time = 0;
  }

  render() {
    const ctx = this.ctx;

    // Create gradient
    const gradient = ctx.createLinearGradient(
      0,
      0,
      this.width,
      this.height
    );

    const hue1 = (this.time * 0.5) % 360;
    const hue2 = (this.time * 0.5 + 120) % 360;

    gradient.addColorStop(0, `hsla(${hue1}, 70%, 50%, 0.3)`);
    gradient.addColorStop(0.5, `hsla(${hue2}, 70%, 50%, 0.2)`);
    gradient.addColorStop(1, `hsla(${hue1}, 70%, 50%, 0.3)`);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);

    // Increment time
    this.time += this.intensity / 100;
  }
}

// 4. Matrix Rain Renderer
class MatrixRainRenderer {
  constructor(ctx, width, height, color, intensity) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
    this.color = color ? `#${color}` : '#00ff00';
    this.intensity = intensity;
    this.columns = Math.floor(width / 20);
    this.drops = Array(this.columns).fill(1);
    this.chars = 'アイウエオカキクケコサシスセソタチツテトABCDEF0123456789';
  }

  render() {
    const ctx = this.ctx;

    // Fade effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, this.width, this.height);

    // Draw characters
    ctx.fillStyle = this.color;
    ctx.font = '15px monospace';

    for (let i = 0; i < this.drops.length; i++) {
      const char = this.chars[Math.floor(Math.random() * this.chars.length)];
      const x = i * 20;
      const y = this.drops[i] * 20;

      ctx.fillText(char, x, y);

      // Reset drop randomly
      if (y > this.height && Math.random() > 0.975) {
        this.drops[i] = 0;
      }

      this.drops[i] += (this.intensity / 50);
    }
  }
}

// 5. Nebula Renderer (simplified)
class NebulaRenderer {
  constructor(ctx, width, height, color, intensity) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
    this.color = color ? `#${color}` : '#8b5cf6';
    this.intensity = intensity;
    this.time = 0;
  }

  render() {
    const ctx = this.ctx;

    // Clear
    ctx.fillStyle = '#000510';
    ctx.fillRect(0, 0, this.width, this.height);

    // Draw nebula clouds (simplified with radial gradients)
    for (let i = 0; i < 3; i++) {
      const x = this.width / 2 + Math.sin(this.time * 0.001 + i) * 300;
      const y = this.height / 2 + Math.cos(this.time * 0.001 + i) * 200;

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, 400);
      gradient.addColorStop(0, `${this.color}40`);
      gradient.addColorStop(1, 'transparent');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, this.width, this.height);
    }

    this.time += this.intensity / 10;
  }
}

// 6. Minimal Renderer (CSS-only, no canvas needed)
class MinimalRenderer {
  constructor(ctx, width, height, color) {
    // No-op for CSS-only theme
  }

  render() {
    // No-op
  }
}
```

---

## Styling

### File: `src/components/OverlayBackground.css`

```css
.overlay-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: -1;
  pointer-events: none;
}

.overlay-background.minimal {
  background: linear-gradient(135deg, #0f172a 0%, #020617 100%);
}

/* Ensure canvas fills container */
canvas.overlay-background {
  display: block;
  width: 100%;
  height: 100%;
}
```

---

## Route Setup

### File: `src/App.js`

```jsx
import OverlayBackground from './components/OverlayBackground';

// In Routes section:
<Route
  path="/overlay-background"
  element={<OverlayBackground />}
/>
```

---

## OBS Integration

### Browser Source Settings
```
URL: http://localhost:3000/overlay-background?theme=cyber
Width: 1920
Height: 1080
FPS: 60 (or 30 for performance)
Custom CSS: body { margin: 0; overflow: hidden; }
```

### Layer Position
- Place at **bottom** of scene (below all other sources)
- Ensure "Shutdown source when not visible" is **disabled** (always render)
- Set opacity in OBS if additional dimming needed

---

## Performance Optimization

### FPS Throttling
```javascript
// Limit to 30 FPS for better performance
URL: /overlay-background?theme=cyber&fps=30
```

### Low-Intensity Mode
```javascript
// Reduce animation intensity
URL: /overlay-background?theme=particles&intensity=25
```

### Minimal Theme for Maximum Performance
```javascript
// 0% CPU usage (CSS only)
URL: /overlay-background?theme=minimal
```

### GPU Acceleration
Ensure hardware acceleration is enabled in OBS:
- Settings > Advanced > Video > Renderer: Direct3D 11 (Windows) or OpenGL (Mac/Linux)

---

## Theme Comparison

| Theme | CPU Usage | Animation | Complexity | Best For |
|-------|-----------|-----------|------------|----------|
| Cyber Grid | Medium | High | Medium | Tech/coding streams |
| Particle Flow | Medium-High | High | High | Creative/artistic |
| Gradient Wave | Low | Medium | Low | Clean professional |
| Matrix Rain | Medium | High | Medium | Hacking/coding theme |
| Minimal | None | None | None | Performance priority |
| Nebula | High | Medium | High | Space/gaming theme |

---

## Testing Checklist

- [ ] All 6 themes render correctly
- [ ] Canvas fills entire background
- [ ] Transparent to content above
- [ ] Smooth animation at target FPS
- [ ] No visual stuttering
- [ ] Query parameters work
- [ ] Custom colors apply
- [ ] Opacity control works
- [ ] Performance acceptable (check CPU in OBS)
- [ ] Works at different resolutions

---

## Future Enhancements

1. **Video Backgrounds**: Support for video file playback
2. **Image Upload**: Custom static image backgrounds
3. **Shader Support**: WebGL shaders for advanced effects
4. **Audio Reactivity**: Background responds to music
5. **Twitch Integration**: Colors match current game category
6. **Weather Effects**: Rain, snow, aurora animations
7. **Admin Panel**: Live theme switching via dashboard
8. **Seasonal Themes**: Auto-switch for holidays

---

## Related Documentation
- `STREAM_OVERLAY_LAYOUT.md` - Overall layout design
- `WIDGET_DYNAMIC_BORDERS.md` - Border overlays
- `WIDGET_SETUP.md` - General widget setup
