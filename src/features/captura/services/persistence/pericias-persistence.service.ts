// Serviço de persistência de perícias
// Salva perícias capturadas no banco de dados com comparação antes de atualizar

import { createServiceClient } from '@/lib/supabase/service-client';
import type { Pericia } from '../../types/pericias-types';
import type { CodigoTRT, GrauTRT } from '../../types/trt-types';
import { buscarProcessoNoAcervo } from './acervo-persistence.service';
import {
  salvarEspecialidade,
  buscarEspecialidade,
  type EspecialidadePericiaInput,
} from './especialidade-persistence.service';
import {
  buscarOrgaoJulgador,
  salvarOrgaoJulgador,
  buscarOrgaoJulgadorPorDescricao,
  type OrgaoJulgadorPJE,
} from './orgao-julgador-persistence.service';
import { compararObjetos, removerCamposControle } from './comparison.util';
import { captureLogService, type TipoEntidade } from './capture-log.service';

/**
 * Parâmetros para salvar perícias
 */
export interface SalvarPericiasParams {
  pericias: Pericia[];
  advogadoId: number;
  trt: CodigoTRT;
  grau: GrauTRT;
}

/**
 * Resultado da persistência
 */
export interface SalvarPericiasResult {
  inseridos: number;
  atualizados: number;
  naoAtualizados: number;
  erros: number;
  total: number;
  especialidadesCriadas: number;
  peritosCriados: number;
}

/**
 * Converte data ISO string para timestamptz ou null
 */
function parseDate(dateString?: string | null): string | null {
  if (!dateString) return null;
  try {
    return new Date(dateString).toISOString();
  } catch {
    return null;
  }
}

/**
 * Busca um perito existente pelo id_tipo_parte
 */
