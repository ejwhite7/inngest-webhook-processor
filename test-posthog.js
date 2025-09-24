#!/usr/bin/env node

// Quick test to verify PostHog integration works
const { PostHog } = require('posthog-node');

// Use your environment variables or test values
const posthog = new PostHog(
  process.env.POSTHOG_API_KEY || 'test-key',
  {
    host: process.env.POSTHOG_HOST || 'https://us.posthog.com',
  }
);

async function testPostHog() {
  console.log('🧪 Testing PostHog connection...');

  if (!process.env.POSTHOG_API_KEY) {
    console.log('❌ POSTHOG_API_KEY not found in environment');
    return false;
  }

  console.log('✅ PostHog API key found');
  console.log('🏠 PostHog host:', process.env.POSTHOG_HOST || 'https://us.posthog.com');

  try {
    // Test identify call
    await posthog.identify({
      distinctId: 'test-user-123',
      properties: {
        email: 'test@example.com',
        name: 'Test User',
        source: 'webhook-test'
      }
    });
    console.log('✅ PostHog identify call successful');

    // Test capture call
    await posthog.capture({
      distinctId: 'test-user-123',
      event: 'webhook.test',
      properties: {
        source: 'test-script',
        timestamp: new Date().toISOString()
      }
    });
    console.log('✅ PostHog capture call successful');

    // Test group call
    await posthog.groupIdentify({
      groupType: 'company',
      groupKey: 'test-company',
      properties: {
        name: 'Test Company',
        plan: 'enterprise'
      },
      distinctId: 'test-user-123'
    });
    console.log('✅ PostHog group identify call successful');

    // Ensure events are sent
    await posthog.shutdownAsync();
    console.log('✅ PostHog events flushed successfully');

    return true;
  } catch (error) {
    console.error('❌ PostHog test failed:', error.message);
    return false;
  }
}

testPostHog().then(success => {
  if (success) {
    console.log('\n🎉 PostHog integration test PASSED');
    console.log('Your webhook processor should be sending events to PostHog correctly.');
  } else {
    console.log('\n💥 PostHog integration test FAILED');
    console.log('Check your POSTHOG_API_KEY and POSTHOG_HOST environment variables.');
  }
  process.exit(success ? 0 : 1);
}).catch(console.error);