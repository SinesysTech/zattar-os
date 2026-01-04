'use client';

/**
 * use-save-operations.ts
 *
 * This hook provides save operations for the FieldMappingEditor.
 * It's an alias for useAutosave with additional clarity on its purpose.
 *
 * The hook handles:
 * - Manual save via saveTemplate()
 * - Automatic save (autosave) every 5 seconds when hasUnsavedChanges is true
 */

export { useAutosave as useSaveOperations } from './use-autosave';

// Re-export the underlying useAutosave for backwards compatibility
export { useAutosave } from './use-autosave';
