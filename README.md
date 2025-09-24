# Inngest Webhook to PostHog Processor

A robust webhook processing system built with Inngest that receives webhooks from various sources and transforms them into PostHog Identify, Event, and Group calls.

## Features

- 🎯 **Multi-source webhook processing**: Support for Stripe, GitHub, Mailgun, LinkedIn Lead Sync, Calendly, and generic webhooks
- 🔄 **Automatic transformation**: Intelligent mapping from webhook data to PostHog events
- 🛡️ **Webhook validation**: Signature verification for secure webhook processing
- ⚡ **Async processing**: Powered by Inngest for reliable, scalable event processing
- 📊 **PostHog integration**: Automatic Identify, Event, and Group calls
- 🔧 **Extensible**: Easy to add new webhook sources

## Quick Start

### 1. Installation

```bash
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env` and configure your keys:

```bash
cp .env.example .env
```

Required environment variables:
- `POSTHOG_API_KEY`: Your PostHog API key
- `INNGEST_EVENT_KEY`: Your Inngest event key
- `INNGEST_SIGNING_KEY`: Your Inngest signing key

### 3. Run the Application

#### Development Mode
```bash
# Start the webhook server
npm run dev

# In another terminal, start Inngest dev mode
npm run inngest:dev
```

#### Production Mode
```bash
npm run build
npm start
```

## Webhook Endpoints

Send webhooks to: `POST /webhook/{source}`

### Supported Sources

- **Stripe**: `/webhook/stripe`
- **GitHub**: `/webhook/github`
- **Mailgun**: `/webhook/mailgun`
- **LinkedIn Lead Sync**: `/webhook/linkedin`
- **Calendly**: `/webhook/calendly`
- **Generic**: `/webhook/custom` (or any other source name)

### Example Webhook Calls

```bash
# Stripe webhook
curl -X POST http://localhost:3000/webhook/stripe \
  -H "Content-Type: application/json" \
  -d '{"type": "customer.created", "data": {"object": {"id": "cus_123", "email": "user@example.com"}}}'

# GitHub webhook
curl -X POST http://localhost:3000/webhook/github \
  -H "Content-Type: application/json" \
  -d '{"action": "opened", "sender": {"login": "username"}, "repository": {"name": "repo"}}'

# LinkedIn Lead Sync webhook
curl -X POST http://localhost:3000/webhook/linkedin \
  -H "Content-Type: application/json" \
  -d '{"leads": [{"email": "lead@company.com", "firstName": "Jane", "lastName": "Smith", "company": "Tech Corp"}]}'

# Calendly webhook
curl -X POST http://localhost:3000/webhook/calendly \
  -H "Content-Type: application/json" \
  -d '{"event": "invitee.created", "payload": {"invitee": {"email": "customer@example.com", "name": "John Customer"}}}'

# Generic webhook
curl -X POST http://localhost:3000/webhook/myapp \
  -H "Content-Type: application/json" \
  -d '{"user_id": "123", "event": "signup", "email": "user@example.com"}'
```

## How It Works

1. **Webhook Reception**: Webhooks are received at `/webhook/{source}` endpoints
2. **Event Triggering**: An Inngest event `webhook.inbound` is triggered
3. **Validation**: Webhook signatures are validated (when configured)
4. **Processing**: Another Inngest function transforms the data based on the source
5. **PostHog Calls**: Appropriate PostHog API calls are made (identify, capture, groupIdentify)

## Data Transformation

### Stripe Webhooks
- Customer events → PostHog Identify + Event
- Other events → PostHog Events with customer ID as distinct ID

### GitHub Webhooks
- User data → PostHog Identify
- Repository data → PostHog Group
- Actions → PostHog Events

### Mailgun Webhooks
- Recipient data → PostHog Identify
- Email events → PostHog Events

### LinkedIn Lead Sync Webhooks
- Lead data → PostHog Identify with comprehensive user properties
- Company data → PostHog Group for organization tracking
- Lead capture events → PostHog Events with campaign attribution

