/** @type {import('jest').Config} */

// Shared ESM packages that need to be transformed by ts-jest
const esmPackages = [
  '@lit-labs', '@lit', 'lit',
  'lodash-es',
  '@a2ui', '@copilotkit', '@copilotkitnext',
  'react-resizable-panels',
  'signal-utils',
].join('|');

const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.test.json',
      diagnostics: false,
    }],
  },
  testMatch: [
    '**/__tests__/**/*.test.(ts|tsx)',
    '**/*.test.(ts|tsx)',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/src/.*\\.e2e\\.',
  ],
  modulePathIgnorePatterns: ['<rootDir>/.next/'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  // Prevent worker crashes from Radix UI + fast-check property tests
  workerIdleMemoryLimit: '512MB',
  // Use jsdom for hook and component tests
  testEnvironmentOptions: {
    customExportConditions: [''],
  },
  // Override testEnvironment per file via @jest-environment docblock
  projects: [
    {
      displayName: 'node',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: [
        '<rootDir>/src/app/(authenticated)/**/__tests__/**/*.test.ts',
        '<rootDir>/src/lib/**/__tests__/**/*.test.ts',
      ],
      moduleNameMapper: {
        '^@copilotkit/react-core(.*)$': '<rootDir>/src/__mocks__/@copilotkit/react-core.js',
        '^radix-ui$': '<rootDir>/src/__mocks__/radix-ui.js',
        '^@/(.*)$': '<rootDir>/src/$1',
        '^server-only$': '<rootDir>/src/__mocks__/server-only.js',
        '^next/cache$': '<rootDir>/src/__mocks__/next-cache.js',
        '^next/headers$': '<rootDir>/src/__mocks__/next-headers.js',
      },
      setupFiles: ['<rootDir>/src/__mocks__/env-setup.js'],
      transformIgnorePatterns: [
        `/node_modules/(?!(${esmPackages})/)`
      ],
      transform: {
        '^.+\\.(ts|tsx|js|jsx|mjs)$': ['ts-jest', {
          tsconfig: '<rootDir>/tsconfig.test.json',
          diagnostics: false,
        }],
      },
    },
    {
      displayName: 'jsdom',
      preset: 'ts-jest',
      testEnvironment: 'jest-environment-jsdom',
      testEnvironmentOptions: {
        customExportConditions: ['node', 'require', 'default'],
      },
      setupFilesAfterEnv: ['<rootDir>/src/__mocks__/jest-dom-setup.ts'],
      setupFiles: ['<rootDir>/src/__mocks__/env-setup.js'],
      testMatch: [
        '<rootDir>/src/app/**/__tests__/**/*.test.ts',
        '<rootDir>/src/app/**/__tests__/**/*.test.tsx',
        '<rootDir>/src/components/**/__tests__/**/*.test.ts',
        '<rootDir>/src/components/**/__tests__/**/*.test.tsx',
        '<rootDir>/src/lib/**/__tests__/**/*.test.tsx',
        '<rootDir>/src/hooks/**/__tests__/**/*.test.tsx',
        '<rootDir>/src/providers/**/__tests__/**/*.test.tsx',
      ],
      moduleNameMapper: {
        '^@copilotkit/react-core(.*)$': '<rootDir>/src/__mocks__/@copilotkit/react-core.js',
        '^radix-ui$': '<rootDir>/src/__mocks__/radix-ui.js',
        '^@/(.*)$': '<rootDir>/src/$1',
        '^server-only$': '<rootDir>/src/__mocks__/server-only.js',
        '^next/cache$': '<rootDir>/src/__mocks__/next-cache.js',
        '^next/headers$': '<rootDir>/src/__mocks__/next-headers.js',
        // Mock ESM-only packages that Jest cannot transform
        '^uuid$': '<rootDir>/src/__mocks__/uuid.js',
        '^lodash-es$': 'lodash',
        // Mock CSS and static assets
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '\\.(png|jpg|jpeg|gif|svg|webp)$': '<rootDir>/src/__mocks__/fileMock.js',
      },
      transformIgnorePatterns: [
        `/node_modules/(?!(${esmPackages})/)`
      ],
      transform: {
        '^.+\\.(ts|tsx|js|jsx|mjs)$': ['ts-jest', {
          tsconfig: '<rootDir>/tsconfig.test.json',
          diagnostics: false,
        }],
      },
    },
  ],
};

module.exports = config;
