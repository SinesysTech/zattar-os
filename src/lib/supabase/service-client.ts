/**
 * Cliente Supabase com Secret Key — alias retrocompatível.
 *
 * A lógica real vive em `./db-client.ts` (fonte única da verdade). Este arquivo
 * existe apenas para preservar a importação histórica `createServiceClient`
 * usada em ~30 consumidores espalhados pelo codebase. Evita refactor de alto
 * risco e mantém a consolidação em um único ponto de manutenção (guard
 * server-only, warn de chave legacy, logging).
 *
 * @deprecated Use `createDbClient` de `@/lib/supabase/db-client` em código novo.
 *   O alias `createServiceClient` será removido após a migração gradual dos
 *   consumidores. Não há diferença de comportamento — é o mesmo cliente.
 */

export { createDbClient as createServiceClient } from './db-client';
