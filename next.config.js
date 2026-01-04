/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['swisseph'],
  typescript: {
    ignoreBuildErrors: true
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  webpack: (config) => {
    config.externals.push({
      swisseph: 'commonjs swisseph'
    });
    return config;
  }
};

module.exports = nextConfig;