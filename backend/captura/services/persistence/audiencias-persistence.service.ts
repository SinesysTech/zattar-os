// Serviço de persistência de audiências
// Salva audiências capturadas no banco de dados com comparação antes de atualizar

import { createServiceClient } from '@/backend/utils/supabase/service-client';
import type { Audiencia } from '@/backend/types/pje-trt/types';
import type { CodigoTRT, GrauTRT } from '@/backend/types/captura/trt-types';
import { buscarOrgaoJulgador } from './orgao-julgador-persistence.service';
import { buscarProcessoNoAcervo } from './acervo-persistence.service';
import { salvarOrgaoJulgador } from './orgao-julgador-persistence.service';
import {
  compararObjetos,
  removerCamposControle,
} from '@/backend/utils/captura/comparison.util';
import {
  captureLogService,
  type TipoEntidade,
} from './capture-log.service';

/**
 * Parâmetros para salvar audiências
 */
export interface SalvarAudienciasParams {
  audiencias: Audiencia[];
  advogadoId: number;
  trt: CodigoTRT;
  grau: GrauTRT;
}

/**
 * Resultado da persistência
 */
export interface SalvarAudienciasResult {
  inseridos: number;
  atualizados: number;
  naoAtualizados: number;
  erros: number;
  total: number;
  orgaosJulgadoresCriados: number;
}

/**
 * Converte data ISO string para timestamptz
 */
function parseDate(dateString: string): string {
  return new Date(dateString).toISOString();
}

/**
 * Converte hora HH:mm:ss para time ou null
 */
function parseTime(timeString: string | undefined): string | null {
  if (!timeString) return null;
  // Extrair apenas HH:mm:ss (remover timezone se presente)
  const match = timeString.match(/(\d{2}:\d{2}:\d{2})/);
  return match ? match[1] : null;
}

/**
 * Busca uma audiência existente com todos os campos
 */
