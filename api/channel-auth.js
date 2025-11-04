// Channel-specific authentication API
// Each channel has its own password

const bcrypt = require('bcrypt');
const { createClient } = require('redis');
const { createSessionToken } = require('./admin-utils');

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

module.exports = async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed' 
    });
  }

  const { channelName, password, action } = req.body;

  // Validate input
  if (!channelName || !password) {
    return res.status(400).json({ 
      success: false,
      error: 'channelName and password are required' 
    });
  }

  const normalizedChannel = normalizeChannelName(channelName);
  
  if (!normalizedChannel) {
    return res.status(400).json({ 
      success: false,
      error: 'Invalid channel name' 
    });
  }

  let redis;
  
  try {
    redis = await getRedisClient();
    
    // Handle login action
    if (action === 'login' || !action) {
      // Check if channel exists
      const hashedPassword = await redis.get(`24hour:channel:${normalizedChannel}:password`);
      
      if (!hashedPassword) {
        return res.status(401).json({ 
          success: false,
          error: 'Channel not found or invalid credentials' 
        });
      }
      
      // Verify password
      const isValid = await bcrypt.compare(password, hashedPassword);
      
      if (!isValid) {
        return res.status(401).json({ 
          success: false,
          error: 'Invalid password' 
        });
      }
      
      // Create channel-specific session token
      const sessionToken = createSessionToken();
      const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
      
      // Store session info (optional - can also be stateless with JWT)
      await redis.set(`24hour:channel:${normalizedChannel}:session:${sessionToken}`, expiresAt.toString(), {
        EX: 24 * 60 * 60 // 24 hours expiry
      });
      
      return res.status(200).json({
        success: true,
        message: 'Authentication successful',
        sessionToken: sessionToken,
        expiresAt: expiresAt,
        channelName: normalizedChannel
      });
    }
    
    // Handle register action (for creating new channels)
    if (action === 'register') {
      // Check if channel already exists
      const existingPassword = await redis.get(`24hour:channel:${normalizedChannel}:password`);
      
      if (existingPassword) {
        return res.status(409).json({ 
          success: false,
          error: 'Channel already exists' 
        });
      }
      
      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      // Store channel password
      await redis.set(`24hour:channel:${normalizedChannel}:password`, hashedPassword);
      
      // Add to channels set
      await redis.sAdd('24hour:channels', normalizedChannel);
      
      // Initialize empty schedule metadata
      await redis.set(`24hour:schedule:${normalizedChannel}:date`, '');
      await redis.set(`24hour:schedule:${normalizedChannel}:startDate`, '');
      await redis.set(`24hour:schedule:${normalizedChannel}:endDate`, '');
      await redis.set(`24hour:schedule:${normalizedChannel}:startTime`, '');
      await redis.set(`24hour:schedule:${normalizedChannel}:endTime`, '');
      await redis.set(`24hour:schedule:${normalizedChannel}:categories`, '{}');
      
      console.log('Channel registered:', normalizedChannel);
      
      // Auto-login after registration
      const sessionToken = createSessionToken();
      const expiresAt = Date.now() + (24 * 60 * 60 * 1000);
      
      await redis.set(`24hour:channel:${normalizedChannel}:session:${sessionToken}`, expiresAt.toString(), {
        EX: 24 * 60 * 60
      });
      
      return res.status(201).json({
        success: true,
        message: 'Channel registered successfully',
        sessionToken: sessionToken,
        expiresAt: expiresAt,
        channelName: normalizedChannel
      });
    }
    
    return res.status(400).json({ 
      success: false,
      error: 'Invalid action. Use "login" or "register"' 
    });
    
  } catch (error) {
    console.error('Error in channel authentication:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error',
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

