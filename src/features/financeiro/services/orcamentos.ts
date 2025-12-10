/**
 * Service de Orçamentos
 * Casos de uso e orquestração de regras de negócio
 */

import { OrcamentosRepository } from '../repository/orcamentos';
import type {
    Orcamento,
    OrcamentoComItens,
    OrcamentoComDetalhes,
    ListarOrcamentosParams,
    ListarOrcamentosResponse,
    CriarOrcamentoDTO,
    AtualizarOrcamentoDTO,
    AnaliseOrcamentaria,
    AnaliseOrcamentariaItem,
    ResumoOrcamentario,
    AlertaDesvio
} from '../types/orcamentos';

// ============================================================================
// Service Implementation
// ============================================================================

export const OrcamentosService = {
    /**
     * Lista orçamentos com filtros
     */
    async listar(params: ListarOrcamentosParams): Promise<ListarOrcamentosResponse> {
        return OrcamentosRepository.listar(params);
    },

    /**
     * Busca orçamento por ID com detalhes
     */
    async buscarPorId(id: number): Promise<OrcamentoComDetalhes | null> {
        return OrcamentosRepository.buscarPorId(id);
    },

    /**
     * Cria novo orçamento
     */
    async criar(dto: CriarOrcamentoDTO, usuarioId: string): Promise<Orcamento> {
        // Validar datas
        if (new Date(dto.dataInicio) > new Date(dto.dataFim)) {
            throw new Error('Data de início deve ser anterior à data de fim');
        }

        return OrcamentosRepository.criar(dto, usuarioId);
    },

    /**
     * Atualiza orçamento
     */
    async atualizar(id: number, dto: AtualizarOrcamentoDTO): Promise<Orcamento> {
        const existente = await OrcamentosRepository.buscarPorId(id);
        if (!existente) {
            throw new Error('Orçamento não encontrado');
        }

        // Só pode atualizar rascunhos
        if (existente.status !== 'rascunho') {
            throw new Error('Apenas orçamentos em rascunho podem ser editados');
        }

        return OrcamentosRepository.atualizar(id, dto);
    },

    /**
     * Exclui orçamento
     */
    async excluir(id: number): Promise<void> {
        const existente = await OrcamentosRepository.buscarPorId(id);
        if (!existente) {
            throw new Error('Orçamento não encontrado');
        }

        if (existente.status !== 'rascunho') {
            throw new Error('Apenas orçamentos em rascunho podem ser excluídos');
        }

        return OrcamentosRepository.excluir(id);
    },

    /**
     * Aprova orçamento
     */
    async aprovar(id: number, usuarioId: string, observacoes?: string): Promise<Orcamento> {
        const existente = await OrcamentosRepository.buscarPorId(id);
        if (!existente) {
            throw new Error('Orçamento não encontrado');
        }

        if (existente.status !== 'rascunho') {
            throw new Error('Apenas orçamentos em rascunho podem ser aprovados');
        }

        return OrcamentosRepository.atualizarStatus(id, 'aprovado', usuarioId, observacoes);
    },

    /**
     * Inicia execução do orçamento
     */
    async iniciarExecucao(id: number, usuarioId: string): Promise<Orcamento> {
        const existente = await OrcamentosRepository.buscarPorId(id);
        if (!existente) {
            throw new Error('Orçamento não encontrado');
        }

        if (existente.status !== 'aprovado') {
            throw new Error('Apenas orçamentos aprovados podem iniciar execução');
        }

        return OrcamentosRepository.atualizarStatus(id, 'em_execucao', usuarioId);
    },

    /**
     * Encerra orçamento
     */
    async encerrar(id: number, usuarioId: string, observacoes?: string): Promise<Orcamento> {
        const existente = await OrcamentosRepository.buscarPorId(id);
        if (!existente) {
            throw new Error('Orçamento não encontrado');
        }

        if (existente.status !== 'em_execucao') {
            throw new Error('Apenas orçamentos em execução podem ser encerrados');
        }

        return OrcamentosRepository.atualizarStatus(id, 'encerrado', usuarioId, observacoes);
    },

    /**
     * Busca análise orçamentária
     */
    async buscarAnalise(orcamentoId: number): Promise<AnaliseOrcamentaria | null> {
        return OrcamentosRepository.buscarAnalise(orcamentoId);
    },

    /**
     * Mapeia análise para formato de UI
     */
    mapAnaliseToUI(analise: AnaliseOrcamentaria): {
        itens: AnaliseOrcamentariaItem[];
        resumo: ResumoOrcamentario;
        alertas: AlertaDesvio[];
        evolucao: null;
    } {
        return {
            itens: analise.itens,
            resumo: analise.resumo,
            alertas: analise.alertas,
            evolucao: null // TODO: Implementar evolução temporal
        };
    }
};

// Exportar funções individuais para compatibilidade com actions
export const listarOrcamentos = OrcamentosService.listar.bind(OrcamentosService);
export const buscarOrcamentoComDetalhes = OrcamentosService.buscarPorId.bind(OrcamentosService);
export const criarOrcamento = OrcamentosService.criar.bind(OrcamentosService);
export const atualizarOrcamento = OrcamentosService.atualizar.bind(OrcamentosService);
export const deletarOrcamento = OrcamentosService.excluir.bind(OrcamentosService);
export const aprovarOrcamento = OrcamentosService.aprovar.bind(OrcamentosService);
export const iniciarExecucaoOrcamento = OrcamentosService.iniciarExecucao.bind(OrcamentosService);
export const encerrarOrcamento = OrcamentosService.encerrar.bind(OrcamentosService);
export const buscarAnaliseOrcamentaria = OrcamentosService.buscarAnalise.bind(OrcamentosService);
export const mapAnaliseToUI = OrcamentosService.mapAnaliseToUI.bind(OrcamentosService);
