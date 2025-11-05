/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/**/*.json",
  ],
  safelist: [
    // Category colors from JSON
    'bg-yellow-100', 'border-yellow-400', 'text-yellow-800', 'bg-yellow-500',
    'bg-red-100', 'border-red-400', 'text-red-800', 'bg-red-500',
    'bg-pink-100', 'border-pink-400', 'text-pink-800', 'bg-pink-500',
    'bg-purple-100', 'border-purple-400', 'text-purple-800', 'bg-purple-500',
    'bg-blue-100', 'border-blue-400', 'text-blue-800', 'bg-blue-500',
    'bg-green-100', 'border-green-400', 'text-green-800', 'bg-green-500',
    'bg-orange-100', 'border-orange-400', 'text-orange-800', 'bg-orange-500',
    'bg-amber-100', 'border-amber-400', 'text-amber-800', 'bg-amber-500',
    'bg-indigo-100', 'border-indigo-400', 'text-indigo-800', 'bg-indigo-500',
    'bg-teal-100', 'border-teal-400', 'text-teal-800', 'bg-teal-500',
    'bg-cyan-100', 'border-cyan-400', 'text-cyan-800', 'bg-cyan-500',
    'bg-rose-100', 'border-rose-400', 'text-rose-800', 'bg-rose-500',
    'bg-gray-100', 'border-gray-400', 'text-gray-800', 'bg-gray-500',
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