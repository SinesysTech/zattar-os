/**
 * API Route: Endpoint agregado de dados do cliente por CPF
 * 
 * Este endpoint otimiza a consulta de dados do cliente ao executar
 * todas as buscas em paralelo no servidor, retornando uma resposta
 * consolidada em formato compatível com o app Meu Processo.
 * 
 * Vantagens sobre /api/meu-processo/consulta:
 * - Menor latência (queries paralelas no servidor)
 * - Menor overhead de rede (uma única chamada HTTP)
 * - Melhor controle de cache e rate limiting
 * 
 * @endpoint GET /api/meu-processo/cliente/{cpf}
 * @authentication Service API Key (via header x-service-api-key)
 * 
 * @swagger
 * /api/meu-processo/cliente/{cpf}:
 *   get:
 *     summary: Buscar todos os dados do cliente por CPF (endpoint agregado)
 *     description: |
 *       Retorna todos os dados do cliente em um único response otimizado.
 *       Ideal para o app Meu Processo consumir dados de forma eficiente.
 *       
 *       **Dados Retornados:**
 *       - Processos jurídicos
 *       - Audiências (futuras e passadas)
 *       - Contratos ativos
 *       - Acordos e condenações com parcelas
 *       
 *       **Otimizações:**
 *       - Queries executadas em paralelo no servidor
 *       - Cache HTTP configurável (5 minutos padrão)
 *       - Fallback gracioso (se um recurso falhar, outros continuam)
 *     tags:
 *       - Meu Processo
 *     security:
 *       - serviceApiKey: []
 *     parameters:
 *       - name: cpf
 *         in: path
 *         required: true
 *         description: CPF do cliente (aceita com ou sem pontuação)
 *         schema:
 *           type: string
 *           example: "123.456.789-01"
 *       - name: x-service-api-key
 *         in: header
 *         required: true
 *         description: Chave de API para autenticação
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dados encontrados com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     cliente:
 *                       type: object
 *                       properties:
 *                         nome:
 *                           type: string
 *                         cpf:
 *                           type: string
 *                     processos:
 *                       type: array
 *                       items:
 *                         type: object
 *                     audiencias:
 *                       type: array
 *                       items:
 *                         type: object
 *                     contratos:
 *                       type: array
 *                       items:
 *                         type: object
 *                     acordos_condenacoes:
 *                       type: array
 *                       items:
 *                         type: object
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     query_time_ms:
 *                       type: number
 *                     cached:
 *                       type: boolean
 *       400:
 *         description: CPF inválido
 *       401:
 *         description: Autenticação inválida
 *       404:
 *         description: Cliente não encontrado
 *       500:
 *         description: Erro interno do servidor
 */

import { NextRequest, NextResponse } from 'next/server';
import { buscarProcessosClientePorCpf } from '@/backend/acervo/services/buscar-processos-cliente-cpf.service';
import { buscarAudienciasClientePorCpf } from '@/backend/audiencias/services/buscar-audiencias-cliente-cpf.service';
import { obterClientePorCpf } from '@/backend/clientes/services/clientes/buscar-cliente.service';
import { obterContratos } from '@/backend/contratos/services/contratos/listar-contratos.service';
import { listarAcordosCondenacoes } from '@/backend/acordos-condenacoes/services/persistence/acordo-condenacao-persistence.service';
import {
  MeuProcessoLogger,
  Timer,
} from '@/lib/services/meu-processo-metrics';

// =============================================================================
// CONFIGURAÇÃO
// =============================================================================

// Cache TTL configurável (5 minutos padrão)
const CACHE_TTL = parseInt(process.env.MEU_PROCESSO_CACHE_TTL || '300', 10);

// =============================================================================
// TIPOS
// =============================================================================

interface AggregatedData {
  cliente: {
    nome: string;
    cpf: string;
  } | null;
  processos: unknown[];
  audiencias: unknown[];
  contratos: unknown[];
  acordos_condenacoes: unknown[];
}

// =============================================================================
// VALIDAÇÃO
// =============================================================================

/**
 * Valida formato básico do CPF
 */
function validarCPF(cpf: string): { valido: boolean; cpfLimpo: string; erro?: string } {
  const cpfLimpo = cpf.replace(/\D/g, '');

  // Deve ter 11 dígitos
  if (cpfLimpo.length !== 11) {
    return { valido: false, cpfLimpo, erro: 'CPF deve conter 11 dígitos' };
  }

  // Não pode ser sequência repetida (111.111.111-11, etc)
  if (/^(\d)\1{10}$/.test(cpfLimpo)) {
    return { valido: false, cpfLimpo, erro: 'CPF inválido - sequência repetida' };
  }

  return { valido: true, cpfLimpo };
}

// =============================================================================
// HELPER: BUSCA AGREGADA
// =============================================================================

/**
 * Busca todos os dados do cliente de forma paralela e resiliente
 */
