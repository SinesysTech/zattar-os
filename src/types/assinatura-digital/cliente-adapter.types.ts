import type { ClientePessoaFisica } from '@/types/domain/partes';
import type { Endereco } from '@/types/domain/enderecos';

/**
 * Adaptador de tipos para Cliente - Compatibiliza estrutura da Assinatura Digital com Sinesys
 * 
 * Problema:
 * - Assinatura Digital usa Cliente interface simplificada (campos flatten, sem separação de endereço)
 * - Sinesys usa ClientePessoaFisica/ClientePessoaJuridica com endereco_id e Endereco separado
 * 
 * Solução:
 * - ClienteAssinaturaDigital: Subset de campos necessários para Assinatura Digital (baseado em PF)
 * - Funções de conversão para mapear entre os formatos
 */

/**
 * Tipo adaptado para Cliente no contexto da Assinatura Digital.
 * Subset de campos do ClientePessoaFisica do Sinesys, com endereço flatten e campos adicionais.
 */
export type ClienteAssinaturaDigital = Pick<ClientePessoaFisica, 
  'id' | 'nome' | 'cpf' | 'rg' | 'data_nascimento'
> & {
  // Email único (Assinatura Digital usa string, Sinesys usa array)
  email: string;
  // Celular único (Assinatura Digital usa string, Sinesys separa DDD e número)
  celular: string;
  // Campos de endereço (flatten na Assinatura Digital)
  endereco_completo?: string;
  endereco_rua?: string;
  endereco_numero?: string;
  endereco_complemento?: string;
  endereco_bairro?: string;
  endereco_cidade?: string;
  endereco_uf?: string;
  endereco_cep?: string;
  // Campos adicionais específicos da Assinatura Digital
  estado_civil?: string;
  genero?: string;
  nacionalidade?: string;
};

/**
 * Converte ClientePessoaFisica do Sinesys para formato ClienteAssinaturaDigital.
 * 
 * @param cliente - ClientePessoaFisica do Sinesys
 * @param endereco - Endereco associado (opcional, para campos de endereço)
 * @returns ClienteAssinaturaDigital compatível com Assinatura Digital
 */
export function clienteSinesysToAssinaturaDigital(
  cliente: ClientePessoaFisica,
  endereco?: Endereco
): ClienteAssinaturaDigital {
  // Email: pega o primeiro do array ou string vazia
  const email = cliente.emails?.[0] || '';
  
  // Celular: combina DDD e número
  const celular = cliente.ddd_celular && cliente.numero_celular 
    ? `${cliente.ddd_celular}${cliente.numero_celular}`.replace(/\s+/g, '')
    : cliente.numero_celular || '';

  // Endereço completo (monta string se não existir)
  const enderecoCompleto = endereco 
    ? `${endereco.logradouro || ''}, ${endereco.numero || ''}${endereco.complemento ? `, ${endereco.complemento}` : ''} - ${endereco.bairro || ''}, ${endereco.municipio || ''} - ${endereco.estado_sigla || ''}, CEP: ${endereco.cep || ''}`.trim()
    : undefined;

  return {
    id: cliente.id,
    nome: cliente.nome,
    cpf: cliente.cpf,
    rg: cliente.rg ?? null,
    data_nascimento: cliente.data_nascimento ?? null,
    email,
    celular,
    endereco_completo: enderecoCompleto,
    endereco_rua: endereco?.logradouro ?? undefined,
    endereco_numero: endereco?.numero ?? undefined,
    endereco_complemento: endereco?.complemento ?? undefined,
    endereco_bairro: endereco?.bairro ?? undefined,
    endereco_cidade: endereco?.municipio ?? undefined,
    endereco_uf: endereco?.estado_sigla ?? undefined,
    endereco_cep: endereco?.cep ?? undefined,
    estado_civil: cliente.estado_civil ?? undefined,
    genero: cliente.genero ?? undefined,
    nacionalidade: cliente.nacionalidade ?? undefined,
  };
}

