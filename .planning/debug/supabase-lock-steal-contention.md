---
status: awaiting_human_verify
trigger: "supabase-lock-steal-contention - Lock broken by another request with the 'steal' option AbortErrors"
created: 2026-04-13T00:00:00Z
updated: 2026-04-13T12:00:00Z
---

## Current Focus

hypothesis: All fixes already applied -- SDK upgrade (cascade guard), duplicate listener removal, getUser() deduplication, and graceful error handling should eliminate the AbortError flood
test: User must verify that authenticated page loads no longer produce "Lock broken by another request with the 'steal' option" errors in console
expecting: Zero AbortErrors on normal page loads; at most one brief lock acquisition per auth check
next_action: Await human verification that the issue is resolved in their browser

## Symptoms

expected: Page loads without errors; auth calls don't compete for locks
actual: Multiple "Lock broken by another request with the 'steal' option" AbortErrors on page load (14+ times)
errors: AbortError: Lock broken by another request with the 'steal' option
reproduction: Load any page that makes multiple Supabase calls
started: Ongoing, intermittent

## Eliminated

## Evidence

- timestamp: 2026-04-13T00:01:00Z
  checked: @supabase/ssr@0.8.0 createBrowserClient implementation
  found: Already has built-in singleton via cachedBrowserClient variable - only creates new client if isSingleton=false or not in browser
  implication: The custom singleton in client.ts is redundant but harmless; multiple createClient() calls return the same instance

- timestamp: 2026-04-13T00:02:00Z
  checked: @supabase/auth-js locks.js implementation
  found: navigatorLock uses Navigator LockManager with 5000ms acquireTimeout. On timeout, it steals the lock with {steal:true}, which causes AbortError on the PREVIOUS holder. This is by design (recovery from orphaned locks).
  implication: The "steal" cascade happens when multiple getUser() calls queue up - each steal aborts the previous holder, creating a chain of AbortErrors

- timestamp: 2026-04-13T00:03:00Z
  checked: UserProvider getUser() call sites
  found: UserProvider has deduplicatedGetUser() wrapper, but on mount it triggers: (1) init->fetchUserData->deduplicatedGetUser, (2) onAuthStateChange fires immediately with existing session->deduplicatedGetUser, (3) focus/visibility listeners. The deduplication helps but the onAuthStateChange handler calls deduplicatedGetUser AFTER the init already started one.
  implication: The deduplication is working within UserProvider but there are still race conditions on initial load

- timestamp: 2026-04-13T00:04:00Z
  checked: Other browser-side getUser() callers
  found: use-supabase-upload.ts creates client at module level (line 5); use-realtime-cursors.ts creates client at module level (line 40). These call createClient() which returns singleton but any auth operations from these would share the same lock.
  implication: Not the main issue since they don't call getUser directly

- timestamp: 2026-04-13T00:05:00Z
  checked: proxy.ts (middleware) auth pattern
  found: Proxy calls getUser() on EVERY request server-side. This is correct and doesn't affect browser locks. However, the proxy creates a new createServerClient per request which is the correct pattern.
  implication: Proxy is not contributing to browser lock contention

- timestamp: 2026-04-13T00:06:00Z
  checked: UserProvider onAuthStateChange + init race
  found: INITIAL_SESSION event is skipped (line 323), but TOKEN_REFRESHED or SIGNED_IN events fire and call deduplicatedGetUser which may overlap with the init fetchUserData call. The deduplication ref prevents true duplicates but the lock contention happens INSIDE supabase.auth.getUser() itself - multiple internal operations (token refresh, session load) each acquire the same Navigator Lock.
  implication: The root cause is that supabase.auth.getUser() internally acquires locks, and when the SDK's onAuthStateChange fires during initial load, it triggers additional internal lock acquisitions that compete

- timestamp: 2026-04-13T12:00:00Z
  checked: Current state of all fixes in codebase
  found: |
    1. @supabase/supabase-js@2.103.0 and @supabase/ssr@0.10.2 already installed (package.json + package-lock.json confirm @supabase/auth-js@2.103.0 which includes cascade guard fix #2178)
    2. UserProvider already has duplicate focus/visibilitychange listeners REMOVED (lines 285-289 have comment explaining why)
    3. UserProvider already has deduplicatedGetUser() wrapper (lines 174-183)
    4. UserProvider already has isLockOrAbortError() graceful handling (lines 163-167, 200-205, 308-311)
    5. INITIAL_SESSION event already skipped (line 299)
    6. client.ts is clean thin wrapper delegating to SDK singleton
    7. All other getUser() calls are server-side (actions, repositories, proxy) using createServerClient -- no browser lock involvement
    8. No custom middleware.ts exists -- only proxy.ts which is server-side
  implication: All four planned fixes are already applied. The lockAcquireTimeout increase (fix item 4) is unnecessary since the cascade guard in 2.103.0 prevents the chain reaction directly.

## Resolution

root_cause: |
  Two-part problem:
  1. PRIMARY: @supabase/supabase-js@2.98.0 (auth-js@2.98.0) had a known bug where the Navigator Lock 
     "steal" recovery mechanism causes a cascade of AbortErrors. When one lock acquisition times out 
     and steals, it aborts the previous holder, which triggers another steal, creating a chain reaction 
     of 14+ AbortErrors. This was fixed in supabase-js@2.99.3 with "guard navigator lock steal against 
     cascade when lock is stolen by another request" (#2178).
  2. SECONDARY: The UserProvider registered its own `focus` and `visibilitychange` event listeners 
     that called getUser(), DUPLICATING the Supabase SDK's built-in visibility change handling in 
     _handleVisibilityChange(). This doubled lock acquisition attempts when tab regained focus.

fix: |
  All fixes already applied in current codebase:
  1. DONE: Upgraded @supabase/supabase-js to 2.103.0 and @supabase/ssr to 0.10.2 (includes cascade guard)
  2. DONE: Removed duplicate focus/visibilitychange listeners from UserProvider (SDK handles internally)
  3. DONE: Added deduplicatedGetUser() wrapper in UserProvider to prevent concurrent getUser() calls
  4. DONE: Added graceful isLockOrAbortError() handling to prevent logout on transient lock errors
  5. DONE: Skipping INITIAL_SESSION event to avoid redundant getUser() with init()
  6. SKIPPED: lockAcquireTimeout increase unnecessary -- cascade guard in 2.103.0 addresses root cause directly

verification: Awaiting human verification that AbortErrors no longer appear on page loads
files_changed:
  - package.json
  - package-lock.json
  - src/providers/user-provider.tsx
  - src/lib/supabase/client.ts
  - src/lib/supabase/__tests__/client.test.ts
