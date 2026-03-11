module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/functions/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/functions/tsconfig.json',
      },
    ],
  },
  moduleNameMapper: {
    '^@nasna/shared$': '<rootDir>/shared/src/index.ts',
  },
  collectCoverage: false,
  collectCoverageFrom: [
    'functions/src/operationsMapApi.ts',
    'functions/src/payments.ts',
  ],
  coverageDirectory: '<rootDir>/coverage/functions',
  coverageReporters: ['text', 'json-summary', 'lcov'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
};
