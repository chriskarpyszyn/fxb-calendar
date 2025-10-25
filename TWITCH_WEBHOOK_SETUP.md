# Twitch EventSub Webhook Setup Guide

This guide will help you set up Twitch EventSub webhooks to replace the polling mechanism with real-time event notifications.

## Overview

The webhook system captures `stream.online` and `stream.offline` events from Twitch and updates your application in real-time via Server-Sent Events (SSE).

## Prerequisites

- Twitch Developer Account
- Vercel deployment with HTTPS
- Redis database (already configured)
- Twitch CLI (for local testing)

## Step 1: Create Twitch Application

1. Go to [Twitch Developer Console](https://dev.twitch.tv/console)
2. Click "Create Application"
3. Fill in:
   - **Name**: FXB Calendar Webhooks
   - **OAuth Redirect URLs**: `https://yourdomain.vercel.app/api/twitch-webhook`
   - **Category**: Other
4. Note down your **Client ID** and **Client Secret**

## Step 2: Set Up Environment Variables

Add these to your Vercel environment variables:

```bash
# Existing variables
TWITCH_CLIENT_ID=your_client_id
TWITCH_CLIENT_SECRET=your_client_secret
TWITCH_CHANNEL_NAME=itsFlannelBeard
REDIS_URL=your_redis_url

# New webhook secret (generate a random string)
TWITCH_WEBHOOK_SECRET=your_random_webhook_secret_here
```

**Generate a webhook secret:**
```bash
# Generate a random 32-character secret
openssl rand -hex 32
```

## Step 3: Deploy Your Application

Deploy your application to Vercel to get the HTTPS webhook URL:

```bash
vercel --prod
```

Your webhook URL will be: `https://yourdomain.vercel.app/api/twitch-webhook`

## Step 4: Register EventSub Subscriptions

### Option A: Using Twitch CLI (Recommended)

1. **Install Twitch CLI:**
   ```bash
   # macOS
   brew install twitchdev/twitch/twitch-cli
   
   # Windows
   # Download from: https://github.com/twitchdev/twitch-cli/releases
   ```

2. **Configure Twitch CLI:**
   ```bash
   twitch configure
   # Enter your Client ID and Client Secret
   ```

3. **Create EventSub subscriptions:**
   ```bash
   # Subscribe to stream.online events
   twitch event subscribe stream.online \
     --broadcaster-user-id YOUR_USER_ID \
     --webhook-url https://yourdomain.vercel.app/api/twitch-webhook \
     --secret your_webhook_secret
   
   # Subscribe to stream.offline events
   twitch event subscribe stream.offline \
     --broadcaster-user-id YOUR_USER_ID \
     --webhook-url https://yourdomain.vercel.app/api/twitch-webhook \
     --secret your_webhook_secret
   ```

4. **Get your User ID:**
   ```bash
   twitch api get users --login itsFlannelBeard
   ```

### Option B: Using Twitch API Directly

1. **Get App Access Token:**
   ```bash
   curl -X POST 'https://id.twitch.tv/oauth2/token' \
     -H 'Content-Type: application/x-www-form-urlencoded' \
     -d 'client_id=YOUR_CLIENT_ID&client_secret=YOUR_CLIENT_SECRET&grant_type=client_credentials'
   ```

2. **Get User ID:**
   ```bash
   curl -X GET 'https://api.twitch.tv/helix/users?login=itsFlannelBeard' \
     -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
     -H 'Client-Id: YOUR_CLIENT_ID'
   ```

3. **Create EventSub subscription:**
   ```bash
   curl -X POST 'https://api.twitch.tv/helix/eventsub/subscriptions' \
     -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
     -H 'Client-Id: YOUR_CLIENT_ID' \
     -H 'Content-Type: application/json' \
     -d '{
       "type": "stream.online",
       "version": "1",
       "condition": {
         "broadcaster_user_id": "YOUR_USER_ID"
       },
       "transport": {
         "method": "webhook",
         "callback": "https://yourdomain.vercel.app/api/twitch-webhook",
         "secret": "your_webhook_secret"
       }
     }'
   ```

## Step 5: Test the Webhook

### Local Testing with ngrok

1. **Install ngrok:**
   ```bash
   # macOS
   brew install ngrok
   
   # Or download from: https://ngrok.com/download
   ```

2. **Start your local server:**
   ```bash
   vercel dev
   ```

3. **Expose local server:**
   ```bash
   ngrok http 3000
   ```

4. **Update webhook URL temporarily:**
   Use the ngrok URL (e.g., `https://abc123.ngrok.io/api/twitch-webhook`) for testing

5. **Test webhook:**
   ```bash
   # Test webhook verification
   curl -X POST https://yourdomain.vercel.app/api/twitch-webhook \
     -H "Content-Type: application/json" \
     -d '{"challenge": "test123"}'
   ```

### Production Testing

1. **Go live on Twitch** (or use Twitch CLI to simulate)
2. **Check Vercel function logs** for webhook events
3. **Verify Redis** contains updated status
4. **Check browser** for real-time updates

## Step 6: Verify Everything Works

### Check Webhook Endpoint
```bash
curl https://yourdomain.vercel.app/api/twitch-webhook
# Should return: {"error": "Method not allowed"}
```

### Check Status API
```bash
curl https://yourdomain.vercel.app/api/twitch-status
# Should return current stream status
```

### Check SSE Endpoint
```bash
curl -N https://yourdomain.vercel.app/api/twitch-events
# Should return Server-Sent Events stream
```

## Troubleshooting

### Common Issues

1. **"Invalid signature" error:**
   - Check that `TWITCH_WEBHOOK_SECRET` matches what you used in EventSub subscription
   - Ensure webhook URL is HTTPS

2. **Webhook not receiving events:**
   - Verify EventSub subscription is active in Twitch Developer Console
   - Check webhook URL is accessible
   - Look at Vercel function logs

3. **SSE connection issues:**
   - Check browser console for errors
   - Verify `/api/twitch-events` endpoint is working
   - Check Redis connection

4. **Events not updating in browser:**
   - Check Redis contains updated data
   - Verify SSE connection is active
   - Check browser console for SSE messages

### Debug Commands

```bash
# Check EventSub subscriptions
twitch event list

# Revoke and recreate subscription
twitch event revoke SUBSCRIPTION_ID
twitch event subscribe stream.online --broadcaster-user-id YOUR_USER_ID --webhook-url https://yourdomain.vercel.app/api/twitch-webhook --secret your_webhook_secret

# Test webhook locally
twitch event test stream.online --broadcaster-user-id YOUR_USER_ID
```

## Monitoring

### Vercel Function Logs
Monitor your webhook function logs in Vercel dashboard for:
- Webhook verification challenges
- Event processing
- Redis updates
- SSE broadcasts

### Redis Monitoring
Check Redis for stored stream status:
```bash
# Connect to Redis
redis-cli -u your_redis_url

# Check stored status
GET twitch:stream:status
```

## Future Extensions

To add more event types (subscriptions, channel points, etc.):

1. **Add new event handlers** in `api/twitch-webhook.js`
2. **Create new EventSub subscriptions** for the events you want
3. **Update Redis schema** if needed
4. **Broadcast new events** via SSE

Example for channel subscriptions:
```javascript
case 'channel.subscribe':
  await handleChannelSubscribe(event);
  break;
```

## Security Notes

- Keep your webhook secret secure
- Use HTTPS for all webhook URLs
- Validate all incoming webhook data
- Monitor for unusual webhook activity
- Rotate webhook secrets periodically

## Support

If you encounter issues:
1. Check Vercel function logs
2. Verify Twitch Developer Console for subscription status
3. Test webhook endpoint manually
4. Check Redis connection and data
5. Review browser console for frontend issues
