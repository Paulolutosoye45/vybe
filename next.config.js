/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'decemberissavybe.com' }
    ]
  }
};

module.exports = nextConfig;
