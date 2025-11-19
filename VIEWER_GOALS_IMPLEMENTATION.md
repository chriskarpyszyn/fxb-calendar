# Viewer Goals Implementation Guide

## Overview

This guide explains how to implement the data sources for viewer goals in the stream overlay. The viewer goals system tracks:

- Latest Subscriber
- Latest Follower
- Last 7 Days Top Cheerer
- "First" Reward Streak
- Check-in Leaderboard
- Subscription Goal
- Follower Goal

## Architecture

### Data Storage

All viewer goal data is stored in Redis using the following key structure:

```
twitch:channel:{channelName}:lastSubscriber
twitch:channel:{channelName}:lastFollower
twitch:channel:{channelName}:lastCheerer
twitch:channel:{channelName}:subGoal
twitch:channel:{channelName}:followerGoal
twitch:channel:{channelName}:firstStreak:{username}
twitch:channel:{channelName}:checkIns:{username}
```

### API Endpoints

#### Get Viewer Goals
- **Endpoint**: `/api/get-viewer-goals`
- **Method**: GET
- **Query Parameters**:
  - `channelName` (optional, defaults to 'itsflannelbeard')
- **Response**:
  ```json
  {
    "lastSubscriber": {
      "username": "viewer123",
      "timestamp": "2024-01-15T10:30:00.000Z",
      "isGift": false,
      "tier": "1000"
    },
    "lastFollower": {
      "username": "viewer456",
      "timestamp": "2024-01-15T10:25:00.000Z",
      "userId": "123456789"
    },
    "lastCheerer": {
      "username": "viewer789",
      "bits": 100,
      "timestamp": "2024-01-15T10:20:00.000Z"
    },
    "firstStreak": {
      "username": "streakmaster",
      "streak": 7,
      "updatedAt": "2024-01-15T10:00:00.000Z"
    },
    "checkInLeaderboard": [
      { "username": "checkin1", "checkIns": 15 },
      { "username": "checkin2", "checkIns": 12 },
      { "username": "checkin3", "checkIns": 10 }
    ],
    "subGoal": {
      "current": 5,
      "target": 10,
      "updatedAt": "2024-01-15T10:00:00.000Z"
    },
    "followerGoal": {
      "current": 50,
      "target": 100,
      "updatedAt": "2024-01-15T10:00:00.000Z"
    }
  }
  ```

#### EventSub Webhook Handler
- **Endpoint**: `/api/twitch-viewer-events`
- **Method**: POST
- **Purpose**: Receives Twitch EventSub webhooks for subscriber, follower, and cheer events

## Setting Up Twitch EventSub Subscriptions

### Prerequisites

1. Twitch Developer Application with Client ID and Secret
2. EventSub webhook secret configured in environment variables
3. Publicly accessible webhook URL (for production)

### Required EventSub Subscriptions

You need to subscribe to the following event types:

1. **channel.subscribe** - New subscriptions
2. **channel.follow** - New followers
3. **channel.cheer** - Bits/cheers

### Subscription Setup

#### Option 1: Using Twitch CLI

```bash
twitch event subscribe channel.subscribe --broadcaster-id YOUR_BROADCASTER_ID --webhook-secret YOUR_SECRET --callback-url https://yourdomain.com/api/twitch-viewer-events

twitch event subscribe channel.follow --broadcaster-id YOUR_BROADCASTER_ID --webhook-secret YOUR_SECRET --callback-url https://yourdomain.com/api/twitch-viewer-events

twitch event subscribe channel.cheer --broadcaster-id YOUR_BROADCASTER_ID --webhook-secret YOUR_SECRET --callback-url https://yourdomain.com/api/twitch-viewer-events
```

#### Option 2: Using API Directly

See the existing `tools/register-eventsub.js` or `subscribe-webhooks.sh` for examples of how to register subscriptions programmatically.

### Environment Variables

Ensure these are set in your `.env.local` or production environment:

```env
TWITCH_CLIENT_ID=your_client_id
TWITCH_CLIENT_SECRET=your_client_secret
TWITCH_EVENTSUB_SECRET=your_webhook_secret
REDIS_URL=your_redis_url
```

## Data Flow

### Subscriber Event Flow

1. User subscribes to channel
2. Twitch sends EventSub webhook to `/api/twitch-viewer-events`
3. Handler processes event and stores in Redis:
   - Updates `lastSubscriber` key
   - Increments `subGoal.current`
4. Overlay fetches data from `/api/get-viewer-goals` every 5 seconds
5. Widget displays latest subscriber

### Follower Event Flow

1. User follows channel
2. Twitch sends EventSub webhook to `/api/twitch-viewer-events`
3. Handler processes event and stores in Redis:
   - Updates `lastFollower` key
   - Increments `followerGoal.current`
