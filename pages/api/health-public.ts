import type { NextApiRequest, NextApiResponse } from 'next';

// Public health endpoint to test if protection is bypassed
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'inngest-webhook-processor',
    message: 'Public endpoint working',
    endpoints: {
      inngest: '/api/inngest-public',
      webhook: '/api/webhook-public/{source}'
    }
  });
}