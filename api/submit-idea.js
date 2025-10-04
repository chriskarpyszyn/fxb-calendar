// API route to submit ideas to Discord
// This keeps the webhook URL secret

export default async function handler(req, res) {
  // Load environment variables for local development
  if (process.env.NODE_ENV !== 'production') {
    const { config } = await import('dotenv');
    config({ path: '.env.local' });
  }
    // Only allow POST requests
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  
    // Get the webhook URL from environment variable
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    
    if (!webhookUrl) {
      console.error('Discord webhook URL not configured');
      return res.status(500).json({ error: 'Server configuration error' });
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
  
    // Format the Discord message
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
  
    try {
      // Send to Discord
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(discordMessage)
      });
  
      if (!response.ok) {
        throw new Error(`Discord API responded with ${response.status}`);
      }
  
      // Success!
      return res.status(200).json({ success: true, message: 'Idea submitted successfully!' });
      
    } catch (error) {
      console.error('Error sending to Discord:', error);
      return res.status(500).json({ error: 'Failed to submit idea. Please try again.' });
    }
  }