// DialogFormShell — container para formulários de cadastro (multi-step ou single-step)
export { DialogFormShell } from "./dialog-form-shell";
export type { DialogFormShellProps } from "./dialog-form-shell";

// DialogDetailShell — container para dialogs de detalhe/visualização com inline edits + split
export { DialogDetailShell } from "./dialog-detail-shell";
export type { DialogDetailShellProps } from "./dialog-detail-shell";

// DialogSection — bloco estruturado (subsection + step badge + tone) dentro de qualquer shell
export { DialogSection } from "./dialog-section";
export type {
  DialogSectionProps,
  DialogSectionStepState,
} from "./dialog-section";

// DialogNavButtons — botões de navegação para dialogs multi-step (DialogFormShell)
export { DialogNavPrevious, DialogNavNext } from "./dialog-nav-buttons";
export type { DialogNavButtonProps } from "./dialog-nav-buttons";
