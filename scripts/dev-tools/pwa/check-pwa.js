const fs = require('fs');
const path = require('path');

const swPath = path.join(__dirname, '..', 'public', 'sw.js');

function exists(p) {
  try {
    fs.accessSync(p, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function read(p) {
  try {
    return fs.readFileSync(p, 'utf8');
  } catch {
    return null;
  }
}

if (!exists(swPath)) {
  console.log('OK: No manual service worker present before build.');
  process.exit(0);
}

const content = read(swPath) || '';
const isWorkbox = /self\.__WB_MANIFEST|workbox|precacheAndRoute|skipWaiting|clientsClaim/.test(content);

if (isWorkbox) {
  console.log('OK: Detected next-pwa generated Workbox service worker.');
  process.exit(0);
}

console.error('ERROR: Found manual or empty public/sw.js before build. Remove it and rely on next-pwa.');
process.exit(1);
