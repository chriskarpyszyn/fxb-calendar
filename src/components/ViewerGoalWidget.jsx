import React from 'react';

export default function ViewerGoalWidget({ label, value, extra, timestamp }) {
  const formatTimestamp = (ts) => {
    if (!ts) return null;
    try {
      const date = new Date(ts);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${diffDays}d ago`;
    } catch {
      return null;
    }
  };

  return (
    <div className="viewer-goal-widget">
      <div className="goal-label">{label}:</div>
      <div className="goal-value">{value}</div>
      {extra && <div className="goal-extra">{extra}</div>}
      {timestamp && (
        <div className="goal-timestamp">{formatTimestamp(timestamp)}</div>
      )}
      <style>{`
        .viewer-goal-widget {
          background: rgba(26, 26, 46, 0.6);
          border: 1px solid rgba(244, 114, 182, 0.2);
          border-radius: 4px;
          padding: 0.5rem 0.75rem;
          font-family: 'JetBrains Mono', monospace;
        }

        .goal-label {
          font-size: 0.625rem;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.25rem;
        }

        .goal-value {
          font-size: 0.875rem;
          font-weight: 700;
          color: #f472b6;
          margin-bottom: 0.125rem;
        }

        .goal-extra {
          font-size: 0.75rem;
          color: #e2e8f0;
          opacity: 0.8;
        }

        .goal-timestamp {
          font-size: 0.625rem;
          color: #94a3b8;
          margin-top: 0.25rem;
          opacity: 0.7;
        }
      `}</style>
    </div>
  );
}

