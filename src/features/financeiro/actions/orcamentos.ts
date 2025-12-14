'use server';

/**
 * Server Actions para Orçamentos
 * Usa services locais da feature financeiro
 */

import { revalidatePath } from 'next/cache';
import {
    OrcamentosService,
    listarOrcamentos,
    criarOrcamento,
    buscarOrcamentoComDetalhes,
    atualizarOrcamento,
    deletarOrcamento,
    excluirItemOrcamento,
    aprovarOrcamento,
    iniciarExecucaoOrcamento,
    encerrarOrcamento,
    buscarAnaliseOrcamentaria,
    mapAnaliseToUI,
} from '../services/orcamentos';
import {
    validarCriarOrcamentoDTO,
    validarAtualizarOrcamentoDTO,
    isStatusValido,
    isPeriodoValido,
    type ListarOrcamentosParams,
    type StatusOrcamento,
    type PeriodoOrcamento,
    type CriarOrcamentoDTO,
    type AtualizarOrcamentoDTO,
    type CriarOrcamentoItemDTO,
    type AtualizarOrcamentoItemDTO,
    type AnaliseOrcamentariaItem,
    type ResumoOrcamentario,
    type AlertaDesvio,
    type ProjecaoItem,
} from '../domain/orcamentos';

// ============================================================================
// Types
// ============================================================================

export interface ListarOrcamentosFilters {
    pagina?: number;
    limite?: number;
    busca?: string;
    ano?: number;
    periodo?: PeriodoOrcamento;
    status?: StatusOrcamento | StatusOrcamento[];
    ordenarPor?: 'nome' | 'ano' | 'periodo' | 'status' | 'data_inicio' | 'created_at';
    ordem?: 'asc' | 'desc';
}

export interface AnaliseOrcamentariaOptions {
    incluirResumo?: boolean;
    incluirAlertas?: boolean;
    incluirEvolucao?: boolean;
}

export interface AnaliseOrcamentariaUI {
    itens: AnaliseOrcamentariaItem[];
    resumo: ResumoOrcamentario | null;
    alertas: AlertaDesvio[] | null;
    evolucao: ProjecaoItem[] | null;
}

// ============================================================================
// Server Actions - CRUD
// ============================================================================

/**
 * Lista orçamentos com filtros
 */
export async function actionListarOrcamentos(filters?: ListarOrcamentosFilters) {
    try {
        const params: ListarOrcamentosParams = {
            pagina: filters?.pagina,
            limite: filters?.limite ? Math.min(filters.limite, 100) : undefined,
            busca: filters?.busca,
            ano: filters?.ano,
            periodo: filters?.periodo && isPeriodoValido(filters.periodo) ? filters.periodo : undefined,
            status: filters?.status,
            ordenarPor: filters?.ordenarPor,
            ordem: filters?.ordem,
        };

        const resultado = await listarOrcamentos(params);

        return { success: true, data: resultado };
    } catch (error) {
        console.error('Erro ao listar orçamentos:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Erro interno' };
    }
}

/**
 * Busca orçamento por ID com detalhes
 */
export async function actionBuscarOrcamento(id: number) {
    try {
        if (!id || id <= 0) {
            return { success: false, error: 'ID do orçamento inválido' };
        }

        const orcamento = await buscarOrcamentoComDetalhes(id);

        if (!orcamento) {
            return { success: false, error: 'Orçamento não encontrado' };
        }

        return { success: true, data: orcamento };
    } catch (error) {
        console.error('Erro ao buscar orçamento:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Erro interno' };
    }
}

/**
 * Cria novo orçamento
 */
export async function actionCriarOrcamento(dto: CriarOrcamentoDTO, usuarioId: string) {
    try {
        if (!usuarioId) {
            return { success: false, error: 'Usuário não identificado' };
        }

        if (!validarCriarOrcamentoDTO(dto)) {
            return {
                success: false,
                error: 'Dados inválidos. Campos obrigatórios: nome, ano, periodo, dataInicio, dataFim. dataFim deve ser maior que dataInicio.',
            };
        }

        const orcamento = await criarOrcamento(dto, usuarioId);
        revalidatePath('/financeiro/orcamentos');

        return { success: true, data: orcamento };
    } catch (error) {
        console.error('Erro ao criar orçamento:', error);
        const erroMsg = error instanceof Error ? error.message : 'Erro interno';

        if (erroMsg.includes('obrigatório') || erroMsg.includes('inválido') || erroMsg.includes('Já existe')) {
            return { success: false, error: erroMsg };
        }

        return { success: false, error: erroMsg };
    }
}

