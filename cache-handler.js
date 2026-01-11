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

/**
 * @typedef {{
 *  revalidate?: number | false;
 *  tags?: string[];
 *  kind?: string;
 * }} CacheContext
 */

/**
 * @typedef {{
 *  value: any;
 *  lastModified: number;
 *  revalidate?: number | false;
 *  tags?: string[];
 * }} CacheFileEntry
 */

/** @typedef {Record<string, string[]>} TagsIndex */

// Cache directory inside .next/cache for Docker mount compatibility
const CACHE_DIR = path.join(process.cwd(), ".next", "cache", "custom");

// Ensure cache directory exists
function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

// Generate a safe filename from cache key
/**
 * @param {string} key
 * @returns {string}
 */
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
/** @returns {TagsIndex} */
function loadTags() {
  const tagsPath = getTagsFilePath();
  if (fs.existsSync(tagsPath)) {
    try {
      return /** @type {TagsIndex} */ (JSON.parse(fs.readFileSync(tagsPath, "utf-8")));
    } catch {
      return {};
    }
  }
  return {};
}

// Save tags mapping
/** @param {TagsIndex} tags */
function saveTags(tags) {
  ensureCacheDir();
  fs.writeFileSync(getTagsFilePath(), JSON.stringify(tags, null, 2));
}

module.exports = class CacheHandler {
  /** @param {unknown} options */
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
   * @param {CacheContext} [ctx] - Next.js cache context (e.g. { kind: 'FETCH' | 'APP_PAGE' | ... })
   * @returns {Promise<{value: any, lastModified: number, tags: string[]} | null>}
   */
  async get(key, ctx) {
    const filePath = getCacheFilePath(key);

    if (!fs.existsSync(filePath)) {
      return null;
    }

    try {
      const data = /** @type {CacheFileEntry} */ (
        JSON.parse(fs.readFileSync(filePath, "utf-8"))
      );

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
        tags: Array.isArray(data.tags) ? data.tags : [],
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
   * @param {CacheContext} context - Cache context (may include tags; Next.js also passes kind)
   */
  async set(key, value, context) {
    ensureCacheDir();
    const filePath = getCacheFilePath(key);

    const data = {
      value,
      lastModified: Date.now(),
      revalidate: context?.revalidate,
      tags: Array.isArray(context.tags) ? context.tags : [],
    };

    try {
      fs.writeFileSync(filePath, JSON.stringify(data));

      // Update tags mapping
      const contextTagsRaw = context.tags;
      const contextTags = Array.isArray(contextTagsRaw) ? contextTagsRaw : [];
      if (contextTags.length > 0) {
        const tags = loadTags();
        for (const tag of contextTags) {
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
          const entryTagsRaw = data.tags;
          const entryTags = Array.isArray(entryTagsRaw) ? entryTagsRaw : [];
  async revalidateTag(tag) {
    const tags = loadTags();
    const tagList = Array.isArray(tag) ? tag : [tag];

    for (const t of tagList) {
      const keys = tags[t] || [];

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
      delete tags[t];
    }

    saveTags(tags);

    if (process.env.NODE_ENV === "development") {
      console.log(
        `[CacheHandler] Revalidated tag(s) ${JSON.stringify(tagList)}, cleared associated entries`
      );
    }
  }

  /**
   * Reset the temporary in-memory cache for a single request.
   * This handler is file-based, so there is nothing to reset.
   */
  resetRequestCache() {}

  /**
   * Delete a specific cache entry
   * @param {string} key - Cache key to delete
   */
  async delete(key) {
    const filePath = getCacheFilePath(key);

    if (fs.existsSync(filePath)) {
      try {
        // Load entry to get tags
        const data = /** @type {CacheFileEntry} */ (
          JSON.parse(fs.readFileSync(filePath, "utf-8"))
        );

        // Remove from tags mapping
        const entryTags = Array.isArray(data.tags) ? data.tags : [];
        if (entryTags.length > 0) {
          const tags = loadTags();
          for (const tag of entryTags) {
            if (tags[tag]) {
              tags[tag] = tags[tag].filter(/** @param {string} k */ (k) => k !== key);
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
