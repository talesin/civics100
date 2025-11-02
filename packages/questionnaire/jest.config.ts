/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: "ts-jest",
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    "^@src/(.*)$": "<rootDir>/src/$1",
    "^@test/(.*)$": "<rootDir>/test/$1",
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: {
          moduleResolution: "node",
        },
      },
    ],
  },
  // Automatically clear mock calls, instances, contexts and results before every test
  clearMocks: true,
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
};
