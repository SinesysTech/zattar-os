/**
 * Re-export do shared. Fonte primária dos tipos/schemas de partes (Cliente,
 * ParteContraria, Terceiro, etc.) vive em `@/shared/partes/domain` para
 * permitir consumo por rotas públicas sem cross-group imports.
 */
export * from '@/shared/partes/domain'