/**
 * Atualiza orçamento
 */
export async function actionAtualizarOrcamento(id: number, dto: AtualizarOrcamentoDTO) {
    try {
        if (!id || id <= 0) {
            return { success: false, error: 'ID do orçamento inválido' };
        }

        if (!validarAtualizarOrcamentoDTO(dto)) {
            return { success: false, error: 'Dados inválidos. Forneça pelo menos um campo para atualizar.' };
        }

        const orcamento = await atualizarOrcamento(id, dto);
        revalidatePath('/financeiro/orcamentos');
        revalidatePath(`/financeiro/orcamentos/${id}`);

        return { success: true, data: orcamento };
    } catch (error) {
        console.error('Erro ao atualizar orçamento:', error);
        const erroMsg = error instanceof Error ? error.message : 'Erro interno';

        return { success: false, error: erroMsg };
    }
}

/**
 * Exclui orçamento (apenas rascunhos)
 */
export async function actionExcluirOrcamento(id: number) {
    try {
        if (!id || id <= 0) {
            return { success: false, error: 'ID do orçamento inválido' };
        }

        await deletarOrcamento(id);
        revalidatePath('/financeiro/orcamentos');

        return { success: true, message: 'Orçamento deletado com sucesso' };
    } catch (error) {
        console.error('Erro ao deletar orçamento:', error);
        const erroMsg = error instanceof Error ? error.message : 'Erro interno';

        return { success: false, error: erroMsg };
    }
}

/**
 * Exclui item de orçamento (apenas em rascunho / quando permitido pelo domain)
 */
export async function actionExcluirItemOrcamento(orcamentoId: number, itemId: number) {
    try {
        if (!orcamentoId || orcamentoId <= 0) {
            return { success: false, error: 'ID do orçamento inválido' };
        }
        if (!itemId || itemId <= 0) {
            return { success: false, error: 'ID do item inválido' };
        }

        await excluirItemOrcamento(orcamentoId, itemId);
        revalidatePath(`/financeiro/orcamentos/${orcamentoId}`);
        revalidatePath('/financeiro/orcamentos');

        return { success: true, message: 'Item excluído com sucesso' };
    } catch (error) {
        console.error('Erro ao excluir item do orçamento:', error);
        const erroMsg = error instanceof Error ? error.message : 'Erro interno';
        return { success: false, error: erroMsg };
    }
}

/**
 * Cria item de orçamento
 */
export async function actionCriarItemOrcamento(orcamentoId: number, dto: CriarOrcamentoItemDTO) {
    try {
        if (!orcamentoId || orcamentoId <= 0) {
            return { success: false, error: 'ID do orçamento inválido' };
        }

        const item = await OrcamentosService.criarItem(orcamentoId, dto);
        revalidatePath(`/financeiro/orcamentos/${orcamentoId}`);
        return { success: true, data: item };
    } catch (error) {
        const erroMsg = error instanceof Error ? error.message : 'Erro interno';
        return { success: false, error: erroMsg };
    }
}

/**
 * Atualiza item de orçamento
 */
export async function actionAtualizarItemOrcamento(
    orcamentoId: number,
    itemId: number,
    dto: AtualizarOrcamentoItemDTO
) {
    try {
        if (!orcamentoId || orcamentoId <= 0) {
            return { success: false, error: 'ID do orçamento inválido' };
        }
        if (!itemId || itemId <= 0) {
            return { success: false, error: 'ID do item inválido' };
        }

        const item = await OrcamentosService.atualizarItem(orcamentoId, itemId, dto);
        revalidatePath(`/financeiro/orcamentos/${orcamentoId}`);
        return { success: true, data: item };
    } catch (error) {
        const erroMsg = error instanceof Error ? error.message : 'Erro interno';
        return { success: false, error: erroMsg };
    }
}

// ============================================================================
// Server Actions - Workflow
// ============================================================================

/**
 * Aprova orçamento em rascunho
 */
export async function actionAprovarOrcamento(id: number, usuarioId: string, observacoes?: string) {
    try {
        if (!id || id <= 0) {
            return { success: false, error: 'ID do orçamento inválido' };
        }

        if (!usuarioId) {
            return { success: false, error: 'Usuário não identificado' };
        }

        const orcamento = await aprovarOrcamento(id, usuarioId, observacoes);
        revalidatePath('/financeiro/orcamentos');
        revalidatePath(`/financeiro/orcamentos/${id}`);

        return { success: true, data: orcamento, message: 'Orçamento aprovado com sucesso' };
    } catch (error) {
        console.error('Erro ao aprovar orçamento:', error);
        const erroMsg = error instanceof Error ? error.message : 'Erro interno';

        return { success: false, error: erroMsg };
    }
}

/**
 * Inicia execução de orçamento aprovado
 */
export async function actionIniciarExecucaoOrcamento(id: number, usuarioId: string) {
    try {
        if (!id || id <= 0) {
            return { success: false, error: 'ID do orçamento inválido' };
        }

        if (!usuarioId) {
            return { success: false, error: 'Usuário não identificado' };
        }

        const orcamento = await iniciarExecucaoOrcamento(id, usuarioId);
        revalidatePath('/financeiro/orcamentos');
        revalidatePath(`/financeiro/orcamentos/${id}`);

        return { success: true, data: orcamento, message: 'Execução do orçamento iniciada' };
    } catch (error) {
        console.error('Erro ao iniciar execução:', error);
        const erroMsg = error instanceof Error ? error.message : 'Erro interno';

        return { success: false, error: erroMsg };
    }
}

/**
 * Encerra orçamento
 */
export async function actionEncerrarOrcamento(id: number, usuarioId: string, observacoes?: string) {
    try {
        if (!id || id <= 0) {
            return { success: false, error: 'ID do orçamento inválido' };
        }

        if (!usuarioId) {
            return { success: false, error: 'Usuário não identificado' };
        }

        const orcamento = await encerrarOrcamento(id, usuarioId, observacoes);
        revalidatePath('/financeiro/orcamentos');
        revalidatePath(`/financeiro/orcamentos/${id}`);

        return { success: true, data: orcamento, message: 'Orçamento encerrado com sucesso' };
    } catch (error) {
        console.error('Erro ao encerrar orçamento:', error);
        const erroMsg = error instanceof Error ? error.message : 'Erro interno';

        return { success: false, error: erroMsg };
    }
}

// ============================================================================
// Server Actions - Análise
// ============================================================================

/**
 * Obtém análise orçamentária
 */
export async function actionObterAnaliseOrcamentaria(
    orcamentoId: number,
    options?: AnaliseOrcamentariaOptions
): Promise<{ success: true; data: AnaliseOrcamentariaUI } | { success: false; error: string }> {
    try {
        if (!orcamentoId || orcamentoId <= 0) {
            return { success: false, error: 'ID do orçamento inválido' };
        }

        const incluirResumo = options?.incluirResumo !== false;
        const incluirAlertas = options?.incluirAlertas !== false;
        const incluirEvolucao = options?.incluirEvolucao === true;

        const analise = await buscarAnaliseOrcamentaria({ orcamentoId });

        if (!analise) {
            return { success: false, error: 'Orçamento não encontrado ou sem dados de análise' };
        }

        const analiseUI = mapAnaliseToUI(analise);

        return {
            success: true,
            data: {
                itens: analiseUI.itens,
                resumo: incluirResumo ? analiseUI.resumo : null,
                alertas: incluirAlertas ? analiseUI.alertas : null,
                evolucao: incluirEvolucao ? analiseUI.evolucao : null,
            },
        };
    } catch (error) {
        console.error('Erro ao buscar análise orçamentária:', error);
        const erroMsg = error instanceof Error ? error.message : 'Erro interno';

        return { success: false, error: erroMsg };
    }
}

/**
 * Obtém projeção orçamentária
 */
export async function actionObterProjecaoOrcamentaria(orcamentoId: number) {
    try {
        if (!orcamentoId || orcamentoId <= 0) {
            return { success: false, error: 'ID do orçamento inválido' };
        }

        // TODO: Implementar serviço de projeção
        const analise = await buscarAnaliseOrcamentaria({ orcamentoId });

        if (!analise) {
            return { success: false, error: 'Orçamento não encontrado' };
        }

        const analiseUI = mapAnaliseToUI(analise);

        return {
            success: true,
            data: {
                projecao: analiseUI.evolucao || [],
                resumo: analiseUI.resumo,
            },
        };
    } catch (error) {
        console.error('Erro ao buscar projeção:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Erro interno' };
    }
}
