import { useEffect, useState } from 'react';

export default function Home() {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        setHealth(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Health check failed:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      maxWidth: '800px',
      margin: '0 auto',
      padding: '40px 20px',
      lineHeight: '1.6'
    }}>
      <h1 style={{ color: '#333', textAlign: 'center' }}>
        🎯 Inngest Webhook Processor
      </h1>

      <div style={{
        background: loading ? '#f5f5f5' : (health ? '#e8f5e8' : '#ffe8e8'),
        padding: '20px',
        borderRadius: '8px',
        margin: '20px 0',
        textAlign: 'center'
      }}>
        {loading ? (
          <p>⏳ Checking health...</p>
        ) : health ? (
          <div>
            <p>✅ Service is healthy!</p>
            <small>Last checked: {health.timestamp}</small>
          </div>
        ) : (
          <p>❌ Service health check failed</p>
        )}
      </div>

      <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px' }}>
        <h2>Available Webhook Endpoints</h2>
        <ul style={{ margin: '0', paddingLeft: '20px' }}>
          <li><code>/webhook/stripe</code> - Stripe webhook processing</li>
          <li><code>/webhook/github</code> - GitHub webhook processing</li>
          <li><code>/webhook/mailgun</code> - Mailgun webhook processing</li>
          <li><code>/webhook/linkedin</code> - LinkedIn Lead Sync processing</li>
          <li><code>/webhook/calendly</code> - Calendly webhook processing</li>
          <li><code>/webhook/custom</code> - Generic webhook processing</li>
        </ul>
      </div>

      <div style={{ background: '#f0f8ff', padding: '20px', borderRadius: '8px', marginTop: '20px' }}>
        <h2>Features</h2>
        <ul style={{ margin: '0', paddingLeft: '20px' }}>
          <li>🎯 Multi-source webhook processing</li>
          <li>🔄 Automatic PostHog event transformation</li>
          <li>⚡ Powered by Inngest for reliable processing</li>
          <li>🛡️ Webhook signature validation support</li>
          <li>📊 Identify, Event, and Group call automation</li>
        </ul>
      </div>

      <div style={{ textAlign: 'center', marginTop: '40px', color: '#666' }}>
        <p>
          <a href="https://github.com/ejwhite7/inngest-webhook-processor" target="_blank" rel="noopener">
            📖 View Documentation
          </a>
        </p>
        <small>Built with ❤️ using Inngest, PostHog, and Next.js</small>
      </div>
    </div>
  );
}