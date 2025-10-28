// Twitch EventSub webhook handler for channel point voting
// Handles channel.channel_points_custom_reward_redemption.add events

const crypto = require('crypto');

// Load environment variables for local development
if (process.env.NODE_ENV !== 'production') {
  try {
    require('dotenv').config({ path: '.env.local' });
  } catch (error) {
    console.warn('Could not load .env.local:', error.message);
  }
}

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

// Verify Twitch webhook signature
function verifyTwitchSignature(payload, signature, secret) {
  if (!signature || !secret) {
    return false;
  }

  // Twitch sends signature as "sha256=<hash>"
  const expectedSignature = signature.replace('sha256=', '');
  
  // Create HMAC hash
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const calculatedSignature = hmac.digest('hex');
  
  // Compare signatures using timing-safe comparison
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'hex'),
    Buffer.from(calculatedSignature, 'hex')
  );
}

// Parse idea ID from user input (flexible matching)
function parseIdeaId(userInput) {
  if (!userInput || typeof userInput !== 'string') {
    return null;
  }

  // Clean and normalize input
  const cleaned = userInput.trim().toLowerCase();
  
  // Extract numbers from various formats:
  // "5", "idea-5", "#5", "idea 5", "vote 5", "012345"
  const numberMatch = cleaned.match(/(\d+)/);
  
  if (numberMatch) {
    const number = numberMatch[1];
    
    // If it's a short number (1-6 digits), treat as idea ID
    if (number.length <= 6) {
      return number;
    }
    
    // If it's longer, take the last 6 digits (for full timestamps)
    return number.slice(-6);
  }
  
  return null;
}

// Process a vote from channel point redemption
async function processVote(redemption) {
  try {
    // Extract data from redemption
    const userId = redemption.user_id;
    const username = redemption.user_name;
    const userInput = redemption.user_input;
    const pointsSpent = redemption.reward?.cost || 100;
    
    console.log(`Processing vote from ${username}: "${userInput}"`);
    
    // Parse idea ID
    const ideaId = parseIdeaId(userInput);
    
    if (!ideaId) {
      console.warn('Invalid idea ID format:', userInput);
      return { success: false, error: 'Invalid idea ID format' };
    }
    
    // Load ideas from Redis
    const redis = await getRedisClient();
    const rawIdeas = await redis.lRange('ideas', 0, -1);
    const ideas = rawIdeas.map(raw => JSON.parse(raw));
    
    // Find matching idea by ID (exact match or last 6 digits)
    let ideaIndex = -1;
    let matchedIdea = null;
    
    for (let i = 0; i < ideas.length; i++) {
      const idea = ideas[i];
      const ideaIdStr = idea.id.toString();
      
      // Try exact match first
      if (ideaIdStr === ideaId) {
        ideaIndex = i;
        matchedIdea = idea;
        break;
      }
      
      // Try last 6 digits match
      if (ideaIdStr.slice(-6) === ideaId) {
        ideaIndex = i;
        matchedIdea = idea;
        break;
      }
    }
    
    if (ideaIndex === -1) {
      console.warn('Idea not found for ID:', ideaId);
      await redis.disconnect();
      return { success: false, error: 'Idea not found' };
    }
    
    // Update vote count
    const idea = ideas[ideaIndex];
    idea.votes = (idea.votes || 0) + 1;
    
    // Track voter (allow duplicates)
    if (!idea.voters) idea.voters = [];
    
    idea.voters.push({
      userId,
      username,
      votedAt: new Date().toISOString(),
      pointsSpent,
      userInput: userInput.trim() // Store original input for debugging
    });
    
    idea.lastVoteAt = new Date().toISOString();
    
    // Save back to Redis
    await redis.lSet('ideas', ideaIndex, JSON.stringify(idea));
    await redis.disconnect();
    
    console.log(`Vote recorded: ${username} voted for idea ${ideaId} (${idea.votes} total votes)`);
    return { 
      success: true, 
      ideaId, 
      votes: idea.votes,
      voterCount: idea.voters.length
    };
    
  } catch (error) {
    console.error('Error processing vote:', error);
    return { success: false, error: 'Failed to process vote' };
  }
}

// Handle webhook verification challenge
function handleVerificationChallenge(body) {
  const challenge = body.challenge;
  console.log('Received webhook verification challenge:', challenge);
  return challenge;
}

module.exports = async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const webhookSecret = process.env.TWITCH_EVENTSUB_SECRET;
    if (!webhookSecret) {
      console.error('TWITCH_EVENTSUB_SECRET not configured');
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    // Get raw body for signature verification
    const body = req.body;
    const signature = req.headers['twitch-eventsub-message-signature'];
    
    // Verify signature
    const rawBody = JSON.stringify(body);
    if (!verifyTwitchSignature(rawBody, signature, webhookSecret)) {
      console.error('Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Handle verification challenge
    if (body.challenge) {
      const challenge = handleVerificationChallenge(body);
      return res.status(200).send(challenge);
    }

    // Process the event
    const eventType = body.subscription?.type;
    const event = body.event;

    console.log('Received Twitch EventSub webhook:', { eventType, event });

    // Only handle channel point redemptions
    if (eventType === 'channel.channel_points_custom_reward_redemption.add') {
      const result = await processVote(event);
      
      if (result.success) {
        return res.status(200).json({ 
          message: 'Vote processed successfully',
          ideaId: result.ideaId,
          votes: result.votes,
          voterCount: result.voterCount
        });
      } else {
        return res.status(400).json({ 
          error: 'Failed to process vote',
          details: result.error
        });
      }
    }
    
    // For other event types, just acknowledge
    return res.status(200).json({ message: 'Event type not handled' });
    
  } catch (error) {
    console.error('Error processing Twitch EventSub webhook:', error);
    return res.status(500).json({ 
      error: 'Failed to process webhook',
      details: error.message
    });
  }
};
