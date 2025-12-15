/**
 * ASSINATURA DIGITAL - Actions barrel export
 */

export { searchClienteByCPF, searchParteContraria } from './form-actions';

// Re-export other actions from the main actions file
export {
  listarSegmentosAction,
  criarSegmentoAction,
  atualizarSegmentoAction,
  listarTemplatesAction,
  criarTemplateAction,
  processarTemplateAction,
  gerarPdfDeMarkdownAction,
} from '../actions';

