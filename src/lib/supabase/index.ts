// Client-side exports (safe for Client Components)
export * from './client';
export * from './service-client';
export type * from './database.types';
export * from './db-client';
export * from './set-user-context';

// NOTE: Server-side exports are NOT included here to prevent Client Components
// from accidentally importing them. Sempre importe diretamente:
// - Server Components/Server Actions: import { createClient } from '@/lib/supabase/server'
// (o wrapper `server-client` era legado; consolidamos tudo em `server.ts`)
