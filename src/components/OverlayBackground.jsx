import React, { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import './OverlayBackground.css';

const OverlayBackground = () => {
  const canvasRef = useRef(null);
  const [searchParams] = useSearchParams();

  // Parse parameters
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

    // Initialize nebula renderer
    const renderer = new NebulaRenderer(ctx, width, height, color, intensity);

    // Animation loop
    const frameInterval = 1000 / fps;
    let lastTime = 0;
    let animationId;

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
    };
  }, [width, height, color, intensity, fps, opacity]);

  return (
    <canvas
      ref={canvasRef}
      className="overlay-background nebula"
    />
  );
};

export default OverlayBackground;

// ============================================
// NEBULA RENDERER
// ============================================

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
