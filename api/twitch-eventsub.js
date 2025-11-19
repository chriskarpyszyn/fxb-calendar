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
function verifyTwitchSignature(messageId, timestamp, body, signature, secret) {
  if (!signature || !secret || !messageId || !timestamp || !body) {
    console.error('Missing required signature components:', {
      hasSignature: !!signature,
      hasSecret: !!secret,
      hasMessageId: !!messageId,
      hasTimestamp: !!timestamp,
      hasBody: !!body
    });
    return false;
  }

  try {
    // Twitch requires: HMAC-SHA256(message-id + timestamp + raw-body)
    // Note: body should be the raw JSON string, not the parsed object
    const message = messageId + timestamp + body;
    
    const expectedSignature = signature.replace('sha256=', '').trim();
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(message, 'utf8');
    const calculatedSignature = hmac.digest('hex');
    
    const isValid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(calculatedSignature, 'hex')
    );

    if (!isValid) {
      // Log first few characters for debugging (not the full signature for security)
      console.error('Signature verification failed:', {
        expectedPrefix: expectedSignature.substring(0, 8) + '...',
        calculatedPrefix: calculatedSignature.substring(0, 8) + '...',
        messageLength: message.length,
        messageIdLength: messageId?.length || 0,
        timestampLength: timestamp?.length || 0,
        bodyLength: body?.length || 0
      });
    }
    
    return isValid;
  } catch (error) {
    console.error('Error during signature verification:', error.message);
    return false;
  }
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

// Normalize headers (Vercel might lowercase them)
function getHeader(req, headerName) {
  // Try exact match first
  if (req.headers[headerName]) {
    return req.headers[headerName];
  }
  // Try lowercase
  const lowerHeaderName = headerName.toLowerCase();
  if (req.headers[lowerHeaderName]) {
    return req.headers[lowerHeaderName];
  }
  // Try with capitalized words
  const capitalized = headerName.split('-').map(part => 
    part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
  ).join('-');
  if (req.headers[capitalized]) {
    return req.headers[capitalized];
  }
  return null;
}

// Viewer event processing (subscribe, follow, cheer)
const { storeViewerEvent, updateGoal } = require('./redis-helper');

// Process subscribe event
async function processSubscribe(event) {
  try {
    const channelName = event.broadcaster_user_login || event.broadcaster_user_name;
    const username = event.user_name || event.user_login;
    const isGift = event.is_gift || false;
    const tier = event.tier || '1000';
    
    if (!channelName || !username) {
      console.warn('Missing required fields in subscribe event:', event);
      return { success: false, error: 'Missing required fields' };
    }

    // Store last subscriber
    await storeViewerEvent(channelName, 'lastSubscriber', {
      username,
      isGift,
      tier,
      userId: event.user_id
    });

    // Update sub goal
    const subGoalKey = `twitch:channel:${channelName.toLowerCase()}:subGoal`;
    const { getRedisClient } = require('./redis-helper');
    const redis = await getRedisClient();
    try {
      const existing = await redis.get(subGoalKey);
      const current = existing ? JSON.parse(existing).current || 0 : 0;
      await updateGoal(channelName, 'subGoal', current + 1);
    } finally {
      await redis.disconnect();
    }

    console.log(`Subscribe event processed: ${username} subscribed to ${channelName}`);
    return { success: true, username, channelName };
  } catch (error) {
    console.error('Error processing subscribe event:', error);
    return { success: false, error: error.message };
  }
}

