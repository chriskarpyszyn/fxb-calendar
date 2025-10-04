/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Retro futuristic muted 8-bit palette
        'retro': {
          'bg': '#0a0a0f',      // Deep space black
          'surface': '#1a1a2e',  // Dark purple-gray
          'accent': '#16213e',   // Muted blue-gray
          'border': '#2d3748',   // Muted gray
          'text': '#e2e8f0',     // Light gray
          'muted': '#94a3b8',    // Muted text
          'cyan': '#22d3ee',     // Retro cyan
          'purple': '#a78bfa',   // Muted purple
          'green': '#34d399',    // Muted green
          'orange': '#fb923c',   // Muted orange
          'pink': '#f472b6',     // Muted pink
          'blue': '#60a5fa',     // Muted blue
        }
      },
      fontFamily: {
        'pixel': ['"Press Start 2P"', 'monospace'],
        'retro': ['"Orbitron"', 'monospace'],
        'mono': ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'pixel-bounce': 'pixel-bounce 0.6s ease-in-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'scan': 'scan 2s linear infinite',
        'flicker': 'flicker 0.15s infinite linear',
      },
      keyframes: {
        'pixel-bounce': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        'glow': {
          '0%': { textShadow: '0 0 5px currentColor, 0 0 10px currentColor, 0 0 15px currentColor' },
          '100%': { textShadow: '0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor' },
        },
        'scan': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        'flicker': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        }
      },
      boxShadow: {
        'retro': '0 0 20px rgba(34, 211, 238, 0.3), inset 0 0 20px rgba(34, 211, 238, 0.1)',
        'pixel': '4px 4px 0px #2d3748',
        'glow': '0 0 30px rgba(34, 211, 238, 0.5)',
      },
      backgroundImage: {
        'grid': 'linear-gradient(rgba(34, 211, 238, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 211, 238, 0.1) 1px, transparent 1px)',
        'scanlines': 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(34, 211, 238, 0.03) 2px, rgba(34, 211, 238, 0.03) 4px)',
      }
    },
  },
  plugins: [],
}