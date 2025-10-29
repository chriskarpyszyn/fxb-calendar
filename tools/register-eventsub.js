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
  return data.data || [];
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

// Verify reward ID exists
async function verifyRewardId(broadcasterId, rewardId) {
  const token = await getTwitchToken();
  const clientId = process.env.TWITCH_CLIENT_ID;

  const response = await fetch(
    `https://api.twitch.tv/helix/channel_points/custom_rewards?broadcaster_id=${broadcasterId}&id=${rewardId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Client-Id': clientId
      }
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to verify reward ID: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  
  if (!data.data || data.data.length === 0) {
    throw new Error(`Reward ID '${rewardId}' not found. Please check that the reward exists in your Twitch dashboard.`);
  }

  return data.data[0];
}

// Register EventSub subscription
async function registerEventSub(broadcasterId, rewardId, callbackUrl, secret, retryCount = 0) {
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
    let errorMessage = `Failed to register EventSub: ${response.status} ${errorText}`;
    
    // Provide actionable error messages
    if (response.status === 409) {
      errorMessage += '\n\n   A subscription with these parameters already exists.';
      errorMessage += '\n   The script will attempt to clean up and retry.';
    } else if (response.status === 403) {
      errorMessage += '\n\n   Access forbidden. Check that:';
      errorMessage += '\n   - Your Twitch app has the correct permissions';
      errorMessage += '\n   - Your Client ID and Secret are correct';
      errorMessage += '\n   - The reward ID belongs to your channel';
    } else if (response.status === 400) {
      errorMessage += '\n\n   Bad request. Check that:';
      errorMessage += '\n   - The callback URL is valid and accessible';
      errorMessage += '\n   - The reward ID format is correct (UUID)';
      errorMessage += '\n   - The broadcaster ID is correct';
    }
    
    throw new Error(errorMessage);
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

    // Verify reward ID exists
    console.log('🔍 Verifying reward ID...');
    try {
      const reward = await verifyRewardId(broadcasterId, rewardId);
      console.log(`✓ Reward verified: "${reward.title}" (Cost: ${reward.cost} points)`);
      if (!reward.is_user_input_required) {
        console.log('⚠️  Warning: This reward does not require user input.');
        console.log('   Voting requires text input to specify which idea to vote for.');
      }
    } catch (error) {
      console.error(`❌ ${error.message}`);
      console.error('\nTo find your reward ID:');
      console.error('   1. Go to Twitch Creator Dashboard → Channel Points → Custom Rewards');
      console.error('   2. Find your voting reward');
      console.error('   3. Use the reward ID (UUID) in TWITCH_REWARD_ID');
      process.exit(1);
    }
    console.log('');

    // Check for existing subscriptions
    console.log('🔍 Checking for existing subscriptions...');
    const existingSubs = await getEventSubSubscriptions();
    const existingChannelPointsSubs = existingSubs.filter(sub => 
      sub.type === EVENTSUB_TYPE &&
      sub.condition &&
      sub.condition.broadcaster_user_id === broadcasterId &&
      sub.condition.reward_id === rewardId
    );

    if (existingChannelPointsSubs.length > 0) {
      console.log(`   Found ${existingChannelPointsSubs.length} existing subscription(s) for this reward.\n`);
      
      // Check status of existing subscriptions
      const enabledSubs = existingChannelPointsSubs.filter(sub => sub.status === 'enabled');
      const pendingSubs = existingChannelPointsSubs.filter(sub => 
        sub.status === 'webhook_callback_verification_pending'
      );
      const failedSubs = existingChannelPointsSubs.filter(sub => 
        sub.status === 'webhook_callback_verification_failed' ||
        sub.status === 'notification_failures_exceeded'
      );

      if (enabledSubs.length > 0) {
        console.log('✅ Found enabled subscription(s):');
        enabledSubs.forEach(sub => {
          console.log(`   ID: ${sub.id} (Status: ${sub.status})`);
          console.log(`   Callback: ${sub.transport?.callback || 'N/A'}`);
        });
        console.log('\n🎉 A working subscription already exists! No action needed.');
        console.log('   If you want to update it, delete it first or change the callback URL.');
        return;
      }

      if (pendingSubs.length > 0) {
        console.log('⏳ Found pending subscription(s):');
        pendingSubs.forEach(sub => {
          console.log(`   ID: ${sub.id} (Status: ${sub.status})`);
        });
        console.log('\n   Subscription is waiting for Twitch to verify the webhook.');
        console.log('   This should complete within a few minutes.');
        console.log('   If it stays pending, check that your webhook endpoint is accessible.');
        return;
      }

      if (failedSubs.length > 0) {
        console.log('❌ Found failed subscription(s) that need cleanup:');
        failedSubs.forEach(sub => {
          console.log(`   ID: ${sub.id} (Status: ${sub.status})`);
        });
        console.log('\n🗑️  Deleting failed subscriptions...');
        
        for (const sub of failedSubs) {
          try {
            await deleteEventSubSubscription(sub.id);
            console.log(`   ✓ Deleted subscription ${sub.id}`);
          } catch (error) {
            console.error(`   ✗ Failed to delete ${sub.id}: ${error.message}`);
          }
        }
        console.log('');
      } else {
        // If there are other subscriptions but we want to create a new one anyway
        console.log('   Existing subscriptions found but will create new one.\n');
      }
    } else {
      console.log('   No existing subscriptions found.\n');
    }

    // Register EventSub subscription
    console.log('📡 Registering EventSub subscription...');
    try {
      const subscription = await registerEventSub(broadcasterId, rewardId, callbackUrl, secret);
      
      console.log('✅ EventSub subscription registered successfully!');
      console.log(`   Subscription ID: ${subscription.id}`);
      console.log(`   Status: ${subscription.status}`);
      console.log(`   Created: ${new Date(subscription.created_at).toLocaleString()}`);
      
      if (subscription.status === 'webhook_callback_verification_pending') {
        console.log('\n⏳ Subscription is pending verification.');
        console.log('   Twitch will send a verification request to:');
        console.log(`   ${callbackUrl}`);
        console.log('\n   Next steps:');
        console.log('   1. Ensure your webhook endpoint is deployed and accessible');
        console.log('   2. Wait 1-2 minutes for Twitch to verify');
        console.log('   3. Run: node check-eventsub-subscriptions.js');
        console.log('   4. Status should change from "pending" to "enabled"');
      } else if (subscription.status === 'enabled') {
        console.log('\n🎉 Subscription is enabled and ready to receive events!');
      }

      console.log('\n🎉 Setup complete! Your voting system is ready to receive webhooks.');
    } catch (error) {
      // Handle 409 (conflict) - subscription already exists
      if (error.message.includes('409')) {
        console.error('\n⚠️  Subscription conflict detected.');
        console.error('   This usually means a subscription with the same parameters exists.');
        console.error('\n   Try running: node check-eventsub-subscriptions.js');
        console.error('   Then delete any duplicate or failed subscriptions.');
        console.error('   After cleanup, run this script again.');
      } else {
        throw error;
      }
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

module.exports = { 
  getTwitchToken, 
  getBroadcasterId, 
  registerEventSub,
  getEventSubSubscriptions,
  deleteEventSubSubscription,
  verifyRewardId
};

