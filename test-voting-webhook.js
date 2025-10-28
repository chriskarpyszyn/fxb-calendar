#!/usr/bin/env node

// Test script for Twitch EventSub webhook processing
// Simulates a channel point redemption webhook

// Load environment variables for local development
if (process.env.NODE_ENV !== 'production') {
  try {
    require('dotenv').config({ path: '.env.local' });
  } catch (error) {
    console.warn('Could not load .env.local:', error.message);
  }
}

const crypto = require('crypto');

// Test webhook signature generation
function generateTestSignature(payload, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  return 'sha256=' + hmac.digest('hex');
}

// Test webhook payload
const testPayload = {
  subscription: {
    id: 'test-subscription-id',
    type: 'channel.channel_points_custom_reward_redemption.add',
    version: '1',
    status: 'enabled',
    cost: 100,
    condition: {
      broadcaster_user_id: '123456789',
      reward_id: 'test-reward-id'
    },
    transport: {
      method: 'webhook',
      callback: 'https://test.example.com/webhook'
    },
    created_at: new Date().toISOString()
  },
  event: {
    id: 'test-redemption-id',
    broadcaster_user_id: '123456789',
    broadcaster_user_login: 'testuser',
    broadcaster_user_name: 'TestUser',
    user_id: '987654321',
    user_login: 'testvoter',
    user_name: 'TestVoter',
    user_input: '012345', // Test idea ID
    status: 'unfulfilled',
    redeemed_at: new Date().toISOString(),
    reward: {
      id: 'test-reward-id',
      title: 'Vote for Stream Idea',
      cost: 100,
      prompt: 'Enter the idea number you want to vote for'
    }
  }
};

async function testWebhook() {
  console.log('🧪 Testing Twitch EventSub Webhook Processing');
  console.log('============================================\n');

  try {
    // Check if webhook secret is configured
    const webhookSecret = process.env.TWITCH_EVENTSUB_SECRET;
    if (!webhookSecret) {
      console.error('❌ TWITCH_EVENTSUB_SECRET not configured');
      console.log('Please set TWITCH_EVENTSUB_SECRET in your .env.local file');
      process.exit(1);
    }

    // Generate test signature
    const payloadString = JSON.stringify(testPayload);
    const signature = generateTestSignature(payloadString, webhookSecret);

    console.log('📋 Test Configuration:');
    console.log(`   Webhook Secret: ${webhookSecret.substring(0, 8)}...`);
    console.log(`   Test Idea ID: ${testPayload.event.user_input}`);
    console.log(`   Test Voter: @${testPayload.event.user_name}`);
    console.log(`   Points Spent: ${testPayload.event.reward.cost}\n`);

    // Test the webhook endpoint
    const webhookUrl = 'http://localhost:3000/api/twitch-eventsub';
    
    console.log('📡 Sending test webhook to:', webhookUrl);
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'twitch-eventsub-message-signature': signature,
        'twitch-eventsub-message-id': 'test-message-id',
        'twitch-eventsub-message-timestamp': new Date().toISOString()
      },
      body: payloadString
    });

    const responseText = await response.text();
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      responseData = { raw: responseText };
    }

    console.log(`📊 Response Status: ${response.status}`);
    console.log(`📊 Response Data:`, responseData);

    if (response.ok) {
      console.log('\n✅ Webhook test successful!');
      console.log('   The webhook handler processed the test vote correctly.');
    } else {
      console.log('\n❌ Webhook test failed!');
      console.log('   Check the error details above.');
    }

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure your development server is running:');
      console.log('   npm start');
    }
  }
}

// Test idea ID parsing
function testIdeaIdParsing() {
  console.log('\n🔍 Testing Idea ID Parsing');
  console.log('===========================');

  const testCases = [
    '012345',
    '123456',
    '5',
    'idea-5',
    '#5',
    'idea 5',
    'vote 5',
    'invalid',
    '',
    '12345678901234567890' // Long number
  ];

  // Simulate the parseIdeaId function
  function parseIdeaId(userInput) {
    if (!userInput || typeof userInput !== 'string') {
      return null;
    }

    const cleaned = userInput.trim().toLowerCase();
    const numberMatch = cleaned.match(/(\d+)/);
    
    if (numberMatch) {
      const number = numberMatch[1];
      
      if (number.length <= 6) {
        return number;
      }
      
      return number.slice(-6);
    }
    
    return null;
  }

  testCases.forEach(testCase => {
    const result = parseIdeaId(testCase);
    console.log(`   "${testCase}" → ${result || 'null'}`);
  });
}

// Run tests
async function main() {
  await testWebhook();
  testIdeaIdParsing();
  
  console.log('\n🎉 Testing complete!');
  console.log('\nNext steps:');
  console.log('1. Set up your Twitch channel point reward');
  console.log('2. Run: node tools/register-eventsub.js');
  console.log('3. Test with real channel point redemptions');
}

if (require.main === module) {
  main();
}

module.exports = { testWebhook, testIdeaIdParsing };