/**
 * Converte ClienteAssinaturaDigital para formato do Sinesys (ClientePessoaFisica + Endereco).
 * 
 * @param clienteAssinaturaDigital - ClienteAssinaturaDigital da Assinatura Digital
 * @returns Objeto com cliente (Partial<ClientePessoaFisica>) e endereco (Partial<Endereco>)
 */
export function clienteAssinaturaDigitalToSinesys(clienteAssinaturaDigital: ClienteAssinaturaDigital): {
  cliente: Partial<ClientePessoaFisica>;
  endereco: Partial<Endereco>;
} {
  // ClientePessoaFisica
  const cliente: Partial<ClientePessoaFisica> = {
    id: clienteAssinaturaDigital.id,
    nome: clienteAssinaturaDigital.nome,
    cpf: clienteAssinaturaDigital.cpf,
    rg: clienteAssinaturaDigital.rg,
    data_nascimento: clienteAssinaturaDigital.data_nascimento,
    emails: clienteAssinaturaDigital.email ? [clienteAssinaturaDigital.email] : null,
    // Celular: tenta separar DDD (2 primeiros dígitos) e número
    ddd_celular: clienteAssinaturaDigital.celular.length >= 11 ? clienteAssinaturaDigital.celular.slice(0, 2) : null,
    numero_celular: clienteAssinaturaDigital.celular.length >= 11 ? clienteAssinaturaDigital.celular.slice(2) : clienteAssinaturaDigital.celular,
    estado_civil: clienteAssinaturaDigital.estado_civil,
    genero: clienteAssinaturaDigital.genero,
    nacionalidade: clienteAssinaturaDigital.nacionalidade,
  };

  // Endereco
  const endereco: Partial<Endereco> = {
    logradouro: clienteAssinaturaDigital.endereco_rua,
    numero: clienteAssinaturaDigital.endereco_numero,
    complemento: clienteAssinaturaDigital.endereco_complemento,
    bairro: clienteAssinaturaDigital.endereco_bairro,
    municipio: clienteAssinaturaDigital.endereco_cidade,
    estado_sigla: clienteAssinaturaDigital.endereco_uf,
    cep: clienteAssinaturaDigital.endereco_cep,
  };

  return { cliente, endereco };
}

/**
 * Dados do formulário de Dados Pessoais (DadosPessoaisFormData)
 * Tipagem para o input da função mapClienteFormToCliente
 */
interface DadosPessoaisFormInput {
  name: string;
  cpf: string;
  rg?: string;
  dataNascimento: string;
  estadoCivil: string;
  genero: string;
  nacionalidade: string;
  email: string;
  celular: string;
  telefone?: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
}

/**
 * Formato de saída do mapeamento para envio à API save-client
 */
export interface ClienteFormMapped {
  id?: number;
  nome: string;
  cpf: string;
  rg: string | null;
  data_nascimento: string | null;
  email: string;
  celular: string;
  telefone?: string;
  endereco_rua: string;
  endereco_numero: string;
  endereco_complemento?: string;
  endereco_bairro: string;
  endereco_cidade: string;
  endereco_uf: string;
  endereco_cep: string;
  estado_civil: string;
  genero: number;
  nacionalidade_id: number;
}

/**
 * Mapeia dados do formulário DadosPessoais para formato da API save-client.
 *
 * @param formData - Dados do formulário (DadosPessoaisFormData após sanitização)
 * @returns Objeto no formato esperado pela API save-client (clienteFormsignSchema)
 */
export function mapClienteFormToCliente(formData: DadosPessoaisFormInput): ClienteFormMapped {
  return {
    nome: formData.name,
    cpf: formData.cpf,
    rg: formData.rg || null,
    data_nascimento: formData.dataNascimento || null,
    email: formData.email,
    celular: formData.celular,
    telefone: formData.telefone || undefined,
    endereco_rua: formData.logradouro,
    endereco_numero: formData.numero,
    endereco_complemento: formData.complemento || undefined,
    endereco_bairro: formData.bairro,
    endereco_cidade: formData.cidade,
    endereco_uf: formData.estado,
    endereco_cep: formData.cep,
    estado_civil: formData.estadoCivil,
    genero: parseInt(formData.genero, 10),
    nacionalidade_id: parseInt(formData.nacionalidade, 10),
  };
}