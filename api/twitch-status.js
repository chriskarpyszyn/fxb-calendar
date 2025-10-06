// API route to check Twitch live status
// Checks if the channel is live and returns stream info

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

// Check if channel is live
async function getStreamStatus(channelName) {
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

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const channelName = process.env.TWITCH_CHANNEL_NAME || 'itsFlannelBeard';

  try {
    const status = await getStreamStatus(channelName);
    
    // Set cache headers to avoid hitting rate limits
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    
    return res.status(200).json(status);
    
  } catch (error) {
    console.error('Error checking Twitch status:', error);
    return res.status(500).json({ 
      error: 'Failed to check stream status',
      isLive: false 
    });
  }
}