module.exports = {
  cacheDirectory: '.jest-cache',
  coverageThreshold: {
    global: {
      branches: 91,
      functions: 96,
      lines: 95,
      statements: 95,
    },
  },
  coverageReporters: ['html', 'lcov'],
  collectCoverageFrom: [
    '**/*.js',
    '!**/node_modules/**',
    '!**/lib/**',
    '!**/es/**',
    '!**/dist/**',
    '!**/coverage/**',
    '!**/*.spec.js',
    '!**/*.config.js',
  ],
  moduleFileExtensions: ['js'],
  roots: ['<rootDir>/test', '<rootDir>/src'],
  setupFiles: ['<rootDir>/test/encoder-setup.js'],
};
