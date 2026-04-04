// Constants
export * from './constants/tabelas-2026'

// Domain (calculation engine)
export * from './domain/trabalhista'

// Components
export { CalculatorShell } from './components/calculator-shell'
export { ResultRow } from './components/result-row'
export { NumberInput } from './components/number-input'
export { CurrencyInput } from './components/currency-input'
export { RangeInput } from './components/range-input'
export { ToggleOption } from './components/toggle-option'
export { SelectOption } from './components/select-option'
export { ActionButtons } from './components/action-buttons'
export { VerifiedBadge } from './components/verified-badge'
export { Disclaimer } from './components/disclaimer'
export { CtaZattar } from './components/cta-zattar'
export { ServiceCard } from './components/service-card'
export { ServiceIndexHeader } from './components/service-index-header'

// Utils
export * from './utils/formatters'

// PDF
export { generateServicePDF } from './pdf/generate-pdf'
export type { PDFSection, GeneratePDFParams } from './pdf/generate-pdf'