// Process follow event
async function processFollow(event) {
  try {
    const channelName = event.broadcaster_user_login || event.broadcaster_user_name;
    const username = event.user_name || event.user_login;
    
    if (!channelName || !username) {
      console.warn('Missing required fields in follow event:', event);
      return { success: false, error: 'Missing required fields' };
    }

    // Store last follower
    await storeViewerEvent(channelName, 'lastFollower', {
      username,
      userId: event.user_id,
      followedAt: event.followed_at
    });

    // Update follower goal
    const followerGoalKey = `twitch:channel:${channelName.toLowerCase()}:followerGoal`;
    const { getRedisClient } = require('./redis-helper');
    const redis = await getRedisClient();
    try {
      const existing = await redis.get(followerGoalKey);
      const current = existing ? JSON.parse(existing).current || 0 : 0;
      await updateGoal(channelName, 'followerGoal', current + 1);
    } finally {
      await redis.disconnect();
    }

    console.log(`Follow event processed: ${username} followed ${channelName}`);
    return { success: true, username, channelName };
  } catch (error) {
    console.error('Error processing follow event:', error);
    return { success: false, error: error.message };
  }
}

// Process cheer event
async function processCheer(event) {
  try {
    const channelName = event.broadcaster_user_login || event.broadcaster_user_name;
    const username = event.user_name || event.user_login;
    const bits = parseInt(event.bits || 0, 10);
    
    if (!channelName || !username || bits <= 0) {
      console.warn('Missing or invalid fields in cheer event:', event);
      return { success: false, error: 'Missing or invalid fields' };
    }

    // Store last cheerer (only if this is a significant cheer)
    const { getRedisClient } = require('./redis-helper');
    const redis = await getRedisClient();
    try {
      const lastCheererKey = `twitch:channel:${channelName.toLowerCase()}:lastCheerer`;
      const existing = await redis.get(lastCheererKey);
      
      // Only update if this cheer has more bits than the last one, or if no last cheer exists
      if (!existing || bits >= JSON.parse(existing).bits) {
        await storeViewerEvent(channelName, 'lastCheerer', {
          username,
          bits,
          userId: event.user_id
        });
      }
    } finally {
      await redis.disconnect();
    }

    console.log(`Cheer event processed: ${username} cheered ${bits} bits to ${channelName}`);
    return { success: true, username, bits, channelName };
  } catch (error) {
    console.error('Error processing cheer event:', error);
    return { success: false, error: error.message };
  }
}

// Handle viewer events (routes to appropriate handler)
async function handleViewerEvent(eventType, event) {
  switch (eventType) {
    case 'channel.subscribe':
    case 'channel.subscription.message':
      const subscribeResult = await processSubscribe(event);
      return { handled: true, ...subscribeResult };
      
    case 'channel.follow':
      const followResult = await processFollow(event);
      return { handled: true, ...followResult };
      
    case 'channel.cheer':
      const cheerResult = await processCheer(event);
      return { handled: true, ...cheerResult };
      
    default:
      return { handled: false };
  }
}

