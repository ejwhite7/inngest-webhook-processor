import express from 'express';
import { createWebhookHandler } from './webhook-handler';
import { handler } from './api/serve';

const app = express();
const PORT = process.env.PORT || 3000;

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Inngest function serving endpoints
app.use('/api/inngest', handler);

// Webhook endpoints
const webhookHandler = createWebhookHandler();
app.use('/', webhookHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Webhook processor server running on port ${PORT}`);
  console.log(`📥 Webhook endpoints available at: /webhook/{source}`);
  console.log(`⚡ Inngest functions served at: /api/inngest`);
});