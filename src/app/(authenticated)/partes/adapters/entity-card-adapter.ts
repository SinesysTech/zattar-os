/**
 * Partes > Entity Card Adapter
 *
 * Mapeia cada entidade do módulo Partes para a interface unificada
 * EntityCardData, usada pelos componentes Glass UI do dashboard.
 *
 * USO:
 *   const card = clienteToEntityCard(cliente);
 *   const card = parteContrariaToEntityCard(parte);
 *   const card = terceiroToEntityCard(terceiro);
 *   const card = representanteToEntityCard(representante);
 */

import { Users, Scale, User, Briefcase } from 'lucide-react';
import type { EntityCardConfig, EntityCardData } from '@/components/dashboard/entity-card';
import type { Cliente, ParteContraria, Terceiro, ProcessoRelacionado } from '../domain';
import type { Representante } from '../types/representantes';

// Status que indicam processo ativo (não arquivado/extinto)
const STATUS_ATIVO = new Set(['A', 'ATIVO', 'ativo', null, undefined]);

// =============================================================================
// ENTITY CONFIGS
// =============================================================================

export const ENTITY_CONFIGS: Record<string, EntityCardConfig> = {
  cliente: {
    label: 'Cliente',
    icon: Users,
    color: 'text-primary/70',
    bg: 'bg-primary/8',
  },
  parteContraria: {
    label: 'Parte Contrária',
    icon: Scale,
    color: 'text-warning/70',
    bg: 'bg-warning/8',
  },
  terceiro: {
    label: 'Terceiro',
    icon: User,
    color: 'text-info/70',
    bg: 'bg-info/8',
  },
  representante: {
    label: 'Representante',
    icon: Briefcase,
    color: 'text-success/70',
    bg: 'bg-success/8',
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Formata CPF (000.000.000-00) ou CNPJ (00.000.000/0000-00) para exibição.
 */
export function formatDocument(doc: string | null | undefined): string {
  if (!doc) return '--';
  const digits = doc.replace(/\D/g, '');
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }
  if (digits.length === 14) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
  }
  return doc;
}

/**
 * Extrai o primeiro email de um campo que pode ser string[] (JSONB), string ou null.
 */
export function extractFirstEmail(emails: string[] | string | null | undefined): string | undefined {
  if (!emails) return undefined;
  if (Array.isArray(emails)) {
    return emails[0] || undefined;
  }
  if (typeof emails === 'string') {
    // Tenta parse de JSON array armazenado como string
    try {
      const parsed = JSON.parse(emails) as unknown;
      if (Array.isArray(parsed) && parsed.length > 0) {
        return String(parsed[0]);
      }
    } catch {
      // não é JSON: trata como email direto
    }
    return emails || undefined;
  }
  return undefined;
}

/**
 * Formata DDD + número como "(DD) NNNNN-NNNN" ou "(DD) NNNN-NNNN".
 */
export function formatPhone(
  ddd: string | null | undefined,
  numero: string | null | undefined
): string | undefined {
  const d = ddd?.replace(/\D/g, '') ?? '';
  const n = numero?.replace(/\D/g, '') ?? '';
  if (!d && !n) return undefined;
  if (!d) return n || undefined;
  if (!n) return `(${d})`;

  if (n.length === 9) {
    return `(${d}) ${n.slice(0, 5)}-${n.slice(5)}`;
  }
  if (n.length === 8) {
    return `(${d}) ${n.slice(0, 4)}-${n.slice(4)}`;
  }
  return `(${d}) ${n}`;
}

/**
 * Formata localização como "Cidade, UF" a partir do objeto endereco (join).
 * Retorna "--" quando nao disponivel.
 */
export function formatLocation(endereco: {
  municipio?: string | null;
  estado_sigla?: string | null;
} | null | undefined): string {
  const cidade = endereco?.municipio?.trim();
  const uf = endereco?.estado_sigla?.trim();
  if (cidade && uf) return `${cidade}, ${uf}`;
  if (cidade) return cidade;
  if (uf) return uf;
  return '--';
}

// =============================================================================
// HELPERS INTERNOS
// =============================================================================

/**
 * Acessa propriedade por snake_case OU camelCase.
 * Necessário porque fromSnakeToCamel converte chaves para camelCase,
 * mas os tipos TypeScript usam snake_case.
 */
function prop(obj: Record<string, unknown>, snakeKey: string): unknown {
  if (snakeKey in obj) return obj[snakeKey];
  const camelKey = snakeKey.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
  return obj[camelKey];
}

function strProp(obj: Record<string, unknown>, snakeKey: string): string | null {
  const v = prop(obj, snakeKey);
  return typeof v === 'string' ? v : null;
}

/** Conta processos ativos e total a partir de processos_relacionados */
function contarProcessos(processos?: ProcessoRelacionado[]): { ativos: number; total: number } {
  if (!processos || processos.length === 0) return { ativos: 0, total: 0 };
  const ativos = processos.filter(p => STATUS_ATIVO.has(p.codigo_status_processo ?? undefined)).length;
  return { ativos, total: processos.length };
}

/** Tipo genérico para entidades com endereco e processos opcionais */
type WithEnderecoEProcessos = {
  endereco?: { municipio?: string | null; estado_sigla?: string | null } | null;
  processos_relacionados?: ProcessoRelacionado[];
};

// =============================================================================
// ENTITY MAPPERS
// =============================================================================

/**
 * Mapeia um Cliente para EntityCardData.
 * Quando chamado com dados de findAllClientesComEnderecoEProcessos,
 * preenche localização e métricas automaticamente.
 */
