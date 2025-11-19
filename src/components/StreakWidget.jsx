import React from 'react';

export default function StreakWidget({ username, streak }) {
  return (
    <div className="streak-widget">
      <div className="streak-label">"First" Reward Streak</div>
      <div className="streak-content">
        <span className="streak-username">{username}</span>
        <span className="streak-count">{streak} days</span>
      </div>
      <style>{`
        .streak-widget {
          background: rgba(26, 26, 46, 0.6);
          border: 1px solid rgba(244, 114, 182, 0.2);
          border-radius: 4px;
          padding: 0.5rem 0.75rem;
          font-family: 'JetBrains Mono', monospace;
        }

        .streak-label {
          font-size: 0.625rem;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.25rem;
        }

        .streak-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .streak-username {
          font-size: 0.875rem;
          font-weight: 700;
          color: #f472b6;
        }

        .streak-count {
          font-size: 0.75rem;
          color: #22d3ee;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}

