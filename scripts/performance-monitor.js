#!/usr/bin/env node

/**
 * Performance monitoring script for Sosmedin
 * Run with: node scripts/performance-monitor.js
 */

const { performance } = require('perf_hooks');
const fs = require('fs');
const path = require('path');

class PerformanceMonitor {
    constructor() {
        this.metrics = [];
        this.startTime = performance.now();
    }

    // Monitor API response times
    async monitorApiEndpoints() {
        const endpoints = [
            'http://localhost:3000/api/health',
            'http://localhost:3000/api/feed',
            'http://localhost:3000/api/posts',
            'http://localhost:3000/api/notifications',
        ];

        console.log('🔍 Monitoring API endpoints...\n');

        for (const endpoint of endpoints) {
            try {
                const start = performance.now();
                const response = await fetch(endpoint);
                const end = performance.now();
                const duration = end - start;

                const metric = {
                    endpoint,
                    status: response.status,
                    duration: Math.round(duration),
                    timestamp: new Date().toISOString(),
                };

                this.metrics.push(metric);

                const statusColor = response.status === 200 ? '✅' : '❌';
                const durationColor = duration < 500 ? '🟢' : duration < 1000 ? '🟡' : '🔴';

                console.log(`${statusColor} ${endpoint}`);
                console.log(`   Status: ${response.status}`);
                console.log(`   ${durationColor} Duration: ${duration.toFixed(2)}ms`);
                console.log('');
            } catch (error) {
                console.log(`❌ ${endpoint}`);
                console.log(`   Error: ${error.message}`);
                console.log('');
            }
        }
    }

    // Monitor bundle sizes
    async monitorBundleSizes() {
        console.log('📦 Analyzing bundle sizes...\n');

        const buildDir = path.join(process.cwd(), '.next');

        if (!fs.existsSync(buildDir)) {
            console.log('❌ Build directory not found. Run "npm run build" first.');
            return;
        }

        const staticDir = path.join(buildDir, 'static');

        if (fs.existsSync(staticDir)) {
            const analyzeDirectory = (dir, prefix = '') => {
                const files = fs.readdirSync(dir);

                files.forEach(file => {
                    const filePath = path.join(dir, file);
                    const stat = fs.statSync(filePath);

                    if (stat.isDirectory()) {
                        analyzeDirectory(filePath, `${prefix}${file}/`);
                    } else if (file.endsWith('.js') || file.endsWith('.css')) {
                        const sizeKB = (stat.size / 1024).toFixed(2);
                        const sizeColor = stat.size < 100000 ? '🟢' : stat.size < 500000 ? '🟡' : '🔴';

                        console.log(`${sizeColor} ${prefix}${file}: ${sizeKB} KB`);
                    }
                });
            };

            analyzeDirectory(staticDir);
        }
    }

    // Monitor memory usage
    monitorMemoryUsage() {
        console.log('💾 Memory usage:\n');

        const usage = process.memoryUsage();

        Object.entries(usage).forEach(([key, value]) => {
            const mb = (value / 1024 / 1024).toFixed(2);
            const color = value < 50 * 1024 * 1024 ? '🟢' : value < 100 * 1024 * 1024 ? '🟡' : '🔴';
            console.log(`${color} ${key}: ${mb} MB`);
        });

        console.log('');
    }

    // Generate performance report
    generateReport() {
        const reportPath = path.join(process.cwd(), 'performance-report.json');

        const report = {
            timestamp: new Date().toISOString(),
            duration: performance.now() - this.startTime,
            metrics: this.metrics,
            memory: process.memoryUsage(),
            nodeVersion: process.version,
            platform: process.platform,
        };

        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`📊 Performance report saved to: ${reportPath}`);
    }

    // Run all monitoring tasks
    async run() {
        console.log('🚀 Starting performance monitoring...\n');

        this.monitorMemoryUsage();
        await this.monitorApiEndpoints();
        await this.monitorBundleSizes();
        this.generateReport();

        console.log('✅ Performance monitoring completed!');
    }
}

// Run the monitor
if (require.main === module) {
    const monitor = new PerformanceMonitor();
    monitor.run().catch(console.error);
}

module.exports = PerformanceMonitor;