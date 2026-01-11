// @ts-check
/**
 * Custom Cache Handler for Next.js
 *
 * This handler implements a file-based cache for persistent caching across builds.
 * It's designed to work with Docker BuildKit cache mounts for incremental builds.
 *
 * Features:
 * - File-based persistent cache in .next/cache/custom
 * - Tag-based revalidation support
 * - Automatic cleanup of expired entries
 * - Memory-efficient (no in-memory storage)
 *
 * @see https://nextjs.org/docs/app/building-your-application/deploying#configuring-caching
 */

/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require("fs");
const path = require("path");

// Cache directory inside .next/cache for Docker mount compatibility
const CACHE_DIR = path.join(process.cwd(), ".next", "cache", "custom");

// Ensure cache directory exists
function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

// Generate a safe filename from cache key
function getCacheFilePath(key) {
  // Hash the key to create a safe filename
  const crypto = require("crypto");
  const hash = crypto.createHash("sha256").update(key).digest("hex");
  return path.join(CACHE_DIR, `${hash}.json`);
}

// Get tags file path
function getTagsFilePath() {
  return path.join(CACHE_DIR, "_tags.json");
}

// Load tags mapping
function loadTags() {
  const tagsPath = getTagsFilePath();
  if (fs.existsSync(tagsPath)) {
    try {
      return JSON.parse(fs.readFileSync(tagsPath, "utf-8"));
    } catch {
      return {};
    }
  }
  return {};
}

// Save tags mapping
function saveTags(tags) {
  ensureCacheDir();
  fs.writeFileSync(getTagsFilePath(), JSON.stringify(tags, null, 2));
}

module.exports = class CacheHandler {
  constructor(options) {
    this.options = options;
    ensureCacheDir();

    // Log cache handler initialization in development
    if (process.env.NODE_ENV === "development") {
      console.log("[CacheHandler] Initialized with options:", options);
      console.log("[CacheHandler] Cache directory:", CACHE_DIR);
    }
  }

  /**
   * Get a cached value by key
   * @param {string} key - Cache key
   * @returns {Promise<{value: any, lastModified: number, tags: string[]} | null>}
   */
  async get(key) {
    const filePath = getCacheFilePath(key);

    if (!fs.existsSync(filePath)) {
      return null;
    }

    try {
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

      // Check if entry has expired
      if (data.revalidate && data.lastModified) {
        const age = Date.now() - data.lastModified;
        if (age > data.revalidate * 1000) {
          // Entry expired, delete it
          fs.unlinkSync(filePath);
          return null;
        }
      }

      return {
        value: data.value,
        lastModified: data.lastModified,
        tags: data.tags || [],
      };
    } catch (error) {
      console.error("[CacheHandler] Error reading cache:", error);
      return null;
    }
  }

  /**
   * Set a cached value
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {Object} context - Cache context with revalidate and tags
   */
  async set(key, value, context) {
    ensureCacheDir();
    const filePath = getCacheFilePath(key);

    const data = {
      value,
      lastModified: Date.now(),
      revalidate: context?.revalidate,
      tags: context?.tags || [],
    };

    try {
      fs.writeFileSync(filePath, JSON.stringify(data));

      // Update tags mapping
      if (context?.tags?.length > 0) {
        const tags = loadTags();
        for (const tag of context.tags) {
          if (!tags[tag]) {
            tags[tag] = [];
          }
          if (!tags[tag].includes(key)) {
            tags[tag].push(key);
          }
        }
        saveTags(tags);
      }
    } catch (error) {
      console.error("[CacheHandler] Error writing cache:", error);
    }
  }

  /**
   * Revalidate all entries with a specific tag
   * @param {string} tag - Tag to revalidate
   */
  async revalidateTag(tag) {
    const tags = loadTags();
    const keys = tags[tag] || [];

    for (const key of keys) {
      const filePath = getCacheFilePath(key);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (error) {
          console.error("[CacheHandler] Error deleting cache entry:", error);
        }
      }
    }

    // Remove tag from mapping
    delete tags[tag];
    saveTags(tags);

    if (process.env.NODE_ENV === "development") {
      console.log(`[CacheHandler] Revalidated tag "${tag}", cleared ${keys.length} entries`);
    }
  }

  /**
   * Delete a specific cache entry
   * @param {string} key - Cache key to delete
   */
  async delete(key) {
    const filePath = getCacheFilePath(key);

    if (fs.existsSync(filePath)) {
      try {
        // Load entry to get tags
        const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

        // Remove from tags mapping
        if (data.tags?.length > 0) {
          const tags = loadTags();
          for (const tag of data.tags) {
            if (tags[tag]) {
              tags[tag] = tags[tag].filter((k) => k !== key);
              if (tags[tag].length === 0) {
                delete tags[tag];
              }
            }
          }
          saveTags(tags);
        }

        fs.unlinkSync(filePath);
      } catch (error) {
        console.error("[CacheHandler] Error deleting cache:", error);
      }
    }
  }
};
