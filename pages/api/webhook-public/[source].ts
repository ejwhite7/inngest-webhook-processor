import type { NextApiRequest, NextApiResponse } from 'next';
import { inngest } from '../../../src/inngest';

// Public webhook handler without protection
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Allow all origins for CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { source } = req.query;

    if (!source || typeof source !== 'string') {
      return res.status(400).json({ error: 'Source parameter is required' });
    }

    const headers = req.headers as Record<string, string>;
    const payload = req.body;

    console.log(`📥 Received webhook from ${source}:`, { payload, headers: Object.keys(headers) });

    // Send event to Inngest for processing
    const result = await inngest.send({
      name: "webhook.inbound",
      data: {
        source,
        payload,
        headers,
        receivedAt: new Date().toISOString()
      }
    });

    console.log(`✅ Sent to Inngest:`, result);

    res.status(200).json({
      status: 'received',
      source,
      timestamp: new Date().toISOString(),
      inngestEventId: result.ids
    });

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Configure body parsing
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
}