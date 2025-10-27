// Server-Sent Events endpoint for real-time Twitch status updates
// Designed for Vercel with 50-second timeout and automatic reconnection

const { addSSEClient, removeSSEClient, getStreamStatus } = require('./redis-helper');

module.exports = async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });
    return res.end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  });

  // Send initial connection message
  res.write('data: {"type":"connected","message":"SSE connection established"}\n\n');
  
  console.log('SSE connection established for client');

  // Get current status and send immediately
  try {
    console.log('Attempting to get stream status from Redis...');
    const currentStatus = await getStreamStatus();
    console.log('Redis status:', currentStatus);
    
    if (currentStatus) {
      res.write(`data: ${JSON.stringify(currentStatus)}\n\n`);
      console.log('Sent Redis status to client');
    } else {
      console.log('No status in Redis, falling back to Twitch API...');
      // If no status in Redis, fall back to Twitch API
      const { getStreamStatusFromTwitch } = require('./twitch-status');
      const channelName = process.env.TWITCH_CHANNEL_NAME || 'itsFlannelBeard';
      const twitchStatus = await getStreamStatusFromTwitch(channelName);
      
      if (twitchStatus) {
        res.write(`data: ${JSON.stringify(twitchStatus)}\n\n`);
        console.log('Sent Twitch API status to client');
        // Store in Redis for future requests
        const { storeStreamStatus } = require('./redis-helper');
        await storeStreamStatus(twitchStatus);
      } else {
        // Default offline status
        const defaultStatus = {
          isLive: false,
          channelName: channelName,
          loading: false
        };
        res.write(`data: ${JSON.stringify(defaultStatus)}\n\n`);
        console.log('Sent default offline status to client');
      }
    }
  } catch (error) {
    console.error('Error getting initial status:', error);
    const errorStatus = {
      isLive: false,
      channelName: process.env.TWITCH_CHANNEL_NAME || 'itsFlannelBeard',
      loading: false,
      error: 'Failed to get status'
    };
    res.write(`data: ${JSON.stringify(errorStatus)}\n\n`);
    console.log('Sent error status to client');
  }

  // Add client to registry
  addSSEClient(res);
  console.log('SSE client added to registry');

  // Send heartbeat every 5 seconds (more frequent for Vercel Hobby)
  const heartbeatInterval = setInterval(() => {
    try {
      res.write('data: {"type":"heartbeat","timestamp":"' + new Date().toISOString() + '"}\n\n');
    } catch (error) {
      console.error('Error sending heartbeat:', error);
      clearInterval(heartbeatInterval);
      removeSSEClient(res);
    }
  }, 5000);

  // Close connection after 9 seconds (within Vercel Hobby 10s limit)
  const timeoutId = setTimeout(() => {
    try {
      res.write('data: {"type":"timeout","message":"Connection closing for reconnection"}\n\n');
      res.end();
    } catch (error) {
      console.error('Error closing connection:', error);
    }
    clearInterval(heartbeatInterval);
    removeSSEClient(res);
  }, 9000);

  // Handle client disconnect
  req.on('close', () => {
    console.log('SSE client disconnected');
    clearInterval(heartbeatInterval);
    clearTimeout(timeoutId);
    removeSSEClient(res);
  });

  // Handle client error
  req.on('error', (error) => {
    console.error('SSE client error:', error);
    clearInterval(heartbeatInterval);
    clearTimeout(timeoutId);
    removeSSEClient(res);
  });
};
