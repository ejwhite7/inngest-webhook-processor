import { inngest } from "../inngest";
import { posthog, IdentifyPayload, EventPayload, GroupPayload } from "../posthog";

export interface WebhookPayload {
  source: string;
  data: any;
  headers?: Record<string, string>;
}

export const processWebhook = inngest.createFunction(
  { id: "process-webhook" },
  { event: "webhook.received" },
  async ({ event, step }) => {
    const { source, data, headers } = event.data as WebhookPayload;

    // Step 1: Transform webhook data based on source
    const transformedData = await step.run("transform-data", async () => {
      return transformWebhookData(source, data);
    });

    // Step 2: Send to PostHog based on type
    await step.run("send-to-posthog", async () => {
      const promises = [];

      for (const item of transformedData) {
        switch (item.type) {
          case 'identify':
            promises.push(posthog.identify(item.payload as IdentifyPayload));
            break;
          case 'event':
            const eventPayload = item.payload as EventPayload;
            promises.push(posthog.capture({
              distinctId: eventPayload.distinctId,
              event: eventPayload.event,
              properties: eventPayload.properties
            }));
            break;
          case 'group':
            const groupPayload = item.payload as GroupPayload;
            promises.push(posthog.groupIdentify(groupPayload.groupType, groupPayload.groupKey, groupPayload.properties));
            break;
        }
      }

      await Promise.all(promises);
    });

    return { processed: transformedData.length, source };
  }
);

function transformWebhookData(source: string, data: any): Array<{type: 'identify' | 'event' | 'group', payload: any}> {
  const results: Array<{type: 'identify' | 'event' | 'group', payload: any}> = [];

  switch (source) {
    case 'stripe':
      return transformStripeWebhook(data);
    case 'github':
      return transformGitHubWebhook(data);
    case 'mailgun':
      return transformMailgunWebhook(data);
    case 'linkedin':
      return transformLinkedInWebhook(data);
    case 'calendly':
      return transformCalendlyWebhook(data);
    default:
      // Generic transformation - try to extract common patterns
      return transformGenericWebhook(data);
  }
}

function transformStripeWebhook(data: any): Array<{type: 'identify' | 'event' | 'group', payload: any}> {
  const results = [];

  if (data.type && data.data?.object) {
    const obj = data.data.object;

    // For customer events, create identify + event
    if (obj.object === 'customer') {
      results.push({
        type: 'identify' as const,
        payload: {
          distinctId: obj.id,
          properties: {
            email: obj.email,
            name: obj.name,
            created: obj.created
          }
        }
      });

      results.push({
        type: 'event' as const,
        payload: {
          distinctId: obj.id,
          event: `stripe.${data.type}`,
          properties: obj
        }
      });
    } else {
      // For other objects, just create events
      const distinctId = obj.customer || obj.id;
      results.push({
        type: 'event' as const,
        payload: {
          distinctId,
          event: `stripe.${data.type}`,
          properties: obj
        }
      });
    }
  }

  return results;
}

function transformGitHubWebhook(data: any): Array<{type: 'identify' | 'event' | 'group', payload: any}> {
  const results = [];

  if (data.sender) {
    results.push({
      type: 'identify' as const,
      payload: {
        distinctId: `github:${data.sender.login}`,
        properties: {
          github_login: data.sender.login,
          github_id: data.sender.id,
          github_type: data.sender.type
        }
      }
    });
  }

  if (data.repository) {
    results.push({
      type: 'group' as const,
      payload: {
        groupType: 'repository',
        groupKey: `github:${data.repository.full_name}`,
        properties: {
          name: data.repository.name,
          full_name: data.repository.full_name,
          private: data.repository.private,
          owner: data.repository.owner?.login
        }
      }
    });
  }

  results.push({
    type: 'event' as const,
    payload: {
      distinctId: data.sender ? `github:${data.sender.login}` : 'unknown',
      event: `github.${data.action || 'webhook'}`,
      properties: data
    }
  });

  return results;
}