async function buscarDadosAgregados(cpf: string): Promise<AggregatedData> {
  const logger = new MeuProcessoLogger();

  // Executar todas as buscas em paralelo
  const [processosResult, audienciasResult, clienteResult] = await Promise.allSettled([
    buscarProcessosClientePorCpf(cpf),
    buscarAudienciasClientePorCpf(cpf),
    obterClientePorCpf(cpf),
  ]);

  // Processar resultados de processos
  const processos = processosResult.status === 'fulfilled' && processosResult.value.success
    ? processosResult.value.data.processos || []
    : [];

  // Processar resultados de audiências
  const audiencias = audienciasResult.status === 'fulfilled' && audienciasResult.value.success
    ? audienciasResult.value.data.audiencias || []
    : [];

  // Processar resultado de cliente (retorna Cliente | null)
  const clienteData = clienteResult.status === 'fulfilled' && clienteResult.value !== null
    ? clienteResult.value
    : null;

  const cliente = clienteData
    ? {
      nome: clienteData.nome,
      cpf: clienteData.cpf,
    }
    : null;

  // Buscar contratos se cliente foi encontrado
  let contratos: unknown[] = [];
  if (clienteData?.id) {
    try {
      const contratosResult = await obterContratos({
        clienteId: clienteData.id,
      });
      // obterContratos retorna ListarContratosResult
      contratos = contratosResult.contratos || [];
    } catch (error) {
      logger.warn('Erro ao buscar contratos', { error });
    }
  }

  // Buscar acordos se houver processos
  let acordos: unknown[] = [];
  if (processos.length > 0) {
    try {
      const processoIds = processos
        .map((p: unknown) => (p as Record<string, unknown>).id || (p as Record<string, unknown>).processo_id)
        .filter((id: unknown) => id != null) as number[];

      if (processoIds.length > 0) {
        // Buscar acordos de cada processo e agregar
        const acordosPromises = processoIds.map((processoId: number) =>
          listarAcordosCondenacoes({ processoId, limite: 100 })
        );
        const acordosResults = await Promise.allSettled(acordosPromises);

        acordos = acordosResults
          .filter((result) => result.status === 'fulfilled')
          .flatMap((result) => {
            const r = result as PromiseFulfilledResult<{ success: boolean; data: { acordos: unknown[] } }>;
            return r.value.success ? r.value.data.acordos : [];
          });
      }
    } catch (error) {
      logger.warn('Erro ao buscar acordos', { error });
    }
  }

  return {
    cliente,
    processos,
    audiencias,
    contratos,
    acordos_condenacoes: acordos,
  };
}

// =============================================================================
// HANDLER
// =============================================================================

interface RouteParams {
  params: Promise<{
    cpf: string;
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const timer = new Timer();
  const logger = new MeuProcessoLogger();
  let cpf = '';

  try {
    // 1. Autenticação via Service API Key
    const apiKey = request.headers.get('x-service-api-key');
    const expectedKey = process.env.SERVICE_API_KEY;

    if (!apiKey || !expectedKey || apiKey !== expectedKey) {
      return NextResponse.json(
        { success: false, error: 'Autenticação inválida' },
        { status: 401 }
      );
    }

    // 2. Extrair e validar CPF
    const { cpf: rawCpf } = await params;
    const validacao = validarCPF(rawCpf);

    if (!validacao.valido) {
      return NextResponse.json(
        { success: false, error: validacao.erro },
        { status: 400 }
      );
    }

    cpf = validacao.cpfLimpo;

    logger.logRequest(cpf, 'sinesys', 'Buscando dados agregados do cliente');

    // 3. Buscar dados
    const dados = await buscarDadosAgregados(cpf);

    // Verificar se cliente foi encontrado
    if (!dados.cliente && dados.processos.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Nenhum dado encontrado para este CPF',
        },
        { status: 404 }
      );
    }

    const elapsedTime = timer.stop();

    logger.info('Dados agregados encontrados', {
      cpf_masked: cpf.replace(/\d(?=\d{4})/g, '*'),
      duration_ms: elapsedTime,
      processos: dados.processos.length,
      audiencias: dados.audiencias.length,
      contratos: dados.contratos.length,
      acordos: dados.acordos_condenacoes.length,
    });

    // 4. Retornar resposta
    return NextResponse.json(
      {
        success: true,
        data: dados,
        metadata: {
          query_time_ms: elapsedTime,
          cached: false, // TODO: Implementar cache Redis se necessário
        },
      },
      {
        headers: {
          'Cache-Control': `private, max-age=${CACHE_TTL}`,
          'X-Response-Time': `${elapsedTime}ms`,
          'X-API-Version': '1.0',
        },
      }
    );

  } catch (error) {
    const elapsedTime = timer.stop();

    logger.logError(error as Error, {
      cpf_masked: cpf ? cpf.replace(/\d(?=\d{4})/g, '*') : 'unknown',
      duration_ms: elapsedTime,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao processar consulta',
        details: (error as Error).message,
      },
      {
        status: 500,
        headers: {
          'X-Response-Time': `${elapsedTime}ms`,
        },
      }
    );
  }
}
