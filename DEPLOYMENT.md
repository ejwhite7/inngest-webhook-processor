# Deploying to Vercel

This guide walks you through deploying your Inngest webhook processor to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Inngest Account**: Sign up at [inngest.com](https://inngest.com)
3. **PostHog Account**: Sign up at [posthog.com](https://posthog.com)
4. **Git Repository**: Push your code to GitHub, GitLab, or Bitbucket

## Step 1: Prepare Environment Variables

You'll need to set these environment variables in your Vercel project:

### Required Variables
```bash
# Inngest Configuration
INNGEST_EVENT_KEY=your-inngest-event-key
INNGEST_SIGNING_KEY=your-inngest-signing-key

# PostHog Configuration
POSTHOG_API_KEY=your-posthog-api-key
POSTHOG_HOST=https://app.posthog.com
```

### Optional Webhook Secrets (for signature verification)
```bash
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
GITHUB_WEBHOOK_SECRET=your-github-webhook-secret
MAILGUN_WEBHOOK_SECRET=your-mailgun-webhook-secret
CALENDLY_WEBHOOK_SECRET=your-calendly-webhook-secret

# LinkedIn Lead Sync API (for OAuth-based authentication)
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret
LINKEDIN_ACCESS_TOKEN=your-linkedin-access-token
```

## Step 2: Deploy to Vercel

### Option A: Using Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel --prod
   ```

### Option B: Using Vercel Dashboard

1. **Connect Repository**:
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your Git repository

2. **Configure Build Settings**:
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

3. **Add Environment Variables**:
   - In project settings, add all the environment variables listed above

4. **Deploy**:
   - Click "Deploy"

## Step 3: Configure Inngest

1. **Get Your Vercel URL**:
   After deployment, you'll get a URL like `https://your-project.vercel.app`

2. **Register with Inngest**:
   - Go to your [Inngest dashboard](https://app.inngest.com)
   - Add your app URL: `https://your-project.vercel.app/api/inngest`
   - Inngest will sync your functions automatically

## Step 4: Test Your Deployment

### Health Check
```bash
curl https://your-project.vercel.app/api/health
```

### Test Webhooks
```bash
# Stripe webhook
curl -X POST https://your-project.vercel.app/webhook/stripe \
  -H "Content-Type: application/json" \
  -d '{"type": "customer.created", "data": {"object": {"id": "cus_123", "email": "test@example.com"}}}'

# LinkedIn webhook
curl -X POST https://your-project.vercel.app/webhook/linkedin \
  -H "Content-Type: application/json" \
  -d '{"leads": [{"email": "lead@company.com", "firstName": "Jane", "lastName": "Smith"}]}'

# Calendly webhook
curl -X POST https://your-project.vercel.app/webhook/calendly \
  -H "Content-Type: application/json" \
  -d '{"event": "invitee.created", "payload": {"invitee": {"email": "customer@example.com"}}}'
```

## Available Endpoints

After deployment, your endpoints will be:

- **Health Check**: `GET /api/health`
- **Inngest Functions**: `GET|POST /api/inngest`
- **Webhooks**: `POST /webhook/{source}`
  - `/webhook/stripe`
  - `/webhook/github`
  - `/webhook/mailgun`
  - `/webhook/linkedin`
  - `/webhook/calendly`
  - `/webhook/custom` (or any other source name)

## Monitoring & Debugging

### Vercel Logs
```bash
vercel logs your-project-url
```

### Inngest Dashboard
- View function executions at [app.inngest.com](https://app.inngest.com)
- Monitor webhook processing and errors
- Check function retry attempts

### PostHog Dashboard
- Verify events are being received in your PostHog project
- Check user profiles and event data

## Environment-Specific Configuration

### Development
```bash
npm run dev          # Start Next.js dev server
npm run inngest:dev  # Start Inngest dev mode (in separate terminal)
```

### Local Express Server (Alternative)
```bash
npm run dev:local    # Start the original Express server
```

## Troubleshooting

### Common Issues

1. **Functions Not Syncing with Inngest**:
   - Verify your `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY`
   - Check that `/api/inngest` endpoint is accessible
   - Review Inngest dashboard for sync errors

2. **Webhooks Not Processing**:
   - Check Vercel function logs
   - Verify webhook payload format
   - Ensure environment variables are set correctly

3. **PostHog Events Not Appearing**:
   - Verify `POSTHOG_API_KEY` is correct
   - Check PostHog ingestion logs
   - Confirm PostHog host URL is correct

### Function Timeout Issues
Vercel has function execution limits:
- Hobby plan: 10 seconds
- Pro plan: 60 seconds
- Enterprise: 300 seconds

The `vercel.json` configuration sets appropriate timeouts for webhook processing.

## Scaling Considerations

### Rate Limits
- Vercel Hobby: 100GB-hours per month
- Consider upgrading for high-volume webhook processing

### Function Concurrency
- Inngest handles function queuing and retries automatically
- No need to worry about concurrent webhook processing

### Cost Optimization
- Use Inngest's built-in deduplication features
- Implement webhook signature validation to prevent abuse
- Monitor function execution costs in Vercel dashboard

## Security Best Practices

1. **Enable Webhook Signature Verification**:
   Set webhook secrets for all services you're using

2. **Use Environment Variables**:
   Never commit secrets to your repository

3. **Monitor Function Logs**:
   Watch for suspicious webhook activity

4. **Rate Limiting**:
   Consider adding rate limiting for webhook endpoints

## Next Steps

1. **Set Up Monitoring**: Configure alerts for failed webhook processing
2. **Add More Sources**: Extend the webhook processor for additional services
3. **Custom Analytics**: Build dashboards in PostHog to track webhook metrics
4. **Backup Strategy**: Consider webhook payload logging for debugging