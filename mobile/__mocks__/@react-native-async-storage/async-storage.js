/**
 * Jest mock for @react-native-async-storage/async-storage.
 * In-memory store, reset between tests via setupFiles.
 */
let store = {};

function reset() {
  store = {};
}

const AsyncStorage = {
  getItem: jest.fn(async (key) => (key in store ? store[key] : null)),
  setItem: jest.fn(async (key, value) => {
    store[key] = String(value);
  }),
  removeItem: jest.fn(async (key) => {
    delete store[key];
  }),
  multiRemove: jest.fn(async (keys) => {
    keys.forEach((k) => delete store[k]);
  }),
  getAllKeys: jest.fn(async () => Object.keys(store)),
  clear: jest.fn(async () => {
    reset();
  }),
  __resetForTests: reset,
};

module.exports = AsyncStorage;
module.exports.default = AsyncStorage;
