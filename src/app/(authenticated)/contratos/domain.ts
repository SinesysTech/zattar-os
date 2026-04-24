/**
 * Re-export do shared. Fonte primária dos tipos/schemas de contratos
 * (Contrato, ContratoParte, PapelContratual, etc.) vive em
 * `@/shared/contratos/domain` para permitir consumo por rotas públicas
 * sem cross-group imports.
 */
export * from '@/shared/contratos/domain'
