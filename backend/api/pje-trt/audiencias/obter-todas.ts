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
import type { Audiencia } from '@/backend/types/pje-trt/types';
import { obterPautaAudiencias } from './obter-pauta';

export async function obterTodasAudiencias(
  page: Page,
  dataInicio: string,
  dataFim: string,
  codigoSituacao: string = 'M',
  delayEntrePaginas: number = 500
): Promise<Audiencia[]> {
  const todasAudiencias: Audiencia[] = [];

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

  console.log('📊 [obterTodasAudiencias] Primeira página recebida:', {
    totalRegistros: primeiraPagina.totalRegistros,
    qtdPaginas: primeiraPagina.qtdPaginas,
    resultadoLength: primeiraPagina.resultado?.length || 0,
    temResultado: 'resultado' in primeiraPagina,
  });

  // Validar estrutura da resposta
  if (!primeiraPagina || typeof primeiraPagina !== 'object') {
    console.error('❌ [obterTodasAudiencias] Resposta inválida:', primeiraPagina);
    throw new Error(`Resposta inválida da API: ${JSON.stringify(primeiraPagina)}`);
  }

  // Caso especial: quando não há resultados (totalRegistros=0), a API pode não retornar o campo 'resultado'
  // Neste caso, retornar array vazio sem erro
  if (primeiraPagina.totalRegistros === 0 || primeiraPagina.qtdPaginas === 0) {
    console.log('ℹ️ [obterTodasAudiencias] Nenhum resultado encontrado (totalRegistros=0 ou qtdPaginas=0)');
    return [];
  }

  // Validar que resultado existe e é um array (apenas se houver resultados esperados)
  if (!('resultado' in primeiraPagina) || !Array.isArray(primeiraPagina.resultado)) {
    console.error('❌ [obterTodasAudiencias] Campo resultado não existe ou não é array:', primeiraPagina);
    throw new Error(
      `Campo 'resultado' não existe ou não é um array na resposta da API. Estrutura recebida: ${JSON.stringify(primeiraPagina, null, 2)}`
    );
  }

  // Se o array está vazio mas totalRegistros > 0, pode ser um problema
  // Mas ainda assim retornamos array vazio para não quebrar o fluxo
  if (primeiraPagina.resultado.length === 0) {
    console.log('ℹ️ [obterTodasAudiencias] Array resultado está vazio (mas totalRegistros > 0)');
    return [];
  }

  console.log(`✅ [obterTodasAudiencias] Adicionando ${primeiraPagina.resultado.length} audiências da primeira página`);
  todasAudiencias.push(...primeiraPagina.resultado);

  // Buscar páginas restantes
  const qtdPaginas = primeiraPagina.qtdPaginas || 1;
  console.log(`📄 [obterTodasAudiencias] Total de páginas: ${qtdPaginas}`);

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
    }
  }

  console.log(`✅ [obterTodasAudiencias] Total de audiências obtidas: ${todasAudiencias.length}`);
  return todasAudiencias;
}
