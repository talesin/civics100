import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testMatch: ['**/__tests__/**/*.+(ts|tsx|js)', '**/*.(test|spec).+(ts|tsx|js)'],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx'
        }
      }
    ]
  },
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts', '!src/**/index.ts'],
  setupFiles: ['<rootDir>/test/react-patch.js'],
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^questionnaire$': '<rootDir>/test/mocks/questionnaire.ts'
  },
  testTimeout: 10000,
  // Ensure consistent React resolution across monorepo
  moduleDirectories: ['node_modules', '<rootDir>/../../node_modules']
}

export default config
