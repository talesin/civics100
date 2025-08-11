/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  
  // Only run tests from source files, exclude dist
  testMatch: [
    '<rootDir>/test/**/*.test.ts'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/'
  ],
  
  moduleNameMapper: {
    '^civics2json/Questions$': '<rootDir>/../civics2json/src/Questions.ts',
    '^civics2json$': '<rootDir>/../civics2json/src/types.ts',
    '^@data/civics-questions\.json$': '<rootDir>/../civics2json/data/civics-questions.json',
    '^@src/(.*)$': '<rootDir>/src/$1',
    '^@test/(.*)$': '<rootDir>/test/$1',
    '^@data/(.*)$': '<rootDir>/data/$1'
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          moduleResolution: 'node'
        }
      }
    ]
  },
  // Automatically clear mock calls, instances, contexts and results before every test
  clearMocks: true
}
