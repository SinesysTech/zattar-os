// Serviço para executar um agendamento de captura

import type { Agendamento } from '@/backend/types/captura/agendamentos-types';
import { getCredentialComplete } from '@/backend/captura/credentials/credential.service';
import { getTribunalConfig } from '@/backend/captura/services/trt/config';
import { acervoGeralCapture } from '@/backend/captura/services/trt/acervo-geral.service';
import { arquivadosCapture } from '@/backend/captura/services/trt/arquivados.service';
import { audienciasCapture } from '@/backend/captura/services/trt/audiencias.service';
import { pendentesManifestacaoCapture } from '@/backend/captura/services/trt/pendentes-manifestacao.service';
import { iniciarCapturaLog, finalizarCapturaLogSucesso, finalizarCapturaLogErro } from '@/backend/captura/services/captura-log.service';
import { atualizarAgendamento } from '../agendamentos/atualizar-agendamento.service';
import { recalcularProximaExecucaoAposExecucao } from '../agendamentos/calcular-proxima-execucao.service';

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
    }> = [];

    for (const credCompleta of credenciaisCompletas) {
      if (!credCompleta) continue;

      const tribunalConfig = getTribunalConfig(credCompleta.tribunal, credCompleta.grau);
      if (!tribunalConfig) {
        resultados.push({
          credencial_id: credCompleta.credentialId,
          tribunal: credCompleta.tribunal,
          grau: credCompleta.grau,
          erro: 'Configuração do tribunal não encontrada',
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
            break;
          case 'arquivados':
            resultado = await arquivadosCapture({
              credential: credCompleta.credenciais,
              config: tribunalConfig,
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
            break;
          case 'pendentes':
            const paramsPendentes = agendamento.parametros_extras as { filtroPrazo?: 'no_prazo' | 'sem_prazo' } | null;
            resultado = await pendentesManifestacaoCapture({
              credential: credCompleta.credenciais,
              config: tribunalConfig,
              filtroPrazo: paramsPendentes?.filtroPrazo || 'sem_prazo',
            });
            break;
          default:
            throw new Error(`Tipo de captura não suportado: ${agendamento.tipo_captura}`);
        }

        resultados.push({
          credencial_id: credCompleta.credentialId,
          tribunal: credCompleta.tribunal,
          grau: credCompleta.grau,
          resultado,
        });
      } catch (error) {
        console.error(`Erro ao capturar ${credCompleta.tribunal} ${credCompleta.grau}:`, error);
        resultados.push({
          credencial_id: credCompleta.credentialId,
          tribunal: credCompleta.tribunal,
          grau: credCompleta.grau,
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
          const temErros = resultados.some((r) => 'erro' in r);
          if (temErros) {
            const erros = resultados
              .filter((r) => 'erro' in r)
              .map((r) => `${r.tribunal} ${r.grau} (ID ${r.credencial_id}): ${r.erro}`)
              .join('; ');
            await finalizarCapturaLogErro(logId, erros);
          } else {
            await finalizarCapturaLogSucesso(logId, {
              credenciais_processadas: resultados.length,
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

