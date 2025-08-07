/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone', // Enable for Docker deployment
  env: {
    CUSTOM_KEY: 'my-value',
  },
  async rewrites() {
    return [
      {
        source: '/api/jira/:path*',
        destination: 'https://your-domain.atlassian.net/rest/api/3/:path*',
      },
    ];
  },
};

module.exports = nextConfig;