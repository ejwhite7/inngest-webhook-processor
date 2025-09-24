import type { NextApiRequest, NextApiResponse } from 'next';
import { inngest } from '../../../src/inngest';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { source } = req.query;

  // Handle LinkedIn webhook verification challenge
  if (req.method === 'GET' && source === 'linkedin') {
    const challenge = req.query.challenge;
    if (challenge && typeof challenge === 'string') {
      console.log(`🔐 LinkedIn webhook verification challenge received: ${challenge}`);
      return res.status(200).send(challenge);
    }
  }

  // Handle other webhook verification challenges
  if (req.method === 'GET') {
    // Facebook/Meta webhooks
    if (source === 'facebook' || source === 'meta') {
      const mode = req.query['hub.mode'];
      const token = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];

      if (mode === 'subscribe' && token === process.env.FACEBOOK_VERIFY_TOKEN) {
        console.log(`🔐 Facebook webhook verified`);
        return res.status(200).send(challenge);
      }
    }

    // Generic challenge parameter handling
    const challenge = req.query.challenge;
    if (challenge && typeof challenge === 'string') {
      console.log(`🔐 Webhook verification challenge for ${source}: ${challenge}`);
      return res.status(200).send(challenge);
    }
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
}

// Configure body parsing to preserve raw body for signature verification
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
}