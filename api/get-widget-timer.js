// Public API endpoint for OBS widget timer
// Returns current timer state for itsflannelbeard channel

const { createClient } = require('redis');

// Load environment variables for local development
if (process.env.NODE_ENV !== 'production') {
  try {
    require('dotenv').config({ path: '.env.local' });
  } catch (error) {
    console.warn('Could not load .env.local:', error.message);
  }
}

// Helper function to get Redis client
async function getRedisClient() {
  if (!process.env.REDIS_URL) {
    throw new Error('REDIS_URL environment variable is not set');
  }

  const redis = createClient({
    url: process.env.REDIS_URL
  });

  redis.on('error', (err) => {
    console.error('Redis Client Error:', err);
  });

  await redis.connect();
  return redis;
}

// Format milliseconds to HH:MM:SS
function formatTime(ms) {
  if (ms <= 0) {
    return '00:00:00';
  }
  
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

module.exports = async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed' 
    });
  }

  const channel = 'itsflannelbeard';
  let redis;
  
  try {
    redis = await getRedisClient();
    
    // Get timer state from Redis
    const duration = await redis.get(`widget:timer:${channel}:duration`);
    const startTime = await redis.get(`widget:timer:${channel}:startTime`);
    const pausedAt = await redis.get(`widget:timer:${channel}:pausedAt`);
    const isRunning = await redis.get(`widget:timer:${channel}:isRunning`);
    
    // If no timer is set, return default state
    if (!duration) {
      return res.status(200).json({
        success: true,
        remainingTime: 0,
        isRunning: false,
        formattedTime: '00:00:00',
        isExpired: false
      });
    }
    
    const durationMs = parseInt(duration) || 0;
    const isRunningBool = isRunning === 'true';
    const pausedAtMs = pausedAt ? parseInt(pausedAt) : null;
    const startTimeMs = startTime ? parseInt(startTime) : null;
    
    let remainingTime = 0;
    
    if (isRunningBool && startTimeMs) {
      // Timer is running - calculate remaining time
      const now = Date.now();
      const elapsed = now - startTimeMs;
      remainingTime = Math.max(0, durationMs - elapsed);
    } else if (pausedAtMs !== null) {
      // Timer is paused - use paused value
      remainingTime = Math.max(0, pausedAtMs);
    } else {
      // Timer not started yet - use full duration
      remainingTime = durationMs;
    }
    
    const isExpired = remainingTime <= 0;
    
    return res.status(200).json({
      success: true,
      remainingTime: remainingTime,
      isRunning: isRunningBool && !isExpired,
      formattedTime: formatTime(remainingTime),
      isExpired: isExpired
    });
    
  } catch (error) {
    console.error('Error getting widget timer:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get timer state',
      details: error.message
    });
  } finally {
    if (redis) {
      try {
        await redis.disconnect();
      } catch (err) {
        console.error('Error disconnecting from Redis:', err);
      }
    }
  }
};

