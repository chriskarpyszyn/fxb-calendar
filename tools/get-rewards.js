#!/usr/bin/env node

// Helper script to list Twitch Channel Point Rewards
// This will help you find the Reward ID for your voting system

// Load environment variables for local development
if (process.env.NODE_ENV !== 'production') {
  try {
    require('dotenv').config({ path: '.env.local' });
  } catch (error) {
    console.warn('Could not load .env.local:', error.message);
  }
}

// Get OAuth token from Twitch
async function getTwitchToken() {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET environment variables are required');
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
    const errorText = await response.text();
    throw new Error(`Failed to get Twitch OAuth token: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.access_token;
}

// Get broadcaster ID from channel name
async function getBroadcasterId(channelName) {
  const token = await getTwitchToken();
  const clientId = process.env.TWITCH_CLIENT_ID;

  const response = await fetch(
    `https://api.twitch.tv/helix/users?login=${channelName}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Client-Id': clientId
      }
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get broadcaster info: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  
  if (!data.data || data.data.length === 0) {
    throw new Error(`Channel '${channelName}' not found`);
  }

  return data.data[0].id;
}

// Get all channel point rewards
async function getChannelPointRewards(broadcasterId) {
  const token = await getTwitchToken();
  const clientId = process.env.TWITCH_CLIENT_ID;

  const response = await fetch(
    `https://api.twitch.tv/helix/channel_points/custom_rewards?broadcaster_id=${broadcasterId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Client-Id': clientId
      }
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get channel point rewards: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.data;
}

// Main function
async function main() {
  console.log('🎯 Twitch Channel Point Rewards Finder');
  console.log('=====================================\n');

  try {
    // Check required environment variables
    const requiredVars = [
      'TWITCH_CLIENT_ID',
      'TWITCH_CLIENT_SECRET',
      'TWITCH_CHANNEL_NAME'
    ];

    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      console.error('❌ Missing required environment variables:');
      missingVars.forEach(varName => console.error(`   - ${varName}`));
      console.error('\nPlease check your .env.local file or environment configuration.');
      process.exit(1);
    }

    const channelName = process.env.TWITCH_CHANNEL_NAME;
    console.log(`🔍 Fetching rewards for channel: ${channelName}\n`);

    // Get broadcaster ID
    const broadcasterId = await getBroadcasterId(channelName);
    console.log(`✓ Broadcaster ID: ${broadcasterId}\n`);

    // Get all rewards
    const rewards = await getChannelPointRewards(broadcasterId);
    
    if (rewards.length === 0) {
      console.log('❌ No channel point rewards found.');
      console.log('Make sure you have created at least one custom reward in your Twitch dashboard.');
      return;
    }

    console.log(`📋 Found ${rewards.length} channel point reward(s):\n`);
    
    rewards.forEach((reward, index) => {
      console.log(`${index + 1}. ${reward.title}`);
      console.log(`   ID: ${reward.id}`);
      console.log(`   Cost: ${reward.cost} points`);
      console.log(`   Enabled: ${reward.is_enabled ? '✅' : '❌'}`);
      console.log(`   User Input Required: ${reward.is_user_input_required ? '✅' : '❌'}`);
      if (reward.prompt) {
        console.log(`   Prompt: "${reward.prompt}"`);
      }
      console.log('');
    });

    // Look for voting reward specifically
    const votingReward = rewards.find(reward => 
      reward.title.toLowerCase().includes('vote') || 
      reward.title.toLowerCase().includes('idea')
    );

    if (votingReward) {
      console.log('🎯 Found your voting reward:');
      console.log(`   Name: ${votingReward.title}`);
      console.log(`   ID: ${votingReward.id}`);
      console.log('\n📋 Add this to your .env.local file:');
      console.log(`TWITCH_REWARD_ID=${votingReward.id}`);
    } else {
      console.log('⚠️  No reward found with "vote" or "idea" in the name.');
      console.log('If you created a voting reward, make sure it matches the expected name.');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { getTwitchToken, getBroadcasterId, getChannelPointRewards };
