# Viewer Goals Widget - Implementation Plan

## Overview
A comprehensive vertical panel widget displaying real-time viewer engagement metrics, goals, and leaderboards for stream overlays.

## Widget Specifications

### Visual Design
- **Size**: 320x900px
- **Position**: Right side of stream overlay (1600px from left)
- **Layout**: Vertical stack of 4 sections
- **Background**: Semi-transparent dark panels with cyan accents
- **Font**: JetBrains Mono (monospace, retro theme)

### Section Breakdown
```
┌──────────────────────┐
│  LAST EVENTS         │ 300x250px
│  ──────────────────  │
│  👤 Last Sub         │
│  💜 Last Follow      │
│  💎 Last Cheer       │
├──────────────────────┤
│  REWARD STREAKS      │ 300x150px
│  ──────────────────  │
│  🔥 "First" Streak   │
│  ⏱️  Reset Timer      │
├──────────────────────┤
│  CHECK-IN BOARD      │ 300x250px
│  ──────────────────  │
│  🥇 User1 - 42       │
│  🥈 User2 - 38       │
│  🥉 User3 - 31       │
├──────────────────────┤
│  GOALS               │ 300x200px
│  ──────────────────  │
│  📊 Subs: 45/50      │
│  📊 Followers: 890/1k│
└──────────────────────┘
```

---

## Section 1: Last Events (Top)

### Features
- Display last subscriber, follower, and cheer
- Show username and timestamp ("2m ago")
- Auto-update on new events
- Animated entrance for new events

### Data Structure
```javascript
{
  lastSubscriber: {
    username: "TwitchUser123",
    tier: "1000", // 1000, 2000, 3000 (Tier 1, 2, 3)
    timestamp: "2025-11-18T14:32:00Z"
  },
  lastFollower: {
    username: "NewFollower",
    timestamp: "2025-11-18T14:35:00Z"
  },
  lastCheer: {
    username: "BitsDonor",
    amount: 100,
    timestamp: "2025-11-18T14:30:00Z"
  }
}
```

### API Endpoint (New)
**GET** `/api/viewer-stats?action=last-events`

### Twitch EventSub Events Needed
- `channel.subscribe` - New subscriptions
- `channel.subscription.message` - Resubs with messages
- `channel.follow` - New followers
- `channel.cheer` - Bits cheered

### Display Logic
```jsx
const formatTimeAgo = (timestamp) => {
  const seconds = Math.floor((Date.now() - new Date(timestamp)) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};
```

---

## Section 2: Reward Streaks (Mid-Top)

### Features
- Track consecutive days/hours of specific channel point redemptions
- "First" reward: Users claiming to be first in chat
- Display current streak count
- Reset timer until streak breaks
- Animated milestone celebrations (10, 25, 50, 100 day streaks)

### Data Structure
```javascript
{
  rewardStreaks: {
    "first": {
      currentStreak: 15, // days
      lastRedemption: "2025-11-18T14:00:00Z",
      topStreaker: "ConsistentViewer",
      resetAt: "2025-11-19T00:00:00Z" // Midnight reset
    }
  }
}
```

### API Endpoint (New)
**GET** `/api/viewer-stats?action=streaks`
**POST** `/api/viewer-stats?action=record-streak` (webhook handler)

### Tracking Logic
1. User redeems "First" reward
2. Check if redemption is within streak window (e.g., 24 hours)
3. If yes: Increment streak
4. If no: Reset to 1
5. Update leaderboard

### Display
```
🔥 FIRST STREAK
───────────────
ConsistentViewer: 15 days
Resets in: 9h 32m
```

---

## Section 3: Check-In Leaderboard (Mid-Bottom)

### Features
- Top 5 viewers by total check-ins
- "Check In" channel point reward redemptions
- Daily/weekly/all-time toggle
- Medal indicators (🥇🥈🥉)
- Animated position changes

### Data Structure
```javascript
{
  checkIns: {
    daily: [
      { username: "TopViewer", count: 42, position: 1 },
      { username: "SecondPlace", count: 38, position: 2 },
      { username: "ThirdPlace", count: 31, position: 3 }
    ],
    weekly: [...],
    allTime: [...]
  }
}
```

