#!/usr/bin/env node

// Test script for Discord webhook integration
// Run with: node test-discord.js

// Safety check - only run in development
if (process.env.NODE_ENV === 'production' || process.env.CI === 'true') {
  console.log('🚫 Discord test skipped in production/CI environment');
  process.exit(0);
}

require('dotenv').config({ path: '.env.local' });

const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

if (!webhookUrl) {
  console.error('❌ DISCORD_WEBHOOK_URL not found in .env.local');
  console.log('Please make sure you have:');
  console.log('1. Created .env.local file');
  console.log('2. Added your Discord webhook URL');
  process.exit(1);
}

if (webhookUrl === 'your_discord_webhook_url_here') {
  console.error('❌ Please replace the placeholder URL in .env.local with your actual Discord webhook URL');
  process.exit(1);
}

console.log('🧪 Testing Discord webhook integration...');
console.log('📡 Webhook URL:', webhookUrl.replace(/\/[^/]+$/, '/***')); // Hide the token part

const testMessage = {
  embeds: [{
    title: '🧪 Test Message from Local Development',
    color: 0x00ff00, // Green color
    fields: [
      {
        name: 'Status',
        value: 'Discord integration is working!',
        inline: false
      },
      {
        name: 'Environment',
        value: 'Local Development',
        inline: false
      }
    ],
    timestamp: new Date().toISOString(),
    footer: {
      text: 'Local Test - Stream Calendar'
    }
  }]
};

async function testDiscordWebhook() {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testMessage)
    });

    if (response.ok) {
      console.log('✅ Success! Check your Discord channel for the test message.');
    } else {
      console.error('❌ Discord API error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error details:', errorText);
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

testDiscordWebhook();
