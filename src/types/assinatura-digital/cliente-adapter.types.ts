/**
 * Adapters/Types para o fluxo de Assinatura Digital.
 *
 * Mantido em `src/types/*` por compatibilidade (imports legados).
 */

import type { DadosPessoaisFormData } from '@/features/assinatura-digital/validations/dados-pessoais.schema';

export type ClienteFormsignPayload = {
  id?: number;
  nome: string;
  cpf: string;
  email: string;
  celular: string;
  telefone?: string;
  rg?: string | null;
  data_nascimento?: string | null;

  endereco_completo?: string;
  endereco_rua?: string;
  endereco_numero?: string;
  endereco_complemento?: string;
  endereco_bairro?: string;
  endereco_cidade?: string;
  endereco_uf?: string;
  endereco_cep?: string;

  estado_civil?: string;
  genero?: number;
  nacionalidade_id?: number;
};

export function mapClienteFormToCliente(form: DadosPessoaisFormData): ClienteFormsignPayload {
  const endereco_rua = form.logradouro?.trim() || '';
  const endereco_numero = form.numero?.trim() || '';
  const endereco_complemento = form.complemento?.trim() || '';
  const endereco_bairro = form.bairro?.trim() || '';
  const endereco_cidade = form.cidade?.trim() || '';
  const endereco_uf = form.estado?.trim() || '';
  const endereco_cep = form.cep?.trim() || '';

  const endereco_completo = [
    endereco_rua,
    endereco_numero ? `, ${endereco_numero}` : '',
    endereco_complemento ? ` - ${endereco_complemento}` : '',
    endereco_bairro ? ` - ${endereco_bairro}` : '',
    endereco_cidade ? ` - ${endereco_cidade}` : '',
    endereco_uf ? `/${endereco_uf}` : '',
    endereco_cep ? ` - ${endereco_cep}` : '',
  ]
    .join('')
    .trim();

  return {
    nome: form.name.trim(),
    cpf: form.cpf.trim(),
    email: form.email.trim(),
    celular: form.celular.trim(),
    telefone: form.telefone?.trim() || undefined,
    rg: form.rg?.trim() ? form.rg.trim() : null,
    data_nascimento: form.dataNascimento?.trim() ? form.dataNascimento.trim() : null,

    endereco_completo: endereco_completo || undefined,
    endereco_rua: endereco_rua || undefined,
    endereco_numero: endereco_numero || undefined,
    endereco_complemento: endereco_complemento || undefined,
    endereco_bairro: endereco_bairro || undefined,
    endereco_cidade: endereco_cidade || undefined,
    endereco_uf: endereco_uf || undefined,
    endereco_cep: endereco_cep || undefined,

    estado_civil: form.estadoCivil,
    genero: Number.parseInt(form.genero || '0', 10),
    nacionalidade_id: Number.parseInt(form.nacionalidade || '0', 10),
  };
}

type EnderecoRow = Record<string, unknown>;
type ClienteRow = Record<string, unknown>;

function pickString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function pickNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

/**
 * Converte o registro de `clientes` (Sinesys) + `enderecos(*)` para o formato usado pelo fluxo público.
 * Mantém nomes em snake_case compatíveis com o endpoint `/api/assinatura-digital/forms/save-client`.
 */
export function clienteSinesysToAssinaturaDigital(cliente: ClienteRow, enderecos?: EnderecoRow[] | null) {
  const endereco = Array.isArray(enderecos) ? enderecos[0] : undefined;

  const endereco_cep =
    pickString(cliente.endereco_cep) ??
    pickString(endereco?.cep) ??
    pickString(endereco?.nro_cep) ??
    pickString(endereco?.codigo_postal);

  const endereco_rua =
    pickString(cliente.endereco_rua) ??
    pickString(endereco?.logradouro) ??
    pickString(endereco?.rua);

  const endereco_numero =
    pickString(cliente.endereco_numero) ??
    pickString(endereco?.numero);

  const endereco_complemento =
    pickString(cliente.endereco_complemento) ??
    pickString(endereco?.complemento);

  const endereco_bairro =
    pickString(cliente.endereco_bairro) ??
    pickString(endereco?.bairro);

  const endereco_cidade =
    pickString(cliente.endereco_cidade) ??
    pickString(endereco?.cidade) ??
    pickString(endereco?.municipio);

  const endereco_uf =
    pickString(cliente.endereco_uf) ??
    pickString(endereco?.uf) ??
    pickString((endereco?.estado as Record<string, unknown> | undefined)?.sigla);

  const endereco_completo =
    pickString(cliente.endereco_completo) ??
    pickString(endereco?.endereco_completo);

  return {
    id: pickNumber(cliente.id),
    nome: pickString(cliente.nome) ?? pickString(cliente.nome_completo),
    cpf: pickString(cliente.cpf),
    email: pickString(cliente.email),
    celular: pickString(cliente.celular),
    telefone: pickString(cliente.telefone),
    rg: pickString(cliente.rg) ?? null,
    data_nascimento: pickString(cliente.data_nascimento) ?? null,

    endereco_cep,
    endereco_rua,
    endereco_numero,
    endereco_complemento,
    endereco_bairro,
    endereco_cidade,
    endereco_uf,
    endereco_completo,

    estado_civil: pickString(cliente.estado_civil),
    genero: pickNumber(cliente.genero),
    nacionalidade_id: pickNumber(cliente.nacionalidade_id),
  };
}


