# Cloud Deployment Guide for Low-Resource Environments

This guide helps you deploy the SosMedin application on cloud servers with limited resources (1 CPU, 4GB RAM).

## Quick Start

For immediate deployment on resource-constrained servers:

```bash
# Use the optimized cloud build script
./scripts/build-cloud.sh

# Or use the npm script
npm run build:cloud
```

## Build Optimization Strategies

### 1. Memory-Optimized Build

```bash
# Set Node.js memory limits
export NODE_OPTIONS="--max-old-space-size=3072 --max-semi-space-size=128"

# Use the low-memory build
npm run build:low-memory
```

### 2. Environment Variables

Set these environment variables for optimal cloud builds:

```bash
export NODE_ENV=production
export BUILD_STANDALONE=true
export NEXT_TELEMETRY_DISABLED=1
```

### 3. Build Timeout Solutions

If you're experiencing build timeouts:

#### Option A: Increase timeout (if possible)
```bash
timeout 600 npm run build:cloud  # 10 minutes
```

#### Option B: Use staged building
```bash
# Step 1: Generate Prisma client
npx prisma generate

# Step 2: Build with minimal config
NODE_OPTIONS="--max-old-space-size=2048" npm run build:cloud
```

#### Option C: Use Docker multi-stage build
```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build with memory limits
ENV NODE_OPTIONS="--max-old-space-size=3072"
RUN npm run build:cloud

# Production stage
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy built application
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
```

## Performance Optimizations

### 1. Disable Development Features

The optimized config automatically disables:
- Source maps in production
- React Strict Mode during build
- CSS optimization (memory-intensive)
- Image optimization during build
- Worker threads
- ESLint and TypeScript checking

### 2. Chunk Size Optimization

Smaller chunks reduce memory usage:
- Maximum chunk size: 200KB
- Simplified vendor bundling
- Reduced parallelism

### 3. Component Optimizations

The moderation components have been optimized with:
- `useMemo` for expensive computations
- `useCallback` for stable function references
- Reduced re-renders

## Troubleshooting

### Build Fails with "JavaScript heap out of memory"

1. **Increase Node.js memory limit:**
   ```bash
   NODE_OPTIONS="--max-old-space-size=4096" npm run build:cloud
   ```

2. **Use swap space (Linux):**
   ```bash
   sudo fallocate -l 2G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   ```

3. **Build in stages:**
   ```bash
   # Clear cache first
   rm -rf .next node_modules/.cache
   
   # Install with minimal cache
   npm ci --prefer-offline
   
   # Build with timeout
   timeout 600 npm run build:cloud
   ```

### Build Times Out

1. **Use the cloud build script with timeout:**
   ```bash
   timeout 300 ./scripts/build-cloud.sh
   ```

2. **Reduce build complexity:**
   - Temporarily remove non-essential pages
   - Use static exports for some pages
   - Disable image optimization

3. **Use external build services:**
   - GitHub Actions with larger runners
   - Vercel/Netlify build services
   - Docker builds on local machine

### Memory Usage During Runtime

After successful build, optimize runtime memory:

```bash
# Start with memory limits
NODE_OPTIONS="--max-old-space-size=2048" npm start
```

## Cloud Provider Specific Tips

### DigitalOcean Droplets
- Use at least 2GB RAM droplet for building
- Enable swap space
- Use build caching

### AWS EC2
- Use t3.small or larger for builds
- Consider using CodeBuild for building
- Use EFS for persistent node_modules cache

### Google Cloud Platform
- Use e2-small or larger
- Enable swap on Compute Engine
- Use Cloud Build for complex builds

### Heroku
- Use at least Standard-1X dyno for builds
- Set build timeout in app.json
- Use build cache

## Monitoring Build Performance

```bash
# Monitor memory usage during build
npm run build:cloud & 
PID=$!
while kill -0 $PID 2>/dev/null; do
    ps -p $PID -o pid,vsz,rss,pcpu,time
    sleep 10
done
```

## Alternative Deployment Strategies

If builds continue to fail:

1. **Pre-built deployment:**
   - Build locally or on a larger machine
   - Deploy the `.next` folder directly
   - Use `npm run start` on the server

2. **Static export:**
   - Use `next export` for static sites
   - Deploy to CDN/static hosting
   - Requires API route modifications

3. **Serverless deployment:**
   - Use Vercel, Netlify, or similar
   - Automatic build optimization
   - No server resource constraints

## Success Indicators

A successful cloud build should:
- Complete within 5-10 minutes
- Use less than 3GB RAM peak
- Generate a `.next/standalone` folder
- Show "Build completed successfully!" message

## Support

If you continue experiencing build issues:
1. Check the build logs for specific error messages
2. Try the staged building approach
3. Consider using a larger instance temporarily for builds
4. Use external build services for complex deployments