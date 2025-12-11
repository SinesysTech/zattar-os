// Client-side exports (safe for Client Components)
export * from './client';
export * from './service-client';
export type * from './database.types';
export * from './db-client';
export * from './set-user-context';

// NOTE: Server-side exports are NOT included here to prevent Client Components
// from accidentally importing them. Always import directly:
// - For Server Components: import { createClient } from '@/lib/supabase/server'
// - For Server Actions: import { createClient } from '@/lib/supabase/server-client'
// These files use 'next/headers' which only works in Server Components/Actions
