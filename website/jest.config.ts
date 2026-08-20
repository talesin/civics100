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
    // Route the source-shipped shared package straight at its TS source so ts-jest
    // transforms it (its exports map is ESM-only, which jest-resolve can't consume).
    '^app$': '<rootDir>/../packages/app/src/index.ts',
    '^app/(.*)$': '<rootDir>/../packages/app/src/$1',
    // Same ESM-only-exports problem: civics2json value imports (StateSelector's
    // StatesByAbbreviation) reach jest-resolve once app components use them.
    '^civics2json$': '<rootDir>/../packages/civics2json/src/types.ts',
    '^questionnaire$': '<rootDir>/test/mocks/questionnaire.ts',
    '^questionnaire/data$': '<rootDir>/test/mocks/questionnaire-data.ts',
    '^slash$': '<rootDir>/test/mocks/slash.js',
    '\\.(css|less|scss|sass)$': '<rootDir>/test/mocks/styleMock.js'
  },
  testTimeout: 10000,
  // Ensure consistent React resolution across monorepo
  moduleDirectories: ['node_modules', '<rootDir>/../node_modules']
}

export default config
