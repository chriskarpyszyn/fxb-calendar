// Admin API endpoint to reset all votes
// Requires JWT authentication

const { verifyAdminToken } = require('./admin-utils');

// Redis helper
async function getRedisClient() {
  const { createClient } = require('redis');
  
  const redis = createClient({
    url: process.env.REDIS_URL,
    socket: {
      connectTimeout: 10000,
      lazyConnect: true
    }
  });

  redis.on('error', (err) => {
    console.error('Redis Client Error:', err);
  });

  await redis.connect();
  return redis;
}

module.exports = async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify admin authentication
    const authResult = verifyAdminToken(req);
    if (!authResult.success) {
      return res.status(401).json({ error: authResult.error });
    }

    // Load environment variables for local development
    if (process.env.NODE_ENV !== 'production') {
      try {
        require('dotenv').config({ path: '.env.local' });
      } catch (error) {
        console.warn('Could not load .env.local:', error.message);
      }
    }

    // Get Redis client
    const redis = await getRedisClient();
    
    // Get all ideas
    const rawIdeas = await redis.lRange('ideas', 0, -1);
    const ideas = rawIdeas.map(raw => JSON.parse(raw));
    
    // Reset vote counts and voter data
    const resetIdeas = ideas.map(idea => ({
      ...idea,
      votes: 0,
      voters: [],
      lastVoteAt: null
    }));
    
    // Clear existing ideas list
    await redis.del('ideas');
    
    // Add reset ideas back to Redis
    if (resetIdeas.length > 0) {
      await redis.lPush('ideas', ...resetIdeas.map(idea => JSON.stringify(idea)));
    }
    
    await redis.disconnect();
    
    console.log(`Admin ${authResult.username} reset votes for ${ideas.length} ideas`);
    
    return res.status(200).json({
      success: true,
      message: `Successfully reset votes for ${ideas.length} ideas`,
      resetCount: ideas.length
    });
    
  } catch (error) {
    console.error('Error resetting votes:', error);
    return res.status(500).json({
      error: 'Failed to reset votes',
      details: error.message
    });
  }
};
