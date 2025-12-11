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
 * GET /pje-comum-api/api/processos/id/{idProcesso}/partes
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

/**
 * Resultado da obtenção de partes do PJE
 */
export interface ObterPartesProcessoResult {
  partes: PartePJE[];
  payloadBruto: Record<string, unknown> | null;
}

/**
 * Função: obterPartesProcesso
 *
 * FLUXO DE EXECUÇÃO:
 * 1. Faz requisição GET para /pje-comum-api/api/processos/id/{idProcesso}/partes
 * 2. Normaliza resposta (pode vir como array ou objeto com polos ATIVO/PASSIVO/OUTROS)
 * 3. Para cada parte, extrai representantes do campo 'representantes' do JSON
 * 4. Mapeia resposta do PJE para tipo PartePJE padronizado
 * 5. Retorna array de PartePJE com representantes incluídos E o JSON bruto completo
 *
 * TRATAMENTO DE ERROS:
 * - Se processo não encontrado: retorna { partes: [], payloadBruto: null }
 * - Se erro de rede: propaga exceção
 * - Se resposta inválida: propaga exceção
 * - Se erro ao buscar representantes: loga warning e continua (representantes = [])
 *
 * PERFORMANCE:
 * - Representantes já vêm no JSON (não precisa fazer chamadas extras)
 * - Tempo típico: 200-500ms (depende de quantidade de partes)
 */
