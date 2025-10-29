// API route to retrieve all survey responses from Redis (admin only)
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
  // Only allow GET requests
  if (req.method !== 'GET') {
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

  let redis;
  
  try {
    // Connect to Redis
    redis = await getRedisClient();
    
    // Get all survey responses from Redis list (newest first due to LPUSH)
    const rawResponses = await redis.lRange('survey:responses', 0, -1);
    
    // Parse JSON strings to objects, handling invalid JSON gracefully
    const responses = [];
    for (const rawResponse of rawResponses) {
      try {
        const response = JSON.parse(rawResponse);
        responses.push(response);
      } catch (parseError) {
        console.warn('Skipping invalid JSON survey response:', rawResponse, parseError.message);
        // Continue processing other responses
      }
    }
    
    // Return success response with responses array and count
    return res.status(200).json({
      success: true,
      responses: responses,
      count: responses.length
    });
    
  } catch (error) {
    console.error('Error retrieving survey responses:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve survey responses',
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
