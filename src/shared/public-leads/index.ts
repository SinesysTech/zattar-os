/**
 * Barrel: public-leads
 * ============================================================================
 * Domínio de leads capturados em formulários públicos. Consumido por rotas
 * públicas em src/app/website/* e, futuramente, pelo módulo admin /leads.
 * ============================================================================
 */

export {
  LeadSourceSchema,
  LeadStatusSchema,
  PublicLeadInputSchema,
  PublicLeadRowSchema,
  type LeadSource,
  type LeadStatus,
  type PublicLeadInput,
  type PublicLeadMetadata,
  type PublicLeadRow,
} from './domain';

export {
  DuplicateLeadError,
  RateLimitError,
  submitLead,
  type SubmitLeadResult,
} from './service';

export { submitLeadAction } from './actions/submit-lead';
