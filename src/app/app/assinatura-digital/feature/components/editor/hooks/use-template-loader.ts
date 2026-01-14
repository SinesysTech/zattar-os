'use client';

import { useEffect, useState } from 'react';
import type { Template, TemplateSignatario } from '../../../types/template.types';
import type { EditorField, Signatario } from '../types';
import { normalizeTemplateFields } from '../utils/template-helpers';

interface UseTemplateLoaderProps {
  template: Template;
  mode: 'edit' | 'create';
}

interface UseTemplateLoaderReturn {
  fields: EditorField[];
  setFields: React.Dispatch<React.SetStateAction<EditorField[]>>;
  isLoading: boolean;
  pdfUrl: string | null;
  setPdfUrl: React.Dispatch<React.SetStateAction<string | null>>;
  templatePdfUrl: string | null;
  setTemplatePdfUrl: React.Dispatch<React.SetStateAction<string | null>>;
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: React.Dispatch<React.SetStateAction<boolean>>;
  selectedField: EditorField | null;
  setSelectedField: React.Dispatch<React.SetStateAction<EditorField | null>>;
  previewKey: number;
  setPreviewKey: React.Dispatch<React.SetStateAction<number>>;
  initialSigners: Signatario[];
}

/**
 * Normalize signers from template (handles both string and array formats)
 */
function normalizeTemplateSigners(signatarios: string | TemplateSignatario[] | undefined): Signatario[] {
  if (!signatarios) return [];

  try {
    const parsed = typeof signatarios === 'string' ? JSON.parse(signatarios) : signatarios;
    if (!Array.isArray(parsed)) return [];

    return parsed.map((s: TemplateSignatario) => ({
      id: s.id,
      nome: s.nome,
      email: s.email,
      cor: s.cor,
      ordem: s.ordem,
    }));
  } catch {
    console.warn('[normalizeTemplateSigners] Failed to parse signers:', signatarios);
    return [];
  }
}

/**
 * Hook for loading and managing template data
 * Handles initial template loading, field normalization, and PDF URL management
 */
export function useTemplateLoader({
  template,
  mode,
}: UseTemplateLoaderProps): UseTemplateLoaderReturn {
  const [fields, setFields] = useState<EditorField[]>([]);
  const [selectedField, setSelectedField] = useState<EditorField | null>(null);
  const [isLoading, setIsLoading] = useState(mode === 'edit');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [templatePdfUrl, setTemplatePdfUrl] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [initialSigners, setInitialSigners] = useState<Signatario[]>([]);

  // Load template on mount
  useEffect(() => {
    const loadTemplate = async () => {
      if (mode === 'create') {
        // Create mode: don't load anything, wait for upload
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        // Normalize campos from backend to EditorField format
        const campos = Array.isArray(template.campos) ? template.campos : [];
        const editorFields = normalizeTemplateFields(campos);

        // Normalize signatarios from backend
        const signers = normalizeTemplateSigners(template.signatarios);

        // DEBUG: Log loaded fields
        console.log('[DEBUG LOAD] Total campos carregados:', editorFields.length);
        console.log('[DEBUG LOAD] IDs únicos:', new Set(editorFields.map((f) => f.id)).size);
        console.log(
          '[DEBUG LOAD] Campos:',
          editorFields.map((f) => ({ id: f.id, nome: f.nome, tipo: f.tipo }))
        );
        console.log('[DEBUG LOAD] Signatários carregados:', signers.length);

        setFields(editorFields);
        setInitialSigners(signers);
        setSelectedField(null);
        setHasUnsavedChanges(false);

        // Use preview endpoint that proxies PDF (avoids CORS with Backblaze B2)
        const originalUrl = `/api/assinatura-digital/templates/${template.id}/preview`;
        setTemplatePdfUrl(originalUrl);
        setPdfUrl(originalUrl);
        setPreviewKey((prev) => prev + 1);
      } catch (error) {
        console.error('[useTemplateLoader] Error loading template:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTemplate();
  }, [template, mode]);

  return {
    fields,
    setFields,
    isLoading,
    pdfUrl,
    setPdfUrl,
    templatePdfUrl,
    setTemplatePdfUrl,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    selectedField,
    setSelectedField,
    previewKey,
    setPreviewKey,
    initialSigners,
  };
}
