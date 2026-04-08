/**
 * AJUDA MODULE — Barrel Export (API Pública)
 *
 * Central de Ajuda do ZattarOS — sistema de documentação dinâmica
 * baseado em registry + lazy loading. Serve documentação interna
 * para usuários do sistema.
 *
 * Intencionalmente sem domain.ts/service.ts/repository.ts (ver RULES.md).
 */

// =============================================================================
// Components
// =============================================================================

export { DocsSidebar } from './components/docs-sidebar';
export {
    DocSection,
    DocFieldTable,
    DocActionList,
    DocTip,
    DocSteps,
} from './components/doc-components';
export type { FieldDef, ActionDef, StepDef } from './components/doc-components';

// =============================================================================
// Types / Domain (Registry)
// =============================================================================

export { docsRegistry, resolveSlug, searchDocs } from './docs-registry';
export type { DocEntry } from './docs-registry';
