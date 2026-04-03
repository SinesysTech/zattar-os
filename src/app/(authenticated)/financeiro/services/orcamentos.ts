/**
 * Service de Orçamentos
 * Casos de uso e orquestração de regras de negócio
 */

import { OrcamentosRepository } from '../repository/orcamentos';
import type {
    Orcamento,
    OrcamentoComDetalhes,
    ListarOrcamentosParams,
    ListarOrcamentosResponse,
    CriarOrcamentoDTO,
    AtualizarOrcamentoDTO,
    OrcamentoItem,
    CriarOrcamentoItemDTO,
    AtualizarOrcamentoItemDTO,
    AnaliseOrcamentaria,
    AnaliseOrcamentariaItem,
    ResumoOrcamentario,
    AlertaDesvio
} from '../domain/orcamentos';
import {
    validarCriarOrcamentoDTO,
    validarAtualizarOrcamentoDTO,
    validarCriarOrcamentoItemDTO,
    validarAtualizarOrcamentoItemDTO,
    podeEditarOrcamento,
    podeExcluirOrcamento,
    podeAprovarOrcamento,
    podeIniciarExecucao,
    podeEncerrarOrcamento
} from '../domain/orcamentos';

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
        // Validar DTO usando regras do domain
        const validacao = validarCriarOrcamentoDTO(dto);
        if (!validacao.valido) {
            throw new Error(`Dados inválidos: ${validacao.erros.join(', ')}`);
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

        // Validar se pode editar usando regras do domain
        const podeEditar = podeEditarOrcamento(existente);
        if (!podeEditar.pode) {
            throw new Error(podeEditar.motivo);
        }

        // Validar DTO usando regras do domain
        const validacao = validarAtualizarOrcamentoDTO(dto);
        if (!validacao.valido) {
            throw new Error(`Dados inválidos: ${validacao.erros.join(', ')}`);
        }

        return OrcamentosRepository.atualizar(id, dto);
    },

    /**
     * Cria item do orçamento (rascunho / quando permitido)
     */
    async criarItem(orcamentoId: number, dto: CriarOrcamentoItemDTO): Promise<OrcamentoItem> {
        const existente = await OrcamentosRepository.buscarPorId(orcamentoId);
        if (!existente) throw new Error('Orçamento não encontrado');

        const podeEditar = podeEditarOrcamento(existente);
        if (!podeEditar.pode) throw new Error(podeEditar.motivo);

        const validacao = validarCriarOrcamentoItemDTO(dto);
        if (!validacao.valido) throw new Error(`Dados inválidos: ${validacao.erros.join(', ')}`);

        return OrcamentosRepository.criarItem(orcamentoId, dto);
    },

    /**
     * Atualiza item do orçamento (rascunho / quando permitido)
     */
    async atualizarItem(orcamentoId: number, itemId: number, dto: AtualizarOrcamentoItemDTO): Promise<OrcamentoItem> {
        const existente = await OrcamentosRepository.buscarPorId(orcamentoId);
        if (!existente) throw new Error('Orçamento não encontrado');

        const podeEditar = podeEditarOrcamento(existente);
        if (!podeEditar.pode) throw new Error(podeEditar.motivo);

        const validacao = validarAtualizarOrcamentoItemDTO(dto);
        if (!validacao.valido) throw new Error(`Dados inválidos: ${validacao.erros.join(', ')}`);

        return OrcamentosRepository.atualizarItem(orcamentoId, itemId, dto);
    },

    /**
     * Exclui orçamento
     */
    async excluir(id: number): Promise<void> {
        const existente = await OrcamentosRepository.buscarPorId(id);
        if (!existente) {
            throw new Error('Orçamento não encontrado');
        }

        // Validar se pode excluir usando regras do domain
        const podeExcluir = podeExcluirOrcamento(existente);
        if (!podeExcluir.pode) {
            throw new Error(podeExcluir.motivo);
        }

        return OrcamentosRepository.excluir(id);
    },

    /**
     * Exclui item de orçamento (apenas quando orçamento pode ser editado)
     */
    async excluirItem(orcamentoId: number, itemId: number): Promise<void> {
        const existente = await OrcamentosRepository.buscarPorId(orcamentoId);
        if (!existente) {
            throw new Error('Orçamento não encontrado');
        }

        const podeEditar = podeEditarOrcamento(existente);
        if (!podeEditar.pode) {
            throw new Error(podeEditar.motivo);
        }

        return OrcamentosRepository.excluirItem(orcamentoId, itemId);
    },

    /**
     * Aprova orçamento
     */
    async aprovar(id: number, usuarioId: string, observacoes?: string): Promise<Orcamento> {
        const existente = await OrcamentosRepository.buscarPorId(id);
        if (!existente) {
            throw new Error('Orçamento não encontrado');
        }

        // Validar se pode aprovar usando regras do domain
        const podeAprovar = podeAprovarOrcamento(existente);
        if (!podeAprovar.pode) {
            throw new Error(podeAprovar.motivo);
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

        // Validar se pode iniciar usando regras do domain
        const podeIniciar = podeIniciarExecucao(existente);
        if (!podeIniciar.pode) {
            throw new Error(podeIniciar.motivo);
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

        // Validar se pode encerrar usando regras do domain
        const podeEncerrar = podeEncerrarOrcamento(existente);
        if (!podeEncerrar.pode) {
            throw new Error(podeEncerrar.motivo);
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
export const excluirItemOrcamento = OrcamentosService.excluirItem.bind(OrcamentosService);
export const aprovarOrcamento = OrcamentosService.aprovar.bind(OrcamentosService);
export const iniciarExecucaoOrcamento = OrcamentosService.iniciarExecucao.bind(OrcamentosService);
export const encerrarOrcamento = OrcamentosService.encerrar.bind(OrcamentosService);
export const buscarAnaliseOrcamentaria = OrcamentosService.buscarAnalise.bind(OrcamentosService);
export const mapAnaliseToUI = OrcamentosService.mapAnaliseToUI.bind(OrcamentosService);
