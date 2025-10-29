#!/usr/bin/env node

// Script to check current Twitch EventSub subscriptions
// Helps debug webhook issues

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
  console.log('🔍 Checking Twitch EventSub Subscriptions');
  console.log('==========================================\n');

  try {
    // Check required environment variables
    const requiredVars = [
      'TWITCH_CLIENT_ID',
      'TWITCH_CLIENT_SECRET'
    ];

    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      console.error('❌ Missing required environment variables:');
      missingVars.forEach(varName => console.error(`   - ${varName}`));
      console.error('\nPlease check your .env.local file or environment configuration.');
      process.exit(1);
    }

    // Get subscriptions
    console.log('📡 Fetching EventSub subscriptions...');
    const subscriptions = await getEventSubSubscriptions();
    
    if (subscriptions.length === 0) {
      console.log('❌ No EventSub subscriptions found!');
      console.log('\nYou need to create subscriptions for:');
      console.log('   - stream.online');
      console.log('   - stream.offline');
      console.log('\nRun the subscribe-webhooks.sh script or use the Twitch API directly.');
      return;
    }

    console.log(`✅ Found ${subscriptions.length} EventSub subscription(s):\n`);

    subscriptions.forEach((sub, index) => {
      console.log(`${index + 1}. ${sub.type} (v${sub.version})`);
      console.log(`   ID: ${sub.id}`);
      console.log(`   Status: ${sub.status}`);
      console.log(`   Created: ${new Date(sub.created_at).toLocaleString()}`);
      
      if (sub.condition) {
        console.log(`   Condition:`, JSON.stringify(sub.condition, null, 2));
      }
      
      if (sub.transport) {
        console.log(`   Callback: ${sub.transport.callback}`);
      }
      
      console.log('');
    });

    // Check for stream events specifically
    const streamOnlineSub = subscriptions.find(sub => sub.type === 'stream.online');
    const streamOfflineSub = subscriptions.find(sub => sub.type === 'stream.offline');

    console.log('🎯 Stream Event Analysis:');
    if (streamOnlineSub) {
      console.log(`✅ stream.online subscription found (${streamOnlineSub.status})`);
    } else {
      console.log('❌ stream.online subscription NOT found');
    }

    if (streamOfflineSub) {
      console.log(`✅ stream.offline subscription found (${streamOfflineSub.status})`);
    } else {
      console.log('❌ stream.offline subscription NOT found');
    }

    if (!streamOnlineSub || !streamOfflineSub) {
      console.log('\n⚠️  Missing stream event subscriptions!');
      console.log('This explains why the webhook isn\'t receiving stream status updates.');
      console.log('\nTo fix this, run:');
      console.log('   ./subscribe-webhooks.sh');
      console.log('\nOr manually create subscriptions using the Twitch API.');
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

module.exports = { getTwitchToken, getEventSubSubscriptions };
