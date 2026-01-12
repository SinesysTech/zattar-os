#!/usr/bin/env node
/**
 * Build Performance Validator
 *
 * Validates build performance against configurable thresholds.
 * Supports strict mode (fail on threshold exceeded) and warn mode (only warn).
 *
 * Usage:
 *   node scripts/validate-build-performance.js [options]
 *
 * Options:
 *   --strict    Exit with error code if thresholds are exceeded
 *   --warn      Only warn, don't fail (default)
 *   --json      Output results as JSON
 *   --help      Show help
 */

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

// ============================================================================
// CONFIGURABLE THRESHOLDS
// ============================================================================
function envNumber(name, fallback) {
  const raw = process.env[name];
  if (raw == null || raw === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function getBundleSizeMetric() {
  const raw = (process.env.BUNDLE_SIZE_METRIC || "raw").toLowerCase().trim();
  if (raw === "gzip" || raw === "brotli" || raw === "raw") return raw;
  return "raw";
}

function getBrotliQuality() {
  const raw = process.env.BUNDLE_BROTLI_QUALITY;
  if (raw == null || raw === "") return 4;
  const n = Number(raw);
  if (!Number.isFinite(n)) return 4;
  return Math.max(0, Math.min(11, Math.floor(n)));
}

function gzipSize(buffer) {
  return zlib.gzipSync(buffer).length;
}

function brotliSize(buffer) {
  return zlib
    .brotliCompressSync(buffer, {
      params: {
        [zlib.constants.BROTLI_PARAM_QUALITY]: getBrotliQuality(),
      },
    })
    .length;
}

const THRESHOLDS = {
  // Bundle size thresholds
  // NOTE: This repo is a large Next.js app; totals are measured as the sum of
  // .js assets under .next/static, using the metric selected by BUNDLE_SIZE_METRIC.
  mainChunk: envNumber("BUNDLE_MAIN_CHUNK_MAX_KB", 2048) * 1024, // default: 2MB
  totalSize: envNumber("BUNDLE_TOTAL_MAX_MB", 55) * 1024 * 1024, // default: 55MB
  chunkCount: envNumber("BUNDLE_CHUNK_COUNT_MAX", 1200), // default: 1200 chunks

  // Build time thresholds
  buildTime: envNumber("BUILD_TIME_MAX_MIN", 15) * 60 * 1000, // default: 15 minutes

  // Cache thresholds
  // This hit rate is a rough estimate; CI often runs from a cold cache.
  cacheHitRate: envNumber("BUILD_CACHE_HIT_RATE_MIN", 0.15), // default: 15%

  // Individual chunk thresholds
  singleChunkMax: envNumber("BUNDLE_SINGLE_CHUNK_MAX_MB", 4) * 1024 * 1024, // default: 4MB
};

// ============================================================================
// ANSI COLORS
// ============================================================================
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

// ============================================================================
// PARSE ARGUMENTS
// ============================================================================
const args = {
  strict: process.argv.includes("--strict"),
  warn: process.argv.includes("--warn"),
  json: process.argv.includes("--json"),
  help: process.argv.includes("--help"),
};

// Default to warn mode if neither specified
if (!args.strict && !args.warn) {
  args.warn = true;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)}MB`;
}

function formatDuration(ms) {
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}m ${seconds}s`;
}

function log(msg, color = colors.reset) {
  if (!args.json) {
    console.log(`${color}${msg}${colors.reset}`);
  }
}

function showHelp() {
  console.log(`
Build Performance Validator

Validates build performance against configurable thresholds.

Usage:
  node scripts/validate-build-performance.js [options]

Options:
  --strict    Exit with error code if thresholds are exceeded
  --warn      Only warn, don't fail (default)
  --json      Output results as JSON
  --help      Show this help message

Thresholds:
  Main Chunk:     ${formatBytes(THRESHOLDS.mainChunk)}
  Total Size:     ${formatBytes(THRESHOLDS.totalSize)} (metric: ${getBundleSizeMetric()})
  Chunk Count:    ${THRESHOLDS.chunkCount}
  Build Time:     ${formatDuration(THRESHOLDS.buildTime)}
  Cache Hit Rate: ${(THRESHOLDS.cacheHitRate * 100).toFixed(0)}%
  Single Chunk:   ${formatBytes(THRESHOLDS.singleChunkMax)}
`);
}

