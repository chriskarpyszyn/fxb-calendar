// API route to delete a specific idea from Redis (admin only)
// Requires valid admin session token

const { createClient } = require('redis');
const { verifySessionToken } = require('./admin-utils');

// Helper function to get Redis client (same as other API routes)
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
  // Only allow DELETE requests
  if (req.method !== 'DELETE') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed' 
    });
  }

  // Verify admin session token
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : null;

  if (!verifySessionToken(token)) {
    return res.status(401).json({ 
      success: false,
      error: 'Unauthorized - Invalid or expired session' 
    });
  }

  // Get idea ID from request body
  const { ideaId } = req.body;

  // Validate input
  if (!ideaId) {
    return res.status(400).json({ 
      success: false,
      error: 'Idea ID is required' 
    });
  }

  let redis;
  
  try {
    // Connect to Redis
    redis = await getRedisClient();
    
    // Get all ideas to find the one to delete
    const rawIdeas = await redis.lRange('ideas', 0, -1);
    let ideaToDelete = null;
    let ideaIndex = -1;
    
    // Find the idea with matching ID
    for (let i = 0; i < rawIdeas.length; i++) {
      try {
        const idea = JSON.parse(rawIdeas[i]);
        if (idea.id === ideaId) {
          ideaToDelete = idea;
          ideaIndex = i;
          break;
        }
      } catch (parseError) {
        console.warn('Skipping invalid JSON idea:', rawIdeas[i], parseError.message);
        continue;
      }
    }
    
    if (!ideaToDelete) {
      return res.status(404).json({
        success: false,
        error: 'Idea not found'
      });
    }
    
    // Remove the idea from the list
    // Since Redis lists don't have a direct "remove by value" operation,
    // we need to rebuild the list without the target idea
    const remainingIdeas = [];
    for (let i = 0; i < rawIdeas.length; i++) {
      if (i !== ideaIndex) {
        remainingIdeas.push(rawIdeas[i]);
      }
    }
    
    // Clear the existing list and repopulate with remaining ideas
    await redis.del('ideas');
    if (remainingIdeas.length > 0) {
      await redis.lPush('ideas', ...remainingIdeas);
    }
    
    console.log('Idea deleted:', ideaToDelete.id, 'by', ideaToDelete.username);
    
    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Idea deleted successfully',
      deletedIdea: {
        id: ideaToDelete.id,
        username: ideaToDelete.username,
        idea: ideaToDelete.idea
      }
    });
    
  } catch (error) {
    console.error('Error deleting idea:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete idea',
      details: error.message
    });
  } finally {
    // Always disconnect from Redis
    if (redis) {
      try {
        await redis.disconnect();
      } catch (err) {
        console.error('Error disconnecting from Redis:', err);
      }
    }
  }
};
