#!/usr/bin/env node

// Debug script to test webhook and check PostHog integration
const https = require('https');

const WEBHOOK_URL = 'https://inngest-k63nfcs77-ej-whites-projects.vercel.app/api/webhook-public/test';

async function sendTestWebhook() {
  const testData = {
    user_id: 'debug-test-123',
    email: 'debug-test@example.com',
    name: 'Debug Test User',
    event: 'debug.test',
    source: 'debug-script',
    timestamp: new Date().toISOString()
  };

  const postData = JSON.stringify(testData);

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve, reject) => {
    console.log('🧪 Sending test webhook to:', WEBHOOK_URL);
    console.log('📦 Test data:', testData);

    const req = https.request(WEBHOOK_URL, options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        console.log(`\n✅ Webhook response (${res.statusCode}):`);
        console.log(body);

        if (res.statusCode === 200) {
          console.log('\n🎉 Webhook sent successfully!');
          console.log('📋 Next steps:');
          console.log('1. Check Inngest dashboard for function execution');
          console.log('2. Check PostHog for incoming events');
          console.log('3. Review Vercel logs for debugging info');
        } else {
          console.log('\n❌ Webhook failed with status:', res.statusCode);
        }
        resolve();
      });
    });

    req.on('error', (err) => {
      console.error('❌ Request error:', err.message);
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}

sendTestWebhook().catch(console.error);