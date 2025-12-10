import { z } from 'zod';
import { createSegmentoSchema } from '@/core/assinatura-digital/domain';

/**
 * Schema para segmento de assinatura digital
 * Re-exporta o schema do domain para uso em formulários
 */
export const segmentoSchema = createSegmentoSchema;
