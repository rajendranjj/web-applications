/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone', // Enable for Docker deployment
  env: {
    CUSTOM_KEY: 'my-value',
  },
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // Disable webpack caching in development
      config.cache = false;
      // Disable optimization for faster builds
      config.optimization = {
        ...config.optimization,
        minimize: false,
        splitChunks: false,
      };
    }
    return config;
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