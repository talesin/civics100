/* eslint-env jest */
// Official AsyncStorage jest mock (in-memory store; all methods are jest.fn's,
// so tests can both round-trip data and assert write-through).
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
)
