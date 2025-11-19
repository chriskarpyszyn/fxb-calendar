import React from 'react';
import { useParams } from 'react-router-dom';
import StreamTimerWidget from './StreamTimerWidget';
import KanbanOverlayWidget from './KanbanOverlayWidget';
import ViewerGoalsPanel from './ViewerGoalsPanel';
import DynamicBorder from './DynamicBorder';

export default function StreamOverlayFull() {
  const { channelName } = useParams();
  const normalizedChannel = channelName?.toLowerCase().trim() || 'itsflannelbeard';

  return (
    <div className="stream-overlay-container">
      {/* Background Layer */}
      <div className="overlay-background"></div>
      
      {/* Main Content Grid */}
      <div className="overlay-grid">
        {/* Timer - Top Right */}
        <div className="overlay-timer">
          <StreamTimerWidget />
        </div>

        {/* Kanban - Top Left */}
        <div className="overlay-kanban">
          <KanbanOverlayWidget />
        </div>

        {/* Main Content Window - Center Left */}
        <div className="overlay-main-content">
          <DynamicBorder color="#f472b6" animated={true} pulse="2s" glow={0.5}>
            <div className="content-window-placeholder">
              {/* This space is reserved for game/content capture */}
            </div>
          </DynamicBorder>
        </div>

        {/* Viewer Goals - Bottom Left */}
        <div className="overlay-viewer-goals">
          <ViewerGoalsPanel channelName={normalizedChannel} />
        </div>

        {/* Camera Window - Bottom Right */}
        <div className="overlay-camera">
          <DynamicBorder color="#f472b6" animated={true} pulse="2s" glow={0.5}>
            <div className="camera-window-placeholder">
              {/* This space is reserved for webcam feed */}
            </div>
          </DynamicBorder>
        </div>
      </div>

      <style>{`
        .stream-overlay-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          background: #000;
        }

        /* 16:9 Aspect Ratio Container */
        .stream-overlay-container::before {
          content: '';
          display: block;
          padding-top: 56.25%; /* 16:9 aspect ratio */
        }

        .overlay-background {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 0;
          background: 
            radial-gradient(ellipse at 20% 50%, rgba(167, 139, 250, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 80%, rgba(244, 114, 182, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 40% 20%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
            linear-gradient(135deg, #0a0a0f 0%, #1a0a2e 50%, #16213e 100%);
          background-size: 100% 100%, 100% 100%, 100% 100%, 100% 100%;
          animation: nebulaShift 20s ease-in-out infinite;
        }

        /* Starfield */
        .overlay-background::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: 
            radial-gradient(2px 2px at 20% 30%, white, transparent),
            radial-gradient(2px 2px at 60% 70%, white, transparent),
            radial-gradient(1px 1px at 50% 50%, white, transparent),
            radial-gradient(1px 1px at 80% 10%, white, transparent),
            radial-gradient(2px 2px at 40% 80%, white, transparent),
            radial-gradient(1px 1px at 90% 40%, white, transparent),
            radial-gradient(1px 1px at 10% 60%, white, transparent),
            radial-gradient(2px 2px at 70% 20%, white, transparent);
          background-repeat: repeat;
          background-size: 200% 200%;
          animation: starfield 100s linear infinite;
          opacity: 0.8;
        }

        /* Lens flare effect */
        .overlay-background::after {
          content: '';
          position: absolute;
          top: 20%;
          right: 15%;
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
          border-radius: 50%;
          filter: blur(40px);
          animation: lensFlare 15s ease-in-out infinite;
        }

        @keyframes nebulaShift {
          0%, 100% {
            background-position: 0% 0%, 0% 0%, 0% 0%, 0% 0%;
          }
          50% {
            background-position: 10% 10%, -10% -10%, 5% -5%, 0% 0%;
          }
        }

        @keyframes starfield {
          0% {
            transform: translate(0, 0);
          }
          100% {
            transform: translate(-50%, -50%);
          }
        }

        @keyframes lensFlare {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1) rotate(0deg);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.2) rotate(180deg);
          }
        }

        .overlay-grid {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: grid;
          grid-template-columns: 1fr 2fr 1fr;
          grid-template-rows: auto 1fr auto;
          gap: 1rem;
          padding: 1rem;
          z-index: 1;
        }

        .overlay-timer {
          grid-column: 3;
          grid-row: 1;
          display: flex;
          justify-content: flex-end;
          align-items: flex-start;
        }

        .overlay-kanban {
          grid-column: 1;
          grid-row: 1;
          display: flex;
          justify-content: flex-start;
          align-items: flex-start;
        }

        .overlay-main-content {
          grid-column: 1 / 3;
          grid-row: 2;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .overlay-viewer-goals {
          grid-column: 1;
          grid-row: 3;
          display: flex;
          align-items: flex-end;
        }

        .overlay-camera {
          grid-column: 3;
          grid-row: 3;
          display: flex;
          align-items: flex-end;
          justify-content: flex-end;
        }

        .content-window-placeholder,
        .camera-window-placeholder {
          width: 100%;
          height: 100%;
          min-height: 200px;
          background: rgba(0, 0, 0, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255, 255, 255, 0.3);
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.875rem;
        }

        .content-window-placeholder {
          min-height: 400px;
        }

        .camera-window-placeholder {
          min-height: 200px;
          max-width: 400px;
        }

        /* Responsive adjustments for 16:9 */
        @media (max-aspect-ratio: 16/9) {
          .stream-overlay-container::before {
            padding-top: 100vh;
          }
        }

        @media (min-aspect-ratio: 16/9) {
          .stream-overlay-container::before {
            padding-top: 56.25vw;
          }
        }
      `}</style>
    </div>
  );
}

