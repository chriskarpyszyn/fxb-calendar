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
- **TWITCH_REWARD_ID**: From Step 1 above

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

   📡 Registering EventSub subscription...
   ✅ EventSub subscription registered successfully!
      Subscription ID: abc123-def456-ghi789
      Status: webhook_callback_verification_pending
      Created: 10/19/2025, 9:35:00 AM

   ⚠️  Note: Subscription is pending verification.
      Twitch will send a verification request to your callback URL.
      Make sure your webhook handler is ready to respond to the challenge.

   🎉 Setup complete! Your voting system is ready to receive webhooks.
   ```

## Step 4: Verify EventSub is Working

1. **Check Twitch Dashboard**:
   - Go to [Twitch Developer Console](https://dev.twitch.tv/console)
   - Click on your app
   - Go to **EventSub** tab
   - Verify your subscription shows as "Enabled"

2. **Test the Webhook** (optional):
   - Use [Twitch CLI](https://dev.twitch.tv/docs/cli/) to simulate events:
     ```bash
     twitch event trigger channel.channel_points_custom_reward_redemption.add
     ```

## Step 5: Test the Voting System

1. **Start a test stream** (or use your regular stream)
2. **Go to your calendar website**
3. **Submit a test idea** (if you haven't already)
4. **Redeem the "Vote for Stream Idea" reward** on Twitch
5. **Enter the idea number** when prompted
6. **Check that the vote count increases** on your calendar

## Troubleshooting

### Common Issues

**"Channel not found" error**:
- Check that `TWITCH_CHANNEL_NAME` matches your exact Twitch username
- Username is case-sensitive and should not include @

**"Failed to register EventSub" error**:
- Verify your Twitch app has the correct permissions
- Check that the callback URL is accessible (try visiting it in a browser)
- Ensure all environment variables are set correctly

**"Subscription pending verification"**:
- This is normal! Twitch needs to verify your webhook endpoint
- Make sure your `/api/twitch-eventsub` endpoint is deployed and working
- The subscription will become "Enabled" once verified

**Votes not appearing**:
- Check Vercel function logs for errors
- Verify Redis connection is working
- Ensure the webhook handler is properly implemented

### Getting Help

1. **Check Vercel Function Logs**:
   - Go to your Vercel dashboard
   - Click on your project
   - Go to Functions tab
   - Look for errors in the `/api/twitch-eventsub` function

2. **Verify Environment Variables**:
   - Make sure all variables are set in Vercel dashboard
   - Check that `.env.local` matches your Vercel settings

3. **Test Twitch API Access**:
   - Run `node tools/register-eventsub.js` again
   - Look for any authentication errors

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

