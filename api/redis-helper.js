// Centralized Redis helper module for Twitch webhook and SSE functionality
// Reuses connection logic from submit-idea.js

const { createClient } = require('redis');

// In-memory store for SSE clients
let sseClients = new Set();

// Helper function to get Redis client
async function getRedisClient() {
  // Load environment variables for local development
  if (process.env.NODE_ENV !== 'production') {
    try {
      require('dotenv').config({ path: '.env.local' });
    } catch (error) {
      console.warn('Could not load .env.local:', error.message);
    }
  }

  if (!process.env.REDIS_URL) {
    throw new Error('REDIS_URL environment variable is not set');
  }

  const redis = createClient({
    url: process.env.REDIS_URL
  });

  // Add error handling for connection
  redis.on('error', (err) => {
    console.error('Redis Client Error:', err);
  });

  await redis.connect();
  return redis;
}

// Store stream status in Redis
async function storeStreamStatus(status) {
  const redis = await getRedisClient();
  try {
    const statusWithTimestamp = {
      ...status,
      updatedAt: new Date().toISOString()
    };
    
    await redis.set('twitch:stream:status', JSON.stringify(statusWithTimestamp));
    console.log('Stream status stored in Redis:', statusWithTimestamp);
    
    // Broadcast to all connected SSE clients
    broadcastToSSEClients(statusWithTimestamp);
    
    return statusWithTimestamp;
  } finally {
    await redis.disconnect();
  }
}

// Get stream status from Redis
async function getStreamStatus() {
  const redis = await getRedisClient();
  try {
    const statusJson = await redis.get('twitch:stream:status');
    if (!statusJson) {
      return null;
    }
    return JSON.parse(statusJson);
  } finally {
    await redis.disconnect();
  }
}

// Add SSE client to registry
function addSSEClient(client) {
  sseClients.add(client);
  console.log(`SSE client added. Total clients: ${sseClients.size}`);
}

// Remove SSE client from registry
function removeSSEClient(client) {
  sseClients.delete(client);
  console.log(`SSE client removed. Total clients: ${sseClients.size}`);
}

// Broadcast message to all connected SSE clients
function broadcastToSSEClients(data) {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  const deadClients = [];
  
  sseClients.forEach(client => {
    try {
      client.write(message);
    } catch (error) {
      console.error('Error writing to SSE client:', error);
      deadClients.push(client);
    }
  });
  
  // Remove dead clients
  deadClients.forEach(client => removeSSEClient(client));
  
  console.log(`Broadcasted to ${sseClients.size} SSE clients`);
}

// Get count of connected SSE clients
function getSSEClientCount() {
  return sseClients.size;
}

module.exports = {
  getRedisClient,
  storeStreamStatus,
  getStreamStatus,
  addSSEClient,
  removeSSEClient,
  broadcastToSSEClients,
  getSSEClientCount
};
