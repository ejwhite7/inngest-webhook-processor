import { inngest } from "../inngest";

export const receiveWebhook = inngest.createFunction(
  { id: "receive-webhook" },
  { event: "webhook.inbound" },
  async ({ event, step }) => {
    const { source, payload, headers } = event.data;

    // Step 1: Validate webhook (you can add signature verification here)
    const isValid = await step.run("validate-webhook", async () => {
      return validateWebhook(source, payload, headers);
    });

    if (!isValid) {
      throw new Error(`Invalid webhook from source: ${source}`);
    }

    // Step 2: Send to processing function
    await step.sendEvent("send-for-processing", {
      name: "webhook.received",
      data: {
        source,
        data: payload,
        headers
      }
    });

    return { status: "received", source };
  }
);

function validateWebhook(source: string, payload: any, headers: Record<string, string> = {}): boolean {
  // Add webhook signature verification based on source
  switch (source) {
    case 'stripe':
      // Validate Stripe webhook signature
      // return validateStripeSignature(payload, headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET);
      return true; // Placeholder

    case 'github':
      // Validate GitHub webhook signature
      // return validateGitHubSignature(payload, headers['x-hub-signature-256'], process.env.GITHUB_WEBHOOK_SECRET);
      return true; // Placeholder

    case 'mailgun':
      // Validate Mailgun webhook signature
      return true; // Placeholder

    case 'linkedin':
      // LinkedIn webhooks typically use OAuth-based authentication
      // Validation would be done at the API level during lead sync
      return true; // Placeholder

    case 'calendly':
      // Validate Calendly webhook signature
      // return validateCalendlySignature(payload, headers['calendly-webhook-signature'], process.env.CALENDLY_WEBHOOK_SECRET);
      return true; // Placeholder

    default:
      // For unknown sources, allow by default (you might want to change this)
      return true;
  }
}

// Example signature validation functions (commented out - implement as needed)
/*
function validateStripeSignature(payload: string, signature: string, secret: string): boolean {
  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex');
  return signature === `v1=${expectedSignature}`;
}

function validateGitHubSignature(payload: string, signature: string, secret: string): boolean {
  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex');
  return signature === `sha256=${expectedSignature}`;
}
*/