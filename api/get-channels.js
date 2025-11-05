// API endpoint to list all channels with schedules

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
    
    // Get all channels from the set
    const channels = await redis.sMembers('24hour:channels');
    
    // For each channel, get basic info (date, slot count, start date/time)
    const channelsWithInfo = await Promise.all(
      channels.map(async (channelName) => {
        try {
          const date = await redis.get(`24hour:schedule:${channelName}:date`) || '';
          const startDate = await redis.get(`24hour:schedule:${channelName}:startDate`) || '';
          const startTime = await redis.get(`24hour:schedule:${channelName}:startTime`) || '';
          const slotIndices = await redis.lRange(`24hour:schedule:${channelName}:slots`, 0, -1);
          
          return {
            channelName: channelName,
            date: date,
            startDate: startDate,
            startTime: startTime,
            slotCount: slotIndices.length
          };
        } catch (error) {
          console.error(`Error getting info for channel ${channelName}:`, error);
          return {
            channelName: channelName,
            date: '',
            startDate: '',
            startTime: '',
            slotCount: 0
          };
        }
      })
    );
    
    // Sort by channel name
    channelsWithInfo.sort((a, b) => a.channelName.localeCompare(b.channelName));
    
    return res.status(200).json({
      success: true,
      channels: channelsWithInfo
    });
    
  } catch (error) {
    console.error('Error retrieving channels:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve channels',
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

