// Centralized Redis helper module for Twitch webhook functionality
// Reuses connection logic from submit-idea.js

const { createClient } = require('redis');

// Helper function to get Redis client
async function getRedisClient() {
  // Load environment variables for local development
  if (process.env.NODE_ENV !== 'production') {
    try {
      require('dotenv').config({ path: '.env.local' });
    } catch (error) {
      console.warn('Could not load .env.local:', error.message);
    }
  }

  if (!process.env.REDIS_URL) {
    throw new Error('REDIS_URL environment variable is not set');
  }

  const redis = createClient({
    url: process.env.REDIS_URL
  });

  // Add error handling for connection
  redis.on('error', (err) => {
    console.error('Redis Client Error:', err);
  });

  await redis.connect();
  return redis;
}

// Store stream status in Redis
async function storeStreamStatus(status) {
  const redis = await getRedisClient();
  try {
    const statusWithTimestamp = {
      ...status,
      updatedAt: new Date().toISOString()
    };
    
    await redis.set('twitch:stream:status', JSON.stringify(statusWithTimestamp));
    console.log('Stream status stored in Redis:', statusWithTimestamp);
    
    return statusWithTimestamp;
  } finally {
    await redis.disconnect();
  }
}

// Get stream status from Redis
async function getStreamStatus() {
  const redis = await getRedisClient();
  try {
    const statusJson = await redis.get('twitch:stream:status');
    if (!statusJson) {
      return null;
    }
    return JSON.parse(statusJson);
  } finally {
    await redis.disconnect();
  }
}

// Store viewer event in Redis
async function storeViewerEvent(channelName, eventType, data) {
  const redis = await getRedisClient();
  try {
    const normalizedChannel = channelName.toLowerCase().trim();
    const key = `twitch:channel:${normalizedChannel}:${eventType}`;
    const eventData = {
      ...data,
      timestamp: new Date().toISOString()
    };
    
    await redis.set(key, JSON.stringify(eventData));
    console.log(`Viewer event stored: ${key}`, eventData);
    
    return eventData;
  } finally {
    await redis.disconnect();
  }
}

// Get all viewer goals for a channel
async function getViewerGoals(channelName) {
  const redis = await getRedisClient();
  try {
    const normalizedChannel = channelName.toLowerCase().trim();
    const prefix = `twitch:channel:${normalizedChannel}:`;
    
    // Get all relevant keys
    const lastSubscriberKey = `${prefix}lastSubscriber`;
    const lastFollowerKey = `${prefix}lastFollower`;
    const lastCheererKey = `${prefix}lastCheerer`;
    const subGoalKey = `${prefix}subGoal`;
    const followerGoalKey = `${prefix}followerGoal`;
    
    // Fetch all data in parallel
    const [
      lastSubscriberJson,
      lastFollowerJson,
      lastCheererJson,
      subGoalJson,
      followerGoalJson
    ] = await Promise.all([
      redis.get(lastSubscriberKey),
      redis.get(lastFollowerKey),
      redis.get(lastCheererKey),
      redis.get(subGoalKey),
      redis.get(followerGoalKey)
    ]);
    
    // Get first streak (highest streak)
    const streakKeys = await redis.keys(`${prefix}firstStreak:*`);
    let firstStreak = null;
    if (streakKeys.length > 0) {
      const streakData = await Promise.all(
        streakKeys.map(key => redis.get(key))
      );
      const streaks = streakData
        .filter(Boolean)
        .map(json => JSON.parse(json))
        .filter(s => s.streak > 0);
      
      if (streaks.length > 0) {
        firstStreak = streaks.reduce((max, current) => 
          current.streak > max.streak ? current : max
        );
      }
    }
    
    // Get check-in leaderboard
    const checkInKeys = await redis.keys(`${prefix}checkIns:*`);
    let checkInLeaderboard = [];
    if (checkInKeys.length > 0) {
      const checkInData = await Promise.all(
        checkInKeys.map(key => {
          const username = key.split(':').pop();
          return redis.get(key).then(value => ({
            username,
            checkIns: value ? parseInt(value, 10) : 0
          }));
        })
      );
      checkInLeaderboard = checkInData
        .filter(item => item.checkIns > 0)
        .sort((a, b) => b.checkIns - a.checkIns)
        .slice(0, 10); // Top 10
    }
    
    return {
      lastSubscriber: lastSubscriberJson ? JSON.parse(lastSubscriberJson) : null,
      lastFollower: lastFollowerJson ? JSON.parse(lastFollowerJson) : null,
      lastCheerer: lastCheererJson ? JSON.parse(lastCheererJson) : null,
      firstStreak: firstStreak,
      checkInLeaderboard: checkInLeaderboard,
      subGoal: subGoalJson ? JSON.parse(subGoalJson) : { current: 0, target: 0 },
      followerGoal: followerGoalJson ? JSON.parse(followerGoalJson) : { current: 0, target: 0 }
    };
  } finally {
    await redis.disconnect();
  }
}

