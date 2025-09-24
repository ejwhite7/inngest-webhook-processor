import { serve } from "inngest/next";
import { inngest } from "../inngest";
import { receiveWebhook } from "../functions/webhook-receiver";
import { processWebhook } from "../functions/webhook-processor";

// Create the handler for serving Inngest functions
export const handler = serve({
  client: inngest,
  functions: [
    receiveWebhook,
    processWebhook,
  ],
});

// For use with Express.js or other Node.js frameworks
export { handler as POST, handler as GET, handler as PUT };