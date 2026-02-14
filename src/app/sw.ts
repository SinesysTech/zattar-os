import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig, RuntimeCaching } from "serwist";
import { NetworkOnly, Serwist } from "serwist";

// This declares the value of `injectionPoint` to TypeScript.
// `injectionPoint` is the string that will be replaced by the
// actual precache manifest. By default, this string is set to
// `"self.__SW_MANIFEST"`.
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}
declare const self: WorkerGlobalScope &
  typeof globalThis & {
    skipWaiting: () => Promise<void>;
  };

// Custom runtime caching strategy that NEVER caches Server Actions and APIs
// This prevents "Failed to find Server Action" errors after deployments
const apiOnlyCache: RuntimeCaching[] = [
  // API routes - NEVER cache (includes Server Actions endpoints)
  {
    matcher: /\/api\/.*/i,
    handler: new NetworkOnly(),
  },
  // Server Actions chunks - NEVER cache
  {
    matcher: /\/_next\/static\/chunks\/.*actions.*/i,
    handler: new NetworkOnly(),
  },
  // RSC (React Server Components) payloads - NEVER cache
  // These have RSC header but we can't check headers in matcher,
  // so we catch them by the .rsc extension or _rsc query param
  {
    matcher: /\.rsc(\?|$)/i,
    handler: new NetworkOnly(),
  },
  {
    matcher: /\?.*_rsc=/i,
    handler: new NetworkOnly(),
  },
];

// Combine our API-exclusion rules with the default cache
// Our rules come first to take precedence
const customRuntimeCaching: RuntimeCaching[] = [
  ...apiOnlyCache,
  ...defaultCache,
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: customRuntimeCaching,
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();

// Listen for messages from the client to clear cache or skip waiting
self.addEventListener("message", (event: MessageEvent) => {
  const data = event.data as { type?: string } | undefined;

  if (data?.type === "CLEAR_CACHE") {
    // Clear all caches when version mismatch is detected
    caches.keys().then((cacheNames) => {
      cacheNames.forEach((cacheName) => {
        caches.delete(cacheName);
      });
    });
  }

  if (data?.type === "SKIP_WAITING") {
    // Skip waiting and activate immediately
    self.skipWaiting();
  }
});
