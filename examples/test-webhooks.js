#!/usr/bin/env node

// Test script to send example webhooks to your local server
// Run with: node examples/test-webhooks.js

const http = require('http');

const BASE_URL = 'http://localhost:3000';

async function sendWebhook(source, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: `/webhook/${source}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        console.log(`✅ ${source} webhook sent - Status: ${res.statusCode}`);
        console.log(`   Response: ${body}\n`);
        resolve();
      });
    });

    req.on('error', (err) => {
      console.error(`❌ Error sending ${source} webhook:`, err.message);
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('🚀 Sending test webhooks to ' + BASE_URL + '\n');

  // Test Stripe webhook
  await sendWebhook('stripe', {
    type: 'customer.created',
    data: {
      object: {
        id: 'cus_test123',
        object: 'customer',
        email: 'test@example.com',
        name: 'Test Customer',
        created: Math.floor(Date.now() / 1000)
      }
    }
  });

  // Test GitHub webhook
  await sendWebhook('github', {
    action: 'opened',
    sender: {
      login: 'testuser',
      id: 12345,
      type: 'User'
    },
    repository: {
      name: 'test-repo',
      full_name: 'testuser/test-repo',
      private: false,
      owner: {
        login: 'testuser'
      }
    }
  });

  // Test Mailgun webhook
  await sendWebhook('mailgun', {
    event: 'delivered',
    recipient: 'user@example.com',
    timestamp: Date.now() / 1000,
    'message-id': '<test@example.com>'
  });

  // Test LinkedIn Lead Sync webhook
  await sendWebhook('linkedin', {
    leads: [
      {
        email: 'lead@company.com',
        firstName: 'Jane',
        lastName: 'Smith',
        company: 'Tech Corp',
        jobTitle: 'VP of Engineering',
        phoneNumber: '+1-555-0123',
        linkedInUrl: 'https://linkedin.com/in/janesmith',
        location: 'San Francisco, CA',
        campaignId: 'camp_123',
        formId: 'form_456',
        creativeId: 'creative_789'
      }
    ]
  });

  // Test Calendly webhook - Meeting Scheduled
  await sendWebhook('calendly', {
    event: 'invitee.created',
    payload: {
      invitee: {
        email: 'customer@example.com',
        name: 'John Customer',
        timezone: 'America/New_York',
        uuid: 'invitee_uuid_123',
        questions_and_answers: [
          {
            question: 'What is your company size?',
            answer: '50-100 employees'
          },
          {
            question: 'What is your budget?',
            answer: '$10,000 - $50,000'
          }
        ]
      },
      event_type: {
        name: 'Sales Discovery Call',
        uuid: 'event_type_uuid_456',
        organization: {
          name: 'Your Company',
          uuid: 'org_uuid_789'
        }
      },
      start_time: '2024-01-15T10:00:00Z',
      end_time: '2024-01-15T10:30:00Z',
      location: 'Zoom',
      status: 'active',
      created_at: '2024-01-10T09:00:00Z',
      updated_at: '2024-01-10T09:00:00Z',
      tracking: {
        utm_source: 'website',
        utm_medium: 'cta',
        utm_campaign: 'homepage',
        utm_term: 'demo',
        utm_content: 'hero-button'
      }
    }
  });

  // Test Generic webhook
  await sendWebhook('myapp', {
    user_id: 'user_789',
    event: 'signup_completed',
    email: 'newuser@example.com',
    name: 'New User',
    plan: 'premium',
    timestamp: new Date().toISOString()
  });

  console.log('✨ All test webhooks sent! Check your Inngest dashboard and PostHog for events.');
}

runTests().catch(console.error);