module.exports = async function handler(req, res) {
  const startTime = Date.now();
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    console.warn(`Method not allowed: ${req.method}`);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const webhookSecret = process.env.TWITCH_EVENTSUB_SECRET;
    if (!webhookSecret) {
      console.error('TWITCH_EVENTSUB_SECRET not configured');
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    // Get headers (normalize for different environments)
    const messageId = getHeader(req, 'twitch-eventsub-message-id');
    const timestamp = getHeader(req, 'twitch-eventsub-message-timestamp');
    const signature = getHeader(req, 'twitch-eventsub-message-signature');
    const messageType = getHeader(req, 'twitch-eventsub-message-type');

    // Get body (Vercel automatically parses JSON, so we need to stringify it back)
    const body = req.body;
    
    // Add comprehensive diagnostic logging
    console.log('[EventSub Webhook] Request received:', {
      method: req.method,
      messageType: messageType,
      messageId: messageId || 'MISSING',
      timestamp: timestamp || 'MISSING',
      hasSignature: !!signature,
      signaturePrefix: signature ? signature.substring(0, 12) + '...' : 'MISSING',
      hasBody: !!body,
      bodyType: typeof body,
      hasSecret: !!webhookSecret
    });

    // Validate required headers
    if (!messageId || !timestamp || !signature) {
      console.error('[EventSub Webhook] Missing required headers:', {
        messageId: !!messageId,
        timestamp: !!timestamp,
        signature: !!signature,
        availableHeaders: Object.keys(req.headers).filter(h => h.toLowerCase().includes('twitch'))
      });
      return res.status(400).json({ error: 'Missing required Twitch EventSub headers' });
    }

    if (!body) {
      console.error('[EventSub Webhook] Missing request body');
      return res.status(400).json({ error: 'Missing request body' });
    }

    // Stringify body for signature verification
    // Use consistent JSON stringification (sorted keys, no extra whitespace)
    // Note: This should match Twitch's original body format
    const rawBody = JSON.stringify(body);
    
    console.log('[EventSub Webhook] Verifying signature...');
    const isValidSignature = verifyTwitchSignature(messageId, timestamp, rawBody, signature, webhookSecret);
    
    if (!isValidSignature) {
      console.error('[EventSub Webhook] Signature verification failed');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    console.log('[EventSub Webhook] Signature verified successfully');

    // Handle verification challenge (for initial subscription setup)
    if (body.challenge) {
      console.log('[EventSub Webhook] Handling verification challenge');
      const challenge = handleVerificationChallenge(body);
      console.log('[EventSub Webhook] Challenge response sent');
      return res.status(200).send(challenge);
    }

    // Process the event
    const eventType = body.subscription?.type;
    const event = body.event;

    console.log('[EventSub Webhook] Processing event:', {
      eventType: eventType,
      subscriptionId: body.subscription?.id,
      hasEvent: !!event
    });

    // Handle channel point redemptions (voting)
    if (eventType === 'channel.channel_points_custom_reward_redemption.add') {
      console.log('[EventSub Webhook] Processing channel point redemption:', {
        userId: event?.user_id,
        username: event?.user_name,
        userInput: event?.user_input,
        rewardId: event?.reward?.id,
        rewardTitle: event?.reward?.title
      });

      const result = await processVote(event);
      
      const duration = Date.now() - startTime;
      
      if (result.success) {
        console.log('[EventSub Webhook] Vote processed successfully:', {
          ideaId: result.ideaId,
          votes: result.votes,
          voterCount: result.voterCount,
          duration: `${duration}ms`
        });
        
        return res.status(200).json({ 
          message: 'Vote processed successfully',
          ideaId: result.ideaId,
          votes: result.votes,
          voterCount: result.voterCount
        });
      } else {
        console.warn('[EventSub Webhook] Vote processing failed:', {
          error: result.error,
          userInput: event?.user_input,
          duration: `${duration}ms`
        });
        
        return res.status(400).json({ 
          error: 'Failed to process vote',
          details: result.error
        });
      }
    }
    
    // Handle viewer events (subscribe, follow, cheer)
    const viewerEventResult = await handleViewerEvent(eventType, event);
    if (viewerEventResult.handled) {
      const duration = Date.now() - startTime;
      if (viewerEventResult.success) {
        console.log('[EventSub Webhook] Viewer event processed successfully:', {
          eventType,
          result: viewerEventResult.result,
          duration: `${duration}ms`
        });
        return res.status(200).json({
          message: 'Event processed successfully',
          eventType,
          result: viewerEventResult.result
        });
      } else {
        console.warn('[EventSub Webhook] Viewer event processing failed:', {
          eventType,
          error: viewerEventResult.error,
          duration: `${duration}ms`
        });
        return res.status(400).json({
          error: 'Failed to process event',
          details: viewerEventResult.error
        });
      }
    }
    
    // For other event types, just acknowledge
    console.log('[EventSub Webhook] Unhandled event type:', eventType);
    return res.status(200).json({ message: 'Event type not handled' });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[EventSub Webhook] Error processing webhook:', {
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    
    return res.status(500).json({ 
      error: 'Failed to process webhook',
      details: error.message
    });
  }
};
