/**
 * EDITOR MODULE — Barrel Export (API Pública)
 *
 * Módulo proxy — rota `/editor` que carrega de forma lazy o componente
 * `PlateEditor` localizado em `src/components/editor/plate/plate-editor.tsx`.
 *
 * A estrutura do editor (extensions, plugins, regras de formatação, atalhos)
 * vive em `src/components/editor/plate/`, não neste módulo.
 * Intencionalmente sem domain.ts/service.ts/repository.ts (ver RULES.md).
 */

// =============================================================================
// Note: PlateEditor is loaded via next/dynamic in page.tsx for bundle optimization.
// Direct re-export is not provided to avoid pulling ~500KB into barrel imports.
// Consumers should import PlateEditor directly from '@/components/editor/plate/plate-editor'.
// =============================================================================