// ============================================================================
// MAIN VALIDATION LOGIC
// ============================================================================
function validateFromBuildManifest() {
  const buildDir = path.join(process.cwd(), ".next");
  const manifestPath = path.join(buildDir, "build-manifest.json");

  let pages = {};
  if (!fs.existsSync(manifestPath)) {
    pages = {};
  } else {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    pages = manifest.pages || {};
  }

  const metric = getBundleSizeMetric();

  let totalRawSize = 0;
  let totalGzipSize = 0;
  let totalBrotliSize = 0;
  let mainChunkSize = 0;
  let chunkCount = 0;
  const oversizedChunks = [];

  // Analyze static directory
  const staticDir = path.join(buildDir, "static");
  if (fs.existsSync(staticDir)) {
    const analyzeDir = (dir, prefix = "") => {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const itemPath = path.join(dir, item);
        const stat = fs.statSync(itemPath);
        if (stat.isDirectory()) {
          analyzeDir(itemPath, `${prefix}${item}/`);
        } else if (item.endsWith(".js")) {
          const size = stat.size;
          totalRawSize += size;
          chunkCount++;

          let comparableSize = size;
          if (metric === "gzip" || metric === "brotli") {
            try {
              const buf = fs.readFileSync(itemPath);
              const gzip = gzipSize(buf);
              const brotli = brotliSize(buf);
              totalGzipSize += gzip;
              totalBrotliSize += brotli;
              comparableSize = metric === "gzip" ? gzip : brotli;
            } catch (_e) {
              // Best-effort: if compression fails, fall back to raw size.
              comparableSize = size;
            }
          }

          if (comparableSize > THRESHOLDS.singleChunkMax) {
            oversizedChunks.push({
              name: `${prefix}${item}`,
              size: comparableSize,
              sizeFormatted: formatBytes(comparableSize),
            });
          }
        }
      }
    };
    analyzeDir(staticDir);
  }

  // Analyze page chunks
  for (const [page, chunks] of Object.entries(pages)) {
    for (const chunk of chunks) {
      const chunkPath = path.join(buildDir, chunk);
      if (fs.existsSync(chunkPath)) {
        const size = fs.statSync(chunkPath).size;
        if (page === "/_app" || page === "/layout") {
          mainChunkSize += size;
        }
      }
    }
  }

  const totalSize =
    metric === "brotli"
      ? totalBrotliSize
      : metric === "gzip"
        ? totalGzipSize
        : totalRawSize;

  return {
    success: true,
    metrics: {
      totalSize,
      totalRawSize,
      totalGzipSize,
      totalBrotliSize,
      bundleSizeMetric: metric,
      mainChunkSize,
      chunkCount,
      oversizedChunks,
    },
  };
}

function validateFromPerformanceReport() {
  const reportPath = path.join(
    process.cwd(),
    "scripts",
    "results",
    "build-performance",
    "latest.json"
  );

  if (!fs.existsSync(reportPath)) {
    return {
      success: false,
      error: "Performance report not found. Run analyze:build-performance first.",
      metrics: null,
    };
  }

  try {
    const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));

    const metric = getBundleSizeMetric();
    const pickTotalSize = () => {
      if (metric === "brotli") return report.bundle?.totalBrotliSize;
      if (metric === "gzip") return report.bundle?.totalGzipSize;
      return report.bundle?.totalSize;
    };

    const mapLargestChunks = () => {
      const chunks = report.bundle?.largestChunks || [];
      if (metric === "brotli") {
        return chunks
          .filter((c) => (c.brotliSize ?? c.size) > THRESHOLDS.singleChunkMax)
          .map((c) => ({
            ...c,
            size: c.brotliSize ?? c.size,
            sizeFormatted: c.brotliSizeFormatted || c.sizeFormatted,
          }));
      }
      if (metric === "gzip") {
        return chunks
          .filter((c) => (c.gzipSize ?? c.size) > THRESHOLDS.singleChunkMax)
          .map((c) => ({
            ...c,
            size: c.gzipSize ?? c.size,
            sizeFormatted: c.gzipSizeFormatted || c.sizeFormatted,
          }));
      }
      return chunks.filter((c) => c.size > THRESHOLDS.singleChunkMax);
    };

    return {
      success: true,
      metrics: {
        totalSize: pickTotalSize() || 0,
        mainChunkSize: report.bundle?.mainChunk || 0,
        chunkCount: report.bundle?.chunkCount || 0,
        buildTime: report.total?.duration || 0,
        cacheHitRate: report.cache?.hitRate || 0,
        oversizedChunks:
          mapLargestChunks() || [],
      },
    };
  } catch (e) {
    return {
      success: false,
      error: `Failed to parse performance report: ${e.message}`,
      metrics: null,
    };
  }
}

