import { serve } from "inngest/next";
import { inngest } from "../../src/inngest";
import { receiveWebhook } from "../../src/functions/webhook-receiver";
import { processWebhook } from "../../src/functions/webhook-processor";

// Create a public handler for Inngest functions without any middleware
const handler = serve({
  client: inngest,
  functions: [
    receiveWebhook,
    processWebhook,
  ],
  servePath: "/api/inngest-public",
});

export default handler;

// Disable body parsing to let Inngest handle it
export const config = {
  api: {
    bodyParser: false,
  },
};