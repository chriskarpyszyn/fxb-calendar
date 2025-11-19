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

// 5. Nebula Renderer
class NebulaRenderer {
  constructor(ctx, width, height, color, intensity) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
    this.color = color ? `#${color}` : '#8b5cf6';
    this.intensity = intensity;
    this.time = 0;
    this.stars = this.generateStars(200);
  }

  generateStars(count) {
    return Array.from({ length: count }, () => ({
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      size: Math.random() * 1.5,
      opacity: Math.random() * 0.8 + 0.2,
      twinkleSpeed: Math.random() * 0.02 + 0.01
    }));
  }

  render() {
    const ctx = this.ctx;

    // Clear with deep space background
    ctx.fillStyle = '#000510';
    ctx.fillRect(0, 0, this.width, this.height);

    // Draw twinkling stars
    this.stars.forEach((star) => {
      const twinkle = Math.sin(this.time * star.twinkleSpeed) * 0.3 + 0.7;
      ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity * twinkle})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw nebula clouds with radial gradients
    for (let i = 0; i < 3; i++) {
      const x = this.width / 2 + Math.sin(this.time * 0.0005 + i * 2) * 300;
      const y = this.height / 2 + Math.cos(this.time * 0.0005 + i * 2) * 200;

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, 400);

      // Parse color or use default purple
      const rgb = this.hexToRgb(this.color);
      gradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.25)`);
      gradient.addColorStop(0.5, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`);
      gradient.addColorStop(1, 'transparent');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, this.width, this.height);
    }

    // Add some colored accent clouds
    for (let i = 0; i < 2; i++) {
      const x = this.width / 2 + Math.cos(this.time * 0.0003 + i * 3) * 400;
      const y = this.height / 2 + Math.sin(this.time * 0.0003 + i * 3) * 300;

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, 300);
      gradient.addColorStop(0, 'rgba(34, 211, 238, 0.15)');
      gradient.addColorStop(0.5, 'rgba(34, 211, 238, 0.05)');
      gradient.addColorStop(1, 'transparent');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, this.width, this.height);
    }

    this.time += this.intensity / 10;
  }

  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        }
      : { r: 139, g: 92, b: 246 };
  }
}

// 6. Minimal Renderer (CSS-only, no canvas needed)
class MinimalRenderer {
  render() {
    // No-op
  }
}