function runValidation() {
  const results = {
    timestamp: new Date().toISOString(),
    mode: args.strict ? "strict" : "warn",
    thresholds: THRESHOLDS,
    violations: [],
    warnings: [],
    metrics: null,
    passed: true,
  };

  // Try to load from performance report first, fall back to build manifest
  let validation = validateFromPerformanceReport();
  if (!validation.success) {
    validation = validateFromBuildManifest();
  }

  if (!validation.success) {
    log(`\n${colors.red}[ERROR]${colors.reset} ${validation.error}`);
    results.passed = false;
    results.error = validation.error;
    return results;
  }

  const metrics = validation.metrics;
  results.metrics = metrics;

  log(`\n${colors.cyan}${colors.bright}=== Build Performance Validation ===${colors.reset}\n`);

  // Validate main chunk size
  if (metrics.mainChunkSize > THRESHOLDS.mainChunk) {
    const msg = `Main chunk exceeds threshold: ${formatBytes(metrics.mainChunkSize)} > ${formatBytes(THRESHOLDS.mainChunk)}`;
    results.violations.push({ type: "mainChunk", message: msg });
    log(`${colors.red}[FAIL]${colors.reset} ${msg}`);
  } else {
    log(`${colors.green}[PASS]${colors.reset} Main chunk: ${formatBytes(metrics.mainChunkSize)} (threshold: ${formatBytes(THRESHOLDS.mainChunk)})`);
  }

  // Validate total size
  if (metrics.totalSize > THRESHOLDS.totalSize) {
    const msg = `Total size (${getBundleSizeMetric()}) exceeds threshold: ${formatBytes(metrics.totalSize)} > ${formatBytes(THRESHOLDS.totalSize)}`;
    results.violations.push({ type: "totalSize", message: msg });
    log(`${colors.red}[FAIL]${colors.reset} ${msg}`);
  } else {
    log(`${colors.green}[PASS]${colors.reset} Total size (${getBundleSizeMetric()}): ${formatBytes(metrics.totalSize)} (threshold: ${formatBytes(THRESHOLDS.totalSize)})`);
  }

  // Validate chunk count
  if (metrics.chunkCount > THRESHOLDS.chunkCount) {
    const msg = `Chunk count exceeds threshold: ${metrics.chunkCount} > ${THRESHOLDS.chunkCount}`;
    results.warnings.push({ type: "chunkCount", message: msg });
    log(`${colors.yellow}[WARN]${colors.reset} ${msg}`);
  } else {
    log(`${colors.green}[PASS]${colors.reset} Chunk count: ${metrics.chunkCount} (threshold: ${THRESHOLDS.chunkCount})`);
  }

  // Validate build time (if available)
  if (metrics.buildTime) {
    if (metrics.buildTime > THRESHOLDS.buildTime) {
      const msg = `Build time exceeds threshold: ${formatDuration(metrics.buildTime)} > ${formatDuration(THRESHOLDS.buildTime)}`;
      results.warnings.push({ type: "buildTime", message: msg });
      log(`${colors.yellow}[WARN]${colors.reset} ${msg}`);
    } else {
      log(`${colors.green}[PASS]${colors.reset} Build time: ${formatDuration(metrics.buildTime)} (threshold: ${formatDuration(THRESHOLDS.buildTime)})`);
    }
  }

  // Validate cache hit rate (if available)
  if (metrics.cacheHitRate !== undefined) {
    if (metrics.cacheHitRate < THRESHOLDS.cacheHitRate) {
      const msg = `Cache hit rate below threshold: ${(metrics.cacheHitRate * 100).toFixed(1)}% < ${(THRESHOLDS.cacheHitRate * 100).toFixed(0)}%`;
      results.warnings.push({ type: "cacheHitRate", message: msg });
      log(`${colors.yellow}[WARN]${colors.reset} ${msg}`);
    } else {
      log(`${colors.green}[PASS]${colors.reset} Cache hit rate: ${(metrics.cacheHitRate * 100).toFixed(1)}% (threshold: ${(THRESHOLDS.cacheHitRate * 100).toFixed(0)}%)`);
    }
  }

  // Report oversized chunks
  if (metrics.oversizedChunks && metrics.oversizedChunks.length > 0) {
    log(`\n${colors.yellow}[WARN]${colors.reset} ${metrics.oversizedChunks.length} chunk(s) exceed ${formatBytes(THRESHOLDS.singleChunkMax)}:`);
    for (const chunk of metrics.oversizedChunks) {
      log(`  - ${chunk.name}: ${chunk.sizeFormatted || formatBytes(chunk.size)}`);
      results.warnings.push({
        type: "oversizedChunk",
        message: `Chunk ${chunk.name} is ${chunk.sizeFormatted || formatBytes(chunk.size)}`,
      });
    }
  }

  // Summary
  log("");
  if (results.violations.length > 0) {
    results.passed = false;
    log(`${colors.red}${colors.bright}[RESULT] ${results.violations.length} violation(s) found${colors.reset}`);
  } else if (results.warnings.length > 0) {
    log(`${colors.yellow}${colors.bright}[RESULT] Passed with ${results.warnings.length} warning(s)${colors.reset}`);
  } else {
    log(`${colors.green}${colors.bright}[RESULT] All thresholds passed${colors.reset}`);
  }

  return results;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================
if (args.help) {
  showHelp();
  process.exit(0);
}

const results = runValidation();

if (args.json) {
  console.log(JSON.stringify(results, null, 2));
}

// Exit with appropriate code
if (args.strict && !results.passed) {
  process.exit(1);
} else if (args.strict && results.violations.length > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
