import express from 'express';
import { inngest } from './inngest';

export function createWebhookHandler() {
  const app = express();

  // Middleware to parse JSON and preserve raw body for signature verification
  app.use('/webhook/:source', express.raw({ type: 'application/json' }));

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