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
  coverageReporters: [
    'html',
  ],
  moduleFileExtensions: ['js'],
  roots: [
    '<rootDir>/test',
    '<rootDir>/src',
  ],
  setupFiles: [
    '<rootDir>/test/websocket-setup.js',
  ],
};
