/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/tests'],
    testMatch: ['**/*.test.ts'],
    moduleFileExtensions: ['ts', 'js', 'json'],
    setupFiles: ['dotenv/config'],
    setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
    testTimeout: 10000,
    verbose: true,
    transformIgnorePatterns: [],
    transform: {
        '^.+\\.tsx?$': ['ts-jest', { isolatedModules: true }],
        '^.+\\.jsx?$': 'babel-jest'
    },
    maxWorkers: 1,  // run tests serially to avoid db conflicts
};
