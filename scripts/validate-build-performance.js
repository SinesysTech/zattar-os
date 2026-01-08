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

// ============================================================================
// CONFIGURABLE THRESHOLDS
// ============================================================================
const THRESHOLDS = {
  // Bundle size thresholds
  mainChunk: 500 * 1024, // 500KB - main app chunk
  totalSize: 5 * 1024 * 1024, // 5MB - total bundle size
  chunkCount: 50, // Maximum number of chunks

  // Build time thresholds
  buildTime: 10 * 60 * 1000, // 10 minutes in milliseconds

  // Cache thresholds
  cacheHitRate: 0.7, // 70% minimum cache hit rate

  // Individual chunk thresholds
  singleChunkMax: 1 * 1024 * 1024, // 1MB - no single chunk should exceed this
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
  Total Size:     ${formatBytes(THRESHOLDS.totalSize)}
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

  if (!fs.existsSync(manifestPath)) {
    return {
      success: false,
      error: "Build manifest not found. Run build first.",
      metrics: null,
    };
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const pages = manifest.pages || {};

  let totalSize = 0;
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
          totalSize += size;
          chunkCount++;

          if (size > THRESHOLDS.singleChunkMax) {
            oversizedChunks.push({
              name: `${prefix}${item}`,
              size,
              sizeFormatted: formatBytes(size),
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

  return {
    success: true,
    metrics: {
      totalSize,
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
    return {
      success: true,
      metrics: {
        totalSize: report.bundle?.totalSize || 0,
        mainChunkSize: report.bundle?.mainChunk || 0,
        chunkCount: report.bundle?.chunkCount || 0,
        buildTime: report.total?.duration || 0,
        cacheHitRate: report.cache?.hitRate || 0,
        oversizedChunks:
          report.bundle?.largestChunks?.filter(
            (c) => c.size > THRESHOLDS.singleChunkMax
          ) || [],
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
    const msg = `Total size exceeds threshold: ${formatBytes(metrics.totalSize)} > ${formatBytes(THRESHOLDS.totalSize)}`;
    results.violations.push({ type: "totalSize", message: msg });
    log(`${colors.red}[FAIL]${colors.reset} ${msg}`);
  } else {
    log(`${colors.green}[PASS]${colors.reset} Total size: ${formatBytes(metrics.totalSize)} (threshold: ${formatBytes(THRESHOLDS.totalSize)})`);
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
