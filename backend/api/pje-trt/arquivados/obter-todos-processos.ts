/**
 * Arquivo: arquivados/obter-todos-processos.ts
 * 
 * PROPÓSITO:
 * Obtém TODAS as páginas de processos arquivados automaticamente.
 * Esta função faz paginação automática internamente, chamando obterProcessosArquivados() várias vezes
 * até obter todos os processos arquivados disponíveis.
 * 
 * PARÂMETROS:
 * - page: Page (obrigatório) - Instância da página do navegador autenticada no PJE
 * - idAdvogado: number (obrigatório) - ID do advogado no sistema PJE
 * - delayEntrePaginas: number (opcional, padrão: 500) - Delay em ms entre requisições
 * - paramsAdicionais?: Record<string, string | number | boolean> (opcional) - Parâmetros adicionais
 *   Exemplos:
 *   - { tipoPainelAdvogado: 5, ordenacaoCrescente: false, data: Date.now() }
 * 
 * RETORNO:
 * Promise<Processo[]> - Array com TODOS os processos arquivados de todas as páginas
 * 
 * ENDPOINT HTTP:
 * Mesmo endpoint de obterProcessosArquivados(), mas chamado múltiplas vezes:
 * GET /pje-comum-api/api/paineladvogado/{idAdvogado}/processos?idAgrupamentoProcessoTarefa=5&pagina={pagina}&tamanhoPagina=100&{paramsAdicionais}
 * 
 * COMPORTAMENTO ESPECIAL:
 * 1. Paginação Automática
 * 2. Validações de resposta e arrays
 * 3. Rate Limiting (delay padrão: 500ms)
 * 
 * EXEMPLO DE USO:
 * const todosProcessos = await obterTodosProcessosArquivados(page, 12345, 500, {
 *   tipoPainelAdvogado: 5,
 *   ordenacaoCrescente: false,
 *   data: Date.now()
 * });
 */

import type { Page } from 'playwright';
import type { Processo } from '@/backend/types/pje-trt/types';
import { obterProcessosArquivados } from './obter-processos';

export async function obterTodosProcessosArquivados(
  page: Page,
  idAdvogado: number,
  delayEntrePaginas: number = 500,
  paramsAdicionais?: Record<string, string | number | boolean>
): Promise<Processo[]> {
  const todosProcessos: Processo[] = [];

  // Primeira página para obter total de páginas
  const primeiraPagina = await obterProcessosArquivados(
    page,
    idAdvogado,
    1,
    100, // Sempre usa tamanhoPagina=100 para minimizar requisições
    paramsAdicionais
  );

  // Validar estrutura da resposta
  if (!primeiraPagina || typeof primeiraPagina !== 'object') {
    throw new Error(`Resposta inválida da API: ${JSON.stringify(primeiraPagina)}`);
  }

  // Determinar quantidade real de registros no array resultado
  const registrosNaPagina = primeiraPagina.resultado?.length || 0;

  // IMPORTANTE: A API do PJE retorna qtdPaginas=0 quando há apenas 1 página de resultados!
  // Por isso, verificamos o array resultado diretamente, não o campo qtdPaginas.
  if (!Array.isArray(primeiraPagina.resultado) || registrosNaPagina === 0) {
    return [];
  }

  // Adiciona processos da primeira página ao array final
  todosProcessos.push(...primeiraPagina.resultado);

  // Calcular total de páginas (qtdPaginas=0 significa 1 página quando há resultados)
  const qtdPaginas = primeiraPagina.qtdPaginas > 0 ? primeiraPagina.qtdPaginas : 1;
  for (let p = 2; p <= qtdPaginas; p++) {
    // Delay para rate limiting (evita sobrecarregar o servidor)
    await new Promise((resolve) => setTimeout(resolve, delayEntrePaginas));

    // Busca a página atual
    const pagina = await obterProcessosArquivados(
      page,
      idAdvogado,
      p,
      100, // Sempre usa tamanhoPagina=100
      paramsAdicionais
    );

    // Valida resposta da página atual
    if (!pagina || !Array.isArray(pagina.resultado)) {
      throw new Error(
        `Resposta inválida na página ${p}: ${JSON.stringify(pagina)}`
      );
    }

    // Adiciona processos da página atual ao array final
    todosProcessos.push(...pagina.resultado);
  }

  return todosProcessos;
}
