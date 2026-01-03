/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.tsx',
    '**/tests/**/*.test.ts',
    '**/tests/**/*.test.tsx',
    '**/*.test.ts',
    '**/*.test.tsx',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(platejs|@platejs|uuid|@ai-sdk|remark-gfm|remark-math)/)',
  ],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.test.json',
      useESM: true,
    }],
  },
  setupFilesAfterEnv: ['<rootDir>/src/testing/setup.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: [
    'src/features/**/*.{ts,tsx}',
    'src/components/**/*.{ts,tsx}',
    'src/hooks/**/*.{ts,tsx}',
    'src/lib/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/index.ts',
    '!**/types.ts',
    '!src/testing/**',
    '!**/node_modules/**',
  ],
  // Configuração para property-based testing com fast-check
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    'src/features/**/domain.ts': {
      statements: 90,
    },
    'src/features/**/service.ts': {
      statements: 90,
    },
    // Thresholds específicos para lib/
    'src/lib/formatters.ts': {
      statements: 95,
      branches: 90,
      functions: 95,
      lines: 95,
    },
    'src/lib/utils.ts': {
      statements: 95,
      branches: 90,
      functions: 95,
      lines: 95,
    },
    'src/lib/safe-action.ts': {
      statements: 90,
      branches: 85,
      functions: 90,
      lines: 90,
    },
    'src/lib/auth/*.ts': {
      statements: 85,
      branches: 80,
      functions: 85,
      lines: 85,
    },
    'src/lib/redis/*.ts': {
      statements: 85,
      branches: 80,
      functions: 85,
      lines: 85,
    },
  },
  // globals configuration moved to transform
};

module.exports = config;
