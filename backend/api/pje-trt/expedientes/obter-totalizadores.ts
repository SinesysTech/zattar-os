/**
 * Arquivo: pendentes-manifestacao/obter-totalizadores.ts
 * 
 * PROPÓSITO:
 * Obtém o totalizador específico de Pendentes de Manifestação do painel do advogado.
 * Retorna apenas o totalizador de Pendentes de Manifestação, não todos os totalizadores.
 * 
 * PARÂMETROS:
 * - page: Page (obrigatório)
 *   Tipo: Page do Playwright
 *   Significado: Instância da página do navegador autenticada no PJE
 * 
 * - idAdvogado: number (obrigatório)
 *   Tipo: number
 *   Significado: ID do advogado no sistema PJE
 *   Como obter: Extraído do JWT após autenticação (campo idAdvogado)
 * 
 * RETORNO:
 * Tipo: Promise<Totalizador | null>
 * Significado: Totalizador de Pendentes de Manifestação ou null se não encontrado
 * 
 * ENDPOINT HTTP:
 * GET /pje-comum-api/api/paineladvogado/{idAdvogado}/totalizadores?tipoPainelAdvogado=0
 * 
 * COMPORTAMENTO ESPECIAL:
 * - Busca todos os totalizadores e filtra apenas o de Pendentes de Manifestação (idAgrupamentoProcessoTarefa=2)
 * - Retorna null se o totalizador não for encontrado
 * 
 * EXEMPLO DE USO:
 * const totalizador = await obterTotalizadoresPendentesManifestacao(page, 12345);
 * if (totalizador) {
 *   console.log(`Processos pendentes de manifestação: ${totalizador.quantidadeProcessos}`);
 * }
 */

import type { Page } from 'playwright';
import type { Totalizador } from '@/backend/types/pje-trt/types';
import { AgrupamentoProcessoTarefa } from '@/backend/types/pje-trt/types';
import { fetchPJEAPI } from '../shared/fetch';

export async function obterTotalizadoresPendentesManifestacao(
  page: Page,
  idAdvogado: number
): Promise<Totalizador | null> {
  const totalizadores = await fetchPJEAPI<Totalizador[]>(
    page,
    `/pje-comum-api/api/paineladvogado/${idAdvogado}/totalizadores`,
    { tipoPainelAdvogado: 0 }
  );

  return (
    totalizadores.find(
      (t) => t.idAgrupamentoProcessoTarefa === AgrupamentoProcessoTarefa.PENDENTES_MANIFESTACAO
    ) || null
  );
}
