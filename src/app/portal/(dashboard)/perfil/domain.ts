/**
 * PERFIL PORTAL DOMAIN
 *
 * Tipos para a pagina de perfil do portal do cliente.
 */

export interface PerfilPortal {
  nome: string
  cpf: string
  email: string | null
  celular: string | null
  telefoneResidencial: string | null
  dataNascimento: string | null
  estadoCivil: string | null
  rg: string | null
  endereco: {
    logradouro: string
    numero: string
    complemento: string | null
    bairro: string
    cidade: string
    estado: string
    cep: string
  } | null
  totalProcessos: number
}
