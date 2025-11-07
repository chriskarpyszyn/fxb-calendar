import React, { useState, useEffect } from 'react';

export default function StreamTimerWidget() {
  const [timerData, setTimerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch timer state from API
  useEffect(() => {
    const fetchTimer = async () => {
      try {
        const response = await fetch('/api/get-widget-timer');
        if (!response.ok) {
          throw new Error('Failed to load timer');
        }
        const data = await response.json();
        
        if (data.success) {
          setTimerData(data);
          setError(null);
        } else {
          setError(data.error || 'Failed to load timer');
        }
      } catch (err) {
        setError(err.message);
        console.error('Error loading timer:', err);
      } finally {
        setLoading(false);
      }
    };

    // Fetch immediately
    fetchTimer();

    // Update every second
    const interval = setInterval(fetchTimer, 1000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-transparent p-4">
        <div className="text-white text-sm font-mono">Loading timer...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-transparent p-4">
        <div className="text-red-400 text-sm font-mono">Error: {error}</div>
      </div>
    );
  }

  if (!timerData || timerData.remainingTime === 0) {
    return (
      <div className="bg-transparent p-4 font-mono">
        <div className="timer-container">
          <div className="timer-label">STREAM TIMER</div>
          <div className="timer-display timer-paused">
            00:00:00
          </div>
        </div>
        <style>{`
          .timer-container {
            text-align: center;
          }
          
          .timer-label {
            font-size: 0.75rem;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            margin-bottom: 0.5rem;
          }
          
          .timer-display {
            font-size: 2.5rem;
            font-weight: 700;
            color: #94a3b8;
            letter-spacing: 0.1em;
            font-variant-numeric: tabular-nums;
          }
        `}</style>
      </div>
    );
  }

  const { formattedTime, isRunning, isExpired } = timerData;

  if (isExpired) {
    return (
      <div className="bg-transparent p-4 font-mono">
        <div className="celebration-container">
          <div className="celebration-text celebration-glow">
            TIME'S UP!
          </div>
          <div className="celebration-subtitle">
            STREAM TIMER COMPLETE
          </div>
        </div>
        <style>{`
          .celebration-container {
            text-align: center;
            animation: celebrationPulse 1s ease-in-out infinite;
          }
          
          .celebration-text {
            font-size: 3rem;
            font-weight: 900;
            color: #22d3ee;
            text-transform: uppercase;
            letter-spacing: 0.2em;
            margin-bottom: 0.5rem;
            animation: celebrationGlow 2s ease-in-out infinite alternate;
          }
          
          .celebration-subtitle {
            font-size: 1rem;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 0.1em;
          }
          
          @keyframes celebrationPulse {
            0%, 100% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.05);
            }
          }
          
          @keyframes celebrationGlow {
            0% {
              text-shadow: 0 0 10px #22d3ee, 0 0 20px #22d3ee, 0 0 30px #22d3ee;
            }
            100% {
              text-shadow: 0 0 20px #22d3ee, 0 0 30px #22d3ee, 0 0 40px #22d3ee, 0 0 50px #22d3ee;
            }
          }
        `}</style>
      </div>
    );
  }

  const labelText = isRunning ? 'STREAM TIMER' : 'STREAM TIMER (PAUSED)';
  const displayColor = isRunning ? '#22d3ee' : '#fbbf24'; // Cyan for running, amber for paused

  return (
    <div className="bg-transparent p-4 font-mono">
      <div className="timer-container">
        <div className="timer-label">{labelText}</div>
        <div className="timer-display" style={{ color: displayColor }}>
          {formattedTime}
        </div>
      </div>
      <style>{`
        .timer-container {
          text-align: center;
        }
        
        .timer-label {
          font-size: 0.75rem;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 0.5rem;
        }
        
        .timer-display {
          font-size: 2.5rem;
          font-weight: 700;
          text-shadow: 0 0 10px rgba(34, 211, 238, 0.5);
          letter-spacing: 0.1em;
          font-variant-numeric: tabular-nums;
        }
      `}</style>
    </div>
  );
}

