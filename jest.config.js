/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
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
    'node_modules/(?!(platejs|@platejs)/)',
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
    'backend/**/*.ts',
    'app/api/**/*.ts',
    'components/**/*.tsx',
    'hooks/**/*.ts',
    'hooks/**/*.tsx',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  // Configuração para property-based testing com fast-check
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
};

module.exports = config;
