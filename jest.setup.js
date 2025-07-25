// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Learn more: https://github.com/testing-library/jest-dom
// import '@testing-library/jest-dom/extend-expect';

// Mock the environment variables
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

// Polyfill for Next.js API routes in Node environment
if (typeof global.Request === 'undefined') {
    const { Request, Response, Headers, fetch } = require('undici');
    global.Request = Request;
    global.Response = Response;
    global.Headers = Headers;
    global.fetch = fetch;
}

// Mock FormData for file upload tests
if (typeof global.FormData === 'undefined') {
    global.FormData = require('form-data');
}

// Mock File for file upload tests
if (typeof global.File === 'undefined') {
    global.File = class File {
        constructor(chunks, filename, options = {}) {
            this.name = filename;
            this.type = options.type || '';
            this.size = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
            this.lastModified = Date.now();
        }

        async arrayBuffer() {
            return Buffer.concat(this.chunks);
        }
    };
}