### Calendly Webhooks
- Invitee data → PostHog Identify with timezone and custom fields
- Meeting events → PostHog Events (scheduled, canceled, rescheduled, no-show)
- Organization data → PostHog Group for company tracking
- UTM parameters preserved for attribution tracking

### Generic Webhooks
- Attempts to extract user identifiers (user_id, email, etc.)
- Creates Identify calls when user data is found
- Always creates Events for tracking

## Adding New Webhook Sources

To add a new webhook source, modify `src/functions/webhook-processor.ts`:

1. Add a new case to the `transformWebhookData` function:

```typescript
case 'your-source':
  return transformYourSourceWebhook(data);
```

2. Implement the transformation function:

```typescript
function transformYourSourceWebhook(data: any): Array<{type: 'identify' | 'event' | 'group', payload: any}> {
  const results = [];

  // Your transformation logic here
  results.push({
    type: 'event',
    payload: {
      distinctId: data.user_id,
      event: 'your-event',
      properties: data
    }
  });

  return results;
}
```

## PostHog Integration

The system automatically handles three types of PostHog calls:

### Identify Calls
Used to set user properties:
```typescript
{
  type: 'identify',
  payload: {
    distinctId: 'user-123',
    properties: {
      email: 'user@example.com',
      name: 'John Doe'
    }
  }
}
```

### Event Calls
Used to track user actions:
```typescript
{
  type: 'event',
  payload: {
    distinctId: 'user-123',
    event: 'subscription.created',
    properties: {
      plan: 'premium',
      amount: 99
    }
  }
}
```

### Group Calls
Used to set organization/group properties:
```typescript
{
  type: 'group',
  payload: {
    groupType: 'organization',
    groupKey: 'org-456',
    properties: {
      name: 'Acme Corp',
      plan: 'enterprise'
    }
  }
}
```

## Monitoring and Health

- Health check endpoint: `GET /health`
- Inngest dashboard: View function executions and logs
- PostHog dashboard: Monitor incoming events and user data

## Security

### Webhook Signature Verification

Enable signature verification by setting webhook secrets in your environment variables:

- `STRIPE_WEBHOOK_SECRET`
- `GITHUB_WEBHOOK_SECRET`
- `MAILGUN_WEBHOOK_SECRET`
- `CALENDLY_WEBHOOK_SECRET`
- `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `LINKEDIN_ACCESS_TOKEN` (for OAuth)

The validation functions are implemented in `src/functions/webhook-receiver.ts`.

## Troubleshooting

### Common Issues

1. **Webhooks not processing**: Check Inngest dev mode is running
2. **PostHog events not appearing**: Verify `POSTHOG_API_KEY` is correct
3. **Validation errors**: Check webhook secrets are properly configured

### Logs

- Server logs: Console output from the Express server
- Inngest logs: Available in the Inngest dashboard
- PostHog logs: Check PostHog ingestion logs

## Development

### Project Structure

```
src/
├── api/
│   └── serve.ts          # Inngest function server
├── functions/
│   ├── webhook-receiver.ts   # Webhook validation & routing
│   └── webhook-processor.ts  # Data transformation & PostHog calls
├── inngest.ts            # Inngest client setup
├── posthog.ts            # PostHog client setup
├── webhook-handler.ts    # Express webhook endpoints
└── index.ts              # Main server entry point
```

### Adding Features

1. Fork the repository
2. Create a feature branch
3. Add your changes
4. Test with `npm run dev`
5. Submit a pull request

## Deployment

### Vercel Deployment (Recommended)

This app is optimized for Vercel deployment. See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

**Quick Deploy:**
1. Push to GitHub
2. Connect to Vercel
3. Add environment variables
4. Deploy
5. Register with Inngest

### Local Development
```bash
npm run dev          # Next.js dev server
npm run inngest:dev  # Inngest dev mode
```

### Alternative Express Server
```bash
npm run dev:local    # Original Express server
```

## License

MIT License - see LICENSE file for details.