### API Endpoint (New)
**GET** `/api/viewer-stats?action=check-in-leaderboard&period=daily`
**POST** `/api/viewer-stats?action=record-check-in` (webhook handler)

### Redis Storage
```
check-ins:daily:2025-11-18 -> Hash map { username: count }
check-ins:weekly:2025-W47 -> Hash map
check-ins:all-time -> Sorted set (username, score)
```

### Display Logic
```jsx
const medals = ['🥇', '🥈', '🥉'];

{leaderboard.slice(0, 5).map((entry, index) => (
  <div key={entry.username} className="leaderboard-entry">
    <span className="medal">{medals[index] || `${index + 1}.`}</span>
    <span className="username">{entry.username}</span>
    <span className="count">{entry.count}</span>
  </div>
))}
```

---

## Section 4: Progress Goals (Bottom)

### Features
- Subscriber goal with progress bar
- Follower goal with progress bar
- Current count vs. target
- Percentage display
- Animated progress fill
- Celebration animation on goal completion

### Data Structure
```javascript
{
  goals: {
    subscribers: {
      current: 45,
      target: 50,
      percentage: 90
    },
    followers: {
      current: 890,
      target: 1000,
      percentage: 89
    }
  }
}
```

### API Endpoint (New)
**GET** `/api/viewer-stats?action=goals`
**POST** `/api/admin?action=set-goals` (admin only)

### Twitch API Integration
Fetch current counts from Twitch API:
- **Subscribers**: `GET /helix/subscriptions?broadcaster_id={id}` (requires auth)
- **Followers**: `GET /helix/channels/followers?broadcaster_id={id}`

### Display Component
```jsx
const GoalProgressBar = ({ label, current, target }) => {
  const percentage = Math.min((current / target) * 100, 100);

  return (
    <div className="goal-item">
      <div className="goal-header">
        <span className="goal-label">{label}</span>
        <span className="goal-numbers">{current} / {target}</span>
      </div>
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${percentage}%` }}
        >
          <span className="percentage">{percentage.toFixed(0)}%</span>
        </div>
      </div>
    </div>
  );
};
```

---

## Full Component Structure

### File: `src/components/ViewerGoalsWidget.jsx`

```jsx
import React, { useState, useEffect } from 'react';
import './ViewerGoalsWidget.css';

