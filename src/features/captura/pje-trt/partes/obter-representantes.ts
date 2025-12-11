/**
 * Arquivo: partes/obter-representantes.ts
 *
 * PROPÓSITO:
 * Obtém os representantes legais (advogados, defensores, procuradores) de uma parte específica.
 * Representantes são pessoas autorizadas a atuar em nome da parte no processo.
 *
 * PARÂMETROS:
 * - page: Page (obrigatório)
 *   Tipo: Page do Playwright
 *   Significado: Instância da página do navegador autenticada no PJE
 *
 * - idParte: number (obrigatório)
 *   Tipo: number
 *   Significado: ID único da parte no sistema PJE
 *   Como obter: Campo 'id' ou 'idParte' da resposta de obterPartesProcesso()
 *   Exemplo: 123456
 *
 * RETORNO:
 * Tipo: Promise<RepresentantePJE[]>
 * Significado: Array de representantes com dados completos (nome, CPF, OAB, etc.)
 * Formato: Cada objeto contém dados cadastrais do representante
 *
 * ENDPOINT HTTP:
 * GET /pje-comum-api/api/partes/{idParte}/representantes
 *
 * IMPORTANTE:
 * - Endpoint não é documentado oficialmente pelo PJE
 * - Pode retornar array vazio [] se parte não tiver representantes
 * - Representantes podem não ter OAB (ex: defensores públicos, procuradores)
 * - CPF pode estar ausente em alguns casos (raros)
 *
 * ESTRUTURA DE RESPOSTA DA API PJE:
 * [
 *   {
 *     "idPessoa": 789,
 *     "nome": "Dra. Maria Advogada",
 *     "tipoDocumento": "CPF",
 *     "numeroDocumento": "98765432100",
 *     "numeroOAB": "123456",
 *     "ufOAB": "MG",
 *     "situacaoOAB": "ATIVO",
 *     "tipo": "ADVOGADO",
 *     "email": "maria@exemplo.com",
 *     "telefones": [{ "ddd": "31", "numero": "987654321" }]
 *   },
 *   // ... mais representantes
 * ]
 *
 * EXEMPLO DE USO:
 * const representantes = await obterRepresentantesPartePorID(page, 123456);
 * console.log(`Parte possui ${representantes.length} representantes`);
 * for (const rep of representantes) {
 *   console.log(`- ${rep.nome} (OAB: ${rep.numeroOAB}/${rep.ufOAB})`);
 * }
 */

import type { Page } from 'playwright';
import { fetchPJEAPI } from '../shared/fetch';
import type { RepresentantePJE, TelefoneContato } from './types';

// Raw data from PJE API
interface RepresentantePJERaw {
  idPessoa?: number;
  id_pessoa?: number;
  nome?: string;
  nomeCompleto?: string;
  tipoDocumento?: string;
  tipo_documento?: string;
  numeroDocumento?: string;
  numero_documento?: string;
  cpf?: string;
  cnpj?: string;
  numeroOAB?: string;
  numeroOab?: string;
  numero_oab?: string;
  ufOAB?: string;
  ufOab?: string;
  uf_oab?: string;
  situacaoOAB?: string;
  situacaoOab?: string;
  situacao_oab?: string;
  tipo?: string;
  tipoRepresentante?: string;
  email?: string;
  telefones?: { ddd: string; numero: string }[];
  ddd_telefone?: string;
  numero_telefone?: string;
  ddd_celular?: string;
  numero_celular?: string;
}

/**
 * Função: obterRepresentantesPartePorID
 *
 * FLUXO DE EXECUÇÃO:
 * 1. Faz requisição GET para /pje-backend-api/api/partes/{idParte}/representantes
 * 2. Recebe array de objetos com dados dos representantes
 * 3. Mapeia resposta do PJE para tipo RepresentantePJE padronizado
 * 4. Retorna array de RepresentantePJE
 *
 * TRATAMENTO DE ERROS:
 * - Se parte não encontrada: retorna []
 * - Se parte não tem representantes: retorna []
 * - Se erro de rede: propaga exceção
 * - Se resposta inválida: retorna [] com warning
 *
 * PERFORMANCE:
 * - Tempo típico: 200-500ms
 * - Não faz chamadas adicionais (apenas 1 request)
 */
