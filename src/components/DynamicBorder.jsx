import React from 'react';

export default function DynamicBorder({ 
  children, 
  color = '#f472b6', 
  animated = true, 
  pulse = '2s',
  glow = 0.5 
}) {
  const borderStyle = {
    '--border-color': color,
    '--pulse-duration': pulse,
    '--glow-intensity': glow,
  };

  return (
    <div className="dynamic-border-wrapper" style={borderStyle}>
      <div className={`dynamic-border ${animated ? 'animated' : ''}`}>
        {children}
      </div>
      <style>{`
        .dynamic-border-wrapper {
          position: relative;
          width: 100%;
          height: 100%;
        }

        .dynamic-border {
          position: relative;
          width: 100%;
          height: 100%;
          border: 2px solid var(--border-color);
          border-radius: 8px;
          padding: 4px;
          background: rgba(0, 0, 0, 0.2);
          overflow: hidden;
        }

        .dynamic-border.animated {
          animation: borderPulse var(--pulse-duration) ease-in-out infinite;
        }

        .dynamic-border.animated::before {
          content: '';
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          border: 2px solid var(--border-color);
          border-radius: 8px;
          opacity: var(--glow-intensity);
          filter: blur(8px);
          animation: borderGlow var(--pulse-duration) ease-in-out infinite;
          z-index: -1;
        }

        .dynamic-border.animated::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.1),
            transparent
          );
          animation: borderSweep calc(var(--pulse-duration) * 2) linear infinite;
        }

        @keyframes borderPulse {
          0%, 100% {
            box-shadow: 
              0 0 10px var(--border-color),
              inset 0 0 10px var(--border-color);
            border-color: var(--border-color);
          }
          50% {
            box-shadow: 
              0 0 20px var(--border-color),
              0 0 30px var(--border-color),
              inset 0 0 15px var(--border-color);
            border-color: var(--border-color);
            filter: brightness(1.2);
          }
        }

        @keyframes borderGlow {
          0%, 100% {
            opacity: calc(var(--glow-intensity) * 0.5);
            transform: scale(1);
          }
          50% {
            opacity: var(--glow-intensity);
            transform: scale(1.02);
          }
        }

        @keyframes borderSweep {
          0% {
            left: -100%;
          }
          100% {
            left: 100%;
          }
        }

        /* Particle effect along border */
        .dynamic-border.animated {
          background-image: 
            radial-gradient(circle at 0% 0%, var(--border-color) 1px, transparent 1px),
            radial-gradient(circle at 100% 0%, var(--border-color) 1px, transparent 1px),
            radial-gradient(circle at 100% 100%, var(--border-color) 1px, transparent 1px),
            radial-gradient(circle at 0% 100%, var(--border-color) 1px, transparent 1px);
          background-size: 20px 20px, 20px 20px, 20px 20px, 20px 20px;
          background-position: 0 0, 100% 0, 100% 100%, 0 100%;
          background-repeat: no-repeat;
          animation: 
            borderPulse var(--pulse-duration) ease-in-out infinite,
            particleMove 3s linear infinite;
        }

        @keyframes particleMove {
          0% {
            background-position: 0 0, 100% 0, 100% 100%, 0 100%;
          }
          25% {
            background-position: 20px 0, 100% 0, 100% 100%, 0 100%;
          }
          50% {
            background-position: 20px 0, 100% 20px, 100% 100%, 0 100%;
          }
          75% {
            background-position: 20px 0, 100% 20px, 100% 80px, 0 100%;
          }
          100% {
            background-position: 0 0, 100% 0, 100% 100%, 0 100%;
          }
        }
      `}</style>
    </div>
  );
}