const ViewerGoalsWidget = ({ channelName }) => {
  const [lastEvents, setLastEvents] = useState(null);
  const [streaks, setStreaks] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [goals, setGoals] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch all data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsRes, streaksRes, leaderboardRes, goalsRes] = await Promise.all([
          fetch(`/api/viewer-stats?action=last-events&channel=${channelName}`),
          fetch(`/api/viewer-stats?action=streaks&channel=${channelName}`),
          fetch(`/api/viewer-stats?action=check-in-leaderboard&period=daily&channel=${channelName}`),
          fetch(`/api/viewer-stats?action=goals&channel=${channelName}`)
        ]);

        setLastEvents(await eventsRes.json());
        setStreaks(await streaksRes.json());
        setLeaderboard(await leaderboardRes.json());
        setGoals(await goalsRes.json());
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch viewer stats:', error);
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000); // Refresh every 5s

    return () => clearInterval(interval);
  }, [channelName]);

  if (loading) {
    return <div className="viewer-goals-widget loading">Loading stats...</div>;
  }

  return (
    <div className="viewer-goals-widget">
      {/* Section 1: Last Events */}
      <div className="widget-section last-events">
        <h3 className="section-title">RECENT ACTIVITY</h3>
        <div className="event-item">
          <span className="event-icon">👤</span>
          <div className="event-details">
            <div className="event-label">Last Sub</div>
            <div className="event-user">{lastEvents?.lastSubscriber?.username || 'None yet'}</div>
            {lastEvents?.lastSubscriber && (
              <div className="event-time">{formatTimeAgo(lastEvents.lastSubscriber.timestamp)}</div>
            )}
          </div>
        </div>
        <div className="event-item">
          <span className="event-icon">💜</span>
          <div className="event-details">
            <div className="event-label">Last Follow</div>
            <div className="event-user">{lastEvents?.lastFollower?.username || 'None yet'}</div>
            {lastEvents?.lastFollower && (
              <div className="event-time">{formatTimeAgo(lastEvents.lastFollower.timestamp)}</div>
            )}
          </div>
        </div>
        <div className="event-item">
          <span className="event-icon">💎</span>
          <div className="event-details">
            <div className="event-label">Last Cheer</div>
            <div className="event-user">
              {lastEvents?.lastCheer?.username || 'None yet'}
              {lastEvents?.lastCheer && ` (${lastEvents.lastCheer.amount} bits)`}
            </div>
            {lastEvents?.lastCheer && (
              <div className="event-time">{formatTimeAgo(lastEvents.lastCheer.timestamp)}</div>
            )}
          </div>
        </div>
      </div>

      {/* Section 2: Reward Streaks */}
      <div className="widget-section streaks">
        <h3 className="section-title">🔥 FIRST STREAK</h3>
        {streaks?.rewardStreaks?.first ? (
          <>
            <div className="streak-user">{streaks.rewardStreaks.first.topStreaker}</div>
            <div className="streak-count">{streaks.rewardStreaks.first.currentStreak} days</div>
            <div className="streak-reset">
              Resets in: {calculateResetTime(streaks.rewardStreaks.first.resetAt)}
            </div>
          </>
        ) : (
          <div className="streak-empty">No active streak</div>
        )}
      </div>

      {/* Section 3: Check-In Leaderboard */}
      <div className="widget-section leaderboard">
        <h3 className="section-title">CHECK-IN LEADERBOARD</h3>
        {leaderboard.daily?.slice(0, 5).map((entry, index) => (
          <div key={entry.username} className="leaderboard-entry">
            <span className="position">{['🥇', '🥈', '🥉'][index] || `${index + 1}.`}</span>
            <span className="username">{entry.username}</span>
            <span className="count">{entry.count}</span>
          </div>
        ))}
        {(!leaderboard.daily || leaderboard.daily.length === 0) && (
          <div className="leaderboard-empty">No check-ins yet today</div>
        )}
      </div>

      {/* Section 4: Progress Goals */}
      <div className="widget-section goals">
        <h3 className="section-title">GOALS</h3>
        {goals?.subscribers && (
          <GoalProgressBar
            label="Subscribers"
            current={goals.subscribers.current}
            target={goals.subscribers.target}
          />
        )}
        {goals?.followers && (
          <GoalProgressBar
            label="Followers"
            current={goals.followers.current}
            target={goals.followers.target}
          />
        )}
      </div>
    </div>
  );
};

// Helper Components
const GoalProgressBar = ({ label, current, target }) => {
  const percentage = Math.min((current / target) * 100, 100);

  return (
    <div className="goal-item">
      <div className="goal-header">
        <span className="goal-label">{label}</span>
        <span className="goal-numbers">
          {current} / {target}
        </span>
      </div>
      <div className="progress-bar-container">
        <div className="progress-bar-fill" style={{ width: `${percentage}%` }}>
          <span className="progress-percentage">{percentage.toFixed(0)}%</span>
        </div>
      </div>
    </div>
  );
};

