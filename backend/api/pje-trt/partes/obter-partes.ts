/**
 * Arquivo: partes/obter-partes.ts
 *
 * PROPÓSITO:
 * Obtém todas as partes (pessoas envolvidas) de um processo específico do PJE-TRT.
 * Retorna dados completos de cada parte incluindo seus representantes legais.
 *
 * PARÂMETROS:
 * - page: Page (obrigatório)
 *   Tipo: Page do Playwright
 *   Significado: Instância da página do navegador autenticada no PJE
 *   Como obter: Retorno da função de autenticação do PJE
 *
 * - idProcesso: number (obrigatório)
 *   Tipo: number
 *   Significado: ID interno do processo no sistema PJE (não é o número CNJ)
 *   Como obter: Extraído da resposta de endpoints de acervo geral, audiências, etc.
 *   Exemplo: 12345678 (número sequencial interno do PJE)
 *
 * RETORNO:
 * Tipo: Promise<PartePJE[]>
 * Significado: Array de partes do processo com dados completos
 * Formato: Cada objeto contém dados da parte + array de representantes
 *
 * ENDPOINT HTTP:
 * GET /pje-backend-api/api/processos/{idProcesso}/partes
 *
 * IMPORTANTE:
 * - Endpoint não é documentado oficialmente pelo PJE
 * - URL pode variar entre tribunais (TRT1-TRT24)
 * - Requer autenticação via cookies de sessão
 * - Pode retornar array vazio [] se processo não tiver partes cadastradas
 *
 * ESTRUTURA DE RESPOSTA DA API PJE:
 * [
 *   {
 *     "id": 123,
 *     "idPessoa": 456789,
 *     "nome": "João da Silva",
 *     "tipoParte": "AUTOR",
 *     "polo": "ATIVO",
 *     "principal": true,
 *     "tipoDocumento": "CPF",
 *     "numeroDocumento": "12345678900",
 *     "emails": ["joao@exemplo.com"],
 *     "telefones": [{ "ddd": "31", "numero": "987654321" }],
 *     // ... outros campos variáveis por tribunal
 *   },
 *   // ... mais partes
 * ]
 *
 * EXEMPLO DE USO:
 * const partes = await obterPartesProcesso(page, 12345678);
 * console.log(`Processo possui ${partes.length} partes`);
 * for (const parte of partes) {
 *   console.log(`- ${parte.nome} (${parte.tipoParte})`);
 * }
 */

import type { Page } from 'playwright';
import { fetchPJEAPI } from '../shared/fetch';
import type { PartePJE } from './types';
import { obterRepresentantesPartePorID } from './obter-representantes';

/**
 * Função: obterPartesProcesso
 *
 * FLUXO DE EXECUÇÃO:
 * 1. Faz requisição GET para /pje-backend-api/api/processos/{idProcesso}/partes
 * 2. Recebe array de objetos com dados das partes
 * 3. Para cada parte, busca seus representantes via obterRepresentantesPartePorID()
 * 4. Mapeia resposta do PJE para tipo PartePJE padronizado
 * 5. Retorna array de PartePJE com representantes incluídos
 *
 * TRATAMENTO DE ERROS:
 * - Se processo não encontrado: retorna []
 * - Se erro de rede: propaga exceção
 * - Se resposta inválida: propaga exceção
 * - Se erro ao buscar representantes: loga warning e continua (representantes = [])
 *
 * PERFORMANCE:
 * - Busca representantes em paralelo usando Promise.all()
 * - Tempo típico: 500-2000ms (depende de quantidade de partes)
 */
