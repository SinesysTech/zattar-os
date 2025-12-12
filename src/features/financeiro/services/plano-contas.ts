/**
 * Service do Plano de Contas
 * Casos de uso e orquestração de regras de negócio
 */

import { PlanoContasRepository } from '../repository/plano-contas';
import {
    validarCriacaoConta,
    validarExclusaoConta,
    validarLancamentoConta,
    organizarHierarquia,
    gerarProximoCodigo,
    sugerirContaPadrao
} from '../domain/plano-contas';
import type {
    PlanoContas,
    PlanoContaComPai,
    CriarPlanoContaDTO,
    AtualizarPlanoContaDTO,
    PlanoContasFilters
} from '../domain/plano-contas';

// ============================================================================
// Service Implementation
// ============================================================================

export const PlanoContasService = {
    /**
     * Lista todas as contas do plano de contas
     */
    async listarContas(filters?: PlanoContasFilters): Promise<PlanoContas[]> {
        return PlanoContasRepository.listar(filters);
    },

    /**
     * Lista contas com informação do pai
     */
    async listarContasComPai(filters?: PlanoContasFilters): Promise<PlanoContaComPai[]> {
        return PlanoContasRepository.listarComPai(filters);
    },

    /**
     * Lista contas organizadas hierarquicamente
     */
    async listarHierarquia(filters?: PlanoContasFilters): Promise<PlanoContas[]> {
        const contas = await PlanoContasRepository.listar(filters);
        return organizarHierarquia(contas);
    },

    /**
     * Busca uma conta por ID
     */
    async buscarPorId(id: number): Promise<PlanoContas | null> {
        return PlanoContasRepository.buscarPorId(id);
    },

    /**
     * Busca uma conta por código
     */
    async buscarPorCodigo(codigo: string): Promise<PlanoContas | null> {
        return PlanoContasRepository.buscarPorCodigo(codigo);
    },

    /**
     * Cria uma nova conta
     */
    async criar(dto: CriarPlanoContaDTO): Promise<PlanoContas> {
        // Validar regras de negócio
        const validacao = validarCriacaoConta(dto);
        if (!validacao.valido) {
            throw new Error(validacao.erros.join('; '));
        }

        // Verificar se código já existe
        const codigoExiste = await PlanoContasRepository.codigoExiste(dto.codigo);
        if (codigoExiste) {
            throw new Error(`Código ${dto.codigo} já existe`);
        }

        // Verificar se conta pai existe (se informada)
        if (dto.contaPaiId) {
            const contaPai = await PlanoContasRepository.buscarPorId(dto.contaPaiId);
            if (!contaPai) {
                throw new Error('Conta pai não encontrada');
            }
        }

        return PlanoContasRepository.criar(dto);
    },

    /**
     * Atualiza uma conta
     */
    async atualizar(dto: AtualizarPlanoContaDTO): Promise<PlanoContas> {
        const existente = await PlanoContasRepository.buscarPorId(dto.id);
        if (!existente) {
            throw new Error('Conta não encontrada');
        }

        // Verificar se novo código conflita (se alterado)
        if (dto.codigo && dto.codigo !== existente.codigo) {
            const codigoExiste = await PlanoContasRepository.codigoExiste(dto.codigo, dto.id);
            if (codigoExiste) {
                throw new Error(`Código ${dto.codigo} já existe`);
            }
        }

        return PlanoContasRepository.atualizar(dto.id, dto);
    },

    /**
     * Exclui uma conta
     */
    async excluir(id: number): Promise<void> {
        const conta = await PlanoContasRepository.buscarPorId(id);
        if (!conta) {
            throw new Error('Conta não encontrada');
        }

        const temFilhas = await PlanoContasRepository.temFilhas(id);
        const temLancamentos = await PlanoContasRepository.temLancamentos(id);

        const validacao = validarExclusaoConta(conta, temFilhas, temLancamentos);
        if (!validacao.valido) {
            throw new Error(validacao.erros.join('; '));
        }

        return PlanoContasRepository.excluir(id);
    },

    /**
     * Valida se um lançamento pode usar uma conta específica
     */
    async validarLancamentoConta(
        contaId: number,
        tipoLancamento: 'receita' | 'despesa'
    ): Promise<boolean> {
        const conta = await PlanoContasRepository.buscarPorId(contaId);
        if (!conta) return false;

        const validacao = validarLancamentoConta(conta, tipoLancamento);
        return validacao.valido;
    },

    /**
     * Sugere conta padrão para um tipo de lançamento
     */
    async sugerirContaPorTipo(tipo: 'receita' | 'despesa'): Promise<PlanoContas | null> {
        const contas = await PlanoContasRepository.listarAnaliticasPorTipo(tipo);
        return sugerirContaPadrao(contas, tipo);
    },

    /**
     * Gera próximo código disponível
     */
    async gerarProximoCodigo(contaPaiId?: number): Promise<string> {
        let codigoPai: string | null = null;

        if (contaPaiId) {
            const contaPai = await PlanoContasRepository.buscarPorId(contaPaiId);
            if (!contaPai) {
                throw new Error('Conta pai não encontrada');
            }
            codigoPai = contaPai.codigo;
        }

        const codigosExistentes = await PlanoContasRepository.listarCodigos();
        return gerarProximoCodigo(codigoPai, codigosExistentes);
    },

    /**
     * Busca contas filhas de uma conta
     */
    async buscarFilhas(contaPaiId: number): Promise<PlanoContas[]> {
        return PlanoContasRepository.buscarFilhas(contaPaiId);
    },

    /**
     * Lista contas analíticas por tipo
     */
    async listarAnaliticasPorTipo(tipo: 'receita' | 'despesa'): Promise<PlanoContas[]> {
        return PlanoContasRepository.listarAnaliticasPorTipo(tipo);
    }
};
