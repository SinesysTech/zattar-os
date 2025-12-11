/**
 * Arquivo: acervo-geral/obter-totalizadores.ts
 * 
 * PROPÓSITO:
 * Obtém o totalizador específico do Acervo Geral do painel do advogado.
 * Retorna apenas o totalizador do Acervo Geral, não todos os totalizadores.
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
 * Significado: Totalizador do Acervo Geral ou null se não encontrado
 * 
 * ENDPOINT HTTP:
 * GET /pje-comum-api/api/paineladvogado/{idAdvogado}/totalizadores?tipoPainelAdvogado=0
 * 
 * COMPORTAMENTO ESPECIAL:
 * - Busca todos os totalizadores e filtra apenas o do Acervo Geral (idAgrupamentoProcessoTarefa=1)
 * - Retorna null se o totalizador não for encontrado
 * 
 * EXEMPLO DE USO:
 * const totalizador = await obterTotalizadoresAcervoGeral(page, 12345);
 * if (totalizador) {
 *   console.log(`Processos no acervo geral: ${totalizador.quantidadeProcessos}`);
 * }
 */

import type { Page } from 'playwright';
import type { Totalizador } from '@/backend/types/pje-trt/types';
import { AgrupamentoProcessoTarefa } from '@/backend/types/pje-trt/types';
import { fetchPJEAPI } from '../shared/fetch';

export async function obterTotalizadoresAcervoGeral(
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
      (t) => t.idAgrupamentoProcessoTarefa === AgrupamentoProcessoTarefa.ACERVO_GERAL
    ) || null
  );
}
