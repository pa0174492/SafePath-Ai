/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      { source: '/models', destination: '/ai-studio', permanent: false },
      { source: '/model-training', destination: '/ai-studio', permanent: false },
    ];
  },
};

module.exports = nextConfig;
