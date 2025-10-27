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

module.exports = {
  getRedisClient,
  storeStreamStatus,
  getStreamStatus
};
