// Rota de API para captura de partes de processos do PJE-TRT
// Captura partes, representantes e cria vínculos processo-partes

import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/backend/auth/api-auth";
import { getCredentialComplete } from "@/backend/captura/credentials/credential.service";
import { getTribunalConfig } from "@/backend/captura/services/trt/config";
import {
  capturarPartesProcesso,
  type ProcessoParaCaptura,
} from "@/backend/captura/services/partes/partes-capture.service";
import { autenticarPJE } from "@/backend/captura/services/trt/trt-auth.service";
import { buscarAdvogado } from "@/backend/advogados/services/persistence/advogado-persistence.service";
import { createServiceClient } from "@/backend/utils/supabase/service-client";
import { registrarCapturaRawLog } from "@/backend/captura/services/persistence/captura-raw-log.service";
import { criarCapturaLog, atualizarCapturaLog } from "@/backend/captura/services/persistence/captura-log-persistence.service";
import type { CodigoTRT, GrauTRT } from "@/backend/types/captura/trt-types";
import type { GrauAcervo } from "@/backend/types/acervo/types";
import type { CapturaLog } from "@/backend/types/captura/capturas-log-types";

const GRAUS_VALIDOS: GrauTRT[] = [
  "primeiro_grau",
  "segundo_grau",
  "tribunal_superior",
];

function isCodigoTRT(value: unknown): value is CodigoTRT {
  return typeof value === "string" && /^TRT([1-9]|1[0-9]|2[0-4])$/.test(value);
}

function isGrauTRT(value: unknown): value is GrauTRT {
  return typeof value === "string" && GRAUS_VALIDOS.includes(value as GrauTRT);
}

function sanitizeNumeroProcesso(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const sanitized = value.trim().replace(/\s+/g, "");
  return sanitized.length > 0 ? sanitized : undefined;
}

function sanitizeListaNumerosProcesso(value: unknown): string[] {
  if (!value) return [];
  const list = Array.isArray(value) ? value : [value];
  const numeros = list
    .map((n) => (typeof n === "string" ? n.trim() : ""))
    .map((n) => n.replace(/\s+/g, ""))
    .filter((n) => n.length > 0);
  return Array.from(new Set(numeros));
}

/**
 * @swagger
 * /api/captura/trt/partes:
 *   post:
 *     summary: Captura partes (pessoas envolvidas) de processos do PJE-TRT
 *     description: |
 *       Captura todas as partes de processos específicos ou de todos os processos de um advogado.
 *       Para cada parte:
 *       - Identifica se é cliente, parte contrária ou terceiro (baseado em CPF de representantes)
 *       - Faz upsert na tabela apropriada (clientes, partes_contrarias ou terceiros)
 *       - Salva representantes legais (advogados, defensores, etc.)
 *       - Cria vínculo processo-parte na tabela processo_partes
 *       - Permite filtrar processos por IDs, TRTs, graus ou números de processo (único ou múltiplos)
 *     tags:
 *       - Captura TRT
 *       - Partes
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *       - serviceApiKey: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - advogado_id
 *               - credencial_ids
 *             properties:
 *               advogado_id:
 *                 type: integer
 *                 description: ID do advogado (usado para identificar clientes por CPF)
 *               credencial_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array de IDs das credenciais para autenticação no PJE
 *               processo_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array de IDs dos processos (opcional - se vazio, captura todos os processos do advogado)
 *               trts:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: "Lista de códigos TRT (ex: TRT3) para filtrar processos"
 *               graus:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [primeiro_grau, segundo_grau]
 *                 description: Lista de graus para filtrar processos
 *               numero_processo:
 *                 type: string
 *                 description: Número específico de processo para captura
 *               numeros_processo:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Lista de números de processos (um por item)
 *           example:
 *             advogado_id: 1
 *             credencial_ids: [5, 6]
 *             processo_ids: [100, 101, 102]
 *             trts: ['TRT3', 'TRT5']
 *             graus: ['primeiro_grau']
 *     responses:
 *       200:
 *         description: Captura concluída com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Captura de partes concluída"
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_processos:
 *                       type: integer
 *                       description: Quantidade de processos processados
 *                     total_partes:
 *                       type: integer
 *                       description: Total de partes encontradas
 *                     clientes:
 *                       type: integer
 *                       description: Quantidade de clientes identificados
 *                     partes_contrarias:
 *                       type: integer
 *                       description: Quantidade de partes contrárias
 *                     terceiros:
 *                       type: integer
 *                       description: Quantidade de terceiros (peritos, MP, etc.)
 *                     representantes:
 *                       type: integer
 *                       description: Total de representantes salvos
 *                     vinculos:
 *                       type: integer
 *                       description: Total de vínculos processo-parte criados
 *                     erros:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           processo_id:
 *                             type: integer
 *                           numero_processo:
 *                             type: string
 *                           erro:
 *                             type: string
 *                       description: Lista de erros ocorridos
 *                     duracao_ms:
 *                       type: integer
 *                       description: Tempo total de execução em milissegundos
 *       400:
 *         description: Parâmetros obrigatórios ausentes ou inválidos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *             example:
 *               error: "Missing required parameters: advogado_id, credencial_ids"
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *             example:
 *               error: "Unauthorized"
 *       404:
 *         description: Advogado, credencial ou processo não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *             example:
 *               error: "Advogado não encontrado"
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *             example:
 *               error: "Internal server error"
 */
