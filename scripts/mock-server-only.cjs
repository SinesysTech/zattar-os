// Mock 'server-only' module for script execution outside Next.js
// Usage: npx tsx --require ./scripts/mock-server-only.cjs your-script.ts
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Module = require('module');
const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === 'server-only') return {};
  return originalLoad(request, parent, isMain);
};
