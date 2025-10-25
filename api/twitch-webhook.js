// Twitch EventSub webhook handler
// Handles stream.online and stream.offline events with signature verification

const crypto = require('crypto');
const { storeStreamStatus } = require('./redis-helper');

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

// Process stream.online event
async function handleStreamOnline(event) {
  const streamData = event.data[0];
  
  const status = {
    isLive: true,
    channelName: streamData.user_login,
    viewerCount: streamData.viewer_count,
    title: streamData.title,
    gameName: streamData.game_name,
    thumbnailUrl: streamData.thumbnail_url,
    startedAt: streamData.started_at
  };
  
  console.log('Stream went online:', status);
  await storeStreamStatus(status);
  
  return status;
}

// Process stream.offline event
async function handleStreamOffline(event) {
  const status = {
    isLive: false,
    channelName: event.broadcaster_user_login
  };
  
  console.log('Stream went offline:', status);
  await storeStreamStatus(status);
  
  return status;
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
    // Load environment variables for local development
    if (process.env.NODE_ENV !== 'production') {
      try {
        require('dotenv').config({ path: '.env.local' });
      } catch (error) {
        console.warn('Could not load .env.local:', error.message);
      }
    }

    const webhookSecret = process.env.TWITCH_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('TWITCH_WEBHOOK_SECRET not configured');
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

    console.log('Received Twitch webhook:', { eventType, event });

    switch (eventType) {
      case 'stream.online':
        await handleStreamOnline(event);
        break;
        
      case 'stream.offline':
        await handleStreamOffline(event);
        break;
        
      default:
        console.log('Unhandled event type:', eventType);
        return res.status(200).json({ message: 'Event type not handled' });
    }

    return res.status(200).json({ message: 'Event processed successfully' });
    
  } catch (error) {
    console.error('Error processing Twitch webhook:', error);
    return res.status(500).json({ 
      error: 'Failed to process webhook',
      details: error.message
    });
  }
};
