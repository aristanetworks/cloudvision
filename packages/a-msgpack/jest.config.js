module.exports = {
  cacheDirectory: '.jest-cache',
  coverageThreshold: {
    global: {
      branches: 98.94,
      functions: 100,
      lines: 99.22,
      statements: 99.25,
    },
  },
  coverageReporters: ['html', 'lcov'],
  collectCoverageFrom: [
    '**/*.ts',
    '!src/index.ts',
    '!src/utils/utf8.ts',
    '!src/utils/prettyByte.ts',
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
  setupFiles: ['<rootDir>/test/encoder-setup.js'],
};
