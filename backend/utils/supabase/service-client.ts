/**
 * Re-export do cliente Supabase para serviços backend
 * 
 * Este arquivo mantém compatibilidade com imports legados que usam
 * @/backend/utils/supabase/service-client
 * 
 * A implementação real está em src/lib/supabase/service-client.ts
 */

export { createServiceClient } from '@/lib/supabase/service-client';

