import React, { useState, useEffect } from 'react';
import ViewerGoalWidget from './ViewerGoalWidget';
import StreakWidget from './StreakWidget';
import LeaderboardWidget from './LeaderboardWidget';
import ProgressGoalWidget from './ProgressGoalWidget';

export default function ViewerGoalsPanel({ channelName }) {
  const [goalsData, setGoalsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const response = await fetch(`/api/data?type=viewer-goals&channelName=${encodeURIComponent(channelName)}`);
        if (response.ok) {
          const data = await response.json();
          setGoalsData(data);
        } else {
          // Use mock data if API not available
          setGoalsData(null);
        }
      } catch (err) {
        console.error('Error fetching viewer goals:', err);
        setGoalsData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchGoals();
    // Refresh every 5 seconds
    const interval = setInterval(fetchGoals, 5000);
    return () => clearInterval(interval);
  }, [channelName]);

  if (loading) {
    return (
      <div className="viewer-goals-panel">
        <div className="goals-loading">Loading goals...</div>
      </div>
    );
  }

  return (
    <div className="viewer-goals-panel">
      <div className="goals-grid">
        {/* Last Subscriber */}
        <ViewerGoalWidget
          label="Latest Subscriber"
          value={goalsData?.lastSubscriber?.username || '—'}
          timestamp={goalsData?.lastSubscriber?.timestamp}
        />

        {/* Last Follower */}
        <ViewerGoalWidget
          label="Latest Follower"
          value={goalsData?.lastFollower?.username || '—'}
          timestamp={goalsData?.lastFollower?.timestamp}
        />

        {/* Last Cheerer */}
        <ViewerGoalWidget
          label="Last 7 Days Top Cheerer"
          value={goalsData?.lastCheerer?.username || '—'}
          extra={goalsData?.lastCheerer?.bits ? `${goalsData.lastCheerer.bits} bits` : null}
          timestamp={goalsData?.lastCheerer?.timestamp}
        />

        {/* First Reward Streak */}
        <StreakWidget
          username={goalsData?.firstStreak?.username || '—'}
          streak={goalsData?.firstStreak?.streak || 0}
        />

        {/* Check-in Leaderboard */}
        <LeaderboardWidget
          leaderboard={goalsData?.checkInLeaderboard || []}
        />

        {/* Sub Goal */}
        <ProgressGoalWidget
          label="Subscription Goal"
          current={goalsData?.subGoal?.current || 0}
          target={goalsData?.subGoal?.target || 0}
        />

        {/* Follower Goal */}
        <ProgressGoalWidget
          label="Follower Goal"
          current={goalsData?.followerGoal?.current || 0}
          target={goalsData?.followerGoal?.target || 0}
        />
      </div>
      <style>{`
        .viewer-goals-panel {
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(244, 114, 182, 0.3);
          border-radius: 8px;
          padding: 0.75rem;
          min-width: 300px;
          max-width: 400px;
        }

        .goals-grid {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .goals-loading {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.75rem;
          color: #94a3b8;
          text-align: center;
          padding: 0.5rem;
        }
      `}</style>
    </div>
  );
}

