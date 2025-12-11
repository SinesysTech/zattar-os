/**
 * Arquivo: audiencias/obter-todas.ts
 * 
 * PROPÓSITO:
 * Obtém TODAS as páginas de audiências de um período automaticamente.
 * Esta função faz paginação automática internamente, chamando obterPautaAudiencias() várias vezes
 * até obter todas as audiências disponíveis no período especificado.
 * 
 * PARÂMETROS:
 * - page: Page (obrigatório) - Instância da página do navegador autenticada no PJE
 * - dataInicio: string (obrigatório) - Data inicial do período (formato: YYYY-MM-DD)
 * - dataFim: string (obrigatório) - Data final do período (formato: YYYY-MM-DD)
 * - codigoSituacao: string (opcional, padrão: 'M') - Código da situação das audiências:
 *   - 'C': Canceladas
 *   - 'M': Designadas (padrão)
 *   - 'F': Realizadas
 * - delayEntrePaginas: number (opcional, padrão: 500) - Delay em ms entre requisições
 * 
 * RETORNO:
 * Promise<Audiencia[]> - Array com TODAS as audiências de todas as páginas no período
 * 
 * COMPORTAMENTO ESPECIAL:
 * 1. Paginação Automática - Chama obterPautaAudiencias() para cada página
 * 2. Validações - Valida estrutura da resposta e arrays
 * 3. Rate Limiting - Delay entre páginas (padrão: 500ms)
 * 4. Logging Detalhado - Registra progresso de cada página
 * 
 * EXEMPLO DE USO:
 * const todasAudiencias = await obterTodasAudiencias(
 *   page,
 *   '2024-01-01',
 *   '2024-12-31',
 *   'M'
 * );
 */

import type { Page } from 'playwright';
import type { Audiencia, PagedResponse } from '@/backend/types/pje-trt/types';
import { obterPautaAudiencias } from './obter-pauta';

export interface TodasAudienciasComPaginas {
  audiencias: Audiencia[];
  paginas: PagedResponse<Audiencia>[];
}

export async function obterTodasAudiencias(
  page: Page,
  dataInicio: string,
  dataFim: string,
  codigoSituacao: string = 'M',
  delayEntrePaginas: number = 500
): Promise<TodasAudienciasComPaginas> {
  const todasAudiencias: Audiencia[] = [];
  const paginasBrutas: PagedResponse<Audiencia>[] = [];

  console.log('🔍 [obterTodasAudiencias] Iniciando busca de audiências...', {
    dataInicio,
    dataFim,
    codigoSituacao,
  });

  // Primeira página para obter total de páginas
  console.log('📄 [obterTodasAudiencias] Buscando primeira página...');
  const primeiraPagina = await obterPautaAudiencias(
    page,
    dataInicio,
    dataFim,
    1, // numeroPagina
    100, // tamanhoPagina (sempre usa máximo para minimizar requisições)
    codigoSituacao,
    'asc' // ordenacao (sempre usa 'asc' como padrão)
  );

  paginasBrutas.push(primeiraPagina);

  // Validar estrutura da resposta
  if (!primeiraPagina || typeof primeiraPagina !== 'object') {
    console.error('❌ [obterTodasAudiencias] Resposta inválida da API');
    throw new Error(`Resposta inválida da API: ${JSON.stringify(primeiraPagina)}`);
  }

  // Determinar quantidade real de registros no array resultado
  const registrosNaPagina = primeiraPagina.resultado?.length || 0;

  // IMPORTANTE: A API do PJE retorna qtdPaginas=0 quando há apenas 1 página de resultados!
  // Por isso, verificamos o array resultado diretamente, não o campo qtdPaginas.
  // Se não há campo resultado ou está vazio, não há audiências
  if (!('resultado' in primeiraPagina) || !Array.isArray(primeiraPagina.resultado) || registrosNaPagina === 0) {
    console.log(`ℹ️ [obterTodasAudiencias] Nenhuma audiência encontrada no período ${dataInicio} a ${dataFim}`);
    return {
      audiencias: [],
      paginas: paginasBrutas,
    };
  }

  // Calcular total de páginas (qtdPaginas=0 significa 1 página quando há resultados)
  const qtdPaginas = primeiraPagina.qtdPaginas > 0 ? primeiraPagina.qtdPaginas : 1;

  console.log(`📊 [obterTodasAudiencias] Página 1/${qtdPaginas}: ${registrosNaPagina} audiências (total: ${primeiraPagina.totalRegistros})`);
  todasAudiencias.push(...primeiraPagina.resultado);

  if (qtdPaginas > 1) {
    for (let p = 2; p <= qtdPaginas; p++) {
      // Delay para rate limiting (evita sobrecarregar o servidor)
      await new Promise((resolve) => setTimeout(resolve, delayEntrePaginas));

      console.log(`📄 [obterTodasAudiencias] Buscando página ${p}/${qtdPaginas}...`);
      const pagina = await obterPautaAudiencias(
        page,
        dataInicio,
        dataFim,
        p, // numeroPagina
        100, // tamanhoPagina (sempre usa máximo)
        codigoSituacao,
        'asc' // ordenacao (sempre usa 'asc')
      );

      if (!pagina || !Array.isArray(pagina.resultado)) {
        console.error(`❌ [obterTodasAudiencias] Resposta inválida na página ${p}:`, pagina);
        throw new Error(
          `Resposta inválida na página ${p}: ${JSON.stringify(pagina)}`
        );
      }

      console.log(`✅ [obterTodasAudiencias] Adicionando ${pagina.resultado.length} audiências da página ${p}`);
      todasAudiencias.push(...pagina.resultado);
      paginasBrutas.push(pagina);
    }
  }

  console.log(`✅ [obterTodasAudiencias] Total de audiências obtidas: ${todasAudiencias.length}`);
  return {
    audiencias: todasAudiencias,
    paginas: paginasBrutas,
  };
}