export async function POST(request: NextRequest) {
  let capturaLog: CapturaLog | undefined;

  try {
    // 1. Autenticação
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Validar e parsear body da requisição
    const body = await request.json();
    const {
      advogado_id,
      credencial_ids,
      processo_ids,
      trts,
      graus,
      numero_processo,
      numeros_processo,
    } = body as {
      advogado_id: number;
      credencial_ids: number[];
      processo_ids?: number[];
      trts?: CodigoTRT[];
      graus?: GrauTRT[];
      numero_processo?: string;
      numeros_processo?: string[];
    };

    // Validações básicas
    if (
      !advogado_id ||
      !credencial_ids ||
      !Array.isArray(credencial_ids) ||
      credencial_ids.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required parameters: advogado_id, credencial_ids (array não vazio)",
        },
        { status: 400 }
      );
    }

    // 3. Buscar advogado
    const advogado = await buscarAdvogado(advogado_id);
    if (!advogado) {
      return NextResponse.json(
        { error: `Advogado não encontrado` },
        { status: 404 }
      );
    }

    // 4. Buscar credenciais completas por IDs
    const credenciais = [];
    for (const id of credencial_ids) {
      const credencial = await getCredentialComplete(id);
      if (!credencial) {
        return NextResponse.json(
          { error: `Credencial ${id} não encontrada` },
          { status: 404 }
        );
      }
      credenciais.push(credencial);
    }

    if (credenciais.length === 0) {
      return NextResponse.json(
        { error: "Nenhuma credencial válida encontrada" },
        { status: 404 }
      );
    }

    // Sanitizar filtros opcionais
    const trtsFiltrados = Array.isArray(trts) ? trts.filter(isCodigoTRT) : [];
    const grausFiltrados = Array.isArray(graus) ? graus.filter(isGrauTRT) : [];
    const numeroProcessoUnico = sanitizeNumeroProcesso(numero_processo);
    const numerosProcessoLista = sanitizeListaNumerosProcesso(numeros_processo);
    const numerosParaFiltro = new Set<string>(numerosProcessoLista);
    if (numeroProcessoUnico) {
      numerosParaFiltro.add(numeroProcessoUnico);
    }
    const numerosFiltroArray = Array.from(numerosParaFiltro);

    if (
      (!processo_ids || processo_ids.length === 0) &&
      trtsFiltrados.length === 0 &&
      grausFiltrados.length === 0 &&
      numerosFiltroArray.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "É necessário informar pelo menos um filtro: processo_ids, numero_processo, numeros_processo, trts ou graus",
        },
        { status: 400 }
      );
    }

    // 5. Buscar processos com base nos filtros fornecidos
    let processos: ProcessoParaCaptura[] = [];

    const supabase = createServiceClient();
    let processosQuery = supabase
      .from("acervo")
      .select("id, numero_processo, id_pje, trt, grau");

    if (processo_ids && processo_ids.length > 0) {
      processosQuery = processosQuery.in("id", processo_ids);
    }
    if (numerosFiltroArray.length > 0) {
      processosQuery = processosQuery.in("numero_processo", numerosFiltroArray);
    }
    if (trtsFiltrados.length > 0) {
      processosQuery = processosQuery.in("trt", trtsFiltrados);
    }
    if (grausFiltrados.length > 0) {
      processosQuery = processosQuery.in("grau", grausFiltrados);
    }

    const { data: processosData, error: processosError } = await processosQuery;

    if (processosError || !processosData || processosData.length === 0) {
      return NextResponse.json(
        { error: "Nenhum processo encontrado com os filtros fornecidos" },
        { status: 404 }
      );
    }

    processos = processosData.map((p) => ({
      id: p.id as number,
      numero_processo: p.numero_processo as string,
      id_pje: p.id_pje as number,
      trt: p.trt as CodigoTRT,
      grau: p.grau as GrauAcervo,
    }));

    // 6. Iniciar log de captura
    capturaLog = await criarCapturaLog({
      tipo_captura: 'partes',
      advogado_id: advogado.id,
      credencial_ids: credencial_ids,
      status: 'in_progress',
    });

    console.log(`[API-PARTES] Log de captura criado: ID ${capturaLog.id}`);

    // 7. Resultado agregado de todos os processos
    const resultadoTotal = {
      total_processos: processos.length,
      total_partes: 0,
      clientes: 0,
      partes_contrarias: 0,
      terceiros: 0,
      representantes: 0,
      vinculos: 0,
      erros: [] as Array<{
        processo_id: number;
        numero_processo: string;
        erro: string;
      }>,
      duracao_ms: 0,
      mongodb_ids: [] as string[], // Array para armazenar todos os MongoDB IDs dos logs brutos
    };

    const inicio = Date.now();

    // 8. Agrupar processos por TRT + grau para reutilizar sessão autenticada
    type GrupoChave = string; // Formato: "TRT{numero}_{grau}"
    const gruposProcessos = new Map<GrupoChave, typeof processos>();
    
    for (const processo of processos) {
      const chaveGrupo: GrupoChave = `${processo.trt}_${processo.grau}`;
      if (!gruposProcessos.has(chaveGrupo)) {
        gruposProcessos.set(chaveGrupo, []);
      }
      gruposProcessos.get(chaveGrupo)!.push(processo);
    }

    console.log(
      `[API-PARTES] Processos agrupados em ${gruposProcessos.size} grupos (por TRT + grau)`
    );

    // 9. Processar cada grupo (um login por grupo)
    for (const [chaveGrupo, processosDoGrupo] of gruposProcessos) {
      // Usar o primeiro processo do grupo para obter os dados de TRT e grau corretos
      // Isso evita erros de parse na string da chave (ex: split('_') em "primeiro_grau")
      const processoModelo = processosDoGrupo[0];
      
      console.log(
        `[API-PARTES] Processando grupo ${chaveGrupo}: ${processosDoGrupo.length} processos`
      );

      // Encontra credencial para este grupo usando os dados originais
      const credencial = credenciais.find((c) => c.tribunal === processoModelo.trt && c.grau === processoModelo.grau);

      if (!credencial) {
        console.warn(
          `[API-PARTES] Nenhuma credencial encontrada para ${chaveGrupo}, pulando ${processosDoGrupo.length} processos`
        );
        for (const proc of processosDoGrupo) {
          resultadoTotal.erros.push({
            processo_id: proc.id,
            numero_processo: proc.numero_processo,
            erro: `Nenhuma credencial disponível para ${chaveGrupo}`,
          });
        }
        continue;
      }

      // Buscar configuração do tribunal
      const config = await getTribunalConfig(credencial.tribunal, credencial.grau);

      let browser = null;
      let page = null;

      try {
        // ✅ AUTENTICAR UMA VEZ POR GRUPO
        console.log(`[API-PARTES] Autenticando no ${chaveGrupo}...`);
        const authResult = await autenticarPJE({
          credential: credencial.credenciais,
          config,
        });
        browser = authResult.browser;
        page = authResult.page;
        console.log(
          `[API-PARTES] Autenticado com sucesso! Processando ${processosDoGrupo.length} processos com a mesma sessão`
        );

        // ✅ PROCESSAR TODOS OS PROCESSOS DO GRUPO COM A MESMA SESSÃO
        for (const processo of processosDoGrupo) {
          try {
            console.log(
              `[API-PARTES] [${chaveGrupo}] Processando processo ${processo.numero_processo}`
            );

            // Capturar partes do processo (reutilizando a página autenticada)
            const resultado = await capturarPartesProcesso(page, processo, {
              id: advogado.id,
              documento: advogado.cpf,
            });

            // Salvar log bruto no MongoDB para auditoria
            const mongodbId = await registrarCapturaRawLog({
              tipo_captura: 'partes',
              advogado_id: advogado.id,
              credencial_id: credencial.credentialId,
              captura_log_id: capturaLog.id,
              trt: processo.trt as CodigoTRT,
              grau: processo.grau as GrauTRT,
              status: resultado.erros.length === 0 ? 'success' : 'error',
              requisicao: {
                numero_processo: processo.numero_processo,
                id_pje: processo.id_pje,
                processo_id: processo.id,
              },
              payload_bruto: resultado.payloadBruto,
              resultado_processado: {
                total_partes: resultado.totalPartes,
                clientes: resultado.clientes,
                partes_contrarias: resultado.partesContrarias,
                terceiros: resultado.terceiros,
                representantes: resultado.representantes,
                vinculos: resultado.vinculos,
              },
              logs: resultado.erros.map(e => ({
                tipo: 'erro' as const,
                entidade: 'acervo' as const,
                erro: e.erro,
                contexto: { processo_id: processo.id }
              })),
              erro: resultado.erros.length > 0 ? resultado.erros[0].erro : undefined,
            });

            // Adicionar MongoDB ID ao array de IDs
            if (mongodbId) {
              resultadoTotal.mongodb_ids.push(mongodbId);
            }

            // Agregar resultados
            resultadoTotal.total_partes += resultado.totalPartes;
            resultadoTotal.clientes += resultado.clientes;
            resultadoTotal.partes_contrarias += resultado.partesContrarias;
            resultadoTotal.terceiros += resultado.terceiros;
            resultadoTotal.representantes += resultado.representantes;
            resultadoTotal.vinculos += resultado.vinculos;

            // Agregar erros
            if (resultado.erros.length > 0) {
              for (const erro of resultado.erros) {
                resultadoTotal.erros.push({
                  processo_id: processo.id,
                  numero_processo: processo.numero_processo,
                  erro: erro.erro,
                });
              }
            }

            console.log(
              `[API-PARTES] [${chaveGrupo}] Processo ${processo.numero_processo} concluído: ${resultado.totalPartes} partes`
            );
          } catch (error) {
            console.error(
              `[API-PARTES]  [${chaveGrupo}] Erro ao processar processo ${processo.numero_processo}:`,
              error
            );

            const erroMensagem = error instanceof Error ? error.message : String(error);

            // Salvar log de erro no MongoDB
            const mongodbId = await registrarCapturaRawLog({
              tipo_captura: 'partes',
              advogado_id: advogado.id,
              credencial_id: credencial.credentialId,
              captura_log_id: capturaLog.id,
              trt: processo.trt as CodigoTRT,
              grau: processo.grau as GrauTRT,
              status: 'error',
              requisicao: {
                numero_processo: processo.numero_processo,
                id_pje: processo.id_pje,
                processo_id: processo.id,
              },
              payload_bruto: null,
              resultado_processado: null,
              logs: [{
                tipo: 'erro' as const,
                entidade: 'acervo' as const,
                erro: erroMensagem,
                contexto: { processo_id: processo.id }
              }],
              erro: erroMensagem,
            });

            // Adicionar MongoDB ID ao array de IDs (mesmo em caso de erro)
            if (mongodbId) {
              resultadoTotal.mongodb_ids.push(mongodbId);
            }

            resultadoTotal.erros.push({
              processo_id: processo.id,
              numero_processo: processo.numero_processo,
              erro: erroMensagem,
            });
          }
        }
      } catch (error) {
        console.error(
          `[API-PARTES] Erro ao autenticar no ${chaveGrupo}:`,
          error
        );
        // Se falhar a autenticação, marca todos os processos do grupo com erro
        for (const proc of processosDoGrupo) {
          resultadoTotal.erros.push({
            processo_id: proc.id,
            numero_processo: proc.numero_processo,
            erro: `Falha na autenticação: ${error instanceof Error ? error.message : String(error)}`,
          });
        }
      } finally {
        // ✅ FECHAR BROWSER APENAS AO TERMINAR O GRUPO
        if (browser) {
          await browser.close();
          console.log(`[API-PARTES] Browser fechado para ${chaveGrupo}`);
        }
      }
    }

    resultadoTotal.duracao_ms = Date.now() - inicio;

    // 9. Finalizar log de captura no PostgreSQL
    const status = resultadoTotal.erros.length === 0 ? 'completed' :
                   resultadoTotal.erros.length === resultadoTotal.total_processos ? 'failed' : 'completed';

    await atualizarCapturaLog(capturaLog.id, {
      status,
      resultado: {
        total_processos: resultadoTotal.total_processos,
        total_partes: resultadoTotal.total_partes,
        clientes: resultadoTotal.clientes,
        partes_contrarias: resultadoTotal.partes_contrarias,
        terceiros: resultadoTotal.terceiros,
        representantes: resultadoTotal.representantes,
        vinculos: resultadoTotal.vinculos,
        erros_count: resultadoTotal.erros.length,
        duracao_ms: resultadoTotal.duracao_ms,
        mongodb_ids: resultadoTotal.mongodb_ids, // Array de IDs do MongoDB
      },
      erro: resultadoTotal.erros.length > 0 ?
        `${resultadoTotal.erros.length} erro(s) durante a captura` : undefined,
    });

    console.log(`[API-PARTES] Log de captura atualizado: ID ${capturaLog.id}, Status: ${status}`);

    // 10. Retornar resultado
    return NextResponse.json({
      success: true,
      message: "Captura de partes concluída",
      data: resultadoTotal,
    });
  } catch (error) {
    console.error("[API-PARTES] Erro na captura:", error);

    // Finalizar log com erro se foi iniciado
    try {
      // Verifica se capturaLog foi criado (pode não ter sido se o erro ocorreu antes)
      if (capturaLog) {
        await atualizarCapturaLog(capturaLog.id, {
          status: 'failed',
          erro: error instanceof Error ? error.message : String(error),
        });
        console.log(`[API-PARTES] Log de captura marcado como failed: ID ${capturaLog.id}`);
      }
    } catch (logError) {
      console.error("[API-PARTES] Erro ao atualizar log de captura:", logError);
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
