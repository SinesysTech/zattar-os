// Mock for uuid (ESM-only package)
let counter = 0;

module.exports = {
  v4: () => `mock-uuid-${++counter}`,
  v1: () => `mock-uuid-v1-${++counter}`,
  validate: () => true,
  NIL: '00000000-0000-0000-0000-000000000000',
  MAX: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
};
