/**
 * Re-export do shared. A fonte primária dos tipos de endereço vive em
 * `@/shared/enderecos/types` para permitir consumo por rotas públicas
 * (assinatura digital, portal) sem cross-group imports.
 */
export * from '@/shared/enderecos/types'
