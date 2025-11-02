// Consolidated Admin API route
// Handles all admin operations: auth, get-ideas, get-surveys, delete-idea, delete-survey, reset-votes

const { createClient } = require('redis');
const { verifySessionToken, createSession } = require('./admin-utils');

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

// Handle authentication
async function handleAuth(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed' 
    });
  }

  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ 
        success: false,
        error: 'Password is required' 
      });
    }

    const adminPassword = process.env.ADMIN_PASSWORD;
    
    if (!adminPassword) {
      console.error('ADMIN_PASSWORD environment variable not set');
      return res.status(500).json({ 
        success: false,
        error: 'Server configuration error' 
      });
    }

    const isValid = password === adminPassword;

    if (!isValid) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid password' 
      });
    }

    const { sessionToken, expiresAt } = createSession();

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

// Handle get-ideas
async function handleGetIdeas(req, res) {
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
    redis = await getRedisClient();
    const rawIdeas = await redis.lRange('ideas', 0, -1);
    
    const ideas = [];
    for (const rawIdea of rawIdeas) {
      try {
        const idea = JSON.parse(rawIdea);
        ideas.push(idea);
      } catch (parseError) {
        console.warn('Skipping invalid JSON idea:', rawIdea, parseError.message);
      }
    }
    
    return res.status(200).json({
      success: true,
      ideas: ideas,
      count: ideas.length
    });
    
  } catch (error) {
    console.error('Error retrieving ideas:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve ideas',
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
}

// Handle get-surveys
async function handleGetSurveys(req, res) {
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
    redis = await getRedisClient();
    const rawResponses = await redis.lRange('survey:responses', 0, -1);
    
    const responses = [];
    for (const rawResponse of rawResponses) {
      try {
        const response = JSON.parse(rawResponse);
        responses.push(response);
      } catch (parseError) {
        console.warn('Skipping invalid JSON survey response:', rawResponse, parseError.message);
      }
    }
    
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
    if (redis) {
      try {
        await redis.disconnect();
      } catch (err) {
        console.error('Error disconnecting from Redis:', err);
      }
    }
  }
}

// Handle delete-idea
async function handleDeleteIdea(req, res) {
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

  const { ideaId } = req.body;

  if (!ideaId) {
    return res.status(400).json({ 
      success: false,
      error: 'Idea ID is required' 
    });
  }

  let redis;
  
  try {
    redis = await getRedisClient();
    const rawIdeas = await redis.lRange('ideas', 0, -1);
    let ideaToDelete = null;
    let ideaIndex = -1;
    
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
    
    const remainingIdeas = [];
    for (let i = 0; i < rawIdeas.length; i++) {
      if (i !== ideaIndex) {
        remainingIdeas.push(rawIdeas[i]);
      }
    }
    
    await redis.del('ideas');
    if (remainingIdeas.length > 0) {
      await redis.lPush('ideas', ...remainingIdeas);
    }
    
    console.log('Idea deleted:', ideaToDelete.id, 'by', ideaToDelete.username);
    
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
    if (redis) {
      try {
        await redis.disconnect();
      } catch (err) {
        console.error('Error disconnecting from Redis:', err);
      }
    }
  }
}

// Handle delete-survey
async function handleDeleteSurvey(req, res) {
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

  const { surveyId } = req.body;

  if (!surveyId) {
    return res.status(400).json({ 
      success: false,
      error: 'Survey ID is required' 
    });
  }

  let redis;
  
  try {
    redis = await getRedisClient();
    const rawResponses = await redis.lRange('survey:responses', 0, -1);
    let surveyToDelete = null;
    let surveyIndex = -1;
    
    for (let i = 0; i < rawResponses.length; i++) {
      try {
        const response = JSON.parse(rawResponses[i]);
        if (response.id === surveyId) {
          surveyToDelete = response;
          surveyIndex = i;
          break;
        }
      } catch (parseError) {
        console.warn('Skipping invalid JSON survey response:', rawResponses[i], parseError.message);
        continue;
      }
    }
    
    if (!surveyToDelete) {
      return res.status(404).json({
        success: false,
        error: 'Survey response not found'
      });
    }
    
    const remainingResponses = [];
    for (let i = 0; i < rawResponses.length; i++) {
      if (i !== surveyIndex) {
        remainingResponses.push(rawResponses[i]);
      }
    }
    
    await redis.del('survey:responses');
    if (remainingResponses.length > 0) {
      await redis.lPush('survey:responses', ...remainingResponses);
    }
    
    console.log('Survey response deleted:', surveyToDelete.id, 'from IP:', surveyToDelete.ip);
    
    return res.status(200).json({
      success: true,
      message: 'Survey response deleted successfully',
      deletedSurvey: {
        id: surveyToDelete.id,
        ip: surveyToDelete.ip,
        timestamp: surveyToDelete.timestamp
      }
    });
    
  } catch (error) {
    console.error('Error deleting survey response:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete survey response',
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
}

// Handle reset-votes
async function handleResetVotes(req, res) {
  if (req.method !== 'POST') {
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
    redis = await getRedisClient();
    const rawIdeas = await redis.lRange('ideas', 0, -1);
    const ideas = [];
    
    for (const rawIdea of rawIdeas) {
      try {
        const idea = JSON.parse(rawIdea);
        ideas.push(idea);
      } catch (parseError) {
        console.warn('Skipping invalid JSON idea:', rawIdea, parseError.message);
      }
    }
    
    const resetIdeas = ideas.map(idea => ({
      ...idea,
      votes: 0,
      voters: [],
      lastVoteAt: null
    }));
    
    await redis.del('ideas');
    
    if (resetIdeas.length > 0) {
      await redis.lPush('ideas', ...resetIdeas.map(idea => JSON.stringify(idea)));
    }
    
    console.log(`Admin reset votes for ${ideas.length} ideas`);
    
    return res.status(200).json({
      success: true,
      message: `Successfully reset votes for ${ideas.length} ideas`,
      resetCount: ideas.length
    });
    
  } catch (error) {
    console.error('Error resetting votes:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to reset votes',
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
}

// Main handler
module.exports = async function handler(req, res) {
  // Get action from query parameter (for GET) or body (for POST/DELETE)
  let action;
  
  if (req.method === 'GET') {
    action = req.query.action;
  } else {
    action = req.body?.action;
  }

  if (!action) {
    return res.status(400).json({
      success: false,
      error: 'Action parameter is required. Use ?action=... for GET or { action: ... } in body for POST/DELETE'
    });
  }

  // Route to appropriate handler
  switch (action) {
    case 'auth':
      return handleAuth(req, res);
    case 'get-ideas':
      return handleGetIdeas(req, res);
    case 'get-surveys':
      return handleGetSurveys(req, res);
    case 'delete-idea':
      return handleDeleteIdea(req, res);
    case 'delete-survey':
      return handleDeleteSurvey(req, res);
    case 'reset-votes':
      return handleResetVotes(req, res);
    default:
      return res.status(400).json({
        success: false,
        error: `Unknown action: ${action}. Valid actions: auth, get-ideas, get-surveys, delete-idea, delete-survey, reset-votes`
      });
  }
};

