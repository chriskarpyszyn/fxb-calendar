#!/usr/bin/env node

// Script to clean up failed Twitch EventSub subscriptions for channel points voting
// Deletes subscriptions with failed verification or notification failures

// Load environment variables for local development
if (process.env.NODE_ENV !== 'production') {
  try {
    require('dotenv').config({ path: '.env.local' });
  } catch (error) {
    console.warn('Could not load .env.local:', error.message);
  }
}

const { getBroadcasterId, deleteEventSubSubscription, getEventSubSubscriptions } = require('./register-eventsub');

// Configuration
const EVENTSUB_TYPE = 'channel.channel_points_custom_reward_redemption.add';

// Main function
async function main() {
  console.log('🧹 Cleaning Up Failed Channel Points Subscriptions');
  console.log('==================================================\n');

  try {
    // Check required environment variables
    const requiredVars = [
      'TWITCH_CLIENT_ID',
      'TWITCH_CLIENT_SECRET',
      'TWITCH_CHANNEL_NAME',
      'TWITCH_REWARD_ID'
    ];

    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      console.error('❌ Missing required environment variables:');
      missingVars.forEach(varName => console.error(`   - ${varName}`));
      console.error('\nPlease check your .env.local file or environment configuration.');
      process.exit(1);
    }

    const channelName = process.env.TWITCH_CHANNEL_NAME;
    const rewardId = process.env.TWITCH_REWARD_ID;

    console.log('📋 Configuration:');
    console.log(`   Channel: ${channelName}`);
    console.log(`   Reward ID: ${rewardId}`);
    console.log(`   EventSub Type: ${EVENTSUB_TYPE}\n`);

    // Get broadcaster ID
    console.log('🔍 Fetching broadcaster ID...');
    const broadcasterId = await getBroadcasterId(channelName);
    console.log(`✓ Broadcaster ID: ${broadcasterId}\n`);

    // Get all subscriptions
    console.log('🔍 Fetching subscriptions...');
    const subscriptions = await getEventSubSubscriptions();
    
    // Filter for channel points subscriptions matching our configuration
    const channelPointsSubs = subscriptions.filter(sub => 
      sub.type === EVENTSUB_TYPE &&
      sub.condition &&
      sub.condition.broadcaster_user_id === broadcasterId &&
      sub.condition.reward_id === rewardId
    );

    console.log(`   Found ${channelPointsSubs.length} subscription(s) for this reward.\n`);

    // Filter for failed subscriptions
    const failedSubs = channelPointsSubs.filter(sub => 
      sub.status === 'webhook_callback_verification_failed' ||
      sub.status === 'notification_failures_exceeded' ||
      sub.status === 'authorization_revoked'
    );

    // Also check for enabled/pending subscriptions for reference
    const enabledSubs = channelPointsSubs.filter(sub => sub.status === 'enabled');
    const pendingSubs = channelPointsSubs.filter(sub => 
      sub.status === 'webhook_callback_verification_pending'
    );

    // Display current state
    if (enabledSubs.length > 0) {
      console.log(`✅ ${enabledSubs.length} enabled subscription(s) will be kept:`);
      enabledSubs.forEach(sub => {
        console.log(`   - ${sub.id} (${sub.status})`);
      });
      console.log('');
    }

    if (pendingSubs.length > 0) {
      console.log(`⏳ ${pendingSubs.length} pending subscription(s) will be kept:`);
      pendingSubs.forEach(sub => {
        console.log(`   - ${sub.id} (${sub.status})`);
      });
      console.log('');
    }

    if (failedSubs.length === 0) {
      console.log('✅ No failed subscriptions to clean up!');
      if (channelPointsSubs.length > 0) {
        console.log('\n📊 Summary:');
        console.log(`   Total subscriptions: ${channelPointsSubs.length}`);
        console.log(`   Enabled: ${enabledSubs.length}`);
        console.log(`   Pending: ${pendingSubs.length}`);
        console.log(`   Failed: 0`);
      }
      return;
    }

    // Display failed subscriptions
    console.log(`❌ Found ${failedSubs.length} failed subscription(s) to delete:\n`);
    failedSubs.forEach((sub, index) => {
      console.log(`${index + 1}. ${sub.id}`);
      console.log(`   Status: ${sub.status}`);
      console.log(`   Created: ${new Date(sub.created_at).toLocaleString()}`);
      if (sub.transport && sub.transport.callback) {
        console.log(`   Callback: ${sub.transport.callback}`);
      }
      console.log('');
    });

    // Confirm deletion
    console.log('🗑️  Deleting failed subscriptions...\n');
    
    let deleted = 0;
    let failed = 0;
    
    for (const sub of failedSubs) {
      try {
        await deleteEventSubSubscription(sub.id);
        console.log(`   ✓ Deleted ${sub.id}`);
        deleted++;
      } catch (error) {
        console.error(`   ✗ Failed to delete ${sub.id}: ${error.message}`);
        failed++;
      }
    }

    // Summary
    console.log('\n📊 Cleanup Summary:');
    console.log(`   Total subscriptions: ${channelPointsSubs.length}`);
    console.log(`   Failed subscriptions: ${failedSubs.length}`);
    console.log(`   Deleted: ${deleted}`);
    if (failed > 0) {
      console.log(`   Failed to delete: ${failed}`);
    }
    console.log(`   Remaining enabled: ${enabledSubs.length}`);
    console.log(`   Remaining pending: ${pendingSubs.length}`);

    if (deleted > 0) {
      console.log('\n✅ Cleanup complete!');
      if (enabledSubs.length === 0) {
        console.log('\n⚠️  Note: No enabled subscriptions remain.');
        console.log('   Run `node tools/register-eventsub.js` to create a new subscription.');
      }
    } else {
      console.log('\n⚠️  No subscriptions were deleted.');
      if (failed > 0) {
        console.log('   Some deletions failed. Check the errors above.');
      }
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { main };

