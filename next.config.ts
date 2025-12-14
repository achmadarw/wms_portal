import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    reactStrictMode: true,
    typescript: {
        tsconfigPath: './tsconfig.json',
    },
    experimental: {
        optimizePackageImports: ['lucide-react', '@/components/icons'],
    },
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production',
    },
    // Optimize bundle size
    swcMinify: true,
};

export default nextConfig;