function transformMailgunWebhook(data: any): Array<{type: 'identify' | 'event' | 'group', payload: any}> {
  const results = [];

  if (data.recipient) {
    results.push({
      type: 'identify' as const,
      payload: {
        distinctId: data.recipient,
        properties: {
          email: data.recipient
        }
      }
    });

    results.push({
      type: 'event' as const,
      payload: {
        distinctId: data.recipient,
        event: `mailgun.${data.event || 'webhook'}`,
        properties: data
      }
    });
  }

  return results;
}

function transformLinkedInWebhook(data: any): Array<{type: 'identify' | 'event' | 'group', payload: any}> {
  const results = [];

  // LinkedIn Lead Sync API webhook structure
  if (data.leads && Array.isArray(data.leads)) {
    // Process multiple leads
    for (const lead of data.leads) {
      processLinkedInLead(lead, results);
    }
  } else if (data.lead || data.contact) {
    // Process single lead
    const leadData = data.lead || data.contact;
    processLinkedInLead(leadData, results);
  } else if (data.email || data.firstName || data.lastName) {
    // Direct lead data
    processLinkedInLead(data, results);
  }

  return results;
}

function processLinkedInLead(lead: any, results: any[]) {
  // Extract lead information
  const email = lead.email || lead.emailAddress;
  const firstName = lead.firstName || lead.first_name;
  const lastName = lead.lastName || lead.last_name;
  const fullName = lead.fullName || (firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName);
  const company = lead.company || lead.companyName;
  const jobTitle = lead.jobTitle || lead.title;
  const phoneNumber = lead.phoneNumber || lead.phone;

  // Use email as distinct ID, fallback to LinkedIn member ID or generate one
  const distinctId = email || lead.memberId || lead.id || `linkedin:${Date.now()}`;

  // Create identify call with lead properties
  const identifyProperties: any = {};

  if (email) identifyProperties.email = email;
  if (fullName) identifyProperties.name = fullName;
  if (firstName) identifyProperties.first_name = firstName;
  if (lastName) identifyProperties.last_name = lastName;
  if (company) identifyProperties.company = company;
  if (jobTitle) identifyProperties.job_title = jobTitle;
  if (phoneNumber) identifyProperties.phone_number = phoneNumber;
  if (lead.linkedInUrl) identifyProperties.linkedin_url = lead.linkedInUrl;
  if (lead.location) identifyProperties.location = lead.location;

  results.push({
    type: 'identify' as const,
    payload: {
      distinctId,
      properties: identifyProperties
    }
  });

  // Create company group if company info exists
  if (company) {
    const companyKey = `company:${company.toLowerCase().replace(/\s+/g, '-')}`;
    results.push({
      type: 'group' as const,
      payload: {
        groupType: 'company',
        groupKey: companyKey,
        properties: {
          name: company,
          ...(lead.companySize && { size: lead.companySize }),
          ...(lead.industry && { industry: lead.industry })
        },
        distinctId
      }
    });
  }

  // Create lead event
  results.push({
    type: 'event' as const,
    payload: {
      distinctId,
      event: 'linkedin.lead_captured',
      properties: {
        source: 'linkedin_lead_sync',
        campaign_id: lead.campaignId,
        form_id: lead.formId,
        creative_id: lead.creativeId,
        ...lead
      }
    }
  });
}

