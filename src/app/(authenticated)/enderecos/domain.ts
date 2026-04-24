/**
 * Re-export do shared. A fonte primária dos schemas/tipos de endereço
 * vive em `@/shared/enderecos/domain` para permitir consumo por rotas
 * públicas sem cross-group imports.
 */
export * from '@/shared/enderecos/domain'
