// Local Redis connection test script
// Run with: node test-redis-local.js

const { createClient } = require('redis');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function testRedisConnection() {
  console.log('🔍 Testing Redis connection...');
  console.log('Environment:', process.env.NODE_ENV);
  console.log('Redis URL set:', process.env.REDIS_URL ? 'Yes' : 'No');
  
  if (!process.env.REDIS_URL) {
    console.error('❌ REDIS_URL environment variable is not set');
    console.log('Please create a .env.local file with:');
    console.log('REDIS_URL=your_redis_connection_string');
    return;
  }

  let redis;
  
  try {
    // Create Redis client
    redis = createClient({
      url: process.env.REDIS_URL
    });

    // Add error handling
    redis.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    // Connect to Redis
    console.log('🔌 Connecting to Redis...');
    await redis.connect();
    console.log('✅ Connected to Redis successfully!');

    // Test basic operations
    console.log('🧪 Testing basic operations...');
    
    // Test SET
    await redis.set('test-key', 'Hello from Redis!');
    console.log('✅ SET operation successful');

    // Test GET
    const value = await redis.get('test-key');
    console.log('✅ GET operation successful, value:', value);

    // Test LIST operations (for ideas)
    await redis.lPush('test-ideas', JSON.stringify({ id: '1', idea: 'Test idea' }));
    console.log('✅ LPUSH operation successful');

    const ideas = await redis.lRange('test-ideas', 0, -1);
    console.log('✅ LRANGE operation successful, ideas:', ideas);

    // Clean up test data
    await redis.del('test-key');
    await redis.del('test-ideas');
    console.log('✅ Cleanup successful');

    console.log('🎉 All Redis tests passed!');

  } catch (error) {
    console.error('❌ Redis test failed:', error.message);
    console.error('Full error:', error);
  } finally {
    if (redis) {
      try {
        await redis.disconnect();
        console.log('🔌 Disconnected from Redis');
      } catch (err) {
        console.error('Error disconnecting:', err.message);
      }
    }
  }
}

// Run the test
testRedisConnection();

