// Consolidated data API endpoint
// Handles all GET requests: schedule, channels, ideas, viewer-goals
// Usage: /api/data?type=schedule&channelName=... | /api/data?type=channels | /api/data?type=ideas | /api/data?type=viewer-goals&channelName=...

const { createClient } = require('redis');
const { getViewerGoals } = require('./redis-helper');

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

// Normalize channel name (lowercase, no spaces)
function normalizeChannelName(channelName) {
  if (!channelName) return null;
  return channelName.toLowerCase().trim();
}

// Handle get-24hour-schedule
async function handleGetSchedule(channelName, redis) {
  const normalizedChannel = normalizeChannelName(channelName) || 'itsflannelbeard';
  
  // Get metadata (channel-prefixed)
  const date = await redis.get(`24hour:schedule:${normalizedChannel}:date`) || '';
  const startDate = await redis.get(`24hour:schedule:${normalizedChannel}:startDate`) || '';
  const endDate = await redis.get(`24hour:schedule:${normalizedChannel}:endDate`) || '';
  const startTime = await redis.get(`24hour:schedule:${normalizedChannel}:startTime`) || '';
  const endTime = await redis.get(`24hour:schedule:${normalizedChannel}:endTime`) || '';
  
  // Get categories (stored as JSON)
  const categoriesJson = await redis.get(`24hour:schedule:${normalizedChannel}:categories`) || '{}';
  let categories = {};
  try {
    categories = JSON.parse(categoriesJson);
  } catch (parseError) {
    console.warn('Failed to parse categories:', parseError.message);
  }
  
  // Get slots list (channel-prefixed)
  const slotIndices = await redis.lRange(`24hour:schedule:${normalizedChannel}:slots`, 0, -1);
  const timeSlots = [];
  
  for (const index of slotIndices) {
    const hour = await redis.get(`24hour:schedule:${normalizedChannel}:slot:${index}:hour`) || '';
    const time = await redis.get(`24hour:schedule:${normalizedChannel}:slot:${index}:time`) || '';
    const category = await redis.get(`24hour:schedule:${normalizedChannel}:slot:${index}:category`) || '';
    const activity = await redis.get(`24hour:schedule:${normalizedChannel}:slot:${index}:activity`) || '';
    const description = await redis.get(`24hour:schedule:${normalizedChannel}:slot:${index}:description`) || '';
    
    timeSlots.push({
      hour: hour ? parseInt(hour) : 0,
      time,
      category,
      activity,
      description
    });
  }
  
  return {
    channelName: normalizedChannel,
    date,
    startDate,
    endDate,
    startTime,
    endTime,
    timeSlots,
    categories
  };
}

// Handle get-channels
async function handleGetChannels(redis) {
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
  
  return {
    success: true,
    channels: channelsWithInfo
  };
}

// Handle get-ideas
async function handleGetIdeas(redis) {
  // Get all ideas from Redis list (newest first due to LPUSH)
  const rawIdeas = await redis.lRange('ideas', 0, -1);
  
  // Parse JSON strings to objects, handling invalid JSON gracefully
  const ideas = [];
  for (const rawIdea of rawIdeas) {
    try {
      const idea = JSON.parse(rawIdea);
      ideas.push(idea);
    } catch (parseError) {
      console.warn('Skipping invalid JSON idea:', rawIdea, parseError.message);
      // Continue processing other ideas
    }
  }
  
  return {
    success: true,
    ideas: ideas,
    count: ideas.length
  };
}

// Handle get-viewer-goals
async function handleGetViewerGoals(channelName) {
  return await getViewerGoals(channelName);
}

module.exports = async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed' 
    });
  }

  const { type, channelName } = req.query;
  
  if (!type) {
    return res.status(400).json({
      success: false,
      error: 'Type parameter is required. Use ?type=schedule|channels|ideas|viewer-goals'
    });
  }

  let redis;
  
  try {
    redis = await getRedisClient();
    
    let result;
    
    switch (type) {
      case 'schedule':
        result = await handleGetSchedule(channelName, redis);
        break;
        
      case 'channels':
        result = await handleGetChannels(redis);
        break;
        
      case 'ideas':
        result = await handleGetIdeas(redis);
        break;
        
      case 'viewer-goals':
        const normalizedChannel = normalizeChannelName(channelName) || 'itsflannelbeard';
        result = await handleGetViewerGoals(normalizedChannel);
        break;
        
      default:
        return res.status(400).json({
          success: false,
          error: `Unknown type: ${type}. Use schedule, channels, ideas, or viewer-goals`
        });
    }
    
    return res.status(200).json(result);
    
  } catch (error) {
    console.error(`Error in data API (type: ${type}):`, error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve data',
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

