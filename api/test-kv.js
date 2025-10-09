// Test API route to verify Redis is working
// Access at: https://your-domain.vercel.app/api/test-kv

const { createClient } = require('redis');

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

module.exports = async function handler(req, res) {
  let redis;
  
  try {
    // Connect to Redis
    redis = await getRedisClient();
    
    // Write a test value
    await redis.set('test-key', 'Hello from Redis!');
    
    // Read it back
    const value = await redis.get('test-key');
    
    // Clean up test key
    await redis.del('test-key');
    
    // Return success
    res.status(200).json({
      success: true,
      message: 'Redis is working!',
      testValue: value,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Redis test error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      hint: 'Make sure you created and connected the Redis database in Vercel dashboard',
      redisUrl: process.env.REDIS_URL ? 'Set' : 'Not set',
      nodeEnv: process.env.NODE_ENV
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
}