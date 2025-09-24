import express from 'express';
import { inngest } from './inngest';

export function createWebhookHandler() {
  const app = express();

  // Middleware to parse JSON and preserve raw body for signature verification
  app.use('/webhook/:source', express.raw({ type: 'application/json' }));

  // Handle webhook verification challenges
  app.get('/webhook/:source', async (req, res) => {
    try {
      const source = req.params.source;

      // LinkedIn webhook verification
      if (source === 'linkedin') {
        const challenge = req.query.challenge;
        if (challenge && typeof challenge === 'string') {
          console.log(`🔐 LinkedIn webhook verification challenge: ${challenge}`);
          return res.status(200).send(challenge);
        }
      }

      // Facebook/Meta webhook verification
      if (source === 'facebook' || source === 'meta') {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        if (mode === 'subscribe' && token === process.env.FACEBOOK_VERIFY_TOKEN) {
          console.log(`🔐 Facebook webhook verified`);
          return res.status(200).send(challenge);
        }
      }

      // Generic challenge handling
      const challenge = req.query.challenge;
      if (challenge && typeof challenge === 'string') {
        console.log(`🔐 Webhook verification challenge for ${source}: ${challenge}`);
        return res.status(200).send(challenge);
      }

      res.status(400).json({ error: 'Invalid verification request' });
    } catch (error) {
      console.error('Webhook verification error:', error);
      res.status(500).json({ error: 'Verification failed' });
    }
  });

  // Generic webhook endpoint
  app.post('/webhook/:source', async (req, res) => {
    try {
      const source = req.params.source;
      const headers = req.headers as Record<string, string>;

      // Parse the raw body
      let payload;
      try {
        payload = JSON.parse(req.body.toString());
      } catch (error) {
        return res.status(400).json({ error: 'Invalid JSON payload' });
      }

      // Send event to Inngest for processing
      await inngest.send({
        name: "webhook.inbound",
        data: {
          source,
          payload,
          headers,
          receivedAt: new Date().toISOString()
        }
      });

      res.status(200).json({
        status: 'received',
        source,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Webhook processing error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  return app;
}