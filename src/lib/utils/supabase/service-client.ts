// Compat layer: alguns módulos antigos ainda importam o service client por
// `@/lib/utils/supabase/service-client`. A implementação atual vive em
// `@/lib/supabase/service-client`.
//
// Manter este re-export evita erros de build e permite migração gradual.

export { createServiceClient } from '../../supabase/service-client';