async function buscarPeritoPorIdTipoParte(
  idTipoParte: number
): Promise<{ id: number } | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('terceiros')
    .select('id')
    .eq('tipo_parte', 'PERITO')
    .eq('id_tipo_parte', idTipoParte)
    .eq('ativo', true)
    .maybeSingle();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Erro ao buscar perito: ${error.message}`);
  }

  return data ? { id: data.id } : null;
}


/**
 * Busca uma perícia existente com todos os campos
 */
async function buscarPericiaExistente(
  idPje: number,
  trt: CodigoTRT,
  grau: GrauTRT,
  numeroProcesso: string
): Promise<Record<string, unknown> | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('pericias')
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
    throw new Error(`Erro ao buscar perícia: ${error.message}`);
  }

  return data as Record<string, unknown>;
}

/**
 * Salva múltiplas perícias no banco de dados
 * Compara cada registro antes de atualizar para evitar atualizações desnecessárias
 */
export async function salvarPericias(
  params: SalvarPericiasParams
): Promise<SalvarPericiasResult> {
  const supabase = createServiceClient();
  const { pericias, advogadoId, trt, grau } = params;

  if (pericias.length === 0) {
    return {
      inseridos: 0,
      atualizados: 0,
      naoAtualizados: 0,
      erros: 0,
      total: 0,
      especialidadesCriadas: 0,
      peritosCriados: 0,
    };
  }

  let especialidadesCriadas = 0;
  let peritosCriados = 0;

  const cacheEspecialidades = new Map<number, { id: number }>();
  const cachePeritos = new Map<number, { id: number }>();
  const cacheOrgaosJulgadores = new Map<string, { id: number }>();

  // Fase 1: Garantir que todas as especialidades estão salvas
  for (const pericia of pericias) {
    const idEspecialidade = pericia.idEspecialidade;

    // Verificar cache em memória
    const cached = cacheEspecialidades.get(idEspecialidade);
    if (cached) {
      continue;
    }

    // Buscar no banco
    const existe = await buscarEspecialidade(idEspecialidade, trt, grau);

    if (!existe) {
      // Criar especialidade
      const especialidadeInput: EspecialidadePericiaInput = {
        id: idEspecialidade,
        descricao: pericia.descricaoEspecialidade,
      };

      const salvo = await salvarEspecialidade({
        especialidade: especialidadeInput,
        trt,
        grau,
      });
      cacheEspecialidades.set(idEspecialidade, { id: salvo.id });
      if (salvo.inserido) {
        especialidadesCriadas++;
      }
    } else {
      cacheEspecialidades.set(idEspecialidade, existe);
    }
  }

  // Fase 2: Garantir que todos os peritos estão salvos em terceiros
  for (const pericia of pericias) {
    const idPerito = pericia.idPerito;

    // Verificar cache em memória
    const cached = cachePeritos.get(idPerito);
    if (cached) {
      continue;
    }

    // Buscar perito existente
    const peritoExistente = await buscarPeritoPorIdTipoParte(idPerito);

    if (!peritoExistente) {
      // Criar novo terceiro como perito diretamente no banco
      // (não usamos saveTerceiro pois requer CPF/CNPJ que não temos da API)
      try {
        const { data: novoPerito, error: insertError } = await supabase
          .from('terceiros')
          .insert({
            tipo_parte: 'PERITO',
            polo: 'TERCEIRO',
            tipo_pessoa: 'pf', // Assumir PF por padrão
            nome: pericia.nomePerito.trim(),
            id_tipo_parte: idPerito,
            ativo: true,
            cpf: null, // Não temos CPF da API
          })
          .select('id')
          .single();

        if (insertError) {
          throw insertError;
        }

        if (novoPerito) {
          cachePeritos.set(idPerito, { id: novoPerito.id });
          peritosCriados++;
        }
      } catch (error) {
        // Se falhar, continuar sem o perito (será null)
        console.error(`Erro ao criar perito ${idPerito}:`, error);
      }
    } else {
      cachePeritos.set(idPerito, peritoExistente);
    }
  }

  let inseridos = 0;
  let atualizados = 0;
  let naoAtualizados = 0;
  let erros = 0;

  const entidade: TipoEntidade = 'pericias';

  // Fase 3: Garantir que todos os órgãos julgadores estão salvos
  for (const pericia of pericias) {
    const nomeOrgaoJulgador = pericia.nomeOrgaoJulgador?.trim();
    if (nomeOrgaoJulgador) {
      const cacheKey = `${trt}:${grau}:${nomeOrgaoJulgador}`;
      const cached = cacheOrgaosJulgadores.get(cacheKey);
      if (cached) {
        continue;
      }

      // Tentar buscar por descrição
      const orgaoExistente = await buscarOrgaoJulgadorPorDescricao(
        nomeOrgaoJulgador,
        trt,
        grau
      );

      if (orgaoExistente) {
        // Armazenar no cache apenas se encontrado
        cacheOrgaosJulgadores.set(cacheKey, { id: orgaoExistente.id });
      }
      // Se não encontrado, não armazenar no cache (será null quando buscar)
    }
  }

  // Fase 4: Buscar IDs de relações e persistir perícias
  for (const pericia of pericias) {
    try {
      const numeroProcesso = pericia.numeroProcesso.trim();

      // Buscar processo no acervo - OBRIGATÓRIO (NOT NULL constraint)
      const processo = await buscarProcessoNoAcervo(
        pericia.idProcesso,
        trt,
        grau,
        numeroProcesso
      );

      if (!processo) {
        // Processo não encontrado no acervo - pular perícia e logar erro
        erros++;
        const erroMsg = `Processo não encontrado no acervo para perícia ${pericia.id} (processo PJE: ${pericia.idProcesso}, número: ${numeroProcesso})`;
        captureLogService.logErro(entidade, erroMsg, {
          id_pje: pericia.id,
          numero_processo: numeroProcesso,
          processo_id_pje: pericia.idProcesso,
          trt,
          grau,
        });
        console.error(erroMsg);
        continue;
      }

      const processoId = processo.id;

      // Buscar órgão julgador do cache
      const nomeOrgaoJulgador = pericia.nomeOrgaoJulgador?.trim();
      let orgaoJulgadorId: number | null = null;
      if (nomeOrgaoJulgador) {
        const cacheKey = `${trt}:${grau}:${nomeOrgaoJulgador}`;
        const cached = cacheOrgaosJulgadores.get(cacheKey);
        orgaoJulgadorId = cached ? cached.id : null;
      }

      // Buscar especialidade do cache
      const especialidadeCache = cacheEspecialidades.get(pericia.idEspecialidade);
      const especialidadeId = especialidadeCache?.id ?? null;

      // Buscar perito do cache
      const peritoCache = cachePeritos.get(pericia.idPerito);
      const peritoId = peritoCache?.id ?? null;

      // Montar objeto de dados
      const dadosNovos = {
        id_pje: pericia.id,
        advogado_id: advogadoId,
        processo_id: processoId,
        orgao_julgador_id: orgaoJulgadorId,
        trt,
        grau,
        numero_processo: numeroProcesso,
        prazo_entrega: parseDate(pericia.prazoEntrega),
        data_aceite: parseDate(pericia.dataAceite),
        data_criacao: parseDate(pericia.dataCriacao) ?? new Date().toISOString(),
        situacao_codigo: pericia.situacao.codigo,
        situacao_descricao: pericia.situacao.descricao,
        situacao_pericia: pericia.situacaoPericia,
        id_documento_laudo: pericia.idDocumentoLaudo ?? null,
        laudo_juntado: pericia.laudoJuntado,
        especialidade_id: especialidadeId,
        perito_id: peritoId,
        classe_judicial_sigla: pericia.siglaClasseJudicialProcesso ?? null,
        data_proxima_audiencia: parseDate(pericia.dataProximaAudienciaProcesso),
        segredo_justica: pericia.processoEmSegredoJustica,
        juizo_digital: pericia.juizoDigital,
        arquivado: pericia.arquivado,
        prioridade_processual: pericia.prioridadeProcessual,
        permissoes_pericia: pericia.permissoesPericia,
        funcionalidade_editor: pericia.funcionalidadeEditor ?? null,
      };

      // Buscar registro existente
      const registroExistente = await buscarPericiaExistente(
        pericia.id,
        trt,
        grau,
        numeroProcesso
      );

      if (!registroExistente) {
        // Inserir
        const { error } = await supabase.from('pericias').insert(dadosNovos);

        if (error) {
          throw error;
        }

        inseridos++;
        captureLogService.logInserido(entidade, pericia.id, trt, grau, numeroProcesso);
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
            pericia.id,
            trt,
            grau,
            numeroProcesso
          );
        } else {
          const dadosAnteriores = removerCamposControle(
            registroExistente as Record<string, unknown>
          );

          const { error } = await supabase
            .from('pericias')
            .update({
              ...dadosNovos,
              dados_anteriores: dadosAnteriores,
            })
            .eq('id_pje', pericia.id)
            .eq('trt', trt)
            .eq('grau', grau)
            .eq('numero_processo', numeroProcesso);

          if (error) {
            throw error;
          }

          atualizados++;
          captureLogService.logAtualizado(
            entidade,
            pericia.id,
            trt,
            grau,
            numeroProcesso,
            comparacao.camposAlterados
          );
        }
      }
    } catch (error) {
      erros++;
      const erroMsg = error instanceof Error ? error.message : String(error);
      captureLogService.logErro(entidade, erroMsg, {
        id_pje: pericia.id,
        numero_processo: pericia.numeroProcesso,
        trt,
        grau,
      });
      console.error(`Erro ao salvar perícia ${pericia.id}:`, error);
    }
  }

  return {
    inseridos,
    atualizados,
    naoAtualizados,
    erros,
    total: pericias.length,
    especialidadesCriadas,
    peritosCriados,
  };
}

