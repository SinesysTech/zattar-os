// Serviço para executar um agendamento de captura

import type { Agendamento } from '@/backend/types/captura/agendamentos-types';
import { getCredentialComplete } from '@/backend/captura/credentials/credential.service';
import { getTribunalConfig } from '@/backend/captura/services/trt/config';
import { acervoGeralCapture, type AcervoGeralResult } from '@/backend/captura/services/trt/acervo-geral.service';
import { arquivadosCapture, type ArquivadosResult } from '@/backend/captura/services/trt/arquivados.service';
import { audienciasCapture, type AudienciasResult } from '@/backend/captura/services/trt/audiencias.service';
import { pendentesManifestacaoCapture, type PendentesManifestacaoResult } from '@/backend/captura/services/trt/pendentes-manifestacao.service';
import { iniciarCapturaLog, finalizarCapturaLogSucesso, finalizarCapturaLogErro } from '@/backend/captura/services/captura-log.service';
import { atualizarAgendamento } from '../agendamentos/atualizar-agendamento.service';
import { recalcularProximaExecucaoAposExecucao } from '../agendamentos/calcular-proxima-execucao.service';
import type { FiltroPrazoPendentes } from '@/backend/types/captura/trt-types';
import { registrarCapturaRawLog } from '@/backend/captura/services/persistence/captura-raw-log.service';

const ORDEM_FILTROS_PENDENTES: FiltroPrazoPendentes[] = ['sem_prazo', 'no_prazo'];

const resolverFiltrosPendentes = (
  filtros?: FiltroPrazoPendentes[] | null,
  filtroUnico?: FiltroPrazoPendentes | null
): FiltroPrazoPendentes[] => {
  const candidatos = filtros && filtros.length ? filtros : (filtroUnico ? [filtroUnico] : []);
  const valores: FiltroPrazoPendentes[] = candidatos.length ? candidatos : ['sem_prazo'];
  const unicos = Array.from(new Set(valores));
  return unicos.sort((a, b) => ORDEM_FILTROS_PENDENTES.indexOf(a) - ORDEM_FILTROS_PENDENTES.indexOf(b));
};

/**
 * Executa um agendamento de captura
 * @param agendamento - Agendamento a ser executado
 * @param atualizarProximaExecucao - Se true, atualiza próxima_execucao após execução (para scheduler automático)
 * @returns ID do log de captura criado
 */
