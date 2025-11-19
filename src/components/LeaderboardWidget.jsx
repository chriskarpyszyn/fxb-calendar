import React from 'react';

export default function LeaderboardWidget({ leaderboard }) {
  const topUsers = leaderboard.slice(0, 3); // Show top 3

  if (topUsers.length === 0) {
    return (
      <div className="leaderboard-widget">
        <div className="leaderboard-label">Check-in Leaderboard</div>
        <div className="leaderboard-empty">No check-ins yet</div>
      </div>
    );
  }

  return (
    <div className="leaderboard-widget">
      <div className="leaderboard-label">Check-in Leaderboard</div>
      <div className="leaderboard-list">
        {topUsers.map((user, index) => (
          <div key={index} className="leaderboard-item">
            <span className="leaderboard-rank">#{index + 1}</span>
            <span className="leaderboard-username">{user.username}</span>
            <span className="leaderboard-count">{user.checkIns}</span>
          </div>
        ))}
      </div>
      <style>{`
        .leaderboard-widget {
          background: rgba(26, 26, 46, 0.6);
          border: 1px solid rgba(244, 114, 182, 0.2);
          border-radius: 4px;
          padding: 0.5rem 0.75rem;
          font-family: 'JetBrains Mono', monospace;
        }

        .leaderboard-label {
          font-size: 0.625rem;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.5rem;
        }

        .leaderboard-list {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .leaderboard-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
        }

        .leaderboard-rank {
          color: #22d3ee;
          font-weight: 700;
          min-width: 24px;
        }

        .leaderboard-username {
          flex: 1;
          color: #f472b6;
          font-weight: 600;
        }

        .leaderboard-count {
          color: #e2e8f0;
          opacity: 0.8;
        }

        .leaderboard-empty {
          font-size: 0.75rem;
          color: #94a3b8;
          text-align: center;
          padding: 0.25rem 0;
        }
      `}</style>
    </div>
  );
}

