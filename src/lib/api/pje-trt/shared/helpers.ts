/**
 * Arquivo: shared/helpers.ts
 * 
 * PROPÓSITO:
 * Contém funções auxiliares genéricas compartilhadas entre as diferentes APIs do PJE.
 * 
 * EXPORTAÇÕES:
 * - obterProcessos(): Função genérica para obter processos (usada por acervo-geral, pendentes, arquivados)
 */

import type { Page } from 'playwright';
import { fetchPJEAPI } from './fetch';
import type { PagedResponse, Processo } from '@/backend/types/pje-trt/types';
import { AgrupamentoProcessoTarefa } from '@/backend/types/pje-trt/types';

/**
 * Função interna genérica para obter processos
 * 
 * Usada por:
 * - acervo-geral/obter-processos.ts
 * - pendentes-manifestacao/obter-processos.ts
 * - arquivados/obter-processos.ts
 * 
 * PARÂMETROS:
 * - page: Instância da página do navegador autenticada no PJE
 * - idAdvogado: ID do advogado no sistema PJE
 * - idAgrupamento: Tipo de agrupamento (ACERVO_GERAL=1, PENDENTES_MANIFESTACAO=2, ARQUIVADOS=5)
 * - pagina: Número da página (padrão: 1)
 * - tamanhoPagina: Quantidade de registros por página (padrão: 100)
 * - paramsAdicionais: Parâmetros adicionais específicos do agrupamento (opcional)
 */
export async function obterProcessos(
  page: Page,
  idAdvogado: number,
  idAgrupamento: AgrupamentoProcessoTarefa,
  pagina: number = 1,
  tamanhoPagina: number = 100,
  paramsAdicionais?: Record<string, string | number | boolean>
): Promise<PagedResponse<Processo>> {
  const params: Record<string, string | number | boolean> = {
    idAgrupamentoProcessoTarefa: idAgrupamento,
    pagina,
    tamanhoPagina,
    ...paramsAdicionais,
  };

  return fetchPJEAPI<PagedResponse<Processo>>(
    page,
    `/pje-comum-api/api/paineladvogado/${idAdvogado}/processos`,
    params
  );
}
