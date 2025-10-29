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
      console.log('\nYou may need to create subscriptions for:');
      console.log('   - stream.online (for stream status)');
      console.log('   - stream.offline (for stream status)');
      console.log('   - channel.channel_points_custom_reward_redemption.add (for voting)');
      console.log('\nFor voting, run: node tools/register-eventsub.js');
      console.log('For stream events, run: ./subscribe-webhooks.sh');
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

    // Check for specific event types
    const streamOnlineSub = subscriptions.find(sub => sub.type === 'stream.online');
    const streamOfflineSub = subscriptions.find(sub => sub.type === 'stream.offline');
    const channelPointsSubs = subscriptions.filter(sub => 
      sub.type === 'channel.channel_points_custom_reward_redemption.add'
    );

    console.log('🎯 Event Type Analysis:');
    
    // Stream events
    console.log('\n📺 Stream Events:');
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

    // Channel points events
    console.log('\n🎯 Channel Points Voting:');
    if (channelPointsSubs.length > 0) {
      channelPointsSubs.forEach((sub, idx) => {
        console.log(`✅ Channel Points subscription #${idx + 1} (${sub.status})`);
        if (sub.condition && sub.condition.reward_id) {
          console.log(`   Reward ID: ${sub.condition.reward_id}`);
          if (process.env.TWITCH_REWARD_ID) {
            const matches = sub.condition.reward_id === process.env.TWITCH_REWARD_ID;
            console.log(`   Matches TWITCH_REWARD_ID: ${matches ? '✅' : '❌'}`);
          }
        }
        if (sub.transport && sub.transport.callback) {
          console.log(`   Callback: ${sub.transport.callback}`);
        }
      });
      
      // Check if any are in failed state
      const failedSubs = channelPointsSubs.filter(sub => 
        sub.status === 'webhook_callback_verification_failed' || 
        sub.status === 'notification_failures_exceeded'
      );
      if (failedSubs.length > 0) {
        console.log(`\n⚠️  Warning: ${failedSubs.length} channel points subscription(s) in failed state!`);
        console.log('   These need to be deleted and re-registered.');
        console.log('   Run: node tools/register-eventsub.js (it will handle cleanup)');
      }
      
      // Check if any are pending verification
      const pendingSubs = channelPointsSubs.filter(sub => 
        sub.status === 'webhook_callback_verification_pending'
      );
      if (pendingSubs.length > 0) {
        console.log(`\n⏳ ${pendingSubs.length} subscription(s) pending verification.`);
        console.log('   Twitch is verifying the webhook endpoint. This should complete within a few minutes.');
      }
      
      // Check if any are enabled
      const enabledSubs = channelPointsSubs.filter(sub => sub.status === 'enabled');
      if (enabledSubs.length > 0) {
        console.log(`\n✅ ${enabledSubs.length} subscription(s) enabled and ready to receive events!`);
      }
    } else {
      console.log('❌ channel.channel_points_custom_reward_redemption.add subscription NOT found');
      console.log('\nTo fix this, run:');
      console.log('   node tools/register-eventsub.js');
    }

    // Summary recommendations
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
