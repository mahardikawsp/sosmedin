/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    // Disable ESLint during builds
    eslint: {
        ignoreDuringBuilds: true,
    },
    // Disable TypeScript checking during builds
    typescript: {
        ignoreBuildErrors: true,
    },
    // Disable source maps in production to save memory
    productionBrowserSourceMaps: false,
    experimental: {
        optimizePackageImports: ['react-icons'],
        // Reduce memory usage during build
        workerThreads: false,
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
                pathname: '/**',
            },
        ],
        formats: ['image/webp', 'image/avif'],
        minimumCacheTTL: 60,
        // Allow local uploads
        domains: ['localhost'],
        unoptimized: process.env.NODE_ENV === 'development',
    },
    // Enable compression
    compress: true,
    // Optimize for low-resource environments
    output: process.env.BUILD_STANDALONE === 'true' ? 'standalone' : undefined,
    // Optimize bundle splitting for memory-constrained builds
    webpack: (config, { dev, isServer }) => {
        // Bundle analyzer (only when explicitly requested)
        if (process.env.ANALYZE === 'true') {
            const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
            config.plugins.push(
                new BundleAnalyzerPlugin({
                    analyzerMode: 'static',
                    openAnalyzer: false, // Don't auto-open to save resources
                })
            );
        }

        // Only apply optimizations in production builds
        if (!dev && !isServer) {
            // Ensure optimization object exists
            config.optimization = config.optimization || {};

            // Basic optimizations that don't conflict with cache
            config.optimization.minimize = true;
            config.optimization.concatenateModules = false; // Disable scope hoisting to save memory

            // Simpler chunk splitting for low-memory environments
            config.optimization.splitChunks = {
                chunks: 'all',
                maxSize: 244000, // Smaller chunks to reduce memory usage
                cacheGroups: {
                    default: {
                        minChunks: 2,
                        priority: -20,
                        reuseExistingChunk: true,
                    },
                    vendor: {
                        test: /[\\/]node_modules[\\/]/,
                        name: 'vendors',
                        priority: -10,
                        chunks: 'all',
                        maxSize: 244000,
                    },
                },
            };

            // Remove conflicting optimizations
            // Don't set usedExports as it conflicts with cacheUnaffected
            // config.optimization.usedExports = true;
            config.optimization.sideEffects = false;
        }

        // Limit the number of parallel builds
        if (config.parallelism) {
            config.parallelism = 1;
        }

        return config;
    },
};

export default nextConfig;