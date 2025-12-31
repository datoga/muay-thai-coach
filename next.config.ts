import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  // Vercel deployment optimizations
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  
  // Fix HMR issues with next-auth/Auth.js
  // This prevents the vendor-chunks corruption during hot reload
  serverExternalPackages: ['@auth/core'],
  
  // Set turbopack root to avoid lockfile conflict warnings
  turbopack: {
    root: process.cwd(),
  },
};

export default withNextIntl(nextConfig);
