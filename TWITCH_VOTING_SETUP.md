# Twitch Channel Points Voting Setup Guide

This guide walks you through setting up the Twitch Channel Points voting system for your stream ideas calendar.

## Prerequisites

Before starting, you need:

1. **Twitch Developer Account** - Access to [Twitch Developer Console](https://dev.twitch.tv/console)
2. **Twitch App** - A registered application with Client ID and Client Secret
3. **Channel Point Reward** - A custom reward created in your Twitch dashboard
4. **Vercel Deployment** - Your calendar app deployed to Vercel

## Step 1: Create Channel Point Reward

1. Go to your [Twitch Creator Dashboard](https://dashboard.twitch.tv/)
2. Navigate to **Viewer Rewards** → **Channel Points**
3. Click **Create Custom Reward**
4. Configure the reward:
   - **Name**: `Vote for Stream Idea`
   - **Cost**: `100` points (adjustable)
   - **Require text input**: ✅ **YES**
   - **Prompt**: `Enter the idea number you want to vote for (shown on calendar)`
   - **Skip reward requests queue**: ✅ **YES** (auto-fulfill)
5. Click **Create**
6. **Save the Reward ID** - you'll need this for the next step

## Step 2: Configure Environment Variables

Add these variables to your Vercel project settings and local `.env.local` file:

### Required Variables

```bash
# Twitch API Credentials (get from Twitch Developer Console)
TWITCH_CLIENT_ID=your_client_id_here
TWITCH_CLIENT_SECRET=your_client_secret_here
TWITCH_CHANNEL_NAME=your_twitch_username

# Twitch EventSub Configuration
TWITCH_EVENTSUB_SECRET=your_random_secret_string_here
TWITCH_EVENTSUB_CALLBACK_URL=https://your-app-name.vercel.app/api/twitch-eventsub
TWITCH_REWARD_ID=your_reward_id_from_step_1

# Existing variables (you should already have these)
REDIS_URL=your_redis_url_here
ADMIN_PASSWORD=your_admin_password_here
ADMIN_JWT_SECRET=your_jwt_secret_here
```

### How to Get Each Variable

- **TWITCH_CLIENT_ID & TWITCH_CLIENT_SECRET**: From [Twitch Developer Console](https://dev.twitch.tv/console)
- **TWITCH_CHANNEL_NAME**: Your Twitch username (without @)
- **TWITCH_EVENTSUB_SECRET**: Generate a random string (like a password)
- **TWITCH_EVENTSUB_CALLBACK_URL**: Your Vercel app URL + `/api/twitch-eventsub`
- **TWITCH_REWARD_ID**: From Step 1 above, or see "Verifying Reward ID" section below

### Verifying Your Reward ID with Twitch CLI

If you need to verify or find your reward ID after registration, use the Twitch CLI:

1. **Install Twitch CLI** (if not already installed):
   - Download from [Twitch CLI releases](https://github.com/twitchdev/twitch-cli/releases)
   - Or install using Scoop: `scoop install twitch` (Windows)

2. **Configure Twitch CLI**:
   ```bash
   twitch configure
   ```
   Enter your Client ID and Client Secret when prompted.

3. **Get User OAuth Token** (required for custom rewards API):
   ```bash
   twitch token -u -s 'channel:read:redemptions'
   ```
   This will open a browser for you to authorize. Copy the access token from the output.

4. **List Your Custom Rewards**:
   ```bash
   twitch api get /channel_points/custom_rewards -q "broadcaster_id=YOUR_BROADCASTER_ID"
   ```
   
   Replace `YOUR_BROADCASTER_ID` with your broadcaster ID (or use the one shown when running `register-eventsub.js`).
   
   Example output:
   ```json
   {
     "data": [
       {
         "id": "86710f9c-8f83-41d9-ae63-f8e33ee0d2c8",
         "title": "Vote for Stream Idea",
         "cost": 100,
         "is_user_input_required": true,
         ...
       }
     ]
   }
   ```
   
   Look for your "Vote for Stream Idea" reward and copy its `id` field.

**Alternative**: If you don't have the CLI set up, you can find the reward ID in your Twitch Creator Dashboard → Channel Points → Custom Rewards → click on your reward → the URL will contain the reward ID.

## Step 3: Register EventSub Subscription

1. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

2. **Run the registration script**:
   ```bash
   node tools/register-eventsub.js
   ```

3. **Expected output**:
   ```
   🎯 Twitch EventSub Registration Script
   =====================================

   📋 Configuration:
      Channel: your_username
      Reward ID: 86710f9c-8f83-41d9-ae63-f8e33ee0d2c8
      Callback URL: https://your-app.vercel.app/api/twitch-eventsub
      EventSub Type: channel.channel_points_custom_reward_redemption.add

   🔍 Fetching broadcaster ID...
   ✓ Broadcaster ID: 123456789

   💡 Note: Reward ID verification skipped.
      Use Twitch CLI to verify your reward ID if needed:
      twitch api get /channel_points/custom_rewards -q "broadcaster_id=123456789"

   🔍 Checking for existing subscriptions...
      No existing subscriptions found.

   📡 Registering EventSub subscription...
   ✅ EventSub subscription registered successfully!
      Subscription ID: abc123-def456-ghi789
      Status: webhook_callback_verification_pending
      Created: 10/19/2025, 9:35:00 AM

   ⏳ Subscription is pending verification.
      Twitch will send a verification request to:
      https://your-app.vercel.app/api/twitch-eventsub

      Next steps:
      1. Ensure your webhook endpoint is deployed and accessible
      2. Wait 1-2 minutes for Twitch to verify
      3. Run: node check-eventsub-subscriptions.js
      4. Status should change from "pending" to "enabled"

   🎉 Setup complete! Your voting system is ready to receive webhooks.
   ```

4. **Verify the subscription**:
   ```bash
   node tools/check-channel-points-subscription.js
   ```
   
   This will show the current subscription status and provide specific guidance based on the state.

## Step 4: Verify EventSub is Working

### Option 1: Use Diagnostic Script (Recommended)

Run the channel points subscription checker:

```bash
node tools/check-channel-points-subscription.js
```

This will:
- Validate all required environment variables
- Check if subscription exists
- Display subscription status (enabled/pending/failed)
- Provide specific next steps based on current state

### Option 2: Check All Subscriptions

```bash
node check-eventsub-subscriptions.js
```

This shows all EventSub subscriptions, including channel points voting.

### Option 3: Check Twitch Dashboard

1. Go to [Twitch Developer Console](https://dev.twitch.tv/console)
2. Click on your app
3. Go to **EventSub** tab
4. Look for `channel.channel_points_custom_reward_redemption.add` subscription
5. Verify status shows as "Enabled" (not "Pending" or "Failed")

### Understanding Subscription Status

- **Enabled**: ✅ Subscription is active and ready to receive events
- **webhook_callback_verification_pending**: ⏳ Twitch is verifying your webhook endpoint (normal for 1-2 minutes after registration)
- **webhook_callback_verification_failed**: ❌ Webhook verification failed - check webhook endpoint accessibility
- **notification_failures_exceeded**: ❌ Too many failed webhook deliveries - subscription needs to be re-registered
- **authorization_revoked**: ⚠️ OAuth token was revoked - re-register subscription

## Step 5: Test the Voting System

1. **Start a test stream** (or use your regular stream)
2. **Go to your calendar website**
3. **Submit a test idea** (if you haven't already)
4. **Redeem the "Vote for Stream Idea" reward** on Twitch
5. **Enter the idea number** when prompted
6. **Check that the vote count increases** on your calendar

## Troubleshooting

### Issue: Subscription Not Registered

**Symptoms**: 
- Running `node tools/check-channel-points-subscription.js` shows "No subscription found"
- Votes don't trigger when channel point reward is redeemed

**Solution**:
1. Ensure your app is deployed to Vercel with all environment variables set
2. Run `node tools/register-eventsub.js` to register the subscription
3. Wait 1-2 minutes for verification
4. Run `node tools/check-channel-points-subscription.js` again to verify status is "enabled"

### Issue: Subscription Stuck in "Pending" Status

**Symptoms**: 
- Subscription shows as `webhook_callback_verification_pending` for more than 5 minutes

**Possible Causes & Solutions**:

1. **Webhook endpoint not accessible**:
   - Verify your Vercel app is deployed and the endpoint `/api/twitch-eventsub` is accessible
   - Check Vercel function logs for incoming verification requests
   - Ensure callback URL uses HTTPS (required by Twitch)

2. **Webhook handler not responding correctly**:
   - Check Vercel function logs for the verification challenge
   - Verify the handler responds with just the challenge string (not JSON)
   - Look for `[EventSub Webhook] Handling verification challenge` in logs

3. **Signature verification failing**:
   - Verify `TWITCH_EVENTSUB_SECRET` matches between registration and webhook handler
   - Check Vercel function logs for signature verification errors
   - Ensure environment variables are set correctly in Vercel dashboard

**Action**: Wait a few more minutes, then check again. If still pending, check Vercel logs.

### Issue: Subscription Failed Verification

**Symptoms**: 
- Subscription shows as `webhook_callback_verification_failed`

**Solution**:
1. Check Vercel function logs for errors during verification
2. Verify webhook endpoint is accessible and returns proper responses
3. Run `node tools/register-eventsub.js` again (it will automatically delete failed subscriptions and create new ones)

### Issue: "Channel not found" Error

**Symptoms**: Registration script fails with "Channel not found"

**Solution**:
- Check that `TWITCH_CHANNEL_NAME` matches your exact Twitch username
- Username is case-sensitive and should not include @
- Verify the username in Twitch Developer Console

### Issue: "Failed to register EventSub" Error

**Symptoms**: Registration script fails with HTTP error

**Solutions**:

1. **403 Forbidden**:
   - Verify your Twitch app has the correct permissions
   - Check that Client ID and Secret are correct
   - Ensure the reward ID belongs to your channel

2. **400 Bad Request**:
   - Check that callback URL is valid and uses HTTPS
   - Verify reward ID format is correct (UUID)
   - Ensure broadcaster ID is correct

3. **409 Conflict**:
   - A subscription with these parameters already exists
   - Run `node tools/check-channel-points-subscription.js` to see existing subscriptions
   - Delete duplicates or failed subscriptions, then re-register

### Issue: Votes Not Appearing

**Symptoms**: 
- Channel point redemption works but votes don't appear on calendar
- Webhook appears to be working (subscription is enabled)

**Diagnostic Steps**:

1. **Check Vercel Function Logs**:
   - Go to Vercel dashboard → Functions → `/api/twitch-eventsub`
   - Look for `[EventSub Webhook]` log entries
   - Check for errors in vote processing

2. **Verify Redis Connection**:
   - Check Vercel function logs for Redis connection errors
   - Verify `REDIS_URL` is set correctly in Vercel

3. **Check Idea ID Format**:
   - Look for log entries showing "Invalid idea ID format" or "Idea not found"
   - Ensure users are entering the correct idea number format
   - Check that ideas exist in Redis with matching IDs

4. **Verify Webhook is Receiving Events**:
   - Check for `[EventSub Webhook] Processing channel point redemption` in logs
   - Verify the event contains `user_input` with the idea number

**Solution**: Based on logs, identify the specific failure point and fix accordingly.

### Issue: Signature Verification Failed

**Symptoms**: 
- Vercel logs show "Invalid signature" errors
- Webhook requests are rejected with 401 status

**Solutions**:
- Verify `TWITCH_EVENTSUB_SECRET` is identical in both:
  - Environment variables used for registration
  - Vercel environment variables
- Check that the secret hasn't changed since subscription registration
- Re-register subscription if secret was updated: `node tools/register-eventsub.js`

### Diagnostic Commands

**Check subscription status**:
```bash
node tools/check-channel-points-subscription.js
```

**Check all EventSub subscriptions**:
```bash
node check-eventsub-subscriptions.js
```

**Re-register subscription** (cleans up failed ones automatically):
```bash
node tools/register-eventsub.js
```

### Production Deployment Checklist

Before testing in production, verify:

- [ ] All environment variables set in Vercel dashboard:
  - `TWITCH_CLIENT_ID`
  - `TWITCH_CLIENT_SECRET`
  - `TWITCH_CHANNEL_NAME`
  - `TWITCH_EVENTSUB_SECRET`
  - `TWITCH_EVENTSUB_CALLBACK_URL`
  - `TWITCH_REWARD_ID`
  - `REDIS_URL`

- [ ] Webhook endpoint is deployed and accessible:
  - Visit `https://your-app.vercel.app/api/twitch-eventsub` (should return 405 Method Not Allowed for GET, which is correct)

- [ ] Subscription is registered:
  - Run `node tools/check-channel-points-subscription.js`
  - Status should be "enabled"

- [ ] Test channel point redemption:
  - Redeem the voting reward on Twitch
  - Check Vercel logs for webhook receipt
  - Verify vote appears on calendar

### Getting Help

1. **Check Vercel Function Logs**:
   - Go to your Vercel dashboard
   - Click on your project
   - Go to Functions tab → `/api/twitch-eventsub`
   - Look for `[EventSub Webhook]` prefixed log entries
   - These provide detailed diagnostics at each step

2. **Verify Environment Variables**:
   - Use `node tools/check-channel-points-subscription.js` to validate configuration
   - Ensure all variables are set in Vercel dashboard (Settings → Environment Variables)
   - Check that `.env.local` matches your Vercel settings

3. **Test Subscription Status**:
   - Run `node tools/check-channel-points-subscription.js` for detailed status
   - Run `node check-eventsub-subscriptions.js` to see all subscriptions

4. **Re-register if Needed**:
   - The registration script now handles cleanup of failed subscriptions
   - Run `node tools/register-eventsub.js` to fix most subscription issues

## Next Steps

Once everything is working:

1. **Customize the reward** - Adjust point cost, name, or description
2. **Monitor voting activity** - Check your admin dashboard for vote statistics
3. **Set up notifications** - Consider Discord integration for vote alerts
4. **Plan voting periods** - Decide when voting opens/closes for each stream

## Security Notes

- Keep your `TWITCH_EVENTSUB_SECRET` private and secure
- Never commit `.env.local` to version control
- The webhook endpoint verifies signatures to prevent spoofing
- All vote data is stored securely in Redis

---

**Need help?** Check the main implementation document (`IDEA_VOTING_IMPLEMENTATION.md`) for technical details.

