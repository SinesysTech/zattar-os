/**
 * NOTAS DOMAIN
 *
 * Domínio alinhado ao front-end em `app/(dashboard)/notas`.
 * Mantém tipagem forte e validação com Zod para uso em services e server actions.
 */

import { z } from "zod";

export const noteTypeSchema = z.enum(["text", "checklist", "image"]);
export type NoteType = z.infer<typeof noteTypeSchema>;

export const noteChecklistItemSchema = z.object({
  text: z.string().min(1),
  checked: z.boolean(),
});
export type NoteChecklistItem = z.infer<typeof noteChecklistItemSchema>;

export const noteLabelSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1),
  color: z.string().min(1),
});
export type NoteLabel = z.infer<typeof noteLabelSchema>;

export const noteSchema = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  content: z.string().optional(),
  labels: z.array(z.number().int().positive()),
  isArchived: z.boolean(),
  type: noteTypeSchema,
  items: z.array(noteChecklistItemSchema).optional(),
  image: z.string().optional(),
});
export type Note = z.infer<typeof noteSchema>;

export const notasPayloadSchema = z.object({
  notes: z.array(noteSchema),
  labels: z.array(noteLabelSchema),
});
export type NotasPayload = z.infer<typeof notasPayloadSchema>;

// =============================================================================
// INPUTS (ACTIONS)
// =============================================================================

export const listNotasSchema = z.object({
  includeArchived: z.boolean().optional(),
});
export type ListNotasInput = z.infer<typeof listNotasSchema>;

export const createNotaSchema = z.object({
  title: z.string().trim().min(1).max(200),
  content: z.string().optional(),
  type: noteTypeSchema.optional(),
  labels: z.array(z.number().int().positive()).optional(),
  items: z.array(noteChecklistItemSchema).optional(),
  image: z.string().optional(),
  isArchived: z.boolean().optional(),
});
export type CreateNotaInput = z.infer<typeof createNotaSchema>;

export const updateNotaSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().trim().min(1).max(200).optional(),
  content: z.string().optional(),
  type: noteTypeSchema.optional(),
  labels: z.array(z.number().int().positive()).optional(),
  items: z.array(noteChecklistItemSchema).optional(),
  image: z.string().optional(),
  isArchived: z.boolean().optional(),
});
export type UpdateNotaInput = z.infer<typeof updateNotaSchema>;

export const deleteNotaSchema = z.object({
  id: z.number().int().positive(),
});
export type DeleteNotaInput = z.infer<typeof deleteNotaSchema>;

export const setNotaArquivadaSchema = z.object({
  id: z.number().int().positive(),
  isArchived: z.boolean(),
});
export type SetNotaArquivadaInput = z.infer<typeof setNotaArquivadaSchema>;

export const createEtiquetaSchema = z.object({
  title: z.string().trim().min(1).max(80),
  color: z.string().trim().min(1).max(64),
});
export type CreateEtiquetaInput = z.infer<typeof createEtiquetaSchema>;

export const updateEtiquetaSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().trim().min(1).max(80).optional(),
  color: z.string().trim().min(1).max(64).optional(),
});
export type UpdateEtiquetaInput = z.infer<typeof updateEtiquetaSchema>;

export const deleteEtiquetaSchema = z.object({
  id: z.number().int().positive(),
});
export type DeleteEtiquetaInput = z.infer<typeof deleteEtiquetaSchema>;