function transformCalendlyWebhook(data: any): Array<{type: 'identify' | 'event' | 'group', payload: any}> {
  const results = [];

  // Calendly webhook event types
  const eventType = data.event;
  const payload = data.payload;

  if (!payload) {
    return results;
  }

  let distinctId = 'unknown';
  let userProperties: any = {};

  // Extract user information based on event type
  if (payload.invitee) {
    const invitee = payload.invitee;
    distinctId = invitee.email || invitee.uuid;

    userProperties = {
      email: invitee.email,
      name: invitee.name,
      timezone: invitee.timezone,
      calendly_uuid: invitee.uuid
    };

    // Add custom questions/answers as properties
    if (invitee.questions_and_answers) {
      invitee.questions_and_answers.forEach((qa: any, index: number) => {
        const key = `custom_${qa.question.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`;
        userProperties[key] = qa.answer;
      });
    }
  } else if (payload.email) {
    distinctId = payload.email;
    userProperties.email = payload.email;
  }

  // Create identify call if we have user info
  if (distinctId !== 'unknown' && Object.keys(userProperties).length > 0) {
    results.push({
      type: 'identify' as const,
      payload: {
        distinctId,
        properties: userProperties
      }
    });
  }

  // Extract event information
  let eventName = 'calendly.webhook';
  let eventProperties: any = { ...payload };

  switch (eventType) {
    case 'invitee.created':
      eventName = 'calendly.meeting_scheduled';
      eventProperties = {
        event_type_name: payload.event_type?.name,
        event_type_uuid: payload.event_type?.uuid,
        start_time: payload.start_time,
        end_time: payload.end_time,
        location: payload.location,
        status: payload.status,
        created_at: payload.created_at,
        updated_at: payload.updated_at,
        tracking_cookie: payload.tracking?.utm_campaign,
        utm_source: payload.tracking?.utm_source,
        utm_medium: payload.tracking?.utm_medium,
        utm_campaign: payload.tracking?.utm_campaign,
        utm_term: payload.tracking?.utm_term,
        utm_content: payload.tracking?.utm_content,
        salesforce_uuid: payload.tracking?.salesforce_uuid
      };
      break;

    case 'invitee.canceled':
      eventName = 'calendly.meeting_canceled';
      eventProperties = {
        event_type_name: payload.event_type?.name,
        cancellation_reason: payload.cancellation?.reason,
        canceled_by: payload.cancellation?.canceled_by,
        canceled_at: payload.canceled_at
      };
      break;

    case 'invitee.rescheduled':
      eventName = 'calendly.meeting_rescheduled';
      eventProperties = {
        event_type_name: payload.event_type?.name,
        old_start_time: payload.old_start_time,
        old_end_time: payload.old_end_time,
        new_start_time: payload.new_start_time,
        new_end_time: payload.new_end_time
      };
      break;

    case 'invitee_no_show.created':
      eventName = 'calendly.meeting_no_show';
      eventProperties = {
        event_type_name: payload.event_type?.name,
        no_show_uuid: payload.no_show?.uuid
      };
      break;

    default:
      eventName = `calendly.${eventType}`;
  }

  // Create event
  results.push({
    type: 'event' as const,
    payload: {
      distinctId,
      event: eventName,
      properties: eventProperties
    }
  });

  // Create organization group if we have organization info
  if (payload.event_type?.organization) {
    const org = payload.event_type.organization;
    results.push({
      type: 'group' as const,
      payload: {
        groupType: 'organization',
        groupKey: `calendly:${org.uuid}`,
        properties: {
          name: org.name,
          calendly_uuid: org.uuid
        },
        distinctId
      }
    });
  }

  return results;
}

function transformGenericWebhook(data: any): Array<{type: 'identify' | 'event' | 'group', payload: any}> {
  const results = [];

  // Try to find common user identifiers
  const userIdentifiers = ['user_id', 'userId', 'email', 'id', 'customer_id', 'customerId'];
  let distinctId = 'unknown';

  for (const field of userIdentifiers) {
    if (data[field]) {
      distinctId = data[field];
      break;
    }
  }

  // If we found user info, create an identify call
  if (distinctId !== 'unknown') {
    const userProperties: any = {};

    if (data.email) userProperties.email = data.email;
    if (data.name) userProperties.name = data.name;
    if (data.first_name) userProperties.first_name = data.first_name;
    if (data.last_name) userProperties.last_name = data.last_name;

    if (Object.keys(userProperties).length > 0) {
      results.push({
        type: 'identify' as const,
        payload: {
          distinctId,
          properties: userProperties
        }
      });
    }
  }

  // Always create an event
  results.push({
    type: 'event' as const,
    payload: {
      distinctId,
      event: data.event || 'webhook.received',
      properties: data
    }
  });

  return results;
}