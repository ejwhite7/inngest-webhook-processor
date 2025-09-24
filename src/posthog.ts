import { PostHog } from 'posthog-node';

export const posthog = new PostHog(
  process.env.POSTHOG_API_KEY || '',
  {
    host: process.env.POSTHOG_HOST || 'https://us.posthog.com',
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