#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const THRESHOLDS = {
  mainChunk: 500 * 1024, // 500KB
  totalSize: 5 * 1024 * 1024, // 5MB
  chunkCount: 50, // Máximo de chunks
};

const buildDir = path.join(process.cwd(), '.next');
const statsFile = path.join(buildDir, 'build-manifest.json');

if (!fs.existsSync(statsFile)) {
  console.error('❌ Build manifest não encontrado. Execute npm run build primeiro.');
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(statsFile, 'utf8'));
const pages = manifest.pages;

let totalSize = 0;
let mainChunkSize = 0;
let chunkCount = 0;

for (const [page, chunks] of Object.entries(pages)) {
  for (const chunk of chunks) {
    const chunkPath = path.join(buildDir, chunk);
    if (fs.existsSync(chunkPath)) {
      const size = fs.statSync(chunkPath).size;
      totalSize += size;
      chunkCount++;

      if (page === '/_app') {
        mainChunkSize += size;
      }
    }
  }
}

console.log('📊 Build Performance Report\n');
console.log(`Total Size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
console.log(`Main Chunk: ${(mainChunkSize / 1024).toFixed(2)} KB`);
console.log(`Chunk Count: ${chunkCount}`);
console.log('');

let failed = false;

if (mainChunkSize > THRESHOLDS.mainChunk) {
  console.error(`❌ Main chunk excede threshold: ${(mainChunkSize / 1024).toFixed(2)} KB > ${THRESHOLDS.mainChunk / 1024} KB`);
  failed = true;
}

if (totalSize > THRESHOLDS.totalSize) {
  console.error(`❌ Total size excede threshold: ${(totalSize / 1024 / 1024).toFixed(2)} MB > ${THRESHOLDS.totalSize / 1024 / 1024} MB`);
  failed = true;
}

if (chunkCount > THRESHOLDS.chunkCount) {
  console.warn(`⚠️  Chunk count alto: ${chunkCount} > ${THRESHOLDS.chunkCount}`);
}

if (!failed) {
  console.log('✅ Build performance dentro dos thresholds');
  process.exit(0);
} else {
  console.error('\n❌ Build performance fora dos thresholds');
  process.exit(1);
}
