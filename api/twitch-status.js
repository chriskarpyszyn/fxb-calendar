// API route to check Twitch live status
// Reads from Redis (updated by webhooks) with Twitch API fallback

const { getStreamStatus } = require('./redis-helper');

let cachedToken = null;
let tokenExpiry = null;

// Get OAuth token from Twitch
async function getTwitchToken() {
  // Return cached token if still valid
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Twitch credentials not configured');
  }

  const response = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials'
    })
  });

  if (!response.ok) {
    throw new Error('Failed to get Twitch OAuth token');
  }

  const data = await response.json();
  cachedToken = data.access_token;
  // Cache token for slightly less than expiry time (with 5min buffer)
  tokenExpiry = Date.now() + (data.expires_in - 300) * 1000;

  return cachedToken;
}

// Check if channel is live (renamed to avoid conflict with Redis function)
async function getStreamStatusFromTwitch(channelName) {
  const token = await getTwitchToken();
  const clientId = process.env.TWITCH_CLIENT_ID;

  // First, get user ID from username
  const userResponse = await fetch(
    `https://api.twitch.tv/helix/users?login=${channelName}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Client-Id': clientId
      }
    }
  );

  if (!userResponse.ok) {
    throw new Error('Failed to get Twitch user info');
  }

  const userData = await userResponse.json();
  
  if (!userData.data || userData.data.length === 0) {
    throw new Error('Twitch channel not found');
  }

  const userId = userData.data[0].id;

  // Now check if user is streaming
  const streamResponse = await fetch(
    `https://api.twitch.tv/helix/streams?user_id=${userId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Client-Id': clientId
      }
    }
  );

  if (!streamResponse.ok) {
    throw new Error('Failed to get stream status');
  }

  const streamData = await streamResponse.json();

  if (!streamData.data || streamData.data.length === 0) {
    // Not live
    return {
      isLive: false,
      channelName: channelName
    };
  }

  // Live!
  const stream = streamData.data[0];
  return {
    isLive: true,
    channelName: channelName,
    viewerCount: stream.viewer_count,
    title: stream.title,
    gameName: stream.game_name,
    thumbnailUrl: stream.thumbnail_url,
    startedAt: stream.started_at
  };
}

module.exports = async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const channelName = process.env.TWITCH_CHANNEL_NAME || 'itsFlannelBeard';

  try {
    // First, try to get status from Redis (updated by webhooks)
    let status = await getStreamStatus();
    
    if (!status) {
      // Fallback to Twitch API if no data in Redis
      console.log('No status in Redis, falling back to Twitch API');
      status = await getStreamStatusFromTwitch(channelName);
      
      // Store the result in Redis for future requests
      if (status) {
        const { storeStreamStatus } = require('./redis-helper');
        await storeStreamStatus(status);
      }
    }
    
    // If still no status, return default offline
    if (!status) {
      status = {
        isLive: false,
        channelName: channelName
      };
    }
    
    // Set cache headers (shorter since we have webhook updates)
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate');
    
    return res.status(200).json(status);
    
  } catch (error) {
    console.error('Error checking Twitch status:', error);
    return res.status(500).json({ 
      error: 'Failed to check stream status',
      isLive: false,
      channelName: channelName
    });
  }
}