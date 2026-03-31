/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@nursery-saas/shared'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
