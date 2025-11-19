import React from 'react';

export default function ProgressGoalWidget({ label, current, target }) {
  const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;

  return (
    <div className="progress-goal-widget">
      <div className="progress-header">
        <div className="progress-label">{label}</div>
        <div className="progress-count">
          {current} / {target}
        </div>
      </div>
      <div className="progress-bar-container">
        <div 
          className="progress-bar-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <style>{`
        .progress-goal-widget {
          background: rgba(26, 26, 46, 0.6);
          border: 1px solid rgba(244, 114, 182, 0.2);
          border-radius: 4px;
          padding: 0.5rem 0.75rem;
          font-family: 'JetBrains Mono', monospace;
        }

        .progress-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .progress-label {
          font-size: 0.625rem;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .progress-count {
          font-size: 0.75rem;
          color: #f472b6;
          font-weight: 700;
        }

        .progress-bar-container {
          width: 100%;
          height: 8px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 4px;
          overflow: hidden;
          border: 1px solid rgba(244, 114, 182, 0.2);
        }

        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #f472b6, #a78bfa);
          border-radius: 4px;
          transition: width 0.5s ease;
          box-shadow: 0 0 8px rgba(244, 114, 182, 0.5);
        }
      `}</style>
    </div>
  );
}

