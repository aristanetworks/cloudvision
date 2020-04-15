module.exports = {
  cacheDirectory: '.jest-cache',
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
  coverageReporters: ['html', 'lcov'],
  collectCoverageFrom: [
    '**/*.ts',
    '!**/node_modules/**',
    '!**/lib/**',
    '!**/es/**',
    '!**/dist/**',
    '!**/coverage/**',
    '!**/*.spec.ts',
    '!**/*.config.js',
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  roots: ['<rootDir>/test', '<rootDir>/src'],
  setupFiles: ['<rootDir>/test/websocket-setup.ts'],
};