export async function obterPartesProcesso(
  page: Page,
  idProcesso: number
): Promise<ObterPartesProcessoResult> {
  try {
    console.log(`[PJE-PARTES-API] Buscando partes do processo ${idProcesso}`);

    // Faz requisição para obter partes do processo
    const response = await fetchPJEAPI<Record<string, unknown>>(
      page,
      `/pje-comum-api/api/processos/id/${idProcesso}/partes`
    );

    // Se resposta for vazia, retorna array vazio
    if (!response) {
      console.log(`[PJE-PARTES-API] Processo ${idProcesso} não possui partes cadastradas`);
      return { partes: [], payloadBruto: null };
    }

    // Normalizar resposta: pode vir como array OU objeto com polos { ATIVO: [], PASSIVO: [], OUTROS: [] }
    let partesArray: Record<string, unknown>[] = [];

    if (Array.isArray(response)) {
      // Formato array direto (usado por alguns TRTs)
      partesArray = response;
    } else if (typeof response === 'object') {
      // Formato objeto com polos { ATIVO: [...], PASSIVO: [...], TERCEIROS: [...] }
      // NOTA: API retorna "TERCEIROS" (não "OUTROS") para partes do polo outros
      const polos = ['ATIVO', 'PASSIVO', 'TERCEIROS', 'OUTROS', 'ativo', 'passivo', 'terceiros', 'outros'];
      for (const polo of polos) {
        if (Array.isArray(response[polo])) {
          partesArray.push(...response[polo]);
        }
      }
    }

    if (partesArray.length === 0) {
      console.log(`[PJE-PARTES-API] Processo ${idProcesso} não possui partes cadastradas`);
      return { partes: [], payloadBruto: response };
    }

    console.log(`[PJE-PARTES-API] Encontradas ${partesArray.length} partes no processo ${idProcesso}`);

    // Mapeia cada parte para o tipo PartePJE
    const partesComRepresentantes = await Promise.all(
      partesArray.map(async (parteData: Record<string, unknown>, index: number) => {
        try {
          // Representantes sempre vêm no JSON de partes
          const representantesRaw = Array.isArray(parteData.representantes) ? parteData.representantes : [];
          
          // Mapear representantes para o formato esperado pela interface
          const representantes = representantesRaw.map((rep: Record<string, unknown>) => {
            // Extrair número da OAB e UF (pode vir junto como "BA79812" ou separado)
            const numeroOabRaw = String(rep.numeroOab || rep.numero_oab || '');
            const { numeroOAB, ufOAB } = extrairOabEUf(
              numeroOabRaw,
              rep.ufOab as string | undefined || rep.uf_oab as string | undefined
            );

            return {
              idPessoa: Number(rep.idPessoa || rep.id_pessoa || 0),
              nome: String(rep.nome || ''),
              tipoDocumento: (rep.tipoDocumento || rep.tipo_documento || 'CPF') as 'CPF' | 'CNPJ',
              numeroDocumento: String(rep.documento || rep.numeroDocumento || rep.numero_documento || rep.cpf || ''),
              numeroOAB,
              ufOAB,
              situacaoOAB: rep.situacaoOab || rep.situacao_oab ? String(rep.situacaoOab || rep.situacao_oab) : null,
              tipo: String(rep.tipo || 'ADVOGADO'),
              email: rep.email ? String(rep.email) : null,
              telefones: extrairTelefones(rep),
              dadosCompletos: rep,
            };
          });

          // Mapeia dados da API PJE para tipo PartePJE
          const parte: PartePJE = {
            idParte: Number(parteData.id || parteData.idParte),
            idPessoa: Number(parteData.idPessoa || parteData.id_pessoa),
            nome: String(parteData.nome || parteData.nomeCompleto || ''),
            tipoParte: String(parteData.tipo || parteData.tipoParte || parteData.tipo_parte || 'OUTRO'),
            polo: mapearPolo(parteData.polo as string | undefined),
            principal: Boolean(parteData.principal || parteData.partePrincipal),
            tipoDocumento: mapearTipoDocumento(parteData.tipoDocumento as string | undefined || parteData.tipo_documento as string | undefined),
            numeroDocumento: String(parteData.documento || parteData.numeroDocumento || parteData.numero_documento || ''),
            emails: extrairEmails(parteData),
            telefones: extrairTelefones(parteData),
            representantes,
            dadosCompletos: parteData, // Guarda JSON original para auditoria
          };

          console.log(
            `[PJE-PARTES-API] Parte ${index + 1}/${partesArray.length}: ${parte.nome} (${parte.tipoParte}) - ${representantes.length} representantes`
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
            idParte: Number(parteData.id || parteData.idParte),
            idPessoa: Number(parteData.idPessoa || parteData.id_pessoa),
            nome: String(parteData.nome || parteData.nomeCompleto || ''),
            tipoParte: String(parteData.tipo || parteData.tipoParte || parteData.tipo_parte || 'OUTRO'),
            polo: mapearPolo(parteData.polo as string | undefined),
            principal: Boolean(parteData.principal || parteData.partePrincipal),
            tipoDocumento: mapearTipoDocumento(parteData.tipoDocumento as string | undefined || parteData.tipo_documento as string | undefined),
            numeroDocumento: String(parteData.documento || parteData.numeroDocumento || parteData.numero_documento || ''),
            emails: extrairEmails(parteData),
            telefones: extrairTelefones(parteData),
            representantes: [], // Vazio por conta do erro
            dadosCompletos: parteData,
          };

          return parte;
        }
      })
    );

    return {
      partes: partesComRepresentantes,
      payloadBruto: response
    };
  } catch (error) {
    console.error(`[PJE-PARTES-API] Erro ao obter partes do processo ${idProcesso}:`, error);

    // Se for erro 404 (processo não encontrado), retorna array vazio
    if (error instanceof Error && error.message.includes('HTTP 404')) {
      console.log(`[PJE-PARTES-API] Processo ${idProcesso} não encontrado`);
      return { partes: [], payloadBruto: null };
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
function extrairEmails(parteData: Record<string, unknown>): string[] {
  const emails: string[] = [];

  // Pode vir como array
  if (Array.isArray(parteData.emails)) {
    emails.push(...parteData.emails.filter((e: unknown) => typeof e === 'string'));
  }

  // Pode vir como string única
  if (typeof parteData.email === 'string' && parteData.email) {
    emails.push(parteData.email);
  }

  // Remove duplicatas
  return [...new Set(emails)];
}

/**
 * Lista de UFs válidas do Brasil
 */
const UFS_BRASIL = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

/**
 * Extrai número da OAB e UF
 * O PJE pode retornar o número junto com UF como prefixo (ex: "BA79812") ou separados
 * 
 * Formatos possíveis:
 * - "BA79812" → UF: BA, Número: 79812
 * - "MG128404" → UF: MG, Número: 128404
 * - "79812" (com ufOab separado) → usa ufOab fornecido
 */
function extrairOabEUf(
  numeroOabRaw: string,
  ufOabSeparado?: string
): { numeroOAB: string | null; ufOAB: string | null } {
  if (!numeroOabRaw || numeroOabRaw.trim() === '') {
    return { numeroOAB: null, ufOAB: ufOabSeparado ? String(ufOabSeparado).toUpperCase() : null };
  }

  const numeroLimpo = numeroOabRaw.trim().toUpperCase();

  // Se UF foi fornecida separadamente, usar ela
  if (ufOabSeparado && ufOabSeparado.trim() !== '') {
    return {
      numeroOAB: numeroLimpo,
      ufOAB: String(ufOabSeparado).toUpperCase()
    };
  }

  // Tentar extrair UF do prefixo do número (ex: "BA79812")
  // Verificar se os primeiros 2 caracteres são uma UF válida
  if (numeroLimpo.length >= 3) {
    const possibleUf = numeroLimpo.substring(0, 2);
    if (UFS_BRASIL.includes(possibleUf)) {
      const numeroSemUf = numeroLimpo.substring(2);
      // Verificar se o resto é numérico
      if (/^\d+$/.test(numeroSemUf)) {
        return {
          numeroOAB: numeroSemUf,
          ufOAB: possibleUf
        };
      }
    }
  }

  // Se não conseguir extrair, retornar como está
  return { numeroOAB: numeroLimpo, ufOAB: null };
}

/**
 * Extrai telefones da parte (pode estar em diferentes formatos)
 */
function extrairTelefones(parteData: Record<string, unknown>): Array<{ ddd: string; numero: string }> {
  const telefones: Array<{ ddd: string; numero: string }> = [];

  // Pode vir como array de objetos
  if (Array.isArray(parteData.telefones)) {
    for (const tel of parteData.telefones) {
      if (tel.ddd && tel.numero) {
        telefones.push({ ddd: String(tel.ddd), numero: String(tel.numero) });
      }
    }
  }

  // Pode vir como campos separados (snake_case)
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

  // Pode vir como campos separados (camelCase)
  if (parteData.dddCelular && parteData.numeroCelular) {
    telefones.push({
      ddd: String(parteData.dddCelular),
      numero: String(parteData.numeroCelular),
    });
  }

  if (parteData.dddResidencial && parteData.numeroResidencial) {
    telefones.push({
      ddd: String(parteData.dddResidencial),
      numero: String(parteData.numeroResidencial),
    });
  }

  if (parteData.dddComercial && parteData.numeroComercial) {
    telefones.push({
      ddd: String(parteData.dddComercial),
      numero: String(parteData.numeroComercial),
    });
  }

  // Remove duplicatas
  const uniqueTelefones = telefones.filter((tel, index, self) =>
    index === self.findIndex(t => t.ddd === tel.ddd && t.numero === tel.numero)
  );

  return uniqueTelefones;
}
