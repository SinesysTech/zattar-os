/**
 * CONFIGURAÇÕES MODULE — Barrel Export (API Pública)
 *
 * Módulo de configurações do sistema. Painel administrativo com abas
 * para métricas, segurança, integrações, assistentes IA, aparência e prompts.
 */

// =============================================================================
// Components
// =============================================================================

export { ConfiguracoesSettingsLayout } from './components/configuracoes-settings-layout';
export type { ConfiguracoesSettingsLayoutProps } from './components/configuracoes-settings-layout';
export { SettingsSectionHeader } from './components/settings-section-header';
export { SettingsNav } from './components/settings-nav';
export { SettingsMobileNav } from './components/settings-mobile-nav';
export { AparenciaContent } from './components/aparencia-content';

// =============================================================================
// Types / Domain
// =============================================================================

export { VALID_TABS, findNavItem } from './components/settings-nav-items';
export type { SettingsTab } from './components/settings-nav-items';
