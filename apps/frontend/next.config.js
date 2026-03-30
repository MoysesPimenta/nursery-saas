const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@nursery-saas/ui', '@nursery-saas/shared'],
};

module.exports = withNextIntl(nextConfig);
