export { getAvailableVariables } from './variable-filter';
export type { VariableOption } from './variable-filter';
export { markdownToTiptapJSON, tiptapJSONToMarkdown } from './markdown-converter';
export { generateDummyBase64Image, generateMockDataForPreview } from './mock-data-generator';
export * from './rich-text-parser';
export * from './markdown-renderer';

// Device fingerprint for legal compliance
export { collectDeviceFingerprint } from './device-fingerprint';
export type { DeviceFingerprintData } from '@/backend/types/assinatura-digital/types';

// Template formatting utilities
export {
  formatFileSize,
  formatTemplateStatus,
  getStatusBadgeVariant,
  truncateText,
  getTemplateDisplayName,
} from './format-template';
