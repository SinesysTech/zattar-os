/**
 * Sets dummy environment variables for tests.
 * Prevents Supabase client from throwing during module-level instantiation
 * (e.g., AuditLogService singleton).
 *
 * Only sets values if not already defined, so individual tests can override.
 */
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
}
if (!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY) {
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY = 'test-anon-key';
}
