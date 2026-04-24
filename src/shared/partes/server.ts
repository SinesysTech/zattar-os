import 'server-only';

/**
 * Partes Shared Module — Server-only entrypoint
 *
 * Use este arquivo APENAS em Server Components / Server Actions.
 * Ele existe para evitar que dependências Node (ex: Redis/ioredis) sejam
 * empacotadas no browser.
 *
 * Espelha a API do antigo `@/app/(authenticated)/partes/server`, porém vive em
 * `@/shared/` para permitir consumo cross-route (admin + público + APIs) sem
 * cross-group imports.
 */

export * from './service';
export * from './repository';
