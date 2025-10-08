// API route to submit ideas to Discord and save to Redis
// This keeps the webhook URL and Redis connection secure

const { createClient } = require('redis');

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

module.exports = async function handler(req, res) {

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get form data from request
  const { idea, username } = req.body;

  // Validate input
  if (!idea || !username) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (idea.trim().length < 10) {
    return res.status(400).json({ error: 'Idea must be at least 10 characters' });
  }

  let redis;
  
  try {
    // Create idea object
    const ideaObject = {
      id: Date.now().toString(),
      username: username.trim(),
      idea: idea.trim(),
      timestamp: new Date().toISOString(),
      status: 'pending',
      votes: 0
    };

    // Save to Redis
    redis = await getRedisClient();
    await redis.lPush('ideas', JSON.stringify(ideaObject));
    console.log('Idea saved to Redis:', ideaObject.id);

    // Get the webhook URL from environment variable
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    
    // Send to Discord (if webhook is configured)
    if (webhookUrl) {
      const discordMessage = {
        embeds: [{
          title: '💡 New Stream Idea!',
          color: 0x9333EA, // Purple color
          fields: [
            {
              name: 'Idea',
              value: idea.trim(),
              inline: false
            },
            {
              name: 'Suggested by',
              value: `@${username.trim()}`,
              inline: false
            }
          ],
          timestamp: new Date().toISOString(),
          footer: {
            text: 'Stream Calendar Suggestion'
          }
        }]
      };

      const discordResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(discordMessage)
      });

      if (!discordResponse.ok) {
        console.error(`Discord API responded with ${discordResponse.status}`);
        // Don't fail the request if Discord fails - idea is still saved to Redis
      }
    } else {
      console.warn('Discord webhook URL not configured - skipping Discord notification');
    }

    // Success!
    return res.status(200).json({ 
      success: true, 
      message: 'Idea submitted successfully!',
      ideaId: ideaObject.id
    });
    
  } catch (error) {
    console.error('Error submitting idea:', error);
    return res.status(500).json({ 
      error: 'Failed to submit idea. Please try again.',
      details: error.message,
      redisUrl: process.env.REDIS_URL ? 'Set' : 'Not set',
      nodeEnv: process.env.NODE_ENV
    });
  } finally {
    // Always disconnect from Redis
    if (redis) {
      try {
        await redis.disconnect();
      } catch (err) {
        console.error('Error disconnecting from Redis:', err);
      }
    }
  }
}