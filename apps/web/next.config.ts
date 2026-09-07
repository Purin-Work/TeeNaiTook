import type { NextConfig } from 'next';
import { config } from 'dotenv';
if (process.env.VERCEL !== '1') config({ path: '../../.env', quiet: true });
const nextConfig: NextConfig = {
  poweredByHeader: false,
  async rewrites() {
    const api = process.env.API_INTERNAL_URL;
    const configuredDemo = process.env.NEXT_PUBLIC_STANDALONE_DEMO;
    const standaloneDemo =
      configuredDemo === 'true' ||
      (configuredDemo === undefined && process.env.VERCEL === '1' && !api);
    if (standaloneDemo) return [];
    return api ? [{ source: '/api/:path*', destination: `${api}/:path*` }] : [];
  },
};
export default nextConfig;
