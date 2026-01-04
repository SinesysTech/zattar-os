/**
 * Editor Utilities
 *
 * Utility functions for the FieldMappingEditor component.
 */

export { validatePdfFile, formatFileSize } from './validate-pdf-file';

// Field helpers
export {
  estimateRichTextHeight,
  validateFieldHeight,
  calculateAutoHeight,
  normalizeFieldId,
  generateUniqueFieldId,
  fieldsToTemplateCampos,
  validateFieldIds,
} from './field-helpers';

// Template helpers
export { normalizeTemplateFields, createNewField } from './template-helpers';

// Canvas helpers
export {
  calculateCanvasPosition,
  clampPosition,
  clampDimensions,
  calculateResizeDimensions,
  calculateDuplicatePosition,
  MIN_FIELD_SIZE,
  DRAG_THRESHOLD,
} from './canvas-helpers';
