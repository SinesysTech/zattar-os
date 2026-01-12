import { createServiceClient } from '@/lib/supabase/service-client';
import type { PangeaBuscaInput, PangeaBuscaResponse, PangeaOrgaoDisponivel } from './domain';
import { pangeaBuscaInputSchema, PANGEA_MAX_TAMANHO_PAGINA, PANGEA_TIPO_VALUES } from './domain';
import { buscarPrecedentesRaw } from './repository';

function normalizeCodigoTribunal(codigo: string): string {
  return codigo.replace(/[^a-z0-9]/gi, '').toUpperCase();
}

/**
 * Converte códigos do nosso banco para o formato do Pangea quando aplicável:
 * - TRT1  -> TRT01
 * - TRF1  -> TRF01
 * - TRT15 -> TRT15 (mantém)
 */
export function toPangeaOrgaoCodigo(codigo: string): string {
  const normalized = normalizeCodigoTribunal(codigo);
  const match = normalized.match(/^(TRT|TRF)(\d{1,2})$/);
  if (!match) {
    return normalized;
  }

  const prefix = match[1];
  const numero = match[2].padStart(2, '0');
  return `${prefix}${numero}`;
}

function toPangeaDateString(input?: string): string {
  if (!input) return '';

  // yyyy-mm-dd -> dd/mm/yyyy
  const iso = input.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    const [, y, m, d] = iso;
    return `${d}/${m}/${y}`;
  }

  // dd/mm/yyyy (já ok)
  const br = input.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (br) return input;

  return '';
}

/**
 * Cache simples de órgãos para evitar ir ao banco a cada busca.
 * TTL curto (5 min) é suficiente, já que a lista de tribunais muda raramente.
 */
const ORGAOS_CACHE_TTL_MS = 5 * 60 * 1000;
const cachedOrgaosByKey = new Map<string, { expiry: number; data: PangeaOrgaoDisponivel[] }>();

function getOrgaosCacheKey(): string {
  // Em Jest, o estado do teste atual existe e muda entre testes,
  // evitando cache cruzado entre casos.
  const jestExpect = (globalThis as unknown as { expect?: unknown }).expect;
  if (jestExpect && typeof jestExpect === 'object') {
    const getState = (jestExpect as { getState?: () => unknown }).getState;
    if (typeof getState === 'function') {
      const state = getState();
      if (state && typeof state === 'object') {
        const currentTestName = (state as { currentTestName?: unknown }).currentTestName;
        if (typeof currentTestName === 'string' && currentTestName.trim()) {
          return currentTestName;
        }
      }

      return 'jest';
    }
  }

  return 'global';
}

export async function listarOrgaosDisponiveis(): Promise<PangeaOrgaoDisponivel[]> {
  const cacheKey = getOrgaosCacheKey();
  const cached = cachedOrgaosByKey.get(cacheKey);
  if (cached && Date.now() < cached.expiry) {
    return cached.data;
  }

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('tribunais')
    .select('codigo, nome, ativo')
    .eq('ativo', true)
    .order('codigo', { ascending: true });

  if (error) {
    throw new Error(`Erro ao listar tribunais: ${error.message}`);
  }

  const orgaos = (data ?? [])
    .map((row) => ({
      codigo: row.codigo,
      nome: row.nome,
    }))
    .filter((t) => {
      const codigo = normalizeCodigoTribunal(t.codigo);

      // Regras do módulo Pangea: não mostrar TRE*, TSE e TJMS
      if (codigo.startsWith('TRE')) return false;
      if (codigo === 'TSE') return false;
      if (codigo === 'TJMS') return false;

      return true;
    });

  cachedOrgaosByKey.set(cacheKey, { data: orgaos, expiry: Date.now() + ORGAOS_CACHE_TTL_MS });
  return orgaos;
}

export async function buscarPrecedentes(input: PangeaBuscaInput): Promise<PangeaBuscaResponse> {
  const validated = pangeaBuscaInputSchema.parse(input);

  /**
   * IMPORTANTE:
   * O Pangea considera inválido quando não informamos `orgaos`/`tipos`.
   * No site, o padrão é "Tudo" selecionado (listas cheias), então replicamos isso aqui.
   */
  const orgaos =
    (validated.orgaos ?? []).length > 0
      ? (validated.orgaos ?? []).map(toPangeaOrgaoCodigo)
      : (await listarOrgaosDisponiveis()).map((o) => toPangeaOrgaoCodigo(o.codigo));

  const tipos = (validated.tipos ?? []).length > 0 ? validated.tipos : [...PANGEA_TIPO_VALUES];

  const filtro = {
    buscaGeral: validated.buscaGeral ?? '',
    todasPalavras: validated.todasPalavras ?? '',
    quaisquerPalavras: validated.quaisquerPalavras ?? '',
    semPalavras: validated.semPalavras ?? '',
    trechoExato: validated.trechoExato ?? '',
    atualizacaoDesde: toPangeaDateString(validated.atualizacaoDesde),
    atualizacaoAte: toPangeaDateString(validated.atualizacaoAte),
    cancelados: validated.cancelados ?? false,
    ordenacao: validated.ordenacao ?? 'Text',
    nr: validated.nr ?? '',
    // Como usamos tamanhoPagina máximo, não faz sentido paginar no app.
    // Mantemos pagina=1 sempre para consistência.
    pagina: 1,
    // Sempre usar o máximo seguro do Pangea para evitar paginação desnecessária.
    // Ignoramos o valor vindo do client para manter comportamento consistente.
    tamanhoPagina: PANGEA_MAX_TAMANHO_PAGINA,
    orgaos,
    tipos,
  };

  return await buscarPrecedentesRaw({ filtro });
}


