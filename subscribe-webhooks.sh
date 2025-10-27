#!/bin/bash

# Get credentials from .env.local
source .env.local

# Get access token
echo "Getting access token..."
TOKEN=$(curl -s -X POST "https://id.twitch.tv/oauth2/token?client_id=${TWITCH_CLIENT_ID}&client_secret=${TWITCH_CLIENT_SECRET}&grant_type=client_credentials" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "ERROR: Failed to get access token"
  exit 1
fi

echo "✓ Got access token"
echo ""

# Get broadcaster ID (if not already set)
if [ -z "$BROADCASTER_ID" ]; then
  echo "Getting broadcaster ID..."
  BROADCASTER_ID=$(curl -s -X GET "https://api.twitch.tv/helix/users?login=${TWITCH_CHANNEL_NAME}" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Client-Id: ${TWITCH_CLIENT_ID}" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
fi

echo "✓ Broadcaster ID: $BROADCASTER_ID"
echo ""

# Subscribe to stream.online
echo "Subscribing to stream.online..."
RESPONSE=$(curl -s -X POST 'https://api.twitch.tv/helix/eventsub/subscriptions' \
  -H "Authorization: Bearer $TOKEN" \
  -H "Client-Id: ${TWITCH_CLIENT_ID}" \
  -H "Content-Type: application/json" \
  -d "{
    \"type\": \"stream.online\",
    \"version\": \"1\",
    \"condition\": {
      \"broadcaster_user_id\": \"$BROADCASTER_ID\"
    },
    \"transport\": {
      \"method\": \"webhook\",
      \"callback\": \"https://fxb-calendar.vercel.app/api/twitch-webhook\",
      \"secret\": \"$TWITCH_WEBHOOK_SECRET\"
    }
  }")

if echo "$RESPONSE" | grep -q '"id"'; then
  echo "✓ Successfully subscribed to stream.online"
else
  echo "✗ Failed to subscribe to stream.online"
  echo "Response: $RESPONSE"
fi
echo ""

# Subscribe to stream.offline
echo "Subscribing to stream.offline..."
RESPONSE=$(curl -s -X POST 'https://api.twitch.tv/helix/eventsub/subscriptions' \
  -H "Authorization: Bearer $TOKEN" \
  -H "Client-Id: ${TWITCH_CLIENT_ID}" \
  -H "Content-Type: application/json" \
  -d "{
    \"type\": \"stream.offline\",
    \"version\": \"1\",
    \"condition\": {
      \"broadcaster_user_id\": \"$BROADCASTER_ID\"
    },
    \"transport\": {
      \"method\": \"webhook\",
      \"callback\": \"https://fxb-calendar.vercel.app/api/twitch-webhook\",
      \"secret\": \"$TWITCH_WEBHOOK_SECRET\"
    }
  }")

if echo "$RESPONSE" | grep -q '"id"'; then
  echo "✓ Successfully subscribed to stream.offline"
else
  echo "✗ Failed to subscribe to stream.offline"
  echo "Response: $RESPONSE"
fi
echo ""

echo "Done! Webhooks are subscribed."