// Utility Functions
const formatTimeAgo = (timestamp) => {
  const seconds = Math.floor((Date.now() - new Date(timestamp)) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

const calculateResetTime = (resetAt) => {
  const now = Date.now();
  const reset = new Date(resetAt).getTime();
  const diff = reset - now;

  if (diff <= 0) return '0h 0m';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return `${hours}h ${minutes}m`;
};

export default ViewerGoalsWidget;
```

---

## Styling

### File: `src/components/ViewerGoalsWidget.css`

```css
.viewer-goals-widget {
  width: 320px;
  height: 900px;
  font-family: 'JetBrains Mono', monospace;
  color: #f8fafc;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 10px;
}

.viewer-goals-widget.loading {
  justify-content: center;
  align-items: center;
  color: #64748b;
}

.widget-section {
  background: rgba(15, 23, 42, 0.9);
  border: 2px solid #22d3ee;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 0 15px rgba(34, 211, 238, 0.3);
}

.section-title {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #22d3ee;
  margin: 0 0 12px 0;
  border-bottom: 1px solid rgba(34, 211, 238, 0.3);
  padding-bottom: 6px;
}

/* Last Events Section */
.last-events {
  height: 240px;
}

.event-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
  padding: 8px;
  background: rgba(34, 211, 238, 0.05);
  border-radius: 6px;
  transition: all 0.3s ease;
}

.event-item:hover {
  background: rgba(34, 211, 238, 0.1);
}

.event-icon {
  font-size: 20px;
  line-height: 1;
}

.event-details {
  flex: 1;
}

.event-label {
  font-size: 10px;
  color: #94a3b8;
  text-transform: uppercase;
}

.event-user {
  font-size: 14px;
  font-weight: 600;
  color: #f8fafc;
  margin-top: 2px;
}

.event-time {
  font-size: 10px;
  color: #64748b;
  margin-top: 2px;
}

/* Streaks Section */
.streaks {
  height: 140px;
  text-align: center;
}

.streak-user {
  font-size: 16px;
  font-weight: 600;
  color: #22d3ee;
  margin-bottom: 8px;
}

.streak-count {
  font-size: 32px;
  font-weight: 700;
  color: #fb923c; /* orange for fire theme */
  text-shadow: 0 0 10px rgba(251, 146, 60, 0.5);
  margin-bottom: 8px;
}

.streak-reset {
  font-size: 11px;
  color: #94a3b8;
}

.streak-empty {
  font-size: 12px;
  color: #64748b;
  padding: 20px;
}

/* Leaderboard Section */
.leaderboard {
  height: 240px;
}

.leaderboard-entry {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  margin-bottom: 6px;
  background: rgba(34, 211, 238, 0.05);
  border-radius: 4px;
  transition: all 0.3s ease;
}

.leaderboard-entry:hover {
  background: rgba(34, 211, 238, 0.1);
  transform: translateX(4px);
}

.position {
  font-size: 16px;
  width: 24px;
  text-align: center;
}

.username {
  flex: 1;
  font-size: 13px;
  color: #f8fafc;
}

.count {
  font-size: 13px;
  font-weight: 600;
  color: #22d3ee;
}

.leaderboard-empty {
  font-size: 12px;
  color: #64748b;
  text-align: center;
  padding: 20px;
}

/* Goals Section */
.goals {
  height: 200px;
}

.goal-item {
  margin-bottom: 16px;
}

.goal-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}

.goal-label {
  font-size: 11px;
  color: #94a3b8;
  text-transform: uppercase;
}

.goal-numbers {
  font-size: 11px;
  color: #22d3ee;
  font-weight: 600;
}

.progress-bar-container {
  width: 100%;
  height: 24px;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid #334155;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #22d3ee 0%, #06b6d4 100%);
  transition: width 1s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: 0 0 10px rgba(34, 211, 238, 0.5);
}

.progress-percentage {
  font-size: 10px;
  font-weight: 700;
  color: #0f172a;
  z-index: 1;
}

