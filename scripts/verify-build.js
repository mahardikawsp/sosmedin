#!/usr/bin/env node

// Build verification script
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

console.log('🔍 Verifying build output...\n');

const checks = [
    {
        name: 'Next.js build directory',
        path: '.next',
        type: 'directory',
        required: true
    },
    {
        name: 'Prisma client',
        path: 'node_modules/.prisma/client',
        type: 'directory',
        required: true
    },
    {
        name: 'Prisma client index',
        path: 'node_modules/.prisma/client/index.js',
        type: 'file',
        required: true
    },
    {
        name: 'Standalone server',
        path: '.next/standalone/server.js',
        type: 'file',
        required: false
    },
    {
        name: 'Static assets',
        path: '.next/static',
        type: 'directory',
        required: true
    },
    {
        name: 'Build manifest',
        path: '.next/build-manifest.json',
        type: 'file',
        required: true
    },
    {
        name: 'Moderation page',
        path: '.next/server/app/moderation/page.js',
        type: 'file',
        required: true
    },
    {
        name: 'API routes',
        path: '.next/server/app/api',
        type: 'directory',
        required: true
    }
];

let allPassed = true;
let buildSize = 0;

for (const check of checks) {
    const fullPath = path.join(projectRoot, check.path);
    const exists = fs.existsSync(fullPath);

    if (exists) {
        const stats = fs.statSync(fullPath);
        const size = check.type === 'directory' ?
            getDirSize(fullPath) : stats.size;
        buildSize += size;

        console.log(`✅ ${check.name}: ${formatBytes(size)}`);
    } else {
        const status = check.required ? '❌' : '⚠️';
        console.log(`${status} ${check.name}: Missing${check.required ? ' (REQUIRED)' : ' (Optional)'}`);
        if (check.required) allPassed = false;
    }
}

console.log(`\n📊 Total build size: ${formatBytes(buildSize)}`);

// Check for common issues
console.log('\n🔧 Checking for common issues...');

// Check if build is too large
if (buildSize > 500 * 1024 * 1024) { // 500MB
    console.log('⚠️  Build size is quite large (>500MB). Consider optimizing.');
} else {
    console.log('✅ Build size is reasonable.');
}

// Check for source maps in production
const sourceMapsExist = fs.existsSync(path.join(projectRoot, '.next/static/chunks')) &&
    fs.readdirSync(path.join(projectRoot, '.next/static/chunks'))
        .some(file => file.endsWith('.map'));

if (sourceMapsExist) {
    console.log('⚠️  Source maps detected in production build. This increases size.');
} else {
    console.log('✅ No source maps in production build.');
}

// Final result
console.log('\n🎯 Build Verification Result:');
if (allPassed) {
    console.log('✅ Build verification passed! The application should start correctly.');
    console.log('\n🚀 To start the application:');
    console.log('   npm start');
    console.log('\n🌐 The moderation dashboard will be available at:');
    console.log('   http://localhost:3000/moderation');
} else {
    console.log('❌ Build verification failed. Some required files are missing.');
    console.log('\n💡 Try rebuilding with:');
    console.log('   npm run build:cloud');
}

function getDirSize(dirPath) {
    let size = 0;
    try {
        const files = fs.readdirSync(dirPath);
        for (const file of files) {
            const filePath = path.join(dirPath, file);
            const stats = fs.statSync(filePath);
            if (stats.isDirectory()) {
                size += getDirSize(filePath);
            } else {
                size += stats.size;
            }
        }
    } catch (error) {
        // Ignore errors for inaccessible directories
    }
    return size;
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}