export async function obterRepresentantesPartePorID(
  page: Page,
  idParte: number
): Promise<RepresentantePJE[]> {
  try {
    console.log(`[PJE-PARTES-API] Buscando representantes da parte ${idParte}`);

    // Faz requisição para obter representantes da parte
    const response = await fetchPJEAPI<RepresentantePJERaw[]>(
      page,
      `/pje-comum-api/api/partes/${idParte}/representantes`
    );

    // Se resposta for vazia ou não for array, retorna array vazio
    if (!response || !Array.isArray(response)) {
      console.log(`[PJE-PARTES-API] Parte ${idParte} não possui representantes`);
      return [];
    }

    console.log(`[PJE-PARTES-API] Encontrados ${response.length} representantes para parte ${idParte}`);

    // Mapeia cada representante para tipo padronizado
    const representantes: RepresentantePJE[] = response.map((repData: RepresentantePJERaw) => {
      // Extrair número da OAB e UF (pode vir junto como "BA79812" ou separado)
      const numeroOabRaw = String(repData.numeroOAB || repData.numeroOab || repData.numero_oab || '');
      const { numeroOAB, ufOAB } = extrairOabEUf(
        numeroOabRaw,
        repData.ufOAB || repData.ufOab || repData.uf_oab
      );

      return {
        idPessoa: repData.idPessoa || repData.id_pessoa,
        nome: repData.nome || repData.nomeCompleto || '',
        tipoDocumento: mapearTipoDocumento(repData.tipoDocumento || repData.tipo_documento),
        numeroDocumento: repData.numeroDocumento || repData.numero_documento || repData.cpf || repData.cnpj || '',
        numeroOAB,
        ufOAB,
        situacaoOAB: repData.situacaoOAB || repData.situacaoOab || repData.situacao_oab || null,
        tipo: repData.tipo || repData.tipoRepresentante || 'ADVOGADO',
        email: repData.email || null,
        telefones: extrairTelefones(repData),
        dadosCompletos: repData, // Guarda JSON original para auditoria
      };
    });

    return representantes;
  } catch (error) {
    console.error(`[PJE-PARTES-API] Erro ao obter representantes da parte ${idParte}:`, error);

    // Se for erro 404 (parte não encontrada ou sem representantes), retorna array vazio
    if (error instanceof Error && error.message.includes('HTTP 404')) {
      console.log(`[PJE-PARTES-API] Parte ${idParte} não encontrada ou não possui representantes`);
      return [];
    }

    // Para outros erros, propaga exceção
    throw error;
  }
}

/**
 * Mapeia tipo de documento para tipo padronizado
 */
function mapearTipoDocumento(tipo: string | undefined): 'CPF' | 'CNPJ' {
  if (!tipo) return 'CPF'; // Default para pessoa física (maioria dos representantes)

  const tipoUpper = tipo.toUpperCase();
  if (tipoUpper === 'CNPJ') return 'CNPJ';

  return 'CPF';
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
 * Extrai telefones do representante (pode estar em diferentes formatos)
 */
function extrairTelefones(repData: RepresentantePJERaw): TelefoneContato[] {
  const telefones: TelefoneContato[] = [];

  // Pode vir como array de objetos
  if (Array.isArray(repData.telefones)) {
    for (const tel of repData.telefones) {
      if (tel.ddd && tel.numero) {
        telefones.push({ ddd: String(tel.ddd), numero: String(tel.numero) });
      }
    }
  }

  // Pode vir como campos separados
  if (repData.ddd_telefone && repData.numero_telefone) {
    telefones.push({
      ddd: String(repData.ddd_telefone),
      numero: String(repData.numero_telefone),
    });
  }

  if (repData.ddd_celular && repData.numero_celular) {
    telefones.push({
      ddd: String(repData.ddd_celular),
      numero: String(repData.numero_celular),
    });
  }

  return telefones;
}
