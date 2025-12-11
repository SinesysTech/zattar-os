// Client-side exports (safe for Client Components)
export * from './client';
export * from './service-client';
export * from './database.types';
export * from './db-client';

// Server-side exports (DO NOT import these in Client Components)
// Import directly from the files instead:
// - For Server Components: import { createClient } from '@/lib/supabase/server'
// - For Server Actions: import { createClient } from '@/lib/supabase/server-client'
// - For legacy server: import { createClient } from '@/lib/supabase/server'
export * from './server';
export * from './set-user-context';

// NOTE: server-client.ts is NOT exported here to prevent Client Components
// from accidentally importing it. Always import directly:
// import { createClient } from '@/lib/supabase/server-client'
