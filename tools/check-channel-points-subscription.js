#!/usr/bin/env node

// Script to check Twitch EventSub subscription status for channel points voting
// Validates configuration and provides diagnostic information

// Load environment variables for local development
if (process.env.NODE_ENV !== 'production') {
  try {
    require('dotenv').config({ path: '.env.local' });
  } catch (error) {
    console.warn('Could not load .env.local:', error.message);
  }
}

const { getTwitchToken, getEventSubSubscriptions } = require('../check-eventsub-subscriptions');
const { getBroadcasterId } = require('./register-eventsub');

// Configuration
const EVENTSUB_TYPE = 'channel.channel_points_custom_reward_redemption.add';

// Main function
async function main() {
  console.log('🎯 Channel Points Voting Subscription Checker');
  console.log('=============================================\n');

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

    // Display configuration
    const channelName = process.env.TWITCH_CHANNEL_NAME;
    const rewardId = process.env.TWITCH_REWARD_ID;
    const callbackUrl = process.env.TWITCH_EVENTSUB_CALLBACK_URL;

    console.log('📋 Configuration:');
    console.log(`   Channel: ${channelName}`);
    console.log(`   Reward ID: ${rewardId}`);
    console.log(`   Callback URL: ${callbackUrl}`);
    console.log(`   EventSub Type: ${EVENTSUB_TYPE}\n`);

    // Get broadcaster ID
    console.log('🔍 Fetching broadcaster ID...');
    let broadcasterId;
    try {
      broadcasterId = await getBroadcasterId(channelName);
      console.log(`✓ Broadcaster ID: ${broadcasterId}\n`);
    } catch (error) {
      console.error(`❌ Failed to get broadcaster ID: ${error.message}`);
      console.error('\nCheck that TWITCH_CHANNEL_NAME matches your exact Twitch username.');
      process.exit(1);
    }

    // Get all subscriptions
    console.log('📡 Fetching EventSub subscriptions...');
    let subscriptions;
    try {
      subscriptions = await getEventSubSubscriptions();
      console.log(`✓ Found ${subscriptions.length} total subscription(s)\n`);
    } catch (error) {
      console.error(`❌ Failed to get subscriptions: ${error.message}`);
      process.exit(1);
    }

    // Filter for channel points subscriptions matching our configuration
    const channelPointsSubs = subscriptions.filter(sub => {
      if (sub.type !== EVENTSUB_TYPE) return false;
      if (!sub.condition) return false;
      return sub.condition.broadcaster_user_id === broadcasterId &&
             sub.condition.reward_id === rewardId;
    });

    console.log('🎯 Channel Points Voting Subscription Status:');
    console.log('='.repeat(50));

    if (channelPointsSubs.length === 0) {
      console.log('\n❌ No subscription found for channel points voting!');
      console.log('\n📝 To fix this:');
      console.log('   1. Ensure your webhook endpoint is deployed and accessible');
      console.log('   2. Run: node tools/register-eventsub.js');
      console.log('   3. Wait 1-2 minutes for Twitch to verify the subscription');
      console.log('   4. Run this script again to check status');
      return;
    }

    // Display subscription details
    channelPointsSubs.forEach((sub, index) => {
      console.log(`\n📌 Subscription #${index + 1}:`);
      console.log(`   ID: ${sub.id}`);
      console.log(`   Status: ${sub.status}`);
      console.log(`   Created: ${new Date(sub.created_at).toLocaleString()}`);
      
      if (sub.transport) {
        console.log(`   Callback: ${sub.transport.callback}`);
        const matchesConfig = sub.transport.callback === callbackUrl;
        console.log(`   Matches config: ${matchesConfig ? '✅' : '❌'}`);
      }

      if (sub.condition) {
        console.log(`   Reward ID: ${sub.condition.reward_id}`);
        const matchesReward = sub.condition.reward_id === rewardId;
        console.log(`   Matches config: ${matchesReward ? '✅' : '❌'}`);
      }
    });

    // Status analysis
    console.log('\n📊 Status Analysis:');
    
    const enabledSubs = channelPointsSubs.filter(sub => sub.status === 'enabled');
    const pendingSubs = channelPointsSubs.filter(sub => 
      sub.status === 'webhook_callback_verification_pending'
    );
    const failedSubs = channelPointsSubs.filter(sub => 
      sub.status === 'webhook_callback_verification_failed' ||
      sub.status === 'notification_failures_exceeded'
    );
    const revokedSubs = channelPointsSubs.filter(sub => 
      sub.status === 'authorization_revoked'
    );

    if (enabledSubs.length > 0) {
      console.log(`\n✅ ${enabledSubs.length} subscription(s) is ENABLED and ready to receive events!`);
      console.log('   Your voting system should be working. Test by redeeming the channel point reward.');
    }

    if (pendingSubs.length > 0) {
      console.log(`\n⏳ ${pendingSubs.length} subscription(s) is PENDING verification.`);
      console.log('   Twitch is verifying your webhook endpoint.');
      console.log('   This usually takes 1-2 minutes.');
      console.log('\n   Next steps:');
      console.log('   1. Ensure your webhook endpoint is accessible at:');
      console.log(`      ${callbackUrl}`);
      console.log('   2. Check Vercel function logs for verification challenges');
      console.log('   3. Wait a few minutes and run this script again');
    }

    if (failedSubs.length > 0) {
      console.log(`\n❌ ${failedSubs.length} subscription(s) FAILED!`);
      console.log('   These subscriptions need to be deleted and re-registered.');
      console.log('\n   To fix:');
      console.log('   1. Run: node tools/register-eventsub.js');
      console.log('      (It will automatically delete failed subscriptions)');
      console.log('   2. Verify your webhook endpoint is working');
      console.log('   3. Check that TWITCH_EVENTSUB_SECRET matches between registration and webhook handler');
    }

    if (revokedSubs.length > 0) {
      console.log(`\n⚠️  ${revokedSubs.length} subscription(s) was REVOKED.`);
      console.log('   This usually means the OAuth token was revoked or the app permissions changed.');
      console.log('\n   To fix:');
      console.log('   1. Check your Twitch app permissions');
      console.log('   2. Run: node tools/register-eventsub.js');
    }

    // Recommendations
    console.log('\n💡 Recommendations:');
    if (enabledSubs.length === 0 && pendingSubs.length === 0) {
      console.log('   • Register or fix the subscription using: node tools/register-eventsub.js');
    }
    if (callbackUrl && !callbackUrl.startsWith('https://')) {
      console.log('   ⚠️  Callback URL should use HTTPS (required by Twitch)');
    }
    if (channelPointsSubs.length > 1) {
      console.log('   ⚠️  Multiple subscriptions found. Consider cleaning up duplicates.');
    }
    console.log('   • Check webhook logs in Vercel dashboard for detailed diagnostics');
    console.log('   • Test voting by redeeming the channel point reward on Twitch');

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

