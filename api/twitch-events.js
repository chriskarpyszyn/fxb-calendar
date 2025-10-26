// Server-Sent Events endpoint for real-time Twitch status updates
// Designed for Vercel with 50-second timeout and automatic reconnection

const { addSSEClient, removeSSEClient, getStreamStatus } = require('./redis-helper');

module.exports = async function handler(req, res) {
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
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Send initial connection message
  res.write('data: {"type":"connected","message":"SSE connection established"}\n\n');

  // Get current status and send immediately
  try {
    const currentStatus = await getStreamStatus();
    if (currentStatus) {
      res.write(`data: ${JSON.stringify(currentStatus)}\n\n`);
    } else {
      // If no status in Redis, send default offline status
      const defaultStatus = {
        isLive: false,
        channelName: process.env.TWITCH_CHANNEL_NAME || 'itsFlannelBeard',
        loading: false
      };
      res.write(`data: ${JSON.stringify(defaultStatus)}\n\n`);
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
  }

  // Add client to registry
  addSSEClient(res);

  // Send heartbeat every 15 seconds
  const heartbeatInterval = setInterval(() => {
    try {
      res.write('data: {"type":"heartbeat","timestamp":"' + new Date().toISOString() + '"}\n\n');
    } catch (error) {
      console.error('Error sending heartbeat:', error);
      clearInterval(heartbeatInterval);
      removeSSEClient(res);
    }
  }, 15000);

  // Close connection after 50 seconds (within Vercel limits)
  const timeoutId = setTimeout(() => {
    try {
      res.write('data: {"type":"timeout","message":"Connection closing for reconnection"}\n\n');
      res.end();
    } catch (error) {
      console.error('Error closing connection:', error);
    }
    clearInterval(heartbeatInterval);
    removeSSEClient(res);
  }, 50000);

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
