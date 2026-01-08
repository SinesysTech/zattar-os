#!/usr/bin/env node
/**
 * Validate Build Cache Script
 *
 * This script validates the Next.js build cache configuration and health.
 * It checks:
 * - Cache handler file exists and is valid
 * - Cache directory exists and is writable
 * - Cache entries are valid JSON
 * - No corrupted cache files
 *
 * Usage: npm run validate:cache
 */

const fs = require("fs");
const path = require("path");

const CACHE_HANDLER_PATH = path.join(process.cwd(), "cache-handler.js");
const CACHE_DIR = path.join(process.cwd(), ".next", "cache", "custom");

// ANSI color codes
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkCacheHandler() {
  log("\n[1/4] Checking cache handler...", "blue");

  if (!fs.existsSync(CACHE_HANDLER_PATH)) {
    log("  ERROR: cache-handler.js not found", "red");
    return false;
  }

  try {
    // Try to require the cache handler
    const CacheHandler = require(CACHE_HANDLER_PATH);

    if (typeof CacheHandler !== "function") {
      log("  ERROR: cache-handler.js does not export a class", "red");
      return false;
    }

    // Check if it has required methods
    const instance = new CacheHandler({});
    const requiredMethods = ["get", "set", "revalidateTag", "delete"];

    for (const method of requiredMethods) {
      if (typeof instance[method] !== "function") {
        log(`  ERROR: Missing required method: ${method}`, "red");
        return false;
      }
    }

    log("  OK: Cache handler is valid", "green");
    return true;
  } catch (error) {
    log(`  ERROR: Failed to load cache handler: ${error.message}`, "red");
    return false;
  }
}

function checkCacheDirectory() {
  log("\n[2/4] Checking cache directory...", "blue");

  if (!fs.existsSync(CACHE_DIR)) {
    log(`  INFO: Cache directory does not exist yet (will be created on first build)`, "yellow");
    return true;
  }

  try {
    // Check if directory is writable
    const testFile = path.join(CACHE_DIR, ".write-test");
    fs.writeFileSync(testFile, "test");
    fs.unlinkSync(testFile);
    log("  OK: Cache directory is writable", "green");
    return true;
  } catch (error) {
    log(`  ERROR: Cache directory is not writable: ${error.message}`, "red");
    return false;
  }
}

function checkCacheEntries() {
  log("\n[3/4] Checking cache entries...", "blue");

  if (!fs.existsSync(CACHE_DIR)) {
    log("  INFO: No cache entries to check", "yellow");
    return true;
  }

  const files = fs.readdirSync(CACHE_DIR).filter((f) => f.endsWith(".json"));

  if (files.length === 0) {
    log("  INFO: No cache entries found", "yellow");
    return true;
  }

  let valid = 0;
  let invalid = 0;
  let totalSize = 0;

  for (const file of files) {
    const filePath = path.join(CACHE_DIR, file);
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      JSON.parse(content);
      valid++;
      totalSize += fs.statSync(filePath).size;
    } catch {
      invalid++;
      log(`  WARNING: Invalid cache entry: ${file}`, "yellow");
    }
  }

  const sizeMB = (totalSize / 1024 / 1024).toFixed(2);
  log(`  OK: ${valid} valid entries, ${invalid} invalid entries (${sizeMB} MB total)`, valid > 0 ? "green" : "yellow");

  return invalid === 0;
}

function checkNextConfig() {
  log("\n[4/4] Checking next.config.ts...", "blue");

  const configPath = path.join(process.cwd(), "next.config.ts");

  if (!fs.existsSync(configPath)) {
    log("  ERROR: next.config.ts not found", "red");
    return false;
  }

  const content = fs.readFileSync(configPath, "utf-8");

  const checks = [
    { pattern: /cacheHandler/, name: "cacheHandler" },
    { pattern: /cacheMaxMemorySize/, name: "cacheMaxMemorySize" },
    { pattern: /swcMinify/, name: "swcMinify" },
  ];

  let allPassed = true;

  for (const check of checks) {
    if (check.pattern.test(content)) {
      log(`  OK: ${check.name} is configured`, "green");
    } else {
      log(`  WARNING: ${check.name} is not configured`, "yellow");
      allPassed = false;
    }
  }

  return allPassed;
}

function main() {
  log("\n========================================", "blue");
  log("  Next.js Build Cache Validation", "blue");
  log("========================================", "blue");

  const results = [checkCacheHandler(), checkCacheDirectory(), checkCacheEntries(), checkNextConfig()];

  const allPassed = results.every((r) => r);

  log("\n========================================", "blue");
  if (allPassed) {
    log("  All checks passed!", "green");
    log("========================================\n", "blue");
    process.exit(0);
  } else {
    log("  Some checks failed or have warnings", "yellow");
    log("========================================\n", "blue");
    process.exit(1);
  }
}

main();
