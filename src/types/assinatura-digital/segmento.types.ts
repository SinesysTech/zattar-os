import { z } from 'zod';
import { createSegmentoSchema } from '@/features/assinatura-digital';

/**
 * Schema para segmento de assinatura digital
 * Re-exporta o schema do domain para uso em formulários
 */
export const segmentoSchema = createSegmentoSchema;
