// Public API endpoint for 24-hour schedule
// No authentication required

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

module.exports = async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed' 
    });
  }

  let redis;
  
  try {
    redis = await getRedisClient();
    
    // Get metadata
    const date = await redis.get('24hour:schedule:date') || '';
    const startDate = await redis.get('24hour:schedule:startDate') || '';
    const endDate = await redis.get('24hour:schedule:endDate') || '';
    
    // Get categories (stored as JSON)
    const categoriesJson = await redis.get('24hour:schedule:categories') || '{}';
    let categories = {};
    try {
      categories = JSON.parse(categoriesJson);
    } catch (parseError) {
      console.warn('Failed to parse categories:', parseError.message);
    }
    
    // Get slots list
    const slotIndices = await redis.lRange('24hour:schedule:slots', 0, -1);
    const timeSlots = [];
    
    for (const index of slotIndices) {
      const hour = await redis.get(`24hour:schedule:slot:${index}:hour`) || '';
      const time = await redis.get(`24hour:schedule:slot:${index}:time`) || '';
      const category = await redis.get(`24hour:schedule:slot:${index}:category`) || '';
      const activity = await redis.get(`24hour:schedule:slot:${index}:activity`) || '';
      const description = await redis.get(`24hour:schedule:slot:${index}:description`) || '';
      
      timeSlots.push({
        hour: hour ? parseInt(hour) : 0,
        time,
        category,
        activity,
        description
      });
    }
    
    return res.status(200).json({
      date,
      startDate,
      endDate,
      timeSlots,
      categories
    });
    
  } catch (error) {
    console.error('Error retrieving 24-hour schedule:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve schedule',
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

