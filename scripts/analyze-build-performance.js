#!/usr/bin/env node
/**
 * Build Performance Analyzer
 *
 * Measures build time for each phase, generates detailed performance reports,
 * and compares with previous builds. Outputs JSON reports for CI integration.
 *
 * Usage:
 *   node scripts/analyze-build-performance.js [options]
 *
 * Options:
 *   --skip-build    Skip build and only analyze existing .next directory
 *   --verbose       Show detailed logs
 *   --json-only     Only output JSON (no console logs)
 */

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const { performance } = require("perf_hooks");

// ANSI color codes
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

const log = {
  info: (msg) =>
    !args.jsonOnly && console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) =>
    !args.jsonOnly &&
    console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  warn: (msg) =>
    !args.jsonOnly &&
    console.warn(`${colors.yellow}[WARN]${colors.reset} ${msg}`),
  error: (msg) =>
    console.error(`${colors.red}[ERROR]${colors.reset} ${msg}`),
  verbose: (msg) =>
    args.verbose &&
    !args.jsonOnly &&
    console.log(`${colors.dim}[VERBOSE]${colors.reset} ${msg}`),
  section: (title) =>
    !args.jsonOnly &&
    console.log(
      `\n${colors.bright}${colors.cyan}=== ${title} ===${colors.reset}\n`
    ),
};

// Parse arguments
const args = {
  skipBuild: process.argv.includes("--skip-build"),
  verbose: process.argv.includes("--verbose"),
  jsonOnly: process.argv.includes("--json-only"),
};

// Directories
const rootDir = process.cwd();
const buildDir = path.join(rootDir, ".next");
const resultsDir = path.join(rootDir, "scripts", "results", "build-performance");
const historyDir = path.join(resultsDir, "history");

// Ensure directories exist
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    log.verbose(`Created directory: ${dir}`);
  }
}

// Get current timestamp in ISO format
function getTimestamp() {
  return new Date().toISOString();
}

// Format duration in human-readable format
function formatDuration(ms) {
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(1);
  return `${minutes}m ${seconds}s`;
}

