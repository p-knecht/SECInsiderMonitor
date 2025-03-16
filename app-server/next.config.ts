import type { NextConfig } from 'next';
import dotenv from 'dotenv';
import path from 'path';

// load environment variables from .env.local file in config directory
dotenv.config({ path: path.resolve(__dirname, 'config/.env.local') });

const nextConfig: NextConfig = {
  reactStrictMode: true,
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
