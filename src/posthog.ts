import { PostHog } from 'posthog-node';

console.log('🔧 Initializing PostHog client:', {
  apiKey: process.env.POSTHOG_API_KEY ? 'SET' : 'MISSING',
  host: process.env.POSTHOG_HOST || 'https://us.posthog.com',
});

export const posthog = new PostHog(
  process.env.POSTHOG_API_KEY || '',
  {
    host: process.env.POSTHOG_HOST || 'https://us.posthog.com',
    // Add additional options for serverless environments
    flushAt: 1, // Send events immediately
    flushInterval: 0, // Don't wait for batch interval
  }
);

export interface IdentifyPayload {
  distinctId: string;
  properties?: Record<string, any>;
}

export interface EventPayload {
  distinctId: string;
  event: string;
  properties?: Record<string, any>;
}

export interface GroupPayload {
  groupType: string;
  groupKey: string;
  properties?: Record<string, any>;
  distinctId?: string;
}