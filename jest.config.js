const nextJest = require('next/jest');

const createJestConfig = nextJest({
    // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
    dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    testEnvironment: 'jest-environment-jsdom',
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    testEnvironmentOptions: {
        customExportConditions: [''],
    },
    projects: [
        {
            displayName: 'client',
            testEnvironment: 'jest-environment-jsdom',
            testMatch: ['<rootDir>/src/components/**/*.test.{js,ts,tsx}', '<rootDir>/src/lib/**/*.test.{js,ts}'],
        },
        {
            displayName: 'server',
            testEnvironment: 'jest-environment-node',
            testMatch: ['<rootDir>/src/app/api/**/*.test.{js,ts}'],
            setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
            moduleNameMapper: {
                '^@/(.*)$': '<rootDir>/src/$1',
            },
        },
    ],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);