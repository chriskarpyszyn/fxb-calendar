#!/usr/bin/env node

// Script to fix failed Twitch EventSub subscriptions
// Deletes failed subscriptions and recreates them

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

// Delete EventSub subscription
async function deleteEventSubSubscription(subscriptionId) {
  const token = await getTwitchToken();
  const clientId = process.env.TWITCH_CLIENT_ID;

  const response = await fetch(`https://api.twitch.tv/helix/eventsub/subscriptions?id=${subscriptionId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Client-Id': clientId
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to delete EventSub subscription: ${response.status} ${errorText}`);
  }

  return true;
}

// Create EventSub subscription
async function createEventSubSubscription(type, broadcasterId, callbackUrl, secret) {
  const token = await getTwitchToken();
  const clientId = process.env.TWITCH_CLIENT_ID;

  const subscriptionData = {
    type: type,
    version: '1',
    condition: {
      broadcaster_user_id: broadcasterId
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
    throw new Error(`Failed to create EventSub subscription: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.data[0];
}

// Get all EventSub subscriptions
async function getEventSubSubscriptions() {
  const token = await getTwitchToken();
  const clientId = process.env.TWITCH_CLIENT_ID;

  const response = await fetch('https://api.twitch.tv/helix/eventsub/subscriptions', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Client-Id': clientId
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get EventSub subscriptions: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.data;
}

// Main function
async function main() {
  console.log('🔧 Fixing Failed Twitch EventSub Subscriptions');
  console.log('===============================================\n');

  try {
    // Check required environment variables
    const requiredVars = [
      'TWITCH_CLIENT_ID',
      'TWITCH_CLIENT_SECRET',
      'TWITCH_CHANNEL_NAME',
      'TWITCH_WEBHOOK_SECRET',
      'TWITCH_WEBHOOK_CALLBACK_URL'
    ];

    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      console.error('❌ Missing required environment variables:');
      missingVars.forEach(varName => console.error(`   - ${varName}`));
      console.error('\nPlease check your .env.local file or environment configuration.');
      process.exit(1);
    }

    const channelName = process.env.TWITCH_CHANNEL_NAME;
    const callbackUrl = process.env.TWITCH_WEBHOOK_CALLBACK_URL;
    const secret = process.env.TWITCH_WEBHOOK_SECRET;

    console.log('📋 Configuration:');
    console.log(`   Channel: ${channelName}`);
    console.log(`   Callback URL: ${callbackUrl}`);
    console.log(`   Secret: ${secret ? '***configured***' : 'NOT SET'}\n`);

    // Get broadcaster ID
    console.log('🔍 Fetching broadcaster ID...');
    const broadcasterId = await getBroadcasterId(channelName);
    console.log(`✓ Broadcaster ID: ${broadcasterId}\n`);

    // Get current subscriptions
    console.log('📡 Fetching current subscriptions...');
    const subscriptions = await getEventSubSubscriptions();
    
    // Find failed stream subscriptions
    const failedStreamSubs = subscriptions.filter(sub => 
      (sub.type === 'stream.online' || sub.type === 'stream.offline') &&
      sub.status === 'webhook_callback_verification_failed'
    );

    if (failedStreamSubs.length === 0) {
      console.log('✅ No failed stream subscriptions found!');
      return;
    }

    console.log(`❌ Found ${failedStreamSubs.length} failed stream subscription(s):`);
    failedStreamSubs.forEach(sub => {
      console.log(`   - ${sub.type} (${sub.id})`);
    });
    console.log('');

    // Delete failed subscriptions
    console.log('🗑️  Deleting failed subscriptions...');
    for (const sub of failedStreamSubs) {
      try {
        await deleteEventSubSubscription(sub.id);
        console.log(`✓ Deleted ${sub.type} subscription`);
      } catch (error) {
        console.error(`✗ Failed to delete ${sub.type} subscription:`, error.message);
      }
    }
    console.log('');

    // Wait a moment for cleanup
    console.log('⏳ Waiting for cleanup...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Recreate subscriptions
    console.log('🔄 Creating new subscriptions...');
    
    const streamEvents = ['stream.online', 'stream.offline'];
    for (const eventType of streamEvents) {
      try {
        const subscription = await createEventSubSubscription(
          eventType,
          broadcasterId,
          callbackUrl,
          secret
        );
        
        console.log(`✅ Created ${eventType} subscription:`);
        console.log(`   ID: ${subscription.id}`);
        console.log(`   Status: ${subscription.status}`);
        
        if (subscription.status === 'webhook_callback_verification_pending') {
          console.log(`   ⚠️  Verification pending - Twitch will send a challenge to your webhook`);
        }
        
      } catch (error) {
        console.error(`✗ Failed to create ${eventType} subscription:`, error.message);
      }
    }

    console.log('\n🎉 Stream event subscriptions have been recreated!');
    console.log('\nNext steps:');
    console.log('1. Make sure your webhook endpoint is accessible');
    console.log('2. Twitch will send verification challenges to your webhook');
    console.log('3. Your webhook should respond with the challenge string');
    console.log('4. Once verified, you\'ll start receiving stream.online/offline events');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { 
  getTwitchToken, 
  getBroadcasterId, 
  deleteEventSubSubscription, 
  createEventSubSubscription,
  getEventSubSubscriptions 
};
