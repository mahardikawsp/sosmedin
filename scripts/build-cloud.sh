#!/bin/bash

# Cloud build optimization script for low-resource environments
# Usage: ./scripts/build-cloud.sh

echo "🚀 Starting optimized cloud build..."

# Set memory limits for Node.js
export NODE_OPTIONS="--max-old-space-size=3072 --max-semi-space-size=128"

# Set build environment variables
export BUILD_STANDALONE=true
export NODE_ENV=production

# Clean up any previous builds
echo "🧹 Cleaning previous builds..."
rm -rf .next
rm -rf out

# Generate Prisma client first (lighter operation)
echo "🔧 Generating Prisma client..."
npx prisma generate

# Pre-build optimizations
echo "⚡ Running pre-build optimizations..."

# Create a temporary next.config.js with even more aggressive optimizations for cloud
cat > next.config.cloud.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false, // Disable for faster builds
    swcMinify: true,
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    experimental: {
        workerThreads: false,
        productionBrowserSourceMaps: false,
        optimizeCss: false, // Disable CSS optimization to save memory
    },
    images: {
        unoptimized: true, // Disable image optimization to save build time/memory
    },
    compress: false, // Let the server handle compression
    output: 'standalone',
    webpack: (config, { dev, isServer }) => {
        if (!dev) {
            // Minimal webpack config for low memory
            config.optimization.minimize = true;
            config.optimization.concatenateModules = false;
            config.optimization.splitChunks = {
                chunks: 'all',
                maxSize: 200000,
                cacheGroups: {
                    default: false,
                    vendors: false,
                    vendor: {
                        test: /[\\/]node_modules[\\/]/,
                        name: 'vendors',
                        chunks: 'all',
                        maxSize: 200000,
                    },
                },
            };
        }
        
        // Reduce parallelism
        config.parallelism = 1;
        
        return config;
    },
};

export default nextConfig;
EOF

# Build with the cloud-optimized config
echo "🏗️  Building with cloud optimizations..."
NEXT_CONFIG_FILE=next.config.cloud.js timeout 300 npm run build

BUILD_EXIT_CODE=$?

# Clean up temporary config
rm -f next.config.cloud.js

if [ $BUILD_EXIT_CODE -eq 0 ]; then
    echo "✅ Build completed successfully!"
    
    # Show build size information
    echo "📊 Build size information:"
    du -sh .next 2>/dev/null || echo "Build size: Unable to calculate"
    
    echo "🎉 Cloud build optimization complete!"
    echo "💡 To start the application, run: npm start"
else
    echo "❌ Build failed with exit code: $BUILD_EXIT_CODE"
    
    if [ $BUILD_EXIT_CODE -eq 124 ]; then
        echo "⏰ Build timed out after 5 minutes"
        echo "💡 Try running with even more aggressive optimizations:"
        echo "   NODE_OPTIONS='--max-old-space-size=2048' npm run build:cloud"
    fi
    
    exit $BUILD_EXIT_CODE
fi