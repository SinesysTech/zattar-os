/**
 * PANGEA MODULE — Barrel Export (API Pública)
 *
 * Módulo de busca no Banco Nacional de Precedentes (BNP) do CNJ.
 * Estrutura FSD aninhada em `feature/`.
 */

// =============================================================================
// Components
// =============================================================================

export { PangeaPageContent } from './feature/components/pangea-page-content';

// =============================================================================
// Actions
// =============================================================================

export {
    actionBuscarPrecedentesPangea,
    actionListarOrgaosPangeaDisponiveis,
} from './feature/actions/pangea-actions';

// =============================================================================
// Types / Domain
// =============================================================================

export type {
    PangeaBuscaInput,
    PangeaBuscaResponse,
    PangeaResultado,
    PangeaAgg,
    PangeaOrgaoDisponivel,
    PangeaOrdenacao,
    PangeaTipo,
} from './feature/domain';

export {
    PANGEA_ORDENACAO_VALUES,
    PANGEA_MAX_TAMANHO_PAGINA,
    PANGEA_TIPO_VALUES,
    pangeaBuscaInputSchema,
} from './feature/domain';
