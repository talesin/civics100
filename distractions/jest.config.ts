/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^@src/(.*)$': '<rootDir>/src/$1',
    '^@test/(.*)$': '<rootDir>/test/$1',
    '^@data/(.*)$': '<rootDir>/data/$1'
    // '^civics2json/Questions$': '<rootDir>/../civics2json/dist/Questions.js',
    // '^civics2json$': '<rootDir>/../civics2json/dist/types.js'
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
