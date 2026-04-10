import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: [
      '@dnd-kit/core',
      '@dnd-kit/sortable',
      '@dnd-kit/utilities',
      '@anthropic-ai/sdk',
      '@supabase/supabase-js',
      '@supabase/ssr',
    ],
  },
  turbopack: {},
};

export default nextConfig;
