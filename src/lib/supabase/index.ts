/**
 * Barrel export para módulo Supabase
 *
 * ⚠️ OTIMIZAÇÃO DE BUILD:
 * Prefira imports diretos quando possível para melhor tree-shaking:
 *
 * ✅ Recomendado (import direto):
 * import { createClient } from '@/lib/supabase/client';
 * import { createServiceClient } from '@/lib/supabase/service-client';
 *
 * ⚠️ Use com moderação (barrel export):
 * import { createClient, createDbClient } from '@/lib/supabase';
 *
 * NOTE: Server-side exports are NOT included here to prevent Client Components
 * from accidentally importing them. Sempre importe diretamente:
 * - Server Components/Server Actions: import { createClient } from '@/lib/supabase/server'
 */

// ============================================================================
// Client (Browser)
// ============================================================================
export { createClient } from './client';

// ============================================================================
// Service Client (Backend - bypasses RLS)
// ============================================================================
export { createServiceClient } from './service-client';

// ============================================================================
// Database Types
// ============================================================================
export type * from './database.types';

// ============================================================================
// DB Client (Core - for repositories)
// ============================================================================
export type { DbClient } from './db-client';
export { createDbClient, getDbClient } from './db-client';

// ============================================================================
// User Context Helpers
// ============================================================================
export {
  atribuirResponsavelAcervo,
  atribuirResponsavelAudiencia,
  atribuirResponsavelPendente,
} from './set-user-context';