export async function obterPartesProcesso(
  page: Page,
  idProcesso: number
): Promise<PartePJE[]> {
  try {
    console.log(`[PJE-PARTES-API] Buscando partes do processo ${idProcesso}`);

    // Faz requisição para obter partes do processo
    const response = await fetchPJEAPI<any[]>(
      page,
      `/pje-backend-api/api/processos/${idProcesso}/partes`
    );

    // Se resposta for vazia ou não for array, retorna array vazio
    if (!response || !Array.isArray(response)) {
      console.log(`[PJE-PARTES-API] Processo ${idProcesso} não possui partes cadastradas`);
      return [];
    }

    console.log(`[PJE-PARTES-API] Encontradas ${response.length} partes no processo ${idProcesso}`);

    // Para cada parte, busca seus representantes em paralelo
    const partesComRepresentantes = await Promise.all(
      response.map(async (parteData: any, index: number) => {
        try {
          // Busca representantes da parte
          const representantes = await obterRepresentantesPartePorID(page, parteData.id || parteData.idParte);

          // Mapeia dados da API PJE para tipo PartePJE
          const parte: PartePJE = {
            idParte: parteData.id || parteData.idParte,
            idPessoa: parteData.idPessoa || parteData.id_pessoa,
            nome: parteData.nome || parteData.nomeCompleto || '',
            tipoParte: parteData.tipoParte || parteData.tipo_parte || 'OUTRO',
            polo: mapearPolo(parteData.polo),
            principal: parteData.principal || parteData.partePrincipal || false,
            tipoDocumento: mapearTipoDocumento(parteData.tipoDocumento || parteData.tipo_documento),
            numeroDocumento: parteData.numeroDocumento || parteData.numero_documento || '',
            emails: extrairEmails(parteData),
            telefones: extrairTelefones(parteData),
            representantes,
            dadosCompletos: parteData, // Guarda JSON original para auditoria
          };

          console.log(
            `[PJE-PARTES-API] Parte ${index + 1}/${response.length}: ${parte.nome} (${parte.tipoParte}) - ${representantes.length} representantes`
          );

          return parte;
        } catch (error) {
          // Se falhar ao buscar representantes, loga warning e continua
          console.warn(
            `[PJE-PARTES-API] Erro ao buscar representantes da parte ${parteData.id}:`,
            error instanceof Error ? error.message : error
          );

          // Retorna parte sem representantes
          const parte: PartePJE = {
            idParte: parteData.id || parteData.idParte,
            idPessoa: parteData.idPessoa || parteData.id_pessoa,
            nome: parteData.nome || parteData.nomeCompleto || '',
            tipoParte: parteData.tipoParte || parteData.tipo_parte || 'OUTRO',
            polo: mapearPolo(parteData.polo),
            principal: parteData.principal || parteData.partePrincipal || false,
            tipoDocumento: mapearTipoDocumento(parteData.tipoDocumento || parteData.tipo_documento),
            numeroDocumento: parteData.numeroDocumento || parteData.numero_documento || '',
            emails: extrairEmails(parteData),
            telefones: extrairTelefones(parteData),
            representantes: [], // Vazio por conta do erro
            dadosCompletos: parteData,
          };

          return parte;
        }
      })
    );

    return partesComRepresentantes;
  } catch (error) {
    console.error(`[PJE-PARTES-API] Erro ao obter partes do processo ${idProcesso}:`, error);

    // Se for erro 404 (processo não encontrado), retorna array vazio
    if (error instanceof Error && error.message.includes('HTTP 404')) {
      console.log(`[PJE-PARTES-API] Processo ${idProcesso} não encontrado`);
      return [];
    }

    // Para outros erros, propaga exceção
    throw error;
  }
}

/**
 * Mapeia polo da parte para tipo padronizado
 */
function mapearPolo(polo: string | undefined): 'ATIVO' | 'PASSIVO' | 'OUTROS' {
  if (!polo) return 'OUTROS';

  const poloUpper = polo.toUpperCase();
  if (poloUpper === 'ATIVO' || poloUpper === 'POLO_ATIVO') return 'ATIVO';
  if (poloUpper === 'PASSIVO' || poloUpper === 'POLO_PASSIVO') return 'PASSIVO';

  return 'OUTROS';
}

/**
 * Mapeia tipo de documento para tipo padronizado
 */
function mapearTipoDocumento(tipo: string | undefined): 'CPF' | 'CNPJ' | 'OUTRO' {
  if (!tipo) return 'OUTRO';

  const tipoUpper = tipo.toUpperCase();
  if (tipoUpper === 'CPF') return 'CPF';
  if (tipoUpper === 'CNPJ') return 'CNPJ';

  return 'OUTRO';
}

/**
 * Extrai emails da parte (pode estar em diferentes formatos)
 */
function extrairEmails(parteData: any): string[] {
  const emails: string[] = [];

  // Pode vir como array
  if (Array.isArray(parteData.emails)) {
    emails.push(...parteData.emails.filter((e: any) => typeof e === 'string'));
  }

  // Pode vir como string única
  if (typeof parteData.email === 'string' && parteData.email) {
    emails.push(parteData.email);
  }

  // Remove duplicatas
  return [...new Set(emails)];
}

/**
 * Extrai telefones da parte (pode estar em diferentes formatos)
 */
function extrairTelefones(parteData: any): Array<{ ddd: string; numero: string }> {
  const telefones: Array<{ ddd: string; numero: string }> = [];

  // Pode vir como array de objetos
  if (Array.isArray(parteData.telefones)) {
    for (const tel of parteData.telefones) {
      if (tel.ddd && tel.numero) {
        telefones.push({ ddd: String(tel.ddd), numero: String(tel.numero) });
      }
    }
  }

  // Pode vir como campos separados
  if (parteData.ddd_telefone && parteData.numero_telefone) {
    telefones.push({
      ddd: String(parteData.ddd_telefone),
      numero: String(parteData.numero_telefone),
    });
  }

  if (parteData.ddd_celular && parteData.numero_celular) {
    telefones.push({
      ddd: String(parteData.ddd_celular),
      numero: String(parteData.numero_celular),
    });
  }

  return telefones;
}