// Format bytes in human-readable format
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)}MB`;
}

// Run a command and return duration
async function runCommand(command, cmdArgs, label) {
  return new Promise((resolve, reject) => {
    const startTime = performance.now();
    log.info(`Starting ${label}...`);

    const proc = spawn(command, cmdArgs, {
      cwd: rootDir,
      stdio: ["inherit", "pipe", "pipe"],
      shell: true,
      env: {
        ...process.env,
        ANALYZE: process.env.ANALYZE || "false",
      },
    });

    let stdout = "";
    let stderr = "";

    proc.stdout?.on("data", (data) => {
      stdout += data.toString();
      if (args.verbose) process.stdout.write(data);
    });

    proc.stderr?.on("data", (data) => {
      stderr += data.toString();
      if (args.verbose) process.stderr.write(data);
    });

    proc.on("close", (code) => {
      const duration = performance.now() - startTime;
      if (code === 0) {
        log.success(`${label} completed in ${formatDuration(duration)}`);
        resolve({ duration, stdout, stderr });
      } else {
        log.error(`${label} failed with code ${code}`);
        reject(new Error(`${label} failed with code ${code}\n${stderr}`));
      }
    });

    proc.on("error", reject);
  });
}

// Analyze TypeScript compilation time (from tsc output in build logs)
function _analyzeTypeScriptPhase(_buildOutput) {
  // Next.js doesn't separate TypeScript compilation in build output
  // We estimate based on typical ratios or use a separate tsc --noEmit run
  return null; // Will be calculated separately if needed
}

// Analyze bundle sizes from build manifest
function analyzeBundleSizes() {
  const manifestPath = path.join(buildDir, "build-manifest.json");

  if (!fs.existsSync(manifestPath)) {
    log.warn("build-manifest.json not found");
    return null;
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const pages = manifest.pages || {};

  let totalSize = 0;
  let mainChunkSize = 0;
  let chunkCount = 0;
  const chunkDetails = [];

  // Analyze static chunks
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
          chunkDetails.push({
            name: `${prefix}${item}`,
            size,
            sizeFormatted: formatBytes(size),
          });
        }
      }
    };
    analyzeDir(staticDir);
  }

  // Analyze pages chunks
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

  // Sort chunks by size (largest first)
  chunkDetails.sort((a, b) => b.size - a.size);

  return {
    totalSize,
    totalSizeFormatted: formatBytes(totalSize),
    mainChunk: mainChunkSize,
    mainChunkFormatted: formatBytes(mainChunkSize),
    chunkCount,
    largestChunks: chunkDetails.slice(0, 10),
  };
}

// Analyze cache statistics
function analyzeCacheStats() {
  const cacheDir = path.join(buildDir, "cache");

  if (!fs.existsSync(cacheDir)) {
    return { hitRate: 0, entries: 0, size: 0 };
  }

  let entries = 0;
  let totalSize = 0;

  const countEntries = (dir) => {
    if (!fs.existsSync(dir)) return;
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);
      if (stat.isDirectory()) {
        countEntries(itemPath);
      } else {
        entries++;
        totalSize += stat.size;
      }
    }
  };

  countEntries(cacheDir);

  // Estimate hit rate based on cache presence (rough estimation)
  // In reality, you'd need to track cache hits during build
  const hitRate = entries > 0 ? Math.min(0.95, entries / (entries + 10)) : 0;

  return {
    hitRate,
    entries,
    size: totalSize,
    sizeFormatted: formatBytes(totalSize),
  };
}

// Load previous build report for comparison
function loadPreviousReport() {
  const previousPath = path.join(resultsDir, "previous.json");
  if (fs.existsSync(previousPath)) {
    try {
      return JSON.parse(fs.readFileSync(previousPath, "utf8"));
    } catch (_e) {
      log.warn("Could not load previous report for comparison");
    }
  }
  return null;
}

// Save current report and archive
function saveReport(report) {
  ensureDir(resultsDir);
  ensureDir(historyDir);

  const latestPath = path.join(resultsDir, "latest.json");
  const previousPath = path.join(resultsDir, "previous.json");

  // Move current latest to previous
  if (fs.existsSync(latestPath)) {
    fs.copyFileSync(latestPath, previousPath);
    log.verbose("Archived previous report");
  }

  // Save new latest
  fs.writeFileSync(latestPath, JSON.stringify(report, null, 2));
  log.verbose(`Saved latest report to ${latestPath}`);

  // Archive with timestamp
  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .slice(0, 19);
  const archivePath = path.join(historyDir, `${timestamp}.json`);
  fs.writeFileSync(archivePath, JSON.stringify(report, null, 2));
  log.verbose(`Archived report to ${archivePath}`);

  return latestPath;
}

// Calculate delta between current and previous reports
function calculateDelta(current, previous) {
  if (!previous) return null;

  const delta = {};

  if (current.total?.duration && previous.total?.duration) {
    const durationDelta = current.total.duration - previous.total.duration;
    delta.duration = {
      absolute: durationDelta,
      percentage: (durationDelta / previous.total.duration) * 100,
      improved: durationDelta < 0,
    };
  }

  if (current.bundle?.totalSize && previous.bundle?.totalSize) {
    const sizeDelta = current.bundle.totalSize - previous.bundle.totalSize;
    delta.bundleSize = {
      absolute: sizeDelta,
      percentage: (sizeDelta / previous.bundle.totalSize) * 100,
      improved: sizeDelta < 0,
    };
  }

  return delta;
}

// Print comparison with previous build
function printComparison(delta) {
  if (!delta) {
    log.info("No previous build to compare against");
    return;
  }

  log.section("Comparison with Previous Build");

  if (delta.duration) {
    const sign = delta.duration.improved ? "-" : "+";
    const color = delta.duration.improved ? colors.green : colors.red;
    console.log(
      `Build Time: ${color}${sign}${formatDuration(Math.abs(delta.duration.absolute))} (${sign}${Math.abs(delta.duration.percentage).toFixed(1)}%)${colors.reset}`
    );
  }

  if (delta.bundleSize) {
    const sign = delta.bundleSize.improved ? "-" : "+";
    const color = delta.bundleSize.improved ? colors.green : colors.red;
    console.log(
      `Bundle Size: ${color}${sign}${formatBytes(Math.abs(delta.bundleSize.absolute))} (${sign}${Math.abs(delta.bundleSize.percentage).toFixed(1)}%)${colors.reset}`
    );
  }
}

// Print summary report
function printSummary(report) {
  log.section("Build Performance Summary");

  console.log(`Timestamp: ${report.timestamp}`);
  console.log(`Total Duration: ${colors.bright}${formatDuration(report.total.duration)}${colors.reset}`);
  console.log("");

  if (report.phases) {
    console.log("Phases:");
    for (const [name, phase] of Object.entries(report.phases)) {
      if (phase.duration) {
        const bar = "█".repeat(Math.round(phase.percentage / 5));
        console.log(
          `  ${name.padEnd(15)} ${formatDuration(phase.duration).padStart(10)} ${colors.dim}${bar} ${phase.percentage.toFixed(1)}%${colors.reset}`
        );
      }
    }
  }

  if (report.bundle) {
    log.section("Bundle Analysis");
    console.log(`Total Size: ${report.bundle.totalSizeFormatted}`);
    console.log(`Main Chunk: ${report.bundle.mainChunkFormatted}`);
    console.log(`Chunk Count: ${report.bundle.chunkCount}`);

    if (report.bundle.largestChunks?.length > 0) {
      console.log("\nTop 5 Largest Chunks:");
      for (let i = 0; i < Math.min(5, report.bundle.largestChunks.length); i++) {
        const chunk = report.bundle.largestChunks[i];
        console.log(`  ${(i + 1)}. ${chunk.name.padEnd(40)} ${chunk.sizeFormatted}`);
      }
    }
  }

  if (report.cache) {
    log.section("Cache Statistics");
    console.log(`Cache Entries: ${report.cache.entries}`);
    console.log(`Cache Size: ${report.cache.sizeFormatted}`);
    console.log(`Estimated Hit Rate: ${(report.cache.hitRate * 100).toFixed(1)}%`);
  }
}

// Main execution
async function main() {
  const startTime = performance.now();
  log.section("Build Performance Analyzer");

  const report = {
    timestamp: getTimestamp(),
    phases: {},
    total: {},
    bundle: null,
    cache: null,
    delta: null,
  };

  try {
    if (!args.skipBuild) {
      // Phase 1: TypeScript check (optional, for detailed metrics)
      if (args.verbose) {
        try {
          const tscResult = await runCommand(
            "npx",
            ["tsc", "--noEmit"],
            "TypeScript Check"
          );
          report.phases.typescript = {
            duration: tscResult.duration,
            percentage: 0, // Will be calculated after total
          };
        } catch (_e) {
          log.warn("TypeScript check failed, continuing with build");
        }
      }

      // Phase 2: Full Next.js build
      const buildResult = await runCommand(
        "node",
        [
          "--max-old-space-size=6144",
          "node_modules/next/dist/bin/next",
          "build",
          "--experimental-build-mode=compile",
        ],
        "Next.js Build"
      );
      report.phases.nextjs = {
        duration: buildResult.duration,
        percentage: 0,
      };
    } else {
      log.info("Skipping build (--skip-build flag)");
      if (!fs.existsSync(buildDir)) {
        throw new Error(
          ".next directory not found. Run build first or remove --skip-build flag."
        );
      }
    }

    // Analyze bundle sizes
    log.info("Analyzing bundle sizes...");
    report.bundle = analyzeBundleSizes();

    // Analyze cache
    log.info("Analyzing cache statistics...");
    report.cache = analyzeCacheStats();

    // Calculate total duration
    const totalDuration = performance.now() - startTime;
    report.total.duration = args.skipBuild
      ? report.phases.nextjs?.duration || 0
      : totalDuration;

    // Calculate phase percentages
    const phaseDurations = Object.values(report.phases).reduce(
      (sum, p) => sum + (p.duration || 0),
      0
    );
    for (const phase of Object.values(report.phases)) {
      if (phase.duration && phaseDurations > 0) {
        phase.percentage = (phase.duration / phaseDurations) * 100;
      }
    }

    // Load previous report and calculate delta
    const previousReport = loadPreviousReport();
    report.delta = calculateDelta(report, previousReport);

    // Save report
    const reportPath = saveReport(report);

    // Print summary
    if (!args.jsonOnly) {
      printSummary(report);
      printComparison(report.delta);
      log.success(`Report saved to ${reportPath}`);
    } else {
      console.log(JSON.stringify(report, null, 2));
    }

    // Exit with success
    process.exit(0);
  } catch (error) {
    log.error(`Build analysis failed: ${error.message}`);
    if (args.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();
