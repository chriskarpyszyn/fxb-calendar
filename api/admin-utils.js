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

module.exports = {
  verifySessionToken,
  createSession,
  createSessionToken
};
