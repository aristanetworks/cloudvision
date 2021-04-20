module.exports = {
  cacheDirectory: '.jest-cache',
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
  },
  coverageReporters: ['html', 'lcov'],
  collectCoverageFrom: [
    '**/*.ts',
    '!src/index.ts',
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
};
