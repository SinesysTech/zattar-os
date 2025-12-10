/**
 * ASSINATURA DIGITAL - Utils barrel export
 */

// Formatadores
export {
  formatCPF,
  parseCPF,
  formatCNPJ,
  parseCNPJ,
  formatCpfCnpj,
  parseCpfCnpj,
  formatTelefone,
  parseTelefone,
  formatCelularWithCountryCode,
  formatCEP,
  parseCEP,
  formatData,
  formatDataHora,
  parseDataBR,
} from './formatters';

// Validadores
export {
  validateCPF,
  validateCNPJ,
  validateTelefone,
  validateCEP,
  validateEmail,
  validateCpfCnpj,
} from './validators';

// Device Fingerprint
export { collectDeviceFingerprint } from './device-fingerprint';