export function clienteToEntityCard(
  cliente: Cliente & WithEnderecoEProcessos
): EntityCardData {
  const r = cliente as unknown as Record<string, unknown>;
  const tipoPessoa = (strProp(r, 'tipo_pessoa') ?? '').toLowerCase();
  const isPF = tipoPessoa === 'pf';
  const doc = isPF ? strProp(r, 'cpf') : strProp(r, 'cnpj');

  const { ativos, total } = contarProcessos(cliente.processos_relacionados);

  return {
    id: cliente.id,
    nome: cliente.nome,
    nomeSocial: (strProp(r, 'nome_social_fantasia')) ?? undefined,
    tipo: isPF ? 'pf' : 'pj',
    config: ENTITY_CONFIGS.cliente,
    documentoMasked: formatDocument(doc),
    email: extractFirstEmail(prop(r, 'emails') as string[] | string | null | undefined),
    telefone: formatPhone(strProp(r, 'ddd_celular'), strProp(r, 'numero_celular')),
    localizacao: formatLocation(cliente.endereco),
    ativo: cliente.ativo !== false,
    metricas: { label: 'processos', ativos, total },
    ultimaAtualizacao: strProp(r, 'updated_at') || strProp(r, 'created_at') || '',
    tags: [],
  };
}

/**
 * Mapeia uma ParteContraria para EntityCardData.
 */
export function parteContrariaToEntityCard(
  parte: ParteContraria & WithEnderecoEProcessos
): EntityCardData {
  const r = parte as unknown as Record<string, unknown>;
  const tipoPessoa = (strProp(r, 'tipo_pessoa') ?? '').toLowerCase();
  const isPF = tipoPessoa === 'pf';
  const doc = isPF ? strProp(r, 'cpf') : strProp(r, 'cnpj');

  const { ativos, total } = contarProcessos(parte.processos_relacionados);

  return {
    id: parte.id,
    nome: parte.nome,
    nomeSocial: strProp(r, 'nome_social_fantasia') ?? undefined,
    tipo: isPF ? 'pf' : 'pj',
    config: ENTITY_CONFIGS.parteContraria,
    documentoMasked: formatDocument(doc),
    email: extractFirstEmail(prop(r, 'emails') as string[] | string | null | undefined),
    telefone: formatPhone(strProp(r, 'ddd_celular'), strProp(r, 'numero_celular')),
    localizacao: formatLocation(parte.endereco),
    ativo: parte.ativo !== false,
    metricas: { label: 'processos', ativos, total },
    ultimaAtualizacao: strProp(r, 'updated_at') || strProp(r, 'created_at') || '',
    tags: [],
  };
}

/**
 * Mapeia um Terceiro para EntityCardData.
 */
export function terceiroToEntityCard(
  terceiro: Terceiro & WithEnderecoEProcessos
): EntityCardData {
  const r = terceiro as unknown as Record<string, unknown>;
  const tipoPessoa = (strProp(r, 'tipo_pessoa') ?? '').toLowerCase();
  const isPF = tipoPessoa === 'pf';
  const doc = isPF ? strProp(r, 'cpf') : strProp(r, 'cnpj');

  const nomeSocial = !isPF
    ? strProp(r, 'nome_fantasia') ?? undefined
    : undefined;

  const { ativos, total } = contarProcessos(terceiro.processos_relacionados);
  const tipoParte = strProp(r, 'tipo_parte');

  return {
    id: terceiro.id,
    nome: terceiro.nome,
    nomeSocial,
    tipo: isPF ? 'pf' : 'pj',
    config: ENTITY_CONFIGS.terceiro,
    documentoMasked: formatDocument(doc),
    email: extractFirstEmail(prop(r, 'emails') as string[] | string | null | undefined),
    telefone: formatPhone(strProp(r, 'ddd_celular'), strProp(r, 'numero_celular')),
    localizacao: formatLocation(terceiro.endereco),
    ativo: terceiro.ativo !== false,
    metricas: { label: 'processos', ativos, total },
    ultimaAtualizacao: strProp(r, 'updated_at') || strProp(r, 'created_at') || '',
    tags: tipoParte ? [tipoParte] : [],
  };
}

/**
 * Mapeia um Representante para EntityCardData.
 * Representantes são sempre PF (CPF).
 */
export function representanteToEntityCard(
  representante: Representante & WithEnderecoEProcessos
): EntityCardData {
  const r = representante as unknown as Record<string, unknown>;
  const oabs = prop(r, 'oabs') as { uf?: string; numero?: string }[] | undefined;
  const oabLabel =
    oabs && oabs.length > 0
      ? `OAB/${oabs[0].uf} ${oabs[0].numero}`
      : undefined;

  const emails = prop(r, 'emails') ?? prop(r, 'email');

  return {
    id: representante.id,
    nome: representante.nome,
    tipo: 'pf',
    config: ENTITY_CONFIGS.representante,
    documentoMasked: formatDocument(strProp(r, 'cpf')),
    email: extractFirstEmail(emails as string[] | string | null | undefined),
    telefone: formatPhone(strProp(r, 'ddd_celular'), strProp(r, 'numero_celular')),
    localizacao: formatLocation(representante.endereco),
    ativo: true,
    metricas: { label: 'processos', ...contarProcessos(representante.processos_relacionados) },
    ultimaAtualizacao: strProp(r, 'updated_at') || strProp(r, 'created_at') || '',
    tags: oabLabel ? [oabLabel] : [],
  };
}
