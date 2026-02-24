/**
 * Cliente Adapters for Assinatura Digital
 *
 * Functions to map between different client data formats:
 * - mapClienteFormToCliente: Form (DadosPessoais) → API payload (ClienteFormsignPayload)
 * - clienteSinesysToAssinaturaDigital: DB row (clientes + enderecos) → ClienteAssinaturaDigital
 */

import type { DadosPessoaisFormData } from "../validations/dados-pessoais.schema";
import { NACIONALIDADES } from "../constants/nacionalidades";

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

export function mapClienteFormToCliente(
  form: DadosPessoaisFormData
): ClienteFormsignPayload {
  const endereco_rua = form.logradouro?.trim() || "";
  const endereco_numero = form.numero?.trim() || "";
  const endereco_complemento = form.complemento?.trim() || "";
  const endereco_bairro = form.bairro?.trim() || "";
  const endereco_cidade = form.cidade?.trim() || "";
  const endereco_uf = form.estado?.trim() || "";
  const endereco_cep = form.cep?.trim() || "";

  const endereco_completo = [
    endereco_rua,
    endereco_numero ? `, ${endereco_numero}` : "",
    endereco_complemento ? ` - ${endereco_complemento}` : "",
    endereco_bairro ? ` - ${endereco_bairro}` : "",
    endereco_cidade ? ` - ${endereco_cidade}` : "",
    endereco_uf ? `/${endereco_uf}` : "",
    endereco_cep ? ` - ${endereco_cep}` : "",
  ]
    .join("")
    .trim();

  return {
    nome: form.name.trim(),
    cpf: form.cpf.trim(),
    email: form.email.trim(),
    celular: form.celular.trim(),
    telefone: form.telefone?.trim() || undefined,
    rg: form.rg?.trim() ? form.rg.trim() : null,
    data_nascimento: form.dataNascimento?.trim()
      ? form.dataNascimento.trim()
      : null,

    endereco_completo: endereco_completo || undefined,
    endereco_rua: endereco_rua || undefined,
    endereco_numero: endereco_numero || undefined,
    endereco_complemento: endereco_complemento || undefined,
    endereco_bairro: endereco_bairro || undefined,
    endereco_cidade: endereco_cidade || undefined,
    endereco_uf: endereco_uf || undefined,
    endereco_cep: endereco_cep || undefined,

    estado_civil: form.estadoCivil,
    genero: Number.parseInt(form.genero || "0", 10),
    nacionalidade_id: Number.parseInt(form.nacionalidade || "0", 10),
  };
}

// ---------------------------------------------------------------------------
// DB → ClienteAssinaturaDigital (leitura)
// ---------------------------------------------------------------------------

type EnderecoRow = Record<string, unknown>;
type ClienteRow = Record<string, unknown>;

function pickString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function pickNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

/** DB enum → código do select do formulário */
const ENUM_TO_ESTADO_CIVIL: Record<string, string> = {
  solteiro: "1",
  casado: "2",
  divorciado: "4",
  viuvo: "5",
};

const ENUM_TO_GENERO: Record<string, string> = {
  masculino: "1",
  feminino: "2",
  outro: "3",
  prefiro_nao_informar: "4",
};

/** Mapa reverso: texto da nacionalidade → código numérico como string */
const NACIONALIDADE_TEXT_TO_CODE: Record<string, string> = {};
for (const [code, text] of Object.entries(NACIONALIDADES)) {
  NACIONALIDADE_TEXT_TO_CODE[text] = String(code);
}

/** Extrai o primeiro email do campo jsonb `emails` */
function extractEmail(emails: unknown): string | undefined {
  if (Array.isArray(emails) && emails.length > 0) {
    // Pode ser array de strings ["email@..."] ou array de objetos [{email: "..."}]
    const first = emails[0];
    if (typeof first === "string") return first;
    if (typeof first === "object" && first !== null && "email" in first) {
      return typeof first.email === "string" ? first.email : undefined;
    }
  }
  return undefined;
}

/** Combina DDD + número em uma string única (ex: "11999999999") */
function combinePhone(ddd: unknown, numero: unknown): string | undefined {
  const d = pickString(ddd);
  const n = pickString(numero);
  if (d && n) return `${d}${n}`;
  if (n) return n;
  return undefined;
}

/**
 * Converte o registro de `clientes` + `enderecos(*)` do DB para o formato
 * `ClienteAssinaturaDigital` usado pelo fluxo público de assinatura digital.
 *
 * Retorna campos com nomes compatíveis com a interface ClienteAssinaturaDigital
 * e com os códigos de select usados pelo formulário DadosPessoais.
 */
export function clienteSinesysToAssinaturaDigital(
  cliente: ClienteRow,
  enderecos?: EnderecoRow[] | null
) {
  const endereco = Array.isArray(enderecos) ? enderecos[0] : undefined;

  // Email: extrair de `emails` (jsonb) com fallback para campo legado `email`
  const email =
    extractEmail(cliente.emails) ?? pickString(cliente.email);

  // Telefones: reconstituir de DDD + número
  const celular =
    combinePhone(cliente.ddd_celular, cliente.numero_celular) ??
    pickString(cliente.celular);

  const telefone =
    combinePhone(cliente.ddd_residencial, cliente.numero_residencial) ??
    pickString(cliente.telefone);

  // Estado civil: enum DB → código do select
  const estadoCivilEnum = pickString(cliente.estado_civil);
  const estado_civil = estadoCivilEnum
    ? ENUM_TO_ESTADO_CIVIL[estadoCivilEnum] ?? estadoCivilEnum
    : undefined;

  // Gênero: enum DB → código do select (como string)
  const generoEnum = pickString(cliente.genero);
  const genero = generoEnum
    ? ENUM_TO_GENERO[generoEnum] ?? generoEnum
    : undefined;

  // Nacionalidade: texto DB → código do select
  const nacionalidadeText = pickString(cliente.nacionalidade);
  const nacionalidade = nacionalidadeText
    ? NACIONALIDADE_TEXT_TO_CODE[nacionalidadeText] ?? nacionalidadeText
    : undefined;

  // Endereço: da tabela enderecos (join)
  const cep = pickString(endereco?.cep);
  const logradouro = pickString(endereco?.logradouro);
  const numero = pickString(endereco?.numero);
  const complemento = pickString(endereco?.complemento);
  const bairro = pickString(endereco?.bairro);
  const cidade =
    pickString(endereco?.municipio) ?? pickString(endereco?.cidade);
  const uf =
    pickString(endereco?.estado_sigla) ?? pickString(endereco?.uf);

  return {
    id: pickNumber(cliente.id),
    nome: pickString(cliente.nome) ?? pickString(cliente.nome_completo),
    cpf: pickString(cliente.cpf),
    rg: pickString(cliente.rg) ?? null,
    data_nascimento: pickString(cliente.data_nascimento) ?? null,
    estado_civil: estado_civil ?? null,
    genero: genero ?? null,
    nacionalidade: nacionalidade ?? null,
    email,
    celular,
    telefone,
    cep,
    logradouro,
    numero,
    complemento,
    bairro,
    cidade,
    uf,
  };
}
