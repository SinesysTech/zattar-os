/**
 * Re-export do cliente Supabase para serviços backend
 * 
 * Este arquivo mantém compatibilidade com imports legados que usam
 * @/backend/utils/supabase/server-client
 * 
 * NOTA: Para serviços backend que precisam bypassar RLS, use service-client.
 * Este arquivo é um alias para service-client para manter compatibilidade.
 * 
 * A implementação real está em backend/utils/supabase/service-client.ts
 */

export { createServiceClient as createClient } from './service-client';

