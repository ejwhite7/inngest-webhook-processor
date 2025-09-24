/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Ignore build errors - useful for initial deployment
    ignoreBuildErrors: false,
  },
  eslint: {
    // Ignore lint errors during builds
    ignoreDuringBuilds: true,
  },
  // Redirect root to health check
  async redirects() {
    return [
      {
        source: '/',
        destination: '/api/health',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;