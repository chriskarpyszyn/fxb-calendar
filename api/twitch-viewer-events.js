// Twitch EventSub webhook handler for viewer events
// Handles channel.subscribe, channel.follow, and channel.cheer events

const crypto = require('crypto');
const { storeViewerEvent, updateGoal, updateStreak, updateCheckIn } = require('./redis-helper');

// Load environment variables for local development
if (process.env.NODE_ENV !== 'production') {
  try {
    require('dotenv').config({ path: '.env.local' });
  } catch (error) {
    console.warn('Could not load .env.local:', error.message);
  }
}

// Helper function to get header (case-insensitive)
function getHeader(req, headerName) {
  const lowerHeaderName = headerName.toLowerCase();
  const headers = req.headers || {};
  
  // Try exact match first
  if (headers[headerName]) {
    return headers[headerName];
  }
  
  // Try case-insensitive match
  for (const key in headers) {
    if (key.toLowerCase() === lowerHeaderName) {
      return headers[key];
    }
  }
  
  // Try capitalized version
  const capitalized = headerName.split('-').map(part => 
    part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
  ).join('-');
  
  if (headers[capitalized]) {
    return headers[capitalized];
  }
  
  return null;
}

// Verify Twitch webhook signature
function verifyTwitchSignature(messageId, timestamp, body, signature, secret) {
  if (!signature || !secret || !messageId || !timestamp || !body) {
    return false;
  }

  try {
    const message = messageId + timestamp + body;
    const expectedSignature = signature.replace('sha256=', '').trim();
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(message, 'utf8');
    const calculatedSignature = hmac.digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(calculatedSignature, 'hex')
    );
  } catch (error) {
    console.error('Error during signature verification:', error.message);
    return false;
  }
}

// Handle verification challenge
function handleVerificationChallenge(body) {
  if (body.challenge) {
    return body.challenge;
  }
  return '';
}

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
    // Get current count and increment
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
    // For "Last 7 Days Top Cheerer", we'd need to track all cheers and aggregate
    // For now, we'll store the most recent cheer with bits
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
    
    console.log('[Viewer Events Webhook] Request received:', {
      method: req.method,
      messageType: messageType,
      messageId: messageId || 'MISSING',
      timestamp: timestamp || 'MISSING',
      hasSignature: !!signature,
      hasBody: !!body
    });

    // Validate required headers
    if (!messageId || !timestamp || !signature) {
      console.error('[Viewer Events Webhook] Missing required headers');
      return res.status(400).json({ error: 'Missing required Twitch EventSub headers' });
    }

    if (!body) {
      console.error('[Viewer Events Webhook] Missing request body');
      return res.status(400).json({ error: 'Missing request body' });
    }

    // Stringify body for signature verification
    const rawBody = JSON.stringify(body);
    
    console.log('[Viewer Events Webhook] Verifying signature...');
    const isValidSignature = verifyTwitchSignature(messageId, timestamp, rawBody, signature, webhookSecret);
    
    if (!isValidSignature) {
      console.error('[Viewer Events Webhook] Signature verification failed');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    console.log('[Viewer Events Webhook] Signature verified successfully');

    // Handle verification challenge (for initial subscription setup)
    if (body.challenge) {
      console.log('[Viewer Events Webhook] Handling verification challenge');
      const challenge = handleVerificationChallenge(body);
      console.log('[Viewer Events Webhook] Challenge response sent');
      return res.status(200).send(challenge);
    }

    // Process the event
    const eventType = body.subscription?.type;
    const event = body.event;

    console.log('[Viewer Events Webhook] Processing event:', {
      eventType: eventType,
      subscriptionId: body.subscription?.id,
      hasEvent: !!event
    });

    let result = null;

    // Handle different event types
    switch (eventType) {
      case 'channel.subscribe':
      case 'channel.subscription.message':
        result = await processSubscribe(event);
        break;
        
      case 'channel.follow':
        result = await processFollow(event);
        break;
        
      case 'channel.cheer':
        result = await processCheer(event);
        break;
        
      default:
        console.log('[Viewer Events Webhook] Unhandled event type:', eventType);
        return res.status(200).json({ message: 'Event type not handled' });
    }
    
    const duration = Date.now() - startTime;
    
    if (result && result.success) {
      console.log('[Viewer Events Webhook] Event processed successfully:', {
        eventType,
        result,
        duration: `${duration}ms`
      });
      
      return res.status(200).json({ 
        message: 'Event processed successfully',
        eventType,
        result,
        duration: `${duration}ms`
      });
    } else {
      console.warn('[Viewer Events Webhook] Event processing failed:', {
        eventType,
        error: result?.error,
        duration: `${duration}ms`
      });
      
      return res.status(400).json({ 
        error: 'Failed to process event',
        details: result?.error || 'Unknown error',
        duration: `${duration}ms`
      });
    }
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[Viewer Events Webhook] Error processing webhook:', {
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

