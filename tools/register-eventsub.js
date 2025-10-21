#!/usr/bin/env node

// EventSub Registration Script for Twitch Channel Points Voting
// Registers webhook subscription for channel point reward redemptions

// Load environment variables for local development
if (process.env.NODE_ENV !== 'production') {
  try {
    require('dotenv').config({ path: '.env.local' });
  } catch (error) {
    console.warn('Could not load .env.local:', error.message);
  }
}

// Configuration
const EVENTSUB_TYPE = 'channel.channel_points_custom_reward_redemption.add';
const EVENTSUB_VERSION = '1';

// Get OAuth token from Twitch (reused from twitch-status.js)
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

// Register EventSub subscription
async function registerEventSub(broadcasterId, rewardId, callbackUrl, secret) {
  const token = await getTwitchToken();
  const clientId = process.env.TWITCH_CLIENT_ID;

  const subscriptionData = {
    type: EVENTSUB_TYPE,
    version: EVENTSUB_VERSION,
    condition: {
      broadcaster_user_id: broadcasterId,
      reward_id: rewardId
    },
    transport: {
      method: 'webhook',
      callback: callbackUrl,
      secret: secret
    }
  };

  const response = await fetch('https://api.twitch.tv/helix/eventsub/subscriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Client-Id': clientId,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(subscriptionData)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to register EventSub: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.data[0];
}

// Main function
async function main() {
  console.log('🎯 Twitch EventSub Registration Script');
  console.log('=====================================\n');

  try {
    // Check required environment variables
    const requiredVars = [
      'TWITCH_CLIENT_ID',
      'TWITCH_CLIENT_SECRET',
      'TWITCH_CHANNEL_NAME',
      'TWITCH_EVENTSUB_SECRET',
      'TWITCH_EVENTSUB_CALLBACK_URL',
      'TWITCH_REWARD_ID'
    ];

    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      console.error('❌ Missing required environment variables:');
      missingVars.forEach(varName => console.error(`   - ${varName}`));
      console.error('\nPlease check your .env.local file or environment configuration.');
      process.exit(1);
    }

    // Get configuration
    const channelName = process.env.TWITCH_CHANNEL_NAME;
    const rewardId = process.env.TWITCH_REWARD_ID;
    const callbackUrl = process.env.TWITCH_EVENTSUB_CALLBACK_URL;
    const secret = process.env.TWITCH_EVENTSUB_SECRET;

    console.log('📋 Configuration:');
    console.log(`   Channel: ${channelName}`);
    console.log(`   Reward ID: ${rewardId}`);
    console.log(`   Callback URL: ${callbackUrl}`);
    console.log(`   EventSub Type: ${EVENTSUB_TYPE}\n`);

    // Get broadcaster ID
    console.log('🔍 Fetching broadcaster ID...');
    const broadcasterId = await getBroadcasterId(channelName);
    console.log(`✓ Broadcaster ID: ${broadcasterId}\n`);

    // Register EventSub subscription
    console.log('📡 Registering EventSub subscription...');
    const subscription = await registerEventSub(broadcasterId, rewardId, callbackUrl, secret);
    
    console.log('✅ EventSub subscription registered successfully!');
    console.log(`   Subscription ID: ${subscription.id}`);
    console.log(`   Status: ${subscription.status}`);
    console.log(`   Created: ${new Date(subscription.created_at).toLocaleString()}`);
    
    if (subscription.status === 'webhook_callback_verification_pending') {
      console.log('\n⚠️  Note: Subscription is pending verification.');
      console.log('   Twitch will send a verification request to your callback URL.');
      console.log('   Make sure your webhook handler is ready to respond to the challenge.');
    }

    console.log('\n🎉 Setup complete! Your voting system is ready to receive webhooks.');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { getTwitchToken, getBroadcasterId, registerEventSub };

