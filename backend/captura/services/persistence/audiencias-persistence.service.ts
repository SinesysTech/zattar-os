// Serviço de persistência de audiências
// Salva audiências capturadas no banco de dados

import { createServiceClient } from '@/backend/utils/supabase/service-client';
import type { Audiencia } from '@/backend/api/pje-trt/types';
import type { CodigoTRT, GrauTRT } from '../trt/types';
import { buscarOrgaoJulgador } from './orgao-julgador-persistence.service';
import { buscarProcessoNoAcervo } from './acervo-persistence.service';
import { salvarOrgaoJulgador } from './orgao-julgador-persistence.service';

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
 * Salva múltiplas audiências no banco de dados
 * Usa UPSERT baseado na constraint unique (id_pje, trt, grau, numero_processo)
 * Também salva/atualiza órgãos julgadores relacionados
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

  // Converter audiências para formato do banco
  const dados = dadosComRelacoes.map(({ audiencia, orgaoJulgadorId, processoId }) => ({
    id_pje: audiencia.id,
    advogado_id: advogadoId,
    processo_id: processoId, // Pode ser null se processo não estiver no acervo
    orgao_julgador_id: orgaoJulgadorId,
    trt,
    grau,
    numero_processo: audiencia.processo?.numero?.trim() ?? '',
    data_inicio: parseDate(audiencia.dataInicio),
    data_fim: parseDate(audiencia.dataFim),
    sala_audiencia_nome: audiencia.salaAudiencia?.nome?.trim() ?? null,
    sala_audiencia_id: audiencia.salaAudiencia?.id ?? null,
    status: audiencia.status,
    status_descricao: null, // Não vem na API básica
    tipo_id: audiencia.tipo?.id ?? null,
    tipo_descricao: audiencia.tipo?.descricao?.trim() ?? null,
    tipo_codigo: null, // Não vem na API básica
    tipo_is_virtual: false, // Não vem na API básica
    designada: false, // Não vem na API básica
    em_andamento: false, // Não vem na API básica
    documento_ativo: false, // Não vem na API básica
    polo_ativo_nome: audiencia.poloAtivo?.nome?.trim() ?? null,
    polo_ativo_cpf: audiencia.poloAtivo?.cpf?.trim() ?? null,
    polo_passivo_nome: audiencia.poloPassivo?.nome?.trim() ?? null,
    polo_passivo_cnpj: audiencia.poloPassivo?.cnpj?.trim() ?? null,
    url_audiencia_virtual: audiencia.urlAudienciaVirtual?.trim() ?? null,
    hora_inicial: parseTime(audiencia.pautaAudienciaHorario?.horaInicial),
    hora_final: parseTime(audiencia.pautaAudienciaHorario?.horaFinal),
  }));

  // UPSERT em lotes para melhor performance
  const BATCH_SIZE = 100;
  const inseridos = 0; // UPSERT não distingue inseridos de atualizados, sempre 0
  let atualizados = 0;
  let erros = 0;

  for (let i = 0; i < dados.length; i += BATCH_SIZE) {
    const batch = dados.slice(i, i + BATCH_SIZE);

    const { data, error } = await supabase
      .from('audiencias')
      .upsert(batch, {
        onConflict: 'id_pje,trt,grau,numero_processo',
        ignoreDuplicates: false,
      })
      .select('id');

    if (error) {
      console.error(`Erro ao salvar lote de audiências (${i + 1}-${Math.min(i + BATCH_SIZE, dados.length)}):`, error);
      erros += batch.length;
    } else {
      const count = data?.length ?? 0;
      atualizados += count;
    }
  }

  return {
    inseridos: 0, // UPSERT não distingue inseridos de atualizados
    atualizados: inseridos + atualizados,
    erros,
    total: audiencias.length,
    orgaosJulgadoresCriados,
  };
}

