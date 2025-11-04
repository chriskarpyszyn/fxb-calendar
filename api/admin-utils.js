// Utility functions for admin API routes
// JWT-based session management and verification

const jwt = require('jsonwebtoken');

// JWT secret - use environment variable or fallback
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-development';

// Helper function to create a JWT session token
function createSessionToken() {
  const payload = {
    type: 'admin',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
  };
  
  return jwt.sign(payload, JWT_SECRET);
}

// Helper function to verify JWT session token
function verifySessionToken(token) {
  if (!token) return false;
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.type === 'admin';
  } catch (error) {
    return false;
  }
}

// Helper function to create a new session
function createSession() {
  const sessionToken = createSessionToken();
  const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours

  return { sessionToken, expiresAt };
}

// Helper function to verify channel session token (checks Redis)
async function verifyChannelSessionToken(token, channelName, redis) {
  if (!token || !channelName || !redis) return false;
  
  try {
    // Check if session exists in Redis
    const expiresAt = await redis.get(`24hour:channel:${channelName}:session:${token}`);
    if (!expiresAt) return false;
    
    // Check if expired
    if (Date.now() > parseInt(expiresAt)) {
      // Clean up expired session
      await redis.del(`24hour:channel:${channelName}:session:${token}`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error verifying channel session:', error);
    return false;
  }
}

module.exports = {
  verifySessionToken,
  createSession,
  createSessionToken,
  verifyChannelSessionToken
};
