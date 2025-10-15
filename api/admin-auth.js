// API route for admin authentication
// Validates password and returns session token

const crypto = require('crypto');
const { createSession } = require('./admin-utils');

// Load environment variables for local development
if (process.env.NODE_ENV !== 'production') {
  try {
    require('dotenv').config({ path: '.env.local' });
  } catch (error) {
    console.warn('Could not load .env.local:', error.message);
  }
}

// Main handler function
async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed' 
    });
  }

  try {
    const { password } = req.body;

    // Validate input
    if (!password) {
      return res.status(400).json({ 
        success: false,
        error: 'Password is required' 
      });
    }

    // Get admin password from environment
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    if (!adminPassword) {
      console.error('ADMIN_PASSWORD environment variable not set');
      return res.status(500).json({ 
        success: false,
        error: 'Server configuration error' 
      });
    }

    // Simple password comparison (for now)
    const isValid = password === adminPassword;

    if (!isValid) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid password' 
      });
    }

    // Create session
    const { sessionToken, expiresAt } = createSession();

    // Return success with session token
    return res.status(200).json({
      success: true,
      message: 'Authentication successful',
      sessionToken: sessionToken,
      expiresAt: expiresAt
    });

  } catch (error) {
    console.error('Error in admin authentication:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
}

// Export the handler function
module.exports = handler;
