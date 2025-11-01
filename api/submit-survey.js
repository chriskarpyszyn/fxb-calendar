// API route to submit survey responses and save to Redis

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

// Extract IP address from request headers
function extractIpAddress(req) {
  // Check for Cloudflare connecting IP first
  if (req.headers['cf-connecting-ip']) {
    return req.headers['cf-connecting-ip'];
  }

  // Check for x-forwarded-for (may contain multiple IPs, take the first one)
  const xForwardedFor = req.headers['x-forwarded-for'];
  if (xForwardedFor) {
    // x-forwarded-for can contain multiple IPs separated by commas
    // The first IP is usually the original client IP
    const ips = xForwardedFor.split(',').map(ip => ip.trim());
    return ips[0];
  }

  // Fallback to req.ip if available
  if (req.ip) {
    return req.ip;
  }

  // Last resort - use connection remoteAddress
  if (req.connection && req.connection.remoteAddress) {
    return req.connection.remoteAddress;
  }

  return 'unknown';
}

module.exports = async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get form data from request
  const { categories, otherText } = req.body;

  // Validate input
  if (!categories || !Array.isArray(categories) || categories.length === 0) {
    return res.status(400).json({ error: 'Please select at least one category' });
  }

  // Validate other text if Other category is selected
  if (categories.includes('Other') && (!otherText || !otherText.trim())) {
    return res.status(400).json({ error: 'Please specify what "Other" category you have in mind' });
  }

  let redis;
  
  try {
    // Extract IP address
    const ipAddress = extractIpAddress(req);

    // Create survey response object
    const surveyResponse = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ip: ipAddress,
      categories: categories,
      otherText: categories.includes('Other') && otherText ? otherText.trim() : null
    };

    // Save to Redis
    redis = await getRedisClient();
    await redis.lPush('survey:responses', JSON.stringify(surveyResponse));
    console.log('Survey response saved to Redis:', surveyResponse.id);

    // Success!
    return res.status(200).json({ 
      success: true, 
      message: 'Survey submitted successfully!',
      responseId: surveyResponse.id
    });
    
  } catch (error) {
    console.error('Error submitting survey:', error);
    return res.status(500).json({ 
      error: 'Failed to submit survey. Please try again.',
      details: error.message,
      redisUrl: process.env.REDIS_URL ? 'Set' : 'Not set',
      nodeEnv: process.env.NODE_ENV
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
