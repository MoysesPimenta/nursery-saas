const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@nursery-saas/ui', '@nursery-saas/shared'],
  eslint: {
    // Enabled: ESLint errors will now fail the build
    // Previously ignored: ignoreDuringBuilds: true,
  },
  typescript: {
    // Enabled: TypeScript errors will now fail the build
    // Previously ignored: ignoreBuildErrors: true,
  },
};

module.exports = withNextIntl(nextConfig);
