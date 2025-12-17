export { default as CreateTemplateForm } from './CreateTemplateForm';
export { default as PdfCanvasArea } from './PdfCanvasArea';
export { default as PropertiesPopover } from './PropertiesPopover';
export { default as TemplateInfoPopover } from './TemplateInfoPopover';
export { default as ReplacePdfDialog } from './ReplacePdfDialog';
export { RichTextEditor } from './RichTextEditor';
export { RichTextEditorPopover } from './RichTextEditorPopover';
export { MarkdownRichTextEditor } from './MarkdownRichTextEditor';
export { MarkdownRichTextEditorDialog } from './MarkdownRichTextEditorDialog';
export { Variable } from './extensions/Variable';
export { default as FieldMappingEditor } from './FieldMappingEditor';
export { default as ToolbarButtons } from './ToolbarButtons';
export { default as ToolbarButtonsMobile } from './ToolbarButtonsMobile';

// Template Texto (text-based templates with Plate editor)
export {
  TemplateTypeSelector,
  TemplateTextoEditor,
  TemplateTextoCreateForm,
  TEMPLATE_VARIABLES,
  CATEGORY_LABELS,
  getVariablesByCategory,
  getVariableByKey,
  type TemplateType,
  type TemplateVariable,
  type VariableCategory,
  type TemplateTextoMetadata,
  type TemplateTextoContent,
  type TemplateTextoFormData,
} from './template-texto';

// Editor hooks (extracted for maintainability)
export {
  useFieldDrag,
  useToolbarDrag,
  useAutosave,
  useZoomPan,
  useFieldSelection,
  useFieldValidation,
  useUnsavedChanges,
} from './hooks';

// Editor types
export type {
  EditorField,
  EditorMode,
  DragState,
  ResizeHandle,
  ApiPreviewTestResponse,
  CanvasSize,
  ToolbarPosition,
} from './types';

// Utilities
export { validatePdfFile, formatFileSize } from './utils';