// Update a goal (sub or follower)
async function updateGoal(channelName, goalType, value) {
  const redis = await getRedisClient();
  try {
    const normalizedChannel = channelName.toLowerCase().trim();
    const key = `twitch:channel:${normalizedChannel}:${goalType}`;
    
    const goalData = {
      current: value,
      target: 0, // Target should be set separately or retrieved
      updatedAt: new Date().toISOString()
    };
    
    // Try to get existing goal to preserve target
    const existing = await redis.get(key);
    if (existing) {
      const existingData = JSON.parse(existing);
      goalData.target = existingData.target || 0;
    }
    
    await redis.set(key, JSON.stringify(goalData));
    console.log(`Goal updated: ${key}`, goalData);
    
    return goalData;
  } finally {
    await redis.disconnect();
  }
}

// Set goal target
async function setGoalTarget(channelName, goalType, target) {
  const redis = await getRedisClient();
  try {
    const normalizedChannel = channelName.toLowerCase().trim();
    const key = `twitch:channel:${normalizedChannel}:${goalType}`;
    
    const existing = await redis.get(key);
    const goalData = existing 
      ? { ...JSON.parse(existing), target }
      : { current: 0, target, updatedAt: new Date().toISOString() };
    
    await redis.set(key, JSON.stringify(goalData));
    return goalData;
  } finally {
    await redis.disconnect();
  }
}

// Update streak for a user
async function updateStreak(channelName, username, increment = 1) {
  const redis = await getRedisClient();
  try {
    const normalizedChannel = channelName.toLowerCase().trim();
    const key = `twitch:channel:${normalizedChannel}:firstStreak:${username.toLowerCase()}`;
    
    const existing = await redis.get(key);
    const streakData = existing
      ? { ...JSON.parse(existing), streak: JSON.parse(existing).streak + increment }
      : { username, streak: increment, updatedAt: new Date().toISOString() };
    
    streakData.updatedAt = new Date().toISOString();
    
    await redis.set(key, JSON.stringify(streakData));
    console.log(`Streak updated: ${key}`, streakData);
    
    return streakData;
  } finally {
    await redis.disconnect();
  }
}

// Update check-in count for a user
async function updateCheckIn(channelName, username) {
  const redis = await getRedisClient();
  try {
    const normalizedChannel = channelName.toLowerCase().trim();
    const key = `twitch:channel:${normalizedChannel}:checkIns:${username.toLowerCase()}`;
    
    const existing = await redis.get(key);
    const newCount = existing ? parseInt(existing, 10) + 1 : 1;
    
    await redis.set(key, newCount.toString());
    console.log(`Check-in updated: ${key}`, newCount);
    
    return { username, checkIns: newCount };
  } finally {
    await redis.disconnect();
  }
}

module.exports = {
  getRedisClient,
  storeStreamStatus,
  getStreamStatus,
  storeViewerEvent,
  getViewerGoals,
  updateGoal,
  setGoalTarget,
  updateStreak,
  updateCheckIn
};
