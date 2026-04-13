---
status: fixing
trigger: "supabase-lock-steal-contention - Lock broken by another request with the 'steal' option AbortErrors"
created: 2026-04-13T00:00:00Z
updated: 2026-04-13T00:00:00Z
---

## Current Focus

hypothesis: Multiple concurrent getUser() calls from UserProvider (init + onAuthStateChange + visibilitychange/focus + interval) race for the same Navigator Lock, causing timeout -> steal -> AbortError cascade on the PREVIOUS lock holder
test: Trace all getUser() call sites in browser context and verify they all go through deduplication
expecting: Finding that deduplication only covers UserProvider but not other browser-side callers; also that the initial load triggers multiple concurrent getUser paths
next_action: Map all browser-side getUser() call sites and identify the race window

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

## Resolution

root_cause: |
  Two-part problem:
  1. PRIMARY: @supabase/supabase-js@2.98.0 (auth-js@2.98.0) has a known bug where the Navigator Lock 
     "steal" recovery mechanism causes a cascade of AbortErrors. When one lock acquisition times out 
     and steals, it aborts the previous holder, which triggers another steal, creating a chain reaction 
     of 14+ AbortErrors. This was fixed in supabase-js@2.99.3 with "guard navigator lock steal against 
     cascade when lock is stolen by another request" (#2178).
  2. SECONDARY: The UserProvider registers its own `focus` and `visibilitychange` event listeners 
     that call getUser(), DUPLICATING the Supabase SDK's built-in visibility change handling in 
     _handleVisibilityChange(). This doubles lock acquisition attempts when tab regains focus.
  3. TERTIARY: The chat/call/layout.tsx wraps children in a bare UserProvider (without initialUser), 
     but this is mitigated by layout-client.tsx skipping UserProvider for /app/chat/call routes.
     However, the redundant custom singleton in client.ts adds unnecessary complexity.

fix: |
  1. Upgrade @supabase/supabase-js to ^2.103.0 and @supabase/ssr to ^0.10.2 (includes cascade guard)
  2. Remove duplicate focus/visibilitychange listeners from UserProvider (SDK handles this internally)
  3. Simplify client.ts to rely on @supabase/ssr's built-in singleton (cachedBrowserClient)
  4. Increase lockAcquireTimeout via auth config to reduce premature steal triggers

verification: 
files_changed: []
