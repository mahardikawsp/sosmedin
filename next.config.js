/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    experimental: {
        optimizePackageImports: ['react-icons', 'date-fns'],
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
    },
    // Enable compression
    compress: true,
    // Optimize bundle splitting
    webpack: (config, { dev, isServer }) => {
        // Bundle analyzer
        if (process.env.ANALYZE === 'true') {
            const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
            config.plugins.push(
                new BundleAnalyzerPlugin({
                    analyzerMode: 'static',
                    openAnalyzer: true,
                })
            );
        }

        if (!dev && !isServer) {
            config.optimization.splitChunks = {
                chunks: 'all',
                cacheGroups: {
                    vendor: {
                        test: /[\\/]node_modules[\\/]/,
                        name: 'vendors',
                        chunks: 'all',
                        priority: 10,
                    },
                    common: {
                        name: 'common',
                        minChunks: 2,
                        chunks: 'all',
                        priority: 5,
                        reuseExistingChunk: true,
                    },
                },
            };

            // Tree shaking optimization
            config.optimization.usedExports = true;
            config.optimization.sideEffects = false;
        }

        return config;
    },
};

export default nextConfig;