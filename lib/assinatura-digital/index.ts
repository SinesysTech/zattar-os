// Re-export validation functions
export {
  MAX_MARKDOWN_CHARS,
  validateMarkdownContent,
  normalizeMarkdownContent,
  validateMarkdownForForm,
  type MarkdownValidationResult,
} from './validation/markdown';

// Re-export utils
export {
  getAvailableVariables,
  type VariableOption,
} from './utils/variable-filter';

export {
  markdownToTiptapJSON,
  tiptapJSONToMarkdown,
  type TiptapDocument,
  type TiptapNode,
  type TiptapMark,
} from './utils/markdown-converter';

export * from './validations';
export * from './constants';