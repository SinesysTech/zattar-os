import type { ClientePessoaFisica } from '@/types/domain/partes';
import type { Endereco } from '@/types/domain/enderecos';

/**
 * Adaptador de tipos para Cliente - Compatibiliza estrutura do Formsign com Sinesys
 * 
 * Problema:
 * - Formsign usa Cliente interface simplificada (campos flatten, sem separação de endereço)
 * - Sinesys usa ClientePessoaFisica/ClientePessoaJuridica com endereco_id e Endereco separado
 * 
 * Solução:
 * - ClienteFormsign: Subset de campos necessários para Formsign (baseado em PF)
 * - Funções de conversão para mapear entre os formatos
 */

/**
 * Tipo adaptado para Cliente no contexto do Formsign.
 * Subset de campos do ClientePessoaFisica do Sinesys, com endereço flatten e campos adicionais.
 */
export type ClienteFormsign = Pick<ClientePessoaFisica, 
  'id' | 'nome' | 'cpf' | 'rg' | 'data_nascimento'
> & {
  // Email único (Formsign usa string, Sinesys usa array)
  email: string;
  // Celular único (Formsign usa string, Sinesys separa DDD e número)
  celular: string;
  // Campos de endereço (flatten no Formsign)
  endereco_completo?: string;
  endereco_rua?: string;
  endereco_numero?: string;
  endereco_complemento?: string;
  endereco_bairro?: string;
  endereco_cidade?: string;
  endereco_uf?: string;
  endereco_cep?: string;
  // Campos adicionais específicos do Formsign
  estado_civil?: string;
  genero?: string;
  nacionalidade?: string;
};

/**
 * Converte ClientePessoaFisica do Sinesys para formato ClienteFormsign.
 * 
 * @param cliente - ClientePessoaFisica do Sinesys
 * @param endereco - Endereco associado (opcional, para campos de endereço)
 * @returns ClienteFormsign compatível com Formsign
 */
export function clienteSinesysToFormsign(
  cliente: ClientePessoaFisica,
  endereco?: Endereco
): ClienteFormsign {
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
 * Converte ClienteFormsign para formato do Sinesys (ClientePessoaFisica + Endereco).
 * 
 * @param clienteFormsign - ClienteFormsign do Formsign
 * @returns Objeto com cliente (Partial<ClientePessoaFisica>) e endereco (Partial<Endereco>)
 */
export function clienteFormsignToSinesys(clienteFormsign: ClienteFormsign): {
  cliente: Partial<ClientePessoaFisica>;
  endereco: Partial<Endereco>;
} {
  // ClientePessoaFisica
  const cliente: Partial<ClientePessoaFisica> = {
    id: clienteFormsign.id,
    nome: clienteFormsign.nome,
    cpf: clienteFormsign.cpf,
    rg: clienteFormsign.rg,
    data_nascimento: clienteFormsign.data_nascimento,
    emails: clienteFormsign.email ? [clienteFormsign.email] : null,
    // Celular: tenta separar DDD (2 primeiros dígitos) e número
    ddd_celular: clienteFormsign.celular.length >= 11 ? clienteFormsign.celular.slice(0, 2) : null,
    numero_celular: clienteFormsign.celular.length >= 11 ? clienteFormsign.celular.slice(2) : clienteFormsign.celular,
    estado_civil: clienteFormsign.estado_civil,
    genero: clienteFormsign.genero,
    nacionalidade: clienteFormsign.nacionalidade,
  };

  // Endereco
  const endereco: Partial<Endereco> = {
    logradouro: clienteFormsign.endereco_rua,
    numero: clienteFormsign.endereco_numero,
    complemento: clienteFormsign.endereco_complemento,
    bairro: clienteFormsign.endereco_bairro,
    municipio: clienteFormsign.endereco_cidade,
    estado_sigla: clienteFormsign.endereco_uf,
    cep: clienteFormsign.endereco_cep,
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