4. Overlay fetches and displays

### Cheer Event Flow

1. User cheers bits
2. Twitch sends EventSub webhook
3. Handler processes and stores:
   - Updates `lastCheerer` if bits >= previous best
   - Note: For "Last 7 Days Top Cheerer", you may need additional aggregation logic
4. Overlay displays top cheerer

### Streak Tracking

Streaks are tracked via channel point redemptions or custom rewards. To implement:

1. Create a "First" reward in Twitch
2. When redeemed, call `updateStreak()` function
3. Track daily redemptions per user
4. Increment streak on consecutive days

Example implementation:
```javascript
// In your reward redemption handler
const { updateStreak } = require('./api/redis-helper');
await updateStreak(channelName, username, 1);
```

### Check-in Leaderboard

Check-ins are tracked via channel point redemptions or custom rewards. To implement:

1. Create a "Check-in" reward in Twitch
2. When redeemed, call `updateCheckIn()` function
3. Leaderboard shows top 10 users by check-in count

Example implementation:
```javascript
// In your reward redemption handler
const { updateCheckIn } = require('./api/redis-helper');
await updateCheckIn(channelName, username);
```

## Setting Goal Targets

To set subscription and follower goal targets, you can use the Redis helper functions:

```javascript
const { setGoalTarget } = require('./api/redis-helper');

// Set subscription goal target
await setGoalTarget('itsflannelbeard', 'subGoal', 10);

// Set follower goal target
await setGoalTarget('itsflannelbeard', 'followerGoal', 100);
```

Or manually set in Redis:
```bash
redis-cli SET 'twitch:channel:itsflannelbeard:subGoal' '{"current":0,"target":10}'
```

## Testing

### Manual Testing

1. **Test Subscriber Event**:
   ```bash
   curl -X POST http://localhost:3000/api/twitch-viewer-events \
     -H "Content-Type: application/json" \
     -d '{
       "subscription": {"type": "channel.subscribe"},
       "event": {
         "broadcaster_user_login": "itsflannelbeard",
         "user_name": "testuser",
         "user_id": "123456",
         "is_gift": false,
         "tier": "1000"
       }
     }'
   ```

2. **Test Follower Event**:
   ```bash
   curl -X POST http://localhost:3000/api/twitch-viewer-events \
     -H "Content-Type: application/json" \
     -d '{
       "subscription": {"type": "channel.follow"},
       "event": {
         "broadcaster_user_login": "itsflannelbeard",
         "user_name": "testuser",
         "user_id": "123456"
       }
     }'
   ```

3. **Verify Data**:
   ```bash
   curl http://localhost:3000/api/get-viewer-goals?channelName=itsflannelbeard
   ```

### Using Mock Data

The overlay widgets will display "—" or empty states if no data is available. You can manually populate Redis for testing:

```javascript
const { storeViewerEvent, setGoalTarget } = require('./api/redis-helper');

// Add test data
await storeViewerEvent('itsflannelbeard', 'lastSubscriber', {
  username: 'testuser',
  isGift: false,
  tier: '1000'
});

await setGoalTarget('itsflannelbeard', 'subGoal', 10);
await updateGoal('itsflannelbeard', 'subGoal', 5);
```

## Advanced Features

### Last 7 Days Top Cheerer

The current implementation stores the most recent high-value cheer. For a true "Last 7 Days Top Cheerer", you would need to:

1. Store all cheers with timestamps
2. Filter by date range (last 7 days)
3. Aggregate by username
4. Find the top cheerer

This requires additional Redis data structure (e.g., sorted sets or time-series data).

### Streak Reset Logic

Currently, streaks only increment. To implement streak reset logic:

1. Track last redemption date per user
2. If redemption is not consecutive, reset streak to 1
3. Update `updateStreak()` function to check date

### Check-in Cooldown

To prevent spam, implement cooldown logic:

1. Store last check-in timestamp per user
2. Only allow check-in if cooldown period has passed
3. Return error if too soon

## Troubleshooting

### Events Not Processing

1. Check webhook signature verification
2. Verify `TWITCH_EVENTSUB_SECRET` matches Twitch configuration
3. Check server logs for errors
4. Verify Redis connection

### Data Not Updating

1. Verify EventSub subscriptions are active in Twitch Developer Console
2. Check webhook delivery status
3. Verify Redis keys are being set
4. Check API endpoint responses

### Performance Issues

1. Consider caching viewer goals data
2. Reduce refresh frequency in overlay
3. Use Redis pipelining for bulk operations
4. Monitor Redis memory usage

## Next Steps

- Set up EventSub subscriptions for your channel
- Configure goal targets
- Test with real events
- Customize widget display as needed

