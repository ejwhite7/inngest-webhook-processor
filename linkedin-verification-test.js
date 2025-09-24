#!/usr/bin/env node

// Test script to simulate LinkedIn webhook verification
const https = require('https');

const WEBHOOK_URL = 'https://inngest-k63nfcs77-ej-whites-projects.vercel.app/api/webhook-public/linkedin';
const TEST_CHALLENGE = 'test-challenge-' + Date.now();

async function testLinkedInVerification() {
  console.log('🔐 Testing LinkedIn webhook verification...');
  console.log('🎯 URL:', WEBHOOK_URL);
  console.log('🧪 Challenge:', TEST_CHALLENGE);

  const url = `${WEBHOOK_URL}?challenge=${TEST_CHALLENGE}`;

  return new Promise((resolve, reject) => {
    const req = https.request(url, { method: 'GET' }, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        console.log(`\n📋 Response Status: ${res.statusCode}`);
        console.log(`📋 Response Body: ${body}`);

        if (res.statusCode === 200 && body === TEST_CHALLENGE) {
          console.log('\n✅ LinkedIn webhook verification PASSED!');
          console.log('🎉 Your webhook endpoint correctly echoes the challenge');
        } else {
          console.log('\n❌ LinkedIn webhook verification FAILED');
          console.log(`Expected: ${TEST_CHALLENGE}`);
          console.log(`Got: ${body}`);
        }
        resolve();
      });
    });

    req.on('error', (err) => {
      console.error('❌ Request error:', err.message);
      reject(err);
    });

    req.end();
  });
}

async function testLinkedInWebhookPost() {
  console.log('\n🧪 Testing LinkedIn webhook POST...');

  const testLeadData = {
    leads: [
      {
        email: 'linkedin-test@example.com',
        firstName: 'LinkedIn',
        lastName: 'Test',
        company: 'Test Company',
        jobTitle: 'Test Manager',
        campaignId: 'test-campaign-123',
        formId: 'test-form-456'
      }
    ]
  };

  const postData = JSON.stringify(testLeadData);

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(WEBHOOK_URL, options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        console.log(`📋 POST Response Status: ${res.statusCode}`);
        console.log(`📋 POST Response Body: ${body}`);

        if (res.statusCode === 200) {
          console.log('✅ LinkedIn webhook POST test PASSED!');
        } else {
          console.log('❌ LinkedIn webhook POST test FAILED');
        }
        resolve();
      });
    });

    req.on('error', (err) => {
      console.error('❌ POST Request error:', err.message);
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('🚀 LinkedIn Webhook Verification Test Suite\n');

  try {
    await testLinkedInVerification();
    await testLinkedInWebhookPost();

    console.log('\n🎯 Next Steps:');
    console.log('1. Use this URL in LinkedIn Developer Console:');
    console.log(`   ${WEBHOOK_URL}`);
    console.log('2. LinkedIn will send a GET request with ?challenge=XXXXX');
    console.log('3. Your endpoint will echo back the challenge value');
    console.log('4. After verification, LinkedIn will send POST requests with lead data');
  } catch (error) {
    console.error('Test suite failed:', error);
  }
}

runTests();