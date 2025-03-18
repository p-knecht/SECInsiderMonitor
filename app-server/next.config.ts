import type { NextConfig } from 'next';

/**
 * The custom Next.js configuration object used for SIM Application server.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  /**
   * Custom redirect for the application, redirecting / to /dashboard permanently.
   * @returns {object[]} - The redirect object array.
   */
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
