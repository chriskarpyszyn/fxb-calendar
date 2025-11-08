// Consolidated Admin API route
// Handles all admin operations: auth, get-ideas, get-surveys, delete-idea, delete-survey, reset-votes

const { createClient } = require('redis');
const { verifySessionToken, createSession, verifyChannelSessionToken } = require('./admin-utils');
const bcrypt = require('bcrypt');

// Normalize channel name (lowercase, no spaces)
function normalizeChannelName(channelName) {
  if (!channelName) return null;
  return channelName.toLowerCase().trim();
}

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

// Handle get-24hour-schedule (admin access - can use channel auth or admin auth)
async function handleGet24HourSchedule(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed' 
    });
  }

  // Get channelName from query parameter
  const channelName = normalizeChannelName(req.query.channelName) || normalizeChannelName(req.body?.channelName);
  
  if (!channelName) {
    return res.status(400).json({ 
      success: false,
      error: 'channelName is required' 
    });
  }

  // Verify either admin token or channel token
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : null;

  let redis;
  
  try {
    redis = await getRedisClient();
    
    // Check admin token first (allows access to any channel)
    const isAdmin = verifySessionToken(token);
    
    // If not admin, check channel-specific token
    if (!isAdmin) {
      const isValidChannel = await verifyChannelSessionToken(token, channelName, redis);
      if (!isValidChannel) {
        return res.status(401).json({ 
          success: false,
          error: 'Unauthorized - Invalid or expired session' 
        });
      }
    }
    
    // Get metadata (channel-prefixed)
    const date = await redis.get(`24hour:schedule:${channelName}:date`) || '';
    const startDate = await redis.get(`24hour:schedule:${channelName}:startDate`) || '';
    const endDate = await redis.get(`24hour:schedule:${channelName}:endDate`) || '';
    const startTime = await redis.get(`24hour:schedule:${channelName}:startTime`) || '';
    const endTime = await redis.get(`24hour:schedule:${channelName}:endTime`) || '';
    
    // Get categories (stored as JSON)
    const categoriesJson = await redis.get(`24hour:schedule:${channelName}:categories`) || '{}';
    let categories = {};
    try {
      categories = JSON.parse(categoriesJson);
    } catch (parseError) {
      console.warn('Failed to parse categories:', parseError.message);
    }
    
    // Get slots list (channel-prefixed)
    const slotIndices = await redis.lRange(`24hour:schedule:${channelName}:slots`, 0, -1);
    const timeSlots = [];
    
    for (const index of slotIndices) {
      const hour = await redis.get(`24hour:schedule:${channelName}:slot:${index}:hour`) || '';
      const time = await redis.get(`24hour:schedule:${channelName}:slot:${index}:time`) || '';
      const category = await redis.get(`24hour:schedule:${channelName}:slot:${index}:category`) || '';
      const activity = await redis.get(`24hour:schedule:${channelName}:slot:${index}:activity`) || '';
      const description = await redis.get(`24hour:schedule:${channelName}:slot:${index}:description`) || '';
      
      timeSlots.push({
        hour: hour ? parseInt(hour) : 0,
        time,
        category,
        activity,
        description
      });
    }
    
    return res.status(200).json({
      success: true,
      schedule: {
        channelName: channelName,
        date,
        startDate,
        endDate,
        startTime,
        endTime,
        timeSlots,
        categories
      }
    });
    
  } catch (error) {
    console.error('Error retrieving 24-hour schedule:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve schedule',
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

// Handle add-24hour-slot (admin auth or channel auth required)
async function handleAdd24HourSlot(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed' 
    });
  }

  const { hour, time, category, activity, description, channelName } = req.body;

  if (hour === undefined || !time || !category || !activity) {
    return res.status(400).json({ 
      success: false,
      error: 'hour, time, category, and activity are required' 
    });
  }

  const normalizedChannel = normalizeChannelName(channelName);
  if (!normalizedChannel) {
    return res.status(400).json({ 
      success: false,
      error: 'channelName is required' 
    });
  }

  // Verify admin session token or channel token
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : null;

  let redis;
  
  try {
    redis = await getRedisClient();
    
    // Check admin token first (allows access to any channel)
    const isAdmin = verifySessionToken(token);
    
    // If not admin, check channel-specific token
    if (!isAdmin) {
      const isValidChannel = await verifyChannelSessionToken(token, normalizedChannel, redis);
      if (!isValidChannel) {
        return res.status(401).json({ 
          success: false,
          error: 'Unauthorized - Invalid or expired session' 
        });
      }
    }
    
    // Get current slots list to determine next index (channel-prefixed)
    const slotIndices = await redis.lRange(`24hour:schedule:${normalizedChannel}:slots`, 0, -1);
    const nextIndex = slotIndices.length.toString();
    
    // Add slot to list
    await redis.rPush(`24hour:schedule:${normalizedChannel}:slots`, nextIndex);
    
    // Store slot data as hash fields (channel-prefixed)
    await redis.set(`24hour:schedule:${normalizedChannel}:slot:${nextIndex}:hour`, hour.toString());
    await redis.set(`24hour:schedule:${normalizedChannel}:slot:${nextIndex}:time`, time);
    await redis.set(`24hour:schedule:${normalizedChannel}:slot:${nextIndex}:category`, category);
    await redis.set(`24hour:schedule:${normalizedChannel}:slot:${nextIndex}:activity`, activity);
    await redis.set(`24hour:schedule:${normalizedChannel}:slot:${nextIndex}:description`, description || '');
    
    console.log('24-hour slot added:', nextIndex, 'for channel:', normalizedChannel);
    
    return res.status(200).json({
      success: true,
      message: 'Slot added successfully',
      slotIndex: nextIndex,
      slot: {
        hour: parseInt(hour),
        time,
        category,
        activity,
        description: description || ''
      }
    });
    
  } catch (error) {
    console.error('Error adding 24-hour slot:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to add slot',
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

// Handle update-24hour-slot (admin auth or channel auth required)
async function handleUpdate24HourSlot(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed' 
    });
  }

  const { slotIndex, hour, time, category, activity, description, channelName } = req.body;

  if (slotIndex === undefined || slotIndex === null) {
    return res.status(400).json({ 
      success: false,
      error: 'slotIndex is required' 
    });
  }

  const normalizedChannel = normalizeChannelName(channelName);
  if (!normalizedChannel) {
    return res.status(400).json({ 
      success: false,
      error: 'channelName is required' 
    });
  }

  // Verify admin session token or channel token
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : null;

  let redis;
  
  try {
    redis = await getRedisClient();
    
    // Check admin token first (allows access to any channel)
    const isAdmin = verifySessionToken(token);
    
    // If not admin, check channel-specific token
    if (!isAdmin) {
      const isValidChannel = await verifyChannelSessionToken(token, normalizedChannel, redis);
      if (!isValidChannel) {
        return res.status(401).json({ 
          success: false,
          error: 'Unauthorized - Invalid or expired session' 
        });
      }
    }
    
    // Verify slot exists (channel-prefixed)
    const slotIndices = await redis.lRange(`24hour:schedule:${normalizedChannel}:slots`, 0, -1);
    if (!slotIndices.includes(slotIndex.toString())) {
      return res.status(404).json({
        success: false,
        error: 'Slot not found'
      });
    }
    
    // Update slot fields (channel-prefixed)
    if (hour !== undefined) {
      await redis.set(`24hour:schedule:${normalizedChannel}:slot:${slotIndex}:hour`, hour.toString());
    }
    if (time !== undefined) {
      await redis.set(`24hour:schedule:${normalizedChannel}:slot:${slotIndex}:time`, time);
    }
    if (category !== undefined) {
      await redis.set(`24hour:schedule:${normalizedChannel}:slot:${slotIndex}:category`, category);
    }
    if (activity !== undefined) {
      await redis.set(`24hour:schedule:${normalizedChannel}:slot:${slotIndex}:activity`, activity);
    }
    if (description !== undefined) {
      await redis.set(`24hour:schedule:${normalizedChannel}:slot:${slotIndex}:description`, description);
    }
    
    console.log('24-hour slot updated:', slotIndex, 'for channel:', normalizedChannel);
    
    return res.status(200).json({
      success: true,
      message: 'Slot updated successfully',
      slotIndex: slotIndex.toString()
    });
    
  } catch (error) {
    console.error('Error updating 24-hour slot:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update slot',
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

// Handle delete-24hour-slot (admin auth or channel auth required)
async function handleDelete24HourSlot(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed' 
    });
  }

  const { slotIndex, channelName } = req.body;

  if (slotIndex === undefined || slotIndex === null) {
    return res.status(400).json({ 
      success: false,
      error: 'slotIndex is required' 
    });
  }

  const normalizedChannel = normalizeChannelName(channelName);
  if (!normalizedChannel) {
    return res.status(400).json({ 
      success: false,
      error: 'channelName is required' 
    });
  }

  // Verify admin session token or channel token
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : null;

  let redis;
  
  try {
    redis = await getRedisClient();
    
    // Check admin token first (allows access to any channel)
    const isAdmin = verifySessionToken(token);
    
    // If not admin, check channel-specific token
    if (!isAdmin) {
      const isValidChannel = await verifyChannelSessionToken(token, normalizedChannel, redis);
      if (!isValidChannel) {
        return res.status(401).json({ 
          success: false,
          error: 'Unauthorized - Invalid or expired session' 
        });
      }
    }
    
    // Get current slots list (channel-prefixed)
    const slotIndices = await redis.lRange(`24hour:schedule:${normalizedChannel}:slots`, 0, -1);
    const slotIndexStr = slotIndex.toString();
    
    if (!slotIndices.includes(slotIndexStr)) {
      return res.status(404).json({
        success: false,
        error: 'Slot not found'
      });
    }
    
    // Delete slot hash fields (channel-prefixed)
    await redis.del(`24hour:schedule:${normalizedChannel}:slot:${slotIndexStr}:hour`);
    await redis.del(`24hour:schedule:${normalizedChannel}:slot:${slotIndexStr}:time`);
    await redis.del(`24hour:schedule:${normalizedChannel}:slot:${slotIndexStr}:category`);
    await redis.del(`24hour:schedule:${normalizedChannel}:slot:${slotIndexStr}:activity`);
    await redis.del(`24hour:schedule:${normalizedChannel}:slot:${slotIndexStr}:description`);
    
    // Remove from slots list
    await redis.lRem(`24hour:schedule:${normalizedChannel}:slots`, 0, slotIndexStr);
    
    // Reindex remaining slots - rebuild list with sequential indices
    const remainingIndices = slotIndices.filter(idx => idx !== slotIndexStr);
    
    // Delete old list and rebuild
    await redis.del(`24hour:schedule:${normalizedChannel}:slots`);
    
    if (remainingIndices.length > 0) {
      // Rebuild list with sequential indices 0, 1, 2, ...
      const newIndices = [];
      for (let i = 0; i < remainingIndices.length; i++) {
        const oldIndex = remainingIndices[i];
        const newIndex = i.toString();
        
        // Copy data from old index to new index (channel-prefixed)
        const hour = await redis.get(`24hour:schedule:${normalizedChannel}:slot:${oldIndex}:hour`);
        const time = await redis.get(`24hour:schedule:${normalizedChannel}:slot:${oldIndex}:time`);
        const category = await redis.get(`24hour:schedule:${normalizedChannel}:slot:${oldIndex}:category`);
        const activity = await redis.get(`24hour:schedule:${normalizedChannel}:slot:${oldIndex}:activity`);
        const description = await redis.get(`24hour:schedule:${normalizedChannel}:slot:${oldIndex}:description`);
        
        // Set new index
        if (hour) await redis.set(`24hour:schedule:${normalizedChannel}:slot:${newIndex}:hour`, hour);
        if (time) await redis.set(`24hour:schedule:${normalizedChannel}:slot:${newIndex}:time`, time);
        if (category) await redis.set(`24hour:schedule:${normalizedChannel}:slot:${newIndex}:category`, category);
        if (activity) await redis.set(`24hour:schedule:${normalizedChannel}:slot:${newIndex}:activity`, activity);
        if (description !== null) await redis.set(`24hour:schedule:${normalizedChannel}:slot:${newIndex}:description`, description || '');
        
        // Delete old index if different
        if (oldIndex !== newIndex) {
          await redis.del(`24hour:schedule:${normalizedChannel}:slot:${oldIndex}:hour`);
          await redis.del(`24hour:schedule:${normalizedChannel}:slot:${oldIndex}:time`);
          await redis.del(`24hour:schedule:${normalizedChannel}:slot:${oldIndex}:category`);
          await redis.del(`24hour:schedule:${normalizedChannel}:slot:${oldIndex}:activity`);
          await redis.del(`24hour:schedule:${normalizedChannel}:slot:${oldIndex}:description`);
        }
        
        newIndices.push(newIndex);
      }
      
      // Rebuild list
      await redis.rPush(`24hour:schedule:${normalizedChannel}:slots`, ...newIndices);
    }
    
    console.log('24-hour slot deleted:', slotIndexStr, 'for channel:', normalizedChannel);
    
    return res.status(200).json({
      success: true,
      message: 'Slot deleted successfully',
      deletedSlotIndex: slotIndexStr
    });
    
  } catch (error) {
    console.error('Error deleting 24-hour slot:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete slot',
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

// Handle update-24hour-metadata (admin auth or channel auth required)
async function handleUpdate24HourMetadata(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed' 
    });
  }

  const { date, startDate, endDate, startTime, endTime, channelName } = req.body;

  const normalizedChannel = normalizeChannelName(channelName);
  if (!normalizedChannel) {
    return res.status(400).json({ 
      success: false,
      error: 'channelName is required' 
    });
  }

  // Verify admin session token or channel token
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : null;

  let redis;
  
  try {
    redis = await getRedisClient();
    
    // Check admin token first (allows access to any channel)
    const isAdmin = verifySessionToken(token);
    
    // If not admin, check channel-specific token
    if (!isAdmin) {
      const isValidChannel = await verifyChannelSessionToken(token, normalizedChannel, redis);
      if (!isValidChannel) {
        return res.status(401).json({ 
          success: false,
          error: 'Unauthorized - Invalid or expired session' 
        });
      }
    }
    
    if (date !== undefined) {
      await redis.set(`24hour:schedule:${normalizedChannel}:date`, date);
    }
    if (startDate !== undefined) {
      await redis.set(`24hour:schedule:${normalizedChannel}:startDate`, startDate);
    }
    if (endDate !== undefined) {
      await redis.set(`24hour:schedule:${normalizedChannel}:endDate`, endDate);
    }
    if (startTime !== undefined) {
      await redis.set(`24hour:schedule:${normalizedChannel}:startTime`, startTime);
    }
    if (endTime !== undefined) {
      await redis.set(`24hour:schedule:${normalizedChannel}:endTime`, endTime);
    }
    
    console.log('24-hour schedule metadata updated for channel:', normalizedChannel);
    
    return res.status(200).json({
      success: true,
      message: 'Metadata updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating 24-hour metadata:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update metadata',
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

// Handle update-24hour-categories (admin auth or channel auth required)
async function handleUpdate24HourCategories(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed' 
    });
  }

  const { categories, channelName } = req.body;

  if (!categories || typeof categories !== 'object') {
    return res.status(400).json({ 
      success: false,
      error: 'categories object is required' 
    });
  }

  const normalizedChannel = normalizeChannelName(channelName);
  if (!normalizedChannel) {
    return res.status(400).json({ 
      success: false,
      error: 'channelName is required' 
    });
  }

  // Verify admin session token or channel token
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : null;

  let redis;
  
  try {
    redis = await getRedisClient();
    
    // Check admin token first (allows access to any channel)
    const isAdmin = verifySessionToken(token);
    
    // If not admin, check channel-specific token
    if (!isAdmin) {
      const isValidChannel = await verifyChannelSessionToken(token, normalizedChannel, redis);
      if (!isValidChannel) {
        return res.status(401).json({ 
          success: false,
          error: 'Unauthorized - Invalid or expired session' 
        });
      }
    }
    
    // Store categories as JSON (channel-prefixed)
    await redis.set(`24hour:schedule:${normalizedChannel}:categories`, JSON.stringify(categories));
    
    console.log('24-hour schedule categories updated for channel:', normalizedChannel);
    
    return res.status(200).json({
      success: true,
      message: 'Categories updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating 24-hour categories:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update categories',
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

// Handle create-channel (admin auth required)
async function handleCreateChannel(req, res) {
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
      error: 'Unauthorized - Admin access required' 
    });
  }

  const { channelName, password } = req.body;

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
    
    console.log('Channel created by admin:', normalizedChannel);
    
    return res.status(201).json({
      success: true,
      message: 'Channel created successfully',
      channelName: normalizedChannel
    });
    
  } catch (error) {
    console.error('Error creating channel:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create channel',
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

// Handle list-channels (admin auth required)
async function handleListChannels(req, res) {
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
      error: 'Unauthorized - Admin access required' 
    });
  }

  let redis;
  
  try {
    redis = await getRedisClient();
    
    // Get all channels from the set
    const channels = await redis.sMembers('24hour:channels');
    
    // For each channel, get basic info
    const channelsWithInfo = await Promise.all(
      channels.map(async (channelName) => {
        try {
          const date = await redis.get(`24hour:schedule:${channelName}:date`) || '';
          const slotIndices = await redis.lRange(`24hour:schedule:${channelName}:slots`, 0, -1);
          const hasPassword = await redis.exists(`24hour:channel:${channelName}:password`);
          
          return {
            channelName: channelName,
            date: date,
            slotCount: slotIndices.length,
            hasPassword: hasPassword === 1
          };
        } catch (error) {
          console.error(`Error getting info for channel ${channelName}:`, error);
          return {
            channelName: channelName,
            date: '',
            slotCount: 0,
            hasPassword: false
          };
        }
      })
    );
    
    // Sort by channel name
    channelsWithInfo.sort((a, b) => a.channelName.localeCompare(b.channelName));
    
    return res.status(200).json({
      success: true,
      channels: channelsWithInfo
    });
    
  } catch (error) {
    console.error('Error listing channels:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to list channels',
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

// Handle update-channel-password (admin auth required)
async function handleUpdateChannelPassword(req, res) {
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
      error: 'Unauthorized - Admin access required' 
    });
  }

  const { channelName, password } = req.body;

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
    
    // Check if channel exists
    const channelExists = await redis.sIsMember('24hour:channels', normalizedChannel);
    if (!channelExists) {
      return res.status(404).json({ 
        success: false,
        error: 'Channel not found' 
      });
    }
    
    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Update channel password
    await redis.set(`24hour:channel:${normalizedChannel}:password`, hashedPassword);
    
    // Invalidate all existing sessions for this channel
    // Note: This is a simple approach - you might want to track sessions and delete them individually
    const pattern = `24hour:channel:${normalizedChannel}:session:*`;
    // We can't easily delete by pattern in Redis, so sessions will expire naturally
    
    console.log('Channel password updated by admin:', normalizedChannel);
    
    return res.status(200).json({
      success: true,
      message: 'Password updated successfully',
      channelName: normalizedChannel
    });
    
  } catch (error) {
    console.error('Error updating channel password:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update password',
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

// Handle delete-channel (admin auth required)
async function handleDeleteChannel(req, res) {
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
      error: 'Unauthorized - Admin access required' 
    });
  }

  const { channelName } = req.body;

  if (!channelName) {
    return res.status(400).json({ 
      success: false,
      error: 'channelName is required' 
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
    
    // Check if channel exists
    const channelExists = await redis.sIsMember('24hour:channels', normalizedChannel);
    if (!channelExists) {
      return res.status(404).json({ 
        success: false,
        error: 'Channel not found' 
      });
    }
    
    // Delete channel password
    await redis.del(`24hour:channel:${normalizedChannel}:password`);
    
    // Delete schedule metadata
    await redis.del(`24hour:schedule:${normalizedChannel}:date`);
    await redis.del(`24hour:schedule:${normalizedChannel}:startDate`);
    await redis.del(`24hour:schedule:${normalizedChannel}:endDate`);
    await redis.del(`24hour:schedule:${normalizedChannel}:startTime`);
    await redis.del(`24hour:schedule:${normalizedChannel}:endTime`);
    await redis.del(`24hour:schedule:${normalizedChannel}:categories`);
    
    // Delete all slots
    const slotIndices = await redis.lRange(`24hour:schedule:${normalizedChannel}:slots`, 0, -1);
    for (const index of slotIndices) {
      await redis.del(`24hour:schedule:${normalizedChannel}:slot:${index}:hour`);
      await redis.del(`24hour:schedule:${normalizedChannel}:slot:${index}:time`);
      await redis.del(`24hour:schedule:${normalizedChannel}:slot:${index}:category`);
      await redis.del(`24hour:schedule:${normalizedChannel}:slot:${index}:activity`);
      await redis.del(`24hour:schedule:${normalizedChannel}:slot:${index}:description`);
    }
    await redis.del(`24hour:schedule:${normalizedChannel}:slots`);
    
    // Remove from channels set
    await redis.sRem('24hour:channels', normalizedChannel);
    
    console.log('Channel deleted by admin:', normalizedChannel);
    
    return res.status(200).json({
      success: true,
      message: 'Channel deleted successfully',
      channelName: normalizedChannel
    });
    
  } catch (error) {
    console.error('Error deleting channel:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete channel',
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

// Handle get-widget-timer (admin auth required)
async function handleGetWidgetTimer(req, res) {
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

  const channel = 'itsflannelbeard';
  let redis;
  
  try {
    redis = await getRedisClient();
    
    // Get timer state from Redis
    const duration = await redis.get(`widget:timer:${channel}:duration`);
    const startTime = await redis.get(`widget:timer:${channel}:startTime`);
    const pausedAt = await redis.get(`widget:timer:${channel}:pausedAt`);
    const isRunning = await redis.get(`widget:timer:${channel}:isRunning`);
    
    const durationMs = duration ? parseInt(duration) : 0;
    const startTimeMs = startTime ? parseInt(startTime) : null;
    const pausedAtMs = pausedAt ? parseInt(pausedAt) : null;
    const isRunningBool = isRunning === 'true';
    
    let remainingTime = 0;
    
    if (isRunningBool && startTimeMs) {
      // Timer is running - calculate remaining time
      const now = Date.now();
      const elapsed = now - startTimeMs;
      remainingTime = Math.max(0, durationMs - elapsed);
    } else if (pausedAtMs !== null) {
      // Timer is paused - use paused value
      remainingTime = Math.max(0, pausedAtMs);
    } else {
      // Timer not started yet - use full duration
      remainingTime = durationMs;
    }
    
    return res.status(200).json({
      success: true,
      duration: durationMs,
      remainingTime: remainingTime,
      startTime: startTimeMs,
      pausedAt: pausedAtMs,
      isRunning: isRunningBool && remainingTime > 0
    });
    
  } catch (error) {
    console.error('Error getting widget timer:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get timer state',
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

// Handle get-widget-timer-public (public endpoint, no auth required)
async function handleGetWidgetTimerPublic(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed' 
    });
  }

  const channel = 'itsflannelbeard';
  let redis;
  
  try {
    redis = await getRedisClient();
    
    // Get timer state from Redis
    const duration = await redis.get(`widget:timer:${channel}:duration`);
    const startTime = await redis.get(`widget:timer:${channel}:startTime`);
    const pausedAt = await redis.get(`widget:timer:${channel}:pausedAt`);
    const isRunning = await redis.get(`widget:timer:${channel}:isRunning`);
    
    // If no timer is set, return default state
    if (!duration) {
      return res.status(200).json({
        success: true,
        remainingTime: 0,
        isRunning: false,
        formattedTime: '00:00:00',
        isExpired: false
      });
    }
    
    const durationMs = parseInt(duration) || 0;
    const isRunningBool = isRunning === 'true';
    const pausedAtMs = pausedAt ? parseInt(pausedAt) : null;
    const startTimeMs = startTime ? parseInt(startTime) : null;
    
    let remainingTime = 0;
    
    if (isRunningBool && startTimeMs) {
      // Timer is running - calculate remaining time
      const now = Date.now();
      const elapsed = now - startTimeMs;
      remainingTime = Math.max(0, durationMs - elapsed);
    } else if (pausedAtMs !== null) {
      // Timer is paused - use paused value
      remainingTime = Math.max(0, pausedAtMs);
    } else {
      // Timer not started yet - use full duration
      remainingTime = durationMs;
    }
    
    const isExpired = remainingTime <= 0;
    
    // Format milliseconds to HH:MM:SS
    const totalSeconds = Math.floor(remainingTime / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    return res.status(200).json({
      success: true,
      remainingTime: remainingTime,
      isRunning: isRunningBool && !isExpired,
      formattedTime: formattedTime,
      isExpired: isExpired
    });
    
  } catch (error) {
    console.error('Error getting widget timer:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get timer state',
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

// Handle set-widget-timer (admin auth required)
async function handleSetWidgetTimer(req, res) {
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

  const { hours, minutes, startImmediately } = req.body;
  
  if (hours === undefined || minutes === undefined) {
    return res.status(400).json({ 
      success: false,
      error: 'hours and minutes are required' 
    });
  }
  
  const hoursNum = parseInt(hours) || 0;
  const minutesNum = parseInt(minutes) || 0;
  
  if (hoursNum < 0 || minutesNum < 0) {
    return res.status(400).json({ 
      success: false,
      error: 'hours and minutes must be non-negative' 
    });
  }
  
  const durationMs = (hoursNum * 60 + minutesNum) * 60 * 1000;
  
  if (durationMs <= 0) {
    return res.status(400).json({ 
      success: false,
      error: 'Duration must be greater than 0' 
    });
  }

  const channel = 'itsflannelbeard';
  let redis;
  
  try {
    redis = await getRedisClient();
    
    // Set duration
    await redis.set(`widget:timer:${channel}:duration`, durationMs.toString());
    
    if (startImmediately) {
      // Start timer immediately
      const now = Date.now();
      await redis.set(`widget:timer:${channel}:startTime`, now.toString());
      await redis.del(`widget:timer:${channel}:pausedAt`);
      await redis.set(`widget:timer:${channel}:isRunning`, 'true');
    } else {
      // Reset timer state
      await redis.del(`widget:timer:${channel}:startTime`);
      await redis.del(`widget:timer:${channel}:pausedAt`);
      await redis.set(`widget:timer:${channel}:isRunning`, 'false');
    }
    
    console.log('Widget timer set:', { durationMs, startImmediately });
    
    return res.status(200).json({
      success: true,
      message: 'Timer set successfully',
      duration: durationMs,
      startImmediately: startImmediately || false
    });
    
  } catch (error) {
    console.error('Error setting widget timer:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to set timer',
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

// Handle update-widget-timer (admin auth required)
async function handleUpdateWidgetTimer(req, res) {
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

  const { action, adjustMinutes } = req.body;
  
  if (!action || !['start', 'stop', 'pause', 'resume', 'adjust'].includes(action)) {
    return res.status(400).json({ 
      success: false,
      error: 'action must be one of: start, stop, pause, resume, adjust' 
    });
  }

  const channel = 'itsflannelbeard';
  let redis;
  
  try {
    redis = await getRedisClient();
    
    // Get current state
    const duration = await redis.get(`widget:timer:${channel}:duration`);
    const startTime = await redis.get(`widget:timer:${channel}:startTime`);
    const pausedAt = await redis.get(`widget:timer:${channel}:pausedAt`);
    const isRunning = await redis.get(`widget:timer:${channel}:isRunning`);
    
    if (!duration) {
      return res.status(400).json({ 
        success: false,
        error: 'Timer not set. Please set duration first.' 
      });
    }
    
    const durationMs = parseInt(duration);
    const startTimeMs = startTime ? parseInt(startTime) : null;
    const pausedAtMs = pausedAt ? parseInt(pausedAt) : null;
    const isRunningBool = isRunning === 'true';
    const now = Date.now();
    
    if (action === 'start') {
      // Start timer from current remaining time
      let remainingTime = durationMs;
      
      if (pausedAtMs !== null) {
        remainingTime = pausedAtMs;
      } else if (startTimeMs) {
        // Calculate remaining time if it was running before
        const elapsed = now - startTimeMs;
        remainingTime = Math.max(0, durationMs - elapsed);
      }
      
      // Update duration to remaining time and start
      const newStartTime = now;
      await redis.set(`widget:timer:${channel}:duration`, remainingTime.toString());
      await redis.set(`widget:timer:${channel}:startTime`, newStartTime.toString());
      await redis.del(`widget:timer:${channel}:pausedAt`);
      await redis.set(`widget:timer:${channel}:isRunning`, 'true');
      
      return res.status(200).json({
        success: true,
        message: 'Timer started',
        duration: remainingTime
      });
      
    } else if (action === 'stop') {
      // Stop and reset timer
      await redis.del(`widget:timer:${channel}:startTime`);
      await redis.del(`widget:timer:${channel}:pausedAt`);
      await redis.set(`widget:timer:${channel}:isRunning`, 'false');
      
      return res.status(200).json({
        success: true,
        message: 'Timer stopped'
      });
      
    } else if (action === 'pause') {
      if (!isRunningBool || !startTimeMs) {
        return res.status(400).json({ 
          success: false,
          error: 'Timer is not running' 
        });
      }
      
      // Calculate remaining time and pause
      const elapsed = now - startTimeMs;
      const remainingTime = Math.max(0, durationMs - elapsed);
      
      await redis.del(`widget:timer:${channel}:startTime`);
      await redis.set(`widget:timer:${channel}:pausedAt`, remainingTime.toString());
      await redis.set(`widget:timer:${channel}:isRunning`, 'false');
      
      return res.status(200).json({
        success: true,
        message: 'Timer paused',
        remainingTime: remainingTime
      });
      
    } else if (action === 'resume') {
      if (isRunningBool) {
        return res.status(400).json({ 
          success: false,
          error: 'Timer is already running' 
        });
      }
      
      if (pausedAtMs === null) {
        return res.status(400).json({ 
          success: false,
          error: 'Timer is not paused' 
        });
      }
      
      // Resume from paused time
      const remainingTime = pausedAtMs;
      const newStartTime = now;
      
      await redis.set(`widget:timer:${channel}:duration`, remainingTime.toString());
      await redis.set(`widget:timer:${channel}:startTime`, newStartTime.toString());
      await redis.del(`widget:timer:${channel}:pausedAt`);
      await redis.set(`widget:timer:${channel}:isRunning`, 'true');
      
      return res.status(200).json({
        success: true,
        message: 'Timer resumed',
        duration: remainingTime
      });
      
    } else if (action === 'adjust') {
      if (adjustMinutes === undefined) {
        return res.status(400).json({ 
          success: false,
          error: 'adjustMinutes is required for adjust action' 
        });
      }
      
      const adjustMs = parseInt(adjustMinutes) * 60 * 1000;
      
      // Calculate current remaining time
      let currentRemaining = durationMs;
      
      if (isRunningBool && startTimeMs) {
        const elapsed = now - startTimeMs;
        currentRemaining = Math.max(0, durationMs - elapsed);
      } else if (pausedAtMs !== null) {
        currentRemaining = pausedAtMs;
      }
      
      // Adjust remaining time
      const newRemaining = Math.max(0, currentRemaining + adjustMs);
      
      if (isRunningBool && startTimeMs) {
        // Update duration and adjust start time to maintain remaining time
        const newStartTime = now - (newRemaining - currentRemaining);
        await redis.set(`widget:timer:${channel}:duration`, newRemaining.toString());
        await redis.set(`widget:timer:${channel}:startTime`, newStartTime.toString());
      } else {
        // Update duration or pausedAt
        await redis.set(`widget:timer:${channel}:duration`, newRemaining.toString());
        if (pausedAtMs !== null) {
          await redis.set(`widget:timer:${channel}:pausedAt`, newRemaining.toString());
        }
      }
      
      return res.status(200).json({
        success: true,
        message: 'Timer adjusted',
        remainingTime: newRemaining,
        adjustment: adjustMinutes
      });
    }
    
  } catch (error) {
    console.error('Error updating widget timer:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update timer',
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
    case 'get-24hour-schedule':
      return handleGet24HourSchedule(req, res);
    case 'add-24hour-slot':
      return handleAdd24HourSlot(req, res);
    case 'update-24hour-slot':
      return handleUpdate24HourSlot(req, res);
    case 'delete-24hour-slot':
      return handleDelete24HourSlot(req, res);
    case 'update-24hour-metadata':
      return handleUpdate24HourMetadata(req, res);
    case 'update-24hour-categories':
      return handleUpdate24HourCategories(req, res);
    case 'create-channel':
      return handleCreateChannel(req, res);
    case 'list-channels':
      return handleListChannels(req, res);
    case 'update-channel-password':
      return handleUpdateChannelPassword(req, res);
    case 'delete-channel':
      return handleDeleteChannel(req, res);
    case 'get-widget-timer':
      return handleGetWidgetTimer(req, res);
    case 'set-widget-timer':
      return handleSetWidgetTimer(req, res);
    case 'update-widget-timer':
      return handleUpdateWidgetTimer(req, res);
    case 'get-widget-timer-public':
      return handleGetWidgetTimerPublic(req, res);
    default:
      return res.status(400).json({
        success: false,
        error: `Unknown action: ${action}. Valid actions: auth, get-ideas, get-surveys, delete-idea, delete-survey, reset-votes, get-24hour-schedule, add-24hour-slot, update-24hour-slot, delete-24hour-slot, update-24hour-metadata, update-24hour-categories, create-channel, list-channels, update-channel-password, delete-channel, get-widget-timer, set-widget-timer, update-widget-timer, get-widget-timer-public`
      });
  }
};

