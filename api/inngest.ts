import { serve } from "inngest/next";
import { inngest } from "../src/inngest";
import { receiveWebhook } from "../src/functions/webhook-receiver";
import { processWebhook } from "../src/functions/webhook-processor";

// Create the handler for serving Inngest functions
export default serve({
  client: inngest,
  functions: [
    receiveWebhook,
    processWebhook,
  ],
  servePath: "/api/inngest",
});