'use server';

/**
 * Server Actions para Orçamentos
 * Consolida as rotas REST de /api/financeiro/orcamentos/*
 */

import { revalidatePath } from 'next/cache';
import {
    listarOrcamentos,
    criarOrcamento,
    buscarOrcamentoComDetalhes,
    atualizarOrcamento,
    deletarOrcamento,
    aprovarOrcamento,
    iniciarExecucaoOrcamento,
    encerrarOrcamento,
} from '@/backend/financeiro/orcamento/services/persistence/orcamento-persistence.service';
import {
    buscarAnaliseOrcamentaria,
} from '@/backend/financeiro/orcamento/services/persistence/analise-orcamentaria-persistence.service';
import {
    mapAnaliseToUI,
} from '@/backend/financeiro/orcamento/services/orcamento/relatorios-orcamento.service';
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
} from '@/backend/types/financeiro/orcamento.types';

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
) {
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