export async function executarAgendamento(
  agendamento: Agendamento,
  atualizarProximaExecucao: boolean = true
): Promise<{ captureId: number | null }> {
  console.log(`[Scheduler] Executando agendamento ID ${agendamento.id}: ${agendamento.tipo_captura} para advogado ${agendamento.advogado_id}`);

  // Buscar credenciais completas
  const credenciaisCompletas = await Promise.all(
    agendamento.credencial_ids.map((id) => getCredentialComplete(id))
  );

  const credenciaisNaoEncontradas = credenciaisCompletas
    .map((cred, index) => (!cred ? agendamento.credencial_ids[index] : null))
    .filter((id): id is number => id !== null);

  if (credenciaisNaoEncontradas.length > 0) {
    throw new Error(`Credenciais não encontradas: ${credenciaisNaoEncontradas.join(', ')}`);
  }

  // Criar registro de histórico
  let logId: number | null = null;
  try {
    logId = await iniciarCapturaLog({
      tipo_captura: agendamento.tipo_captura,
      advogado_id: agendamento.advogado_id,
      credencial_ids: agendamento.credencial_ids,
      status: 'in_progress',
    });
  } catch (error) {
    console.error('Erro ao criar registro de histórico:', error);
  }

  // Executar captura baseado no tipo
  const executarCaptura = async () => {
    const resultados: Array<{
      credencial_id: number;
      tribunal: string;
      grau: string;
      resultado?: unknown;
      erro?: string;
      filtros?: Array<{ filtroPrazo: FiltroPrazoPendentes; resultado?: unknown; erro?: string }>;
    }> = [];

    for (const credCompleta of credenciaisCompletas) {
      if (!credCompleta) continue;

      let tribunalConfig;
      try {
        tribunalConfig = await getTribunalConfig(credCompleta.tribunal, credCompleta.grau);
      } catch (error) {
        resultados.push({
          credencial_id: credCompleta.credentialId,
          tribunal: credCompleta.tribunal,
          grau: credCompleta.grau,
          erro: `Configuração do tribunal não encontrada: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        });
        await registrarCapturaRawLog({
          captura_log_id: logId ?? -1,
          tipo_captura: agendamento.tipo_captura,
          advogado_id: agendamento.advogado_id,
          credencial_id: credCompleta.credentialId,
          credencial_ids: agendamento.credencial_ids,
          trt: credCompleta.tribunal,
          grau: credCompleta.grau,
          status: 'error',
          requisicao: {
            agendamento_id: agendamento.id,
            parametros_extras: agendamento.parametros_extras,
          },
          erro: error instanceof Error ? error.message : 'Erro desconhecido',
        });
        continue;
      }

      try {
        let resultado: unknown;

        switch (agendamento.tipo_captura) {
          case 'acervo_geral':
            resultado = await acervoGeralCapture({
              credential: credCompleta.credenciais,
              config: tribunalConfig,
            });
            await registrarCapturaRawLog({
              captura_log_id: logId ?? -1,
              tipo_captura: agendamento.tipo_captura,
              advogado_id: agendamento.advogado_id,
              credencial_id: credCompleta.credentialId,
              credencial_ids: agendamento.credencial_ids,
              trt: credCompleta.tribunal,
              grau: credCompleta.grau,
              status: 'success',
              requisicao: {
                agendamento_id: agendamento.id,
              },
              payload_bruto: (resultado as AcervoGeralResult).payloadBruto ?? (resultado as AcervoGeralResult).processos,
              resultado_processado: (resultado as AcervoGeralResult).persistencia,
              logs: (resultado as AcervoGeralResult).logs,
            });
            break;
          case 'arquivados':
            resultado = await arquivadosCapture({
              credential: credCompleta.credenciais,
              config: tribunalConfig,
            });
            await registrarCapturaRawLog({
              captura_log_id: logId ?? -1,
              tipo_captura: agendamento.tipo_captura,
              advogado_id: agendamento.advogado_id,
              credencial_id: credCompleta.credentialId,
              credencial_ids: agendamento.credencial_ids,
              trt: credCompleta.tribunal,
              grau: credCompleta.grau,
              status: 'success',
              requisicao: {
                agendamento_id: agendamento.id,
              },
              payload_bruto: (resultado as ArquivadosResult).payloadBruto ?? (resultado as ArquivadosResult).processos,
              resultado_processado: (resultado as ArquivadosResult).persistencia,
              logs: (resultado as ArquivadosResult).logs,
            });
            break;
          case 'audiencias':
            const paramsAudiencias = agendamento.parametros_extras as { dataInicio?: string; dataFim?: string } | null;
            resultado = await audienciasCapture({
              credential: credCompleta.credenciais,
              config: tribunalConfig,
              dataInicio: paramsAudiencias?.dataInicio,
              dataFim: paramsAudiencias?.dataFim,
            });
            await registrarCapturaRawLog({
              captura_log_id: logId ?? -1,
              tipo_captura: agendamento.tipo_captura,
              advogado_id: agendamento.advogado_id,
              credencial_id: credCompleta.credentialId,
              credencial_ids: agendamento.credencial_ids,
              trt: credCompleta.tribunal,
              grau: credCompleta.grau,
              status: 'success',
              requisicao: {
                agendamento_id: agendamento.id,
                dataInicioSolicitado: paramsAudiencias?.dataInicio,
                dataFimSolicitado: paramsAudiencias?.dataFim,
                dataInicioExecutado: (resultado as AudienciasResult).dataInicio,
                dataFimExecutado: (resultado as AudienciasResult).dataFim,
              },
              payload_bruto: (resultado as AudienciasResult).paginasBrutas ?? (resultado as AudienciasResult).audiencias,
              resultado_processado: (resultado as AudienciasResult).persistencia,
              logs: (resultado as AudienciasResult).logs,
            });
            break;
          case 'pendentes': {
            const paramsPendentes = agendamento.parametros_extras as { filtroPrazo?: FiltroPrazoPendentes; filtrosPrazo?: FiltroPrazoPendentes[] } | null;
            const filtrosParaExecutar = resolverFiltrosPendentes(
              paramsPendentes?.filtrosPrazo || null,
              paramsPendentes?.filtroPrazo || null
            );

            const resultadosPendentes: Array<{ filtroPrazo: FiltroPrazoPendentes; resultado?: unknown; erro?: string }> = [];

            for (const filtro of filtrosParaExecutar) {
              try {
                const captura = await pendentesManifestacaoCapture({
                  credential: credCompleta.credenciais,
                  config: tribunalConfig,
                  filtroPrazo: filtro,
                  capturarDocumentos: true,
                });

                resultadosPendentes.push({ filtroPrazo: filtro, resultado: captura });

                await registrarCapturaRawLog({
                  captura_log_id: logId ?? -1,
                  tipo_captura: agendamento.tipo_captura,
                  advogado_id: agendamento.advogado_id,
                  credencial_id: credCompleta.credentialId,
                  credencial_ids: agendamento.credencial_ids,
                  trt: credCompleta.tribunal,
                  grau: credCompleta.grau,
                  status: 'success',
                  requisicao: {
                    agendamento_id: agendamento.id,
                    filtroPrazo: filtro,
                    filtrosSolicitados: filtrosParaExecutar,
                  },
                  payload_bruto: (captura as PendentesManifestacaoResult).payloadBruto ?? (captura as PendentesManifestacaoResult).processos,
                  resultado_processado: {
                    persistencia: (captura as PendentesManifestacaoResult).persistencia,
                    documentosCapturados: (captura as PendentesManifestacaoResult).documentosCapturados,
                    documentosFalhados: (captura as PendentesManifestacaoResult).documentosFalhados,
                    errosDocumentos: (captura as PendentesManifestacaoResult).errosDocumentos,
                  },
                  logs: (captura as PendentesManifestacaoResult).logs,
                });
              } catch (error) {
                resultadosPendentes.push({
                  filtroPrazo: filtro,
                  erro: error instanceof Error ? error.message : 'Erro desconhecido',
                });

                await registrarCapturaRawLog({
                  captura_log_id: logId ?? -1,
                  tipo_captura: agendamento.tipo_captura,
                  advogado_id: agendamento.advogado_id,
                  credencial_id: credCompleta.credentialId,
                  credencial_ids: agendamento.credencial_ids,
                  trt: credCompleta.tribunal,
                  grau: credCompleta.grau,
                  status: 'error',
                  requisicao: {
                    agendamento_id: agendamento.id,
                    filtroPrazo: filtro,
                    filtrosSolicitados: filtrosParaExecutar,
                  },
                  erro: error instanceof Error ? error.message : 'Erro desconhecido',
                });
              }
            }

            resultado = { filtros: resultadosPendentes };
            break;
          }
          default:
            throw new Error(`Tipo de captura não suportado: ${agendamento.tipo_captura}`);
        }

        const filtrosResultado = (resultado as { filtros?: Array<{ filtroPrazo: FiltroPrazoPendentes; resultado?: unknown; erro?: string }> } | null)?.filtros;

        resultados.push({
          credencial_id: credCompleta.credentialId,
          tribunal: credCompleta.tribunal,
          grau: credCompleta.grau,
          resultado,
          ...(filtrosResultado ? { filtros: filtrosResultado } : {}),
        });
      } catch (error) {
        console.error(`Erro ao capturar ${credCompleta.tribunal} ${credCompleta.grau}:`, error);
        resultados.push({
          credencial_id: credCompleta.credentialId,
          tribunal: credCompleta.tribunal,
          grau: credCompleta.grau,
          erro: error instanceof Error ? error.message : 'Erro desconhecido',
        });

        await registrarCapturaRawLog({
          captura_log_id: logId ?? -1,
          tipo_captura: agendamento.tipo_captura,
          advogado_id: agendamento.advogado_id,
          credencial_id: credCompleta.credentialId,
          credencial_ids: agendamento.credencial_ids,
          trt: credCompleta.tribunal,
          grau: credCompleta.grau,
          status: 'error',
          requisicao: {
            agendamento_id: agendamento.id,
            parametros_extras: agendamento.parametros_extras,
          },
          erro: error instanceof Error ? error.message : 'Erro desconhecido',
        });
      }
    }

    return resultados;
  };

  // Executar captura e atualizar histórico
  executarCaptura()
    .then(async (resultados) => {
      if (logId) {
        try {
          const errosColetados = resultados.flatMap((r) => {
            const errosFiltro = r.filtros
              ?.filter((f) => f.erro)
              .map((f) => `${r.tribunal} ${r.grau} (ID ${r.credencial_id}) - ${f.filtroPrazo}: ${f.erro}`) || [];

            if ((r as any).erro) {
              return [`${r.tribunal} ${r.grau} (ID ${r.credencial_id}): ${(r as any).erro}`, ...errosFiltro];
            }

            return errosFiltro;
          });

          if (errosColetados.length > 0) {
            await finalizarCapturaLogErro(logId, errosColetados.join('; '));
          } else {
            const filtrosExecutados = Array.from(
              new Set(
                resultados.flatMap((r) => r.filtros?.map((f) => f.filtroPrazo) || [])
              )
            );

            await finalizarCapturaLogSucesso(logId, {
              credenciais_processadas: resultados.length,
              filtros_prazo: filtrosExecutados.length > 0 ? filtrosExecutados : undefined,
              resultados,
            });
          }
        } catch (error) {
          console.error('Erro ao atualizar histórico de captura:', error);
        }
      }

      // Atualizar agendamento: última execução e próxima execução (se solicitado)
      try {
        const updateData: Record<string, unknown> = {
          ultima_execucao: new Date().toISOString(),
        };

        if (atualizarProximaExecucao) {
          const proximaExecucao = recalcularProximaExecucaoAposExecucao(
            agendamento.periodicidade,
            agendamento.dias_intervalo,
            agendamento.horario
          );
          updateData.proxima_execucao = proximaExecucao;
        }

        await atualizarAgendamento(agendamento.id, updateData as any);
        console.log(`[Scheduler] Agendamento ID ${agendamento.id} atualizado após execução`);
      } catch (error) {
        console.error('Erro ao atualizar agendamento após execução:', error);
      }
    })
    .catch(async (error) => {
      console.error('Erro ao executar captura do agendamento:', error);
      if (logId) {
        await finalizarCapturaLogErro(logId, error instanceof Error ? error.message : 'Erro desconhecido');
      }
    });

  return { captureId: logId };
}
