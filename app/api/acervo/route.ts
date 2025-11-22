// Rota de API para acervo
// GET: Listar processos do acervo com filtros, paginação, ordenação e agrupamento

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/utils/auth/api-auth';
import { obterAcervo } from '@/backend/acervo/services/listar-acervo.service';
import type { ListarAcervoParams } from '@/backend/types/acervo/types';

/**
 * @swagger
 * /api/acervo:
 *   get:
 *     summary: Lista processos do acervo
 *     description: |
 *       Retorna uma lista paginada de processos do acervo com filtros avançados, ordenação e agrupamento.
 *       
 *       **Filtros disponíveis:**
 *       - Filtros básicos: origem, TRT, grau, responsável
 *       - Busca textual em múltiplos campos
 *       - Filtros específicos por campo
 *       - Filtros de data (ranges)
 *       
 *       **Agrupamento:**
 *       - Quando `agrupar_por` está presente, retorna dados agrupados por campo específico
 *       - Use `incluir_contagem=true` para retornar apenas contagens (padrão)
 *       - Use `incluir_contagem=false` para retornar processos completos por grupo
 *     tags:
 *       - Acervo
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *       - serviceApiKey: []
 *     parameters:
 *       - in: query
 *         name: pagina
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número da página (começa em 1)
 *       - in: query
 *         name: limite
 *         schema:
 *           type: integer
 *           default: 50
 *           maximum: 100
 *         description: Quantidade de itens por página (máximo 100)
 *       - in: query
 *         name: unified
 *         schema:
 *           type: boolean
 *           default: true
 *         description: |
 *           Unificar processos multi-instância (mesmo numero_processo em graus diferentes).
 *           - true (padrão): Agrupa processos com mesmo numero_processo em um único item
 *           - false: Retorna todas as instâncias separadamente (modo legado)
 *       - in: query
 *         name: origem
 *         schema:
 *           type: string
 *           enum: [acervo_geral, arquivado]
 *         description: Filtrar por origem do processo
 *       - in: query
 *         name: trt
 *         schema:
 *           type: string
 *         description: "Filtrar por código do TRT (ex: TRT3, TRT1)"
 *       - in: query
 *         name: grau
 *         schema:
 *           type: string
 *           enum: [primeiro_grau, segundo_grau]
 *         description: Filtrar por grau do processo
 *       - in: query
 *         name: responsavel_id
 *         schema:
 *           type: string
 *         description: |
 *           Filtrar por ID do responsável.
 *           Use número para processos com responsável específico.
 *           Use string 'null' para processos sem responsável.
 *       - in: query
 *         name: sem_responsavel
 *         schema:
 *           type: boolean
 *         description: Filtrar apenas processos sem responsável (true)
 *       - in: query
 *         name: busca
 *         schema:
 *           type: string
 *         description: |
 *           Busca textual em múltiplos campos:
 *           - numero_processo
 *           - nome_parte_autora
 *           - nome_parte_re
 *           - descricao_orgao_julgador
 *           - classe_judicial
 *       - in: query
 *         name: numero_processo
 *         schema:
 *           type: string
 *         description: Filtrar por número do processo (busca parcial)
 *       - in: query
 *         name: nome_parte_autora
 *         schema:
 *           type: string
 *         description: Filtrar por nome da parte autora (busca parcial)
 *       - in: query
 *         name: nome_parte_re
 *         schema:
 *           type: string
 *         description: Filtrar por nome da parte ré (busca parcial)
 *       - in: query
 *         name: descricao_orgao_julgador
 *         schema:
 *           type: string
 *         description: Filtrar por descrição do órgão julgador (busca parcial)
 *       - in: query
 *         name: classe_judicial
 *         schema:
 *           type: string
 *         description: "Filtrar por classe judicial (exata, ex: ATOrd, ATSum)"
 *       - in: query
 *         name: codigo_status_processo
 *         schema:
 *           type: string
 *         description: "Filtrar por código do status (exata, ex: DISTRIBUIDO)"
 *       - in: query
 *         name: segredo_justica
 *         schema:
 *           type: boolean
 *         description: Filtrar por processos em segredo de justiça
 *       - in: query
 *         name: juizo_digital
 *         schema:
 *           type: boolean
 *         description: Filtrar por processos de juízo digital
 *       - in: query
 *         name: tem_associacao
 *         schema:
 *           type: boolean
 *         description: Filtrar por processos com associações
 *       - in: query
 *         name: data_autuacao_inicio
 *         schema:
 *           type: string
 *           format: date
 *         description: "Data inicial para filtrar por data de autuação (ISO date: YYYY-MM-DD)"
 *       - in: query
 *         name: data_autuacao_fim
 *         schema:
 *           type: string
 *           format: date
 *         description: "Data final para filtrar por data de autuação (ISO date: YYYY-MM-DD)"
 *       - in: query
 *         name: data_arquivamento_inicio
 *         schema:
 *           type: string
 *           format: date
 *         description: "Data inicial para filtrar por data de arquivamento (ISO date: YYYY-MM-DD)"
 *       - in: query
 *         name: data_arquivamento_fim
 *         schema:
 *           type: string
 *           format: date
 *         description: "Data final para filtrar por data de arquivamento (ISO date: YYYY-MM-DD)"
 *       - in: query
 *         name: data_proxima_audiencia_inicio
 *         schema:
 *           type: string
 *           format: date
 *         description: "Data inicial para filtrar por data da próxima audiência (ISO date: YYYY-MM-DD)"
 *       - in: query
 *         name: data_proxima_audiencia_fim
 *         schema:
 *           type: string
 *           format: date
 *         description: "Data final para filtrar por data da próxima audiência (ISO date: YYYY-MM-DD)"
 *       - in: query
 *         name: tem_proxima_audiencia
 *         schema:
 *           type: boolean
 *         description: Filtrar por processos com próxima audiência agendada (true) ou sem (false)
 *       - in: query
 *         name: ordenar_por
 *         schema:
 *           type: string
 *           enum: [data_autuacao, numero_processo, nome_parte_autora, nome_parte_re, data_arquivamento, data_proxima_audiencia, prioridade_processual, created_at, updated_at]
 *           default: data_autuacao
 *         description: Campo para ordenação
 *       - in: query
 *         name: ordem
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Direção da ordenação (asc = crescente, desc = decrescente)
 *       - in: query
 *         name: agrupar_por
 *         schema:
 *           type: string
 *           enum: [trt, grau, origem, responsavel_id, classe_judicial, codigo_status_processo, orgao_julgador, mes_autuacao, ano_autuacao]
 *         description: |
 *           Campo para agrupamento dos resultados.
 *           Quando presente, retorna dados agrupados ao invés de lista paginada.
 *           - trt: Agrupar por TRT
 *           - grau: Agrupar por grau
 *           - origem: Agrupar por origem (acervo_geral/arquivado)
 *           - responsavel_id: Agrupar por responsável
 *           - classe_judicial: Agrupar por classe judicial
 *           - codigo_status_processo: Agrupar por status
 *           - orgao_julgador: Agrupar por órgão julgador
 *           - mes_autuacao: Agrupar por mês/ano de autuação
 *           - ano_autuacao: Agrupar por ano de autuação
 *       - in: query
 *         name: incluir_contagem
 *         schema:
 *           type: boolean
 *           default: true
 *         description: |
 *           Quando agrupar_por está presente:
 *           - true: Retorna apenas grupos com contagens (padrão)
 *           - false: Retorna grupos com lista completa de processos
 *     responses:
 *       200:
 *         description: Lista de processos retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   oneOf:
 *                     - type: object
 *                       description: Resposta padrão (sem agrupamento)
 *                       properties:
 *                         processos:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Acervo'
 *                         paginacao:
 *                           type: object
 *                           properties:
 *                             pagina:
 *                               type: integer
 *                             limite:
 *                               type: integer
 *                             total:
 *                               type: integer
 *                             totalPaginas:
 *                               type: integer
 *                     - type: object
 *                       description: Resposta com agrupamento
 *                       properties:
 *                         agrupamentos:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               grupo:
 *                                 type: string
 *                               quantidade:
 *                                 type: integer
 *                               processos:
 *                                 type: array
 *                                 items:
 *                                   $ref: '#/components/schemas/Acervo'
 *                         total:
 *                           type: integer
 *             examples:
 *               listagemPadrao:
 *                 summary: Listagem padrão paginada
 *                 value:
 *                   success: true
 *                   data:
 *                     processos:
 *                       - id: 1
 *                         numero_processo: "0010014-94.2025.5.03.0022"
 *                         nome_parte_autora: "João Silva"
 *                         nome_parte_re: "Empresa XYZ"
 *                         data_autuacao: "2025-01-10T13:03:15.862Z"
 *                     paginacao:
 *                       pagina: 1
 *                       limite: 50
 *                       total: 100
 *                       totalPaginas: 2
 *               agrupamento:
 *                 summary: Agrupamento por TRT
 *                 value:
 *                   success: true
 *                   data:
 *                     agrupamentos:
 *                       - grupo: "TRT3"
 *                         quantidade: 45
 *                       - grupo: "TRT1"
 *                         quantidade: 30
 *                     total: 75
 *       400:
 *         description: Parâmetros inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Parâmetro 'pagina' deve ser maior ou igual a 1"
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Autenticação
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Obter parâmetros da query string
    const { searchParams } = new URL(request.url);

    // Função auxiliar para converter string para boolean
    const parseBoolean = (value: string | null): boolean | undefined => {
      if (value === null) return undefined;
      if (value === 'true') return true;
      if (value === 'false') return false;
      return undefined;
    };

    // Função auxiliar para converter string para number ou 'null'
    const parseResponsavelId = (value: string | null): number | 'null' | undefined => {
      if (value === null) return undefined;
      if (value === 'null') return 'null';
      const num = parseInt(value, 10);
      return isNaN(num) ? undefined : num;
    };

    const params: ListarAcervoParams = {
      // Paginação
      pagina: searchParams.get('pagina') ? parseInt(searchParams.get('pagina')!, 10) : undefined,
      limite: searchParams.get('limite') ? parseInt(searchParams.get('limite')!, 10) : undefined,

      // Unificação de processos multi-instância
      unified: parseBoolean(searchParams.get('unified')),

      // Filtros básicos
      origem: searchParams.get('origem') as 'acervo_geral' | 'arquivado' | undefined,
      trt: searchParams.get('trt') || undefined,
      grau: searchParams.get('grau') as 'primeiro_grau' | 'segundo_grau' | undefined,
      responsavel_id: parseResponsavelId(searchParams.get('responsavel_id')),
      sem_responsavel: parseBoolean(searchParams.get('sem_responsavel')),

      // Busca textual
      busca: searchParams.get('busca') || undefined,

      // Filtros específicos
      numero_processo: searchParams.get('numero_processo') || undefined,
      nome_parte_autora: searchParams.get('nome_parte_autora') || undefined,
      nome_parte_re: searchParams.get('nome_parte_re') || undefined,
      descricao_orgao_julgador: searchParams.get('descricao_orgao_julgador') || undefined,
      classe_judicial: searchParams.get('classe_judicial') || undefined,
      codigo_status_processo: searchParams.get('codigo_status_processo') || undefined,
      segredo_justica: parseBoolean(searchParams.get('segredo_justica')),
      juizo_digital: parseBoolean(searchParams.get('juizo_digital')),
      tem_associacao: parseBoolean(searchParams.get('tem_associacao')),

      // Filtros de data
      data_autuacao_inicio: searchParams.get('data_autuacao_inicio') || undefined,
      data_autuacao_fim: searchParams.get('data_autuacao_fim') || undefined,
      data_arquivamento_inicio: searchParams.get('data_arquivamento_inicio') || undefined,
      data_arquivamento_fim: searchParams.get('data_arquivamento_fim') || undefined,
      data_proxima_audiencia_inicio: searchParams.get('data_proxima_audiencia_inicio') || undefined,
      data_proxima_audiencia_fim: searchParams.get('data_proxima_audiencia_fim') || undefined,
      tem_proxima_audiencia: parseBoolean(searchParams.get('tem_proxima_audiencia')),

      // Ordenação
      ordenar_por: searchParams.get('ordenar_por') as ListarAcervoParams['ordenar_por'] | undefined,
      ordem: searchParams.get('ordem') as 'asc' | 'desc' | undefined,

      // Agrupamento
      agrupar_por: searchParams.get('agrupar_por') as ListarAcervoParams['agrupar_por'] | undefined,
      incluir_contagem: parseBoolean(searchParams.get('incluir_contagem')),
    };

    // 3. Validações básicas
    if (params.pagina !== undefined && params.pagina < 1) {
      return NextResponse.json(
        { error: "Parâmetro 'pagina' deve ser maior ou igual a 1" },
        { status: 400 }
      );
    }

    if (params.limite !== undefined && (params.limite < 1 || params.limite > 100)) {
      return NextResponse.json(
        { error: "Parâmetro 'limite' deve estar entre 1 e 100" },
        { status: 400 }
      );
    }

    // 4. Listar acervo
    const resultado = await obterAcervo(params);

    // 5. Formatar resposta baseado no tipo de resultado
    if ('agrupamentos' in resultado) {
      // Resposta com agrupamento
      return NextResponse.json({
        success: true,
        data: resultado,
      });
    } else {
      // Resposta padrão com paginação (unificado ou instâncias separadas)
      return NextResponse.json({
        success: true,
        data: {
          processos: resultado.processos,
          paginacao: {
            pagina: resultado.pagina,
            limite: resultado.limite,
            total: resultado.total,
            totalPaginas: resultado.totalPaginas,
          },
        },
      });
    }
  } catch (error) {
    console.error('Erro ao listar acervo:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { error: erroMsg },
      { status: 500 }
    );
  }
}