/* Animation for new events */
@keyframes slideInRight {
  from {
    transform: translateX(20px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.event-item {
  animation: slideInRight 0.5s ease-out;
}

/* Glow pulse for entire widget */
@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 15px rgba(34, 211, 238, 0.3);
  }
  50% {
    box-shadow: 0 0 20px rgba(34, 211, 238, 0.5);
  }
}

.widget-section {
  animation: pulse-glow 4s infinite;
}
```

---

## API Implementation

### File: `api/viewer-stats.js`

```javascript
import { getRedisClient } from '../utils/redis';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, channel, period } = req.query;
  const client = getRedisClient();

  try {
    switch (action) {
      case 'last-events':
        const events = await client.get(`viewer-stats:${channel}:last-events`);
        return res.json(events ? JSON.parse(events) : {
          lastSubscriber: null,
          lastFollower: null,
          lastCheer: null
        });

      case 'streaks':
        const streaks = await client.get(`viewer-stats:${channel}:streaks`);
        return res.json(streaks ? JSON.parse(streaks) : { rewardStreaks: {} });

      case 'check-in-leaderboard':
        const today = new Date().toISOString().split('T')[0];
        const key = `check-ins:${period || 'daily'}:${today}`;
        const leaderboard = await client.zrevrange(key, 0, 4, 'WITHSCORES');

        // Format: [username1, score1, username2, score2, ...]
        const formatted = [];
        for (let i = 0; i < leaderboard.length; i += 2) {
          formatted.push({
            username: leaderboard[i],
            count: parseInt(leaderboard[i + 1]),
            position: (i / 2) + 1
          });
        }

        return res.json({ daily: formatted });

      case 'goals':
        const goals = await client.get(`viewer-stats:${channel}:goals`);
        return res.json(goals ? JSON.parse(goals) : {
          subscribers: { current: 0, target: 50 },
          followers: { current: 0, target: 1000 }
        });

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Viewer stats error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

---

## Twitch EventSub Integration

### Required Subscriptions

Add to EventSub webhook handler (`api/twitch-eventsub.js`):

```javascript
// Handle subscription events
case 'channel.subscribe':
  await recordLastEvent(client, channelName, 'lastSubscriber', {
    username: event.user_name,
    tier: event.tier,
    timestamp: event.timestamp
  });
  break;

// Handle follow events
case 'channel.follow':
  await recordLastEvent(client, channelName, 'lastFollower', {
    username: event.user_name,
    timestamp: event.timestamp
  });
  break;

// Handle cheer events
case 'channel.cheer':
  await recordLastEvent(client, channelName, 'lastCheer', {
    username: event.user_name,
    amount: event.bits,
    timestamp: event.timestamp
  });
  break;

// Handle check-in reward redemption
case 'channel.channel_points_custom_reward_redemption.add':
  if (event.reward.title === 'Check In') {
    await recordCheckIn(client, channelName, event.user_name);
  }
  if (event.reward.title === 'First') {
    await recordStreakRedemption(client, channelName, event.user_name);
  }
  break;
```

### Helper Functions

```javascript
async function recordLastEvent(client, channel, eventType, data) {
  const key = `viewer-stats:${channel}:last-events`;
  const events = JSON.parse(await client.get(key) || '{}');
  events[eventType] = data;
  await client.set(key, JSON.stringify(events));
}

async function recordCheckIn(client, channel, username) {
  const today = new Date().toISOString().split('T')[0];
  const key = `check-ins:daily:${today}`;
  await client.zincrby(key, 1, username);
  await client.expire(key, 86400 * 7); // Expire after 7 days
}

async function recordStreakRedemption(client, channel, username) {
  // Complex streak logic - check last redemption time, increment or reset
  // (Implementation details in STREAK_TRACKING.md)
}
```

---

## Testing Checklist

- [ ] Last events display correctly
- [ ] Time ago updates dynamically
- [ ] Streaks calculate correctly
- [ ] Leaderboard shows top 5
- [ ] Progress bars animate smoothly
- [ ] All sections handle empty states
- [ ] API polling works (5s interval)
- [ ] EventSub webhooks trigger updates
- [ ] Transparent background in OBS
- [ ] No performance issues
- [ ] Works with missing data

---

## Future Enhancements

1. **Animations**: Flash/pulse on new events
2. **Sound Effects**: Optional audio cues for goals
3. **Customization**: Admin panel to set goal targets
4. **More Streaks**: Track different reward types
5. **Historical Data**: Weekly/monthly leaderboards
6. **Raiding**: Show last raid received
7. **Hype Train**: Display hype train progress
8. **Predictions**: Show active prediction stats

---

## Related Documentation
- `STREAM_OVERLAY_LAYOUT.md` - Overall layout design
- `WIDGET_SETUP.md` - General widget setup
- `TWITCH_EVENTSUB_SETUP.md` - EventSub configuration
- `api/twitch-eventsub.js` - Existing webhook handler