async function buscarAudienciaExistente(
  idPje: number,
  trt: CodigoTRT,
  grau: GrauTRT,
  numeroProcesso: string
): Promise<Record<string, unknown> | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('audiencias')
    .select('*')
    .eq('id_pje', idPje)
    .eq('trt', trt)
    .eq('grau', grau)
    .eq('numero_processo', numeroProcesso.trim())
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Erro ao buscar audiência: ${error.message}`);
  }

  return data as Record<string, unknown>;
}

/**
 * Salva múltiplas audiências no banco de dados
 * Compara cada registro antes de atualizar para evitar atualizações desnecessárias
 */
export async function salvarAudiencias(
  params: SalvarAudienciasParams
): Promise<SalvarAudienciasResult> {
  const supabase = createServiceClient();
  const { audiencias, advogadoId, trt, grau } = params;

  if (audiencias.length === 0) {
    return {
      inseridos: 0,
      atualizados: 0,
      naoAtualizados: 0,
      erros: 0,
      total: 0,
      orgaosJulgadoresCriados: 0,
    };
  }

  let orgaosJulgadoresCriados = 0;

  // Primeiro, garantir que todos os órgãos julgadores estão salvos
  for (const audiencia of audiencias) {
    if (audiencia.processo?.orgaoJulgador) {
      const orgaoJulgador = audiencia.processo.orgaoJulgador;
      
      // Verificar se já existe
      const existe = await buscarOrgaoJulgador(orgaoJulgador.id, trt, grau);
      
      if (!existe) {
        // Salvar órgão julgador
        // A API de audiências retorna orgaoJulgador com 'nome' ou 'descricao'
        const descricao = orgaoJulgador.nome || orgaoJulgador.descricao || '';
        
        await salvarOrgaoJulgador({
          orgaoJulgador: {
            id: orgaoJulgador.id,
            descricao,
            cejusc: orgaoJulgador.cejusc ?? false,
            ativo: orgaoJulgador.ativo ?? false,
            postoAvancado: orgaoJulgador.postoAvancado ?? false,
            novoOrgaoJulgador: orgaoJulgador.novoOrgaoJulgador ?? false,
            codigoServentiaCnj: orgaoJulgador.codigoServentiaCnj ?? 0,
          },
          trt,
          grau,
        });
        orgaosJulgadoresCriados++;
      }
    }
  }

  // Buscar IDs dos órgãos julgadores e processos
  const dadosComRelacoes = await Promise.all(
    audiencias.map(async (audiencia) => {
      let orgaoJulgadorId: number | null = null;
      let processoId: number | null = null;

      // Buscar ID do órgão julgador
      if (audiencia.processo?.orgaoJulgador) {
        const orgao = await buscarOrgaoJulgador(
          audiencia.processo.orgaoJulgador.id,
          trt,
          grau
        );
        orgaoJulgadorId = orgao?.id ?? null;
      }

      // Buscar ID do processo no acervo
      if (audiencia.processo?.id && audiencia.processo?.numero) {
        const processo = await buscarProcessoNoAcervo(
          audiencia.processo.id,
          trt,
          grau,
          audiencia.processo.numero
        );
        processoId = processo?.id ?? null;
      }

      return {
        audiencia,
        orgaoJulgadorId,
        processoId,
      };
    })
  );

  let inseridos = 0;
  let atualizados = 0;
  let naoAtualizados = 0;
  let erros = 0;

  const entidade: TipoEntidade = 'audiencias';

  // Processar cada audiência individualmente
  for (const { audiencia, orgaoJulgadorId, processoId } of dadosComRelacoes) {
    try {
      const numeroProcesso = audiencia.processo?.numero?.trim() ?? '';

      const dadosNovos = {
        id_pje: audiencia.id,
        advogado_id: advogadoId,
        processo_id: processoId,
        orgao_julgador_id: orgaoJulgadorId,
        trt,
        grau,
        numero_processo: numeroProcesso,
        data_inicio: parseDate(audiencia.dataInicio),
        data_fim: parseDate(audiencia.dataFim),
        sala_audiencia_nome: audiencia.salaAudiencia?.nome?.trim() ?? null,
        sala_audiencia_id: audiencia.salaAudiencia?.id ?? null,
        status: audiencia.status,
        status_descricao: null,
        tipo_id: audiencia.tipo?.id ?? null,
        tipo_descricao: audiencia.tipo?.descricao?.trim() ?? null,
        tipo_codigo: null,
        tipo_is_virtual: false,
        designada: false,
        em_andamento: false,
        documento_ativo: false,
        polo_ativo_nome: audiencia.poloAtivo?.nome?.trim() ?? null,
        polo_ativo_cpf: audiencia.poloAtivo?.cpf?.trim() ?? null,
        polo_passivo_nome: audiencia.poloPassivo?.nome?.trim() ?? null,
        polo_passivo_cnpj: audiencia.poloPassivo?.cnpj?.trim() ?? null,
        url_audiencia_virtual: audiencia.urlAudienciaVirtual?.trim() ?? null,
        hora_inicial: parseTime(audiencia.pautaAudienciaHorario?.horaInicial),
        hora_final: parseTime(audiencia.pautaAudienciaHorario?.horaFinal),
      };

      // Buscar registro existente
      const registroExistente = await buscarAudienciaExistente(
        audiencia.id,
        trt,
        grau,
        numeroProcesso
      );

      if (!registroExistente) {
        // Inserir
        const { error } = await supabase.from('audiencias').insert(dadosNovos);

        if (error) {
          throw error;
        }

        inseridos++;
        captureLogService.logInserido(
          entidade,
          audiencia.id,
          trt,
          grau,
          numeroProcesso
        );
      } else {
        // Comparar antes de atualizar
        const comparacao = compararObjetos(
          dadosNovos,
          registroExistente as Record<string, unknown>
        );

        if (comparacao.saoIdenticos) {
          naoAtualizados++;
          captureLogService.logNaoAtualizado(
            entidade,
            audiencia.id,
            trt,
            grau,
            numeroProcesso
          );
        } else {
          const dadosAnteriores = removerCamposControle(
            registroExistente as Record<string, unknown>
          );

          const { error } = await supabase
            .from('audiencias')
            .update({
              ...dadosNovos,
              dados_anteriores: dadosAnteriores,
            })
            .eq('id_pje', audiencia.id)
            .eq('trt', trt)
            .eq('grau', grau)
            .eq('numero_processo', numeroProcesso);

          if (error) {
            throw error;
          }

          atualizados++;
          captureLogService.logAtualizado(
            entidade,
            audiencia.id,
            trt,
            grau,
            numeroProcesso,
            comparacao.camposAlterados
          );
        }
      }
    } catch (error) {
      erros++;
      const erroMsg =
        error instanceof Error ? error.message : String(error);
      captureLogService.logErro(entidade, erroMsg, {
        id_pje: audiencia.id,
        numero_processo: audiencia.processo?.numero,
        trt,
        grau,
      });
      console.error(`Erro ao salvar audiência ${audiencia.id}:`, error);
    }
  }

  return {
    inseridos,
    atualizados,
    naoAtualizados,
    erros,
    total: audiencias.length,
    orgaosJulgadoresCriados,
  };
}

