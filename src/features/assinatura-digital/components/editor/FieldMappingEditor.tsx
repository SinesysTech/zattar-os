'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { Upload, Download, ExternalLink } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { DEFAULT_ZOOM_CONFIG, PDF_CANVAS_SIZE } from '@/types/assinatura-digital/pdf-preview.types';
import type { Template, TemplateCampo } from '@/types/assinatura-digital/template.types';
import ToolbarButtons from './ToolbarButtons';
import ToolbarButtonsMobile from './ToolbarButtonsMobile';
import PropertiesPopover from './PropertiesPopover';
import TemplateInfoPopover from './TemplateInfoPopover';
import ReplacePdfDialog from './ReplacePdfDialog';
import PdfCanvasArea from './PdfCanvasArea';
import CreateTemplateForm from './CreateTemplateForm';
import { RichTextEditorPopover } from './RichTextEditorPopover';
import styles from './FieldMappingEditor.module.css';

interface FieldMappingEditorProps {
  template: Template; // from @/features/assinatura-digital
  onCancel?: () => void;
  mode?: 'edit' | 'create';
}

interface EditorField extends TemplateCampo {
  isSelected: boolean;
  isDragging: boolean;
  justAdded?: boolean;
}

type ApiPreviewTestResponse =
  | { success: true; arquivo_url: string; arquivo_nome?: string }
  | { success: false; error: string };

type EditorMode = 'select' | 'add_text' | 'add_image' | 'add_rich_text';

export default function FieldMappingEditor({ template, onCancel, mode = 'edit' }: FieldMappingEditorProps) {
  const router = useRouter();

  const [fields, setFields] = useState<EditorField[]>([]);
  const [selectedField, setSelectedField] = useState<EditorField | null>(null);
  const [editorMode, setEditorMode] = useState<EditorMode>('select');
  const [fieldsWithHeightWarning, setFieldsWithHeightWarning] = useState<Set<string>>(new Set());

  const [zoom, setZoom] = useState(DEFAULT_ZOOM_CONFIG.default);
  const [hasManualZoom, setHasManualZoom] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [isLoading, setIsLoading] = useState(mode === 'edit');  // Não carregar em modo create
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [templatePdfUrl, setTemplatePdfUrl] = useState<string | null>(null); // PDF template original
  const [showFilledPreview, setShowFilledPreview] = useState(false); // Toggle entre template original e preview preenchido

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [previewKey, setPreviewKey] = useState(0);

  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);

  const [showProperties, setShowProperties] = useState(false);
  const [showTemplateInfo, setShowTemplateInfo] = useState(false);  // Não abrir em create mode - usamos inline form
  const [showReplacePdf, setShowReplacePdf] = useState(false);
  const [showRichTextEditor, setShowRichTextEditor] = useState(false);
  const [editingRichTextField, setEditingRichTextField] = useState<EditorField | null>(null);

  // Estados para preview de teste com dados fictícios
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [iframeLoadFailed, setIframeLoadFailed] = useState(false);
  const [iframeLoadTimeout, setIframeLoadTimeout] = useState<NodeJS.Timeout | null>(null);

  // Estados para modo de criação
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFilePreview, setUploadedFilePreview] = useState<string | null>(null);
  const [createdTemplate, setCreatedTemplate] = useState<Template | null>(null);

  // Drag & Drop state (extended for resize)
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    fieldId: string | null;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    offsetX: number;
    offsetY: number;
    hasMoved: boolean;
    mode: 'move' | 'resize';
    resizeHandle: 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | null;
    startWidth: number;
    startHeight: number;
  }>({
    isDragging: false,
    fieldId: null,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    offsetX: 0,
    offsetY: 0,
    hasMoved: false,
    mode: 'move',
    resizeHandle: null,
    startWidth: 0,
    startHeight: 0,
  });

  // Toolbar drag state (draggable floating toolbar)
  // Posição inicial: 300px da esquerda para evitar sobreposição com a sidebar
  const [toolbarPosition, setToolbarPosition] = useState({ x: 300, y: 100 });
  const [toolbarDragging, setToolbarDragging] = useState(false);
  const [toolbarDragOffset, setToolbarDragOffset] = useState({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLDivElement>(null);
  // Canvas dimensions are fixed (540×765px) for consistent field positioning.
  // The PDF generator automatically applies proportional coordinate conversion
  // using convertXCoordinate, convertYCoordinate, convertWidth, and convertHeight
  // functions to map canvas positions to actual PDF dimensions (e.g., A4 595×842pt).
  const canvasSize = PDF_CANVAS_SIZE;

  /**
   * Estima altura necessária para texto composto (frontend)
   * Usa mesma heurística do backend: lineHeight = fontSize * 1.2
   */
  const estimateRichTextHeight = useCallback((text: string, maxWidth: number, fontSize: number): number => {
    const avgCharWidth = fontSize * 0.55;
    const maxCharsPerLine = Math.floor(maxWidth / avgCharWidth);
    const lineHeight = fontSize * 1.2;

    const paragraphs = text.split('\n');
    let totalLines = 0;

    for (const paragraph of paragraphs) {
      const words = paragraph.split(' ');
      let currentLine = '';

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        if (testLine.length <= maxCharsPerLine) {
          currentLine = testLine;
        } else {
          if (currentLine) totalLines++;
          currentLine = word;
        }
      }
      if (currentLine) totalLines++;
    }

    return totalLines * lineHeight;
  }, []);

  /**
   * Valida altura de campos texto_composto e atualiza warnings
   */
  const validateFieldHeight = useCallback((field: EditorField) => {
    if (field.tipo !== 'texto_composto' || !field.conteudo_composto?.template) {
      return false;
    }

    const fontSize = field.estilo?.tamanho_fonte || 12;
    const estimatedHeight = estimateRichTextHeight(
      field.conteudo_composto.template,
      field.posicao.width,
      fontSize
    );

    return estimatedHeight > field.posicao.height;
  }, [estimateRichTextHeight]);

  const clampZoomValue = useCallback(
    (value: number) =>
      Number(
        Math.min(DEFAULT_ZOOM_CONFIG.max, Math.max(DEFAULT_ZOOM_CONFIG.min, value)).toFixed(2),
      ),
    [],
  );

  const markDirty = useCallback(() => {
    setHasUnsavedChanges(true);
  }, []);

  // Validação de arquivo PDF para modo create
  const validateFile = useCallback((file: File): { isValid: boolean; error?: string } => {
    // Aceitar PDFs com MIME type vazio ou application/octet-stream (alguns navegadores/OSes)
    const isPdfByExtension = file.name.toLowerCase().endsWith('.pdf');
    const isPdfByMimeType = file.type === 'application/pdf';
    const isGenericType = file.type === '' || file.type === 'application/octet-stream';

    if (!isPdfByMimeType && !(isPdfByExtension && isGenericType)) {
      return { isValid: false, error: 'Apenas arquivos PDF são aceitos' };
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return { isValid: false, error: 'Arquivo muito grande. Máximo 10MB' };
    }

    const minSize = 10 * 1024; // 10KB
    if (file.size < minSize) {
      return { isValid: false, error: 'Arquivo muito pequeno. Mínimo 10KB' };
    }

    return { isValid: true };
  }, []);

  // Handler para upload de arquivo em modo create
  const handleFileUpload = useCallback((file: File) => {
    const validation = validateFile(file);

    if (!validation.isValid) {
      toast.error(validation.error || 'Arquivo inválido');
      return;
    }

    // Criar URL do blob para preview
    const blobUrl = URL.createObjectURL(file);
    setUploadedFile(file);
    setUploadedFilePreview(blobUrl);
    setPdfUrl(blobUrl);
    setPreviewKey((prev) => prev + 1);

    // NÃO abrir popover - usamos CreateTemplateForm inline
  }, [validateFile]);

  useEffect(() => {
    const loadTemplate = async () => {
      if (mode === 'create') {
        // Modo criação: não carregar nada, aguardar upload
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      // Garantir que campos é sempre um array (defensivo contra dados inconsistentes do backend)
      const campos = Array.isArray(template.campos) ? template.campos : [];

      // Diagnóstico: Verificar campos sem ID válido (ajuda a debugar problemas no backend)
      const camposSemId = campos.filter((c) => c.id == null);
      if (camposSemId.length > 0) {
        console.warn(
          `[FieldMappingEditor] ${camposSemId.length} campo(s) retornados do backend sem ID válido:`,
          camposSemId.map((c) => ({ nome: c.nome, variavel: c.variavel, tipo: c.tipo }))
        );
      }

      // Diagnóstico: Verificar campos sem posição válida (corrigido com valores padrão)
      const camposSemPosicao = campos.filter((c) => !c.posicao);
      if (camposSemPosicao.length > 0) {
        console.warn(
          `[FieldMappingEditor] ${camposSemPosicao.length} campo(s) sem posição válida (usando padrão):`,
          camposSemPosicao.map((c) => ({ nome: c.nome, variavel: c.variavel, tipo: c.tipo }))
        );
      }

      // Normalizar IDs dos campos ao carregar do backend
      // Backend n8n retorna campo.id como number, mas TypeScript espera string
      // Se campo.id for null/undefined, gera ID único temporário (defensivo contra bugs do backend)
      const editorFields: EditorField[] = campos.map((campo) => ({
        ...campo,
        id: campo.id != null
          ? String(campo.id)
          : `field-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, // Gera ID único se backend não retornou
        // Garantir que posicao existe com valores padrão se necessário
        posicao: campo.posicao || {
          x: 100,
          y: 100,
          width: 200,
          height: 40,
          pagina: 1,
        },
        isSelected: false,
        isDragging: false,
        justAdded: false,
      }));

      // Validar unicidade de IDs (após normalização) - Fallback defensivo
      // Esta validação só deve falhar em casos extremos, pois a normalização acima já gera IDs únicos
      const idSet = new Set<string>();
      const duplicateIds = new Set<string>();
      editorFields.forEach((field) => {
        if (idSet.has(field.id)) {
          duplicateIds.add(field.id);
        }
        idSet.add(field.id);
      });

      if (duplicateIds.size > 0) {
        console.error(
          '[FieldMappingEditor] IDs duplicados detectados após normalização (caso inesperado):',
          Array.from(duplicateIds)
        );
        console.error('[FieldMappingEditor] Campos afetados:',
          editorFields.filter((f) => duplicateIds.has(f.id)).map((f) => ({
            id: f.id,
            nome: f.nome,
            variavel: f.variavel,
            tipo: f.tipo
          }))
        );

        // Fallback: Gerar novos IDs únicos para duplicatas (não deveria acontecer mais)
        const idsUsed = new Set<string>();
        editorFields.forEach((field, index) => {
          if (duplicateIds.has(field.id) || idsUsed.has(field.id)) {
            const newId = `field-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            console.warn(
              `[FieldMappingEditor] Regenerando ID para campo duplicado: ${field.nome} (${field.id} -> ${newId})`
            );
            editorFields[index].id = newId;
            idsUsed.add(newId);
          } else {
            idsUsed.add(field.id);
          }
        });
      }

      // DEBUG: Logar campos carregados
      console.log('[DEBUG LOAD] Total campos carregados:', editorFields.length);
      console.log('[DEBUG LOAD] IDs únicos:', new Set(editorFields.map((f) => f.id)).size);
      console.log(
        '[DEBUG LOAD] Campos:',
        editorFields.map((f) => ({ id: f.id, nome: f.nome, tipo: f.tipo }))
      );

      setFields(editorFields);
      setSelectedField(null);
      setHasUnsavedChanges(false);

      // Usar endpoint de preview que faz proxy do PDF (evita CORS com Backblaze B2)
      const originalUrl = `/api/assinatura-digital/templates/${template.id}/preview`;
      setTemplatePdfUrl(originalUrl);
      setPdfUrl(originalUrl);
      setShowFilledPreview(false); // Default para template original
      setPreviewKey((prev) => prev + 1);

      setZoom(DEFAULT_ZOOM_CONFIG.default);
      setHasManualZoom(false);
      setIsLoading(false);
    };

    loadTemplate();
  }, [template, mode]);

  useEffect(() => {
    if (hasManualZoom) {
      return;
    }

    const updateZoomForViewport = () => {
      if (typeof window === 'undefined') return;

      const availableWidth = window.innerWidth - 64;
      const responsiveZoom = Math.min(1, availableWidth / canvasSize.width);
      const clamped = clampZoomValue(responsiveZoom || DEFAULT_ZOOM_CONFIG.default);

      setZoom((prev) => (Math.abs(prev - clamped) < 0.01 ? prev : clamped));
    };

    updateZoomForViewport();
    window.addEventListener('resize', updateZoomForViewport);
    return () => window.removeEventListener('resize', updateZoomForViewport);
     
    // canvasSize.width é usado internamente em updateZoomForViewport, mas não deve triggerar re-render
  }, [hasManualZoom, clampZoomValue, canvasSize.width]);

  const selectField = useCallback((fieldId: string) => {
    console.log('[DEBUG] selectField chamado com:', { fieldId, type: typeof fieldId });

    setFields((prev) => {
      // Log de todos os IDs disponíveis para debug
      console.log('[DEBUG] Available field IDs:', prev.map(f => ({ id: f.id, type: typeof f.id, nome: f.nome })));

      const updatedFields = prev.map((field) => ({
        ...field,
        isSelected: field.id === fieldId,
      }));

      // Encontrar o campo selecionado no array atualizado
      const selected = updatedFields.find((f) => f.id === fieldId) || null;
      console.log('[DEBUG] Campo selecionado:', selected?.nome, selected?.id);

      // Atualizar selectedField dentro do mesmo ciclo de atualização
      setSelectedField(selected);

      return updatedFields;
    });
  }, []);

  // DEBUG: Sincronização temporariamente desabilitada para investigar duplicação
  // Sincronizar selectedField com fields sempre que fields mudar
  /* useEffect(() => {
    if (selectedField) {
      // Buscar a versão atualizada do campo selecionado
      const updatedSelected = fields.find((f) => f.id === selectedField.id);

      if (updatedSelected) {
        // Verificar se houve mudanças reais (evitar loops infinitos)
        const hasChanges =
          updatedSelected.posicao.x !== selectedField.posicao.x ||
          updatedSelected.posicao.y !== selectedField.posicao.y ||
          updatedSelected.posicao.width !== selectedField.posicao.width ||
          updatedSelected.posicao.height !== selectedField.posicao.height ||
          updatedSelected.nome !== selectedField.nome ||
          updatedSelected.variavel !== selectedField.variavel ||
          updatedSelected.estilo?.tamanho_fonte !== selectedField.estilo?.tamanho_fonte;

        if (hasChanges) {
          console.log('[DEBUG] Sincronizando selectedField com fields');
          setSelectedField(updatedSelected);
        }
      } else {
        // Campo foi deletado
        console.log('[DEBUG] Campo selecionado foi deletado');
        setSelectedField(null);
      }
    }
  }, [fields, selectedField]); */

  // Fechar popover de propriedades quando não há campo selecionado
  useEffect(() => {
    if (!selectedField) {
      setShowProperties(false);
    }
  }, [selectedField]);

  // Limpar seleção quando mudar de página se campo selecionado está em página diferente
  useEffect(() => {
    if (selectedField && selectedField.posicao.pagina !== currentPage) {
      setFields((prev) => prev.map((field) => ({ ...field, isSelected: false })));
      setSelectedField(null);
    }
  }, [currentPage, selectedField]);

  const handleCanvasClick = useCallback(
    (event: React.MouseEvent) => {
      if (!canvasRef.current) return;

      // Se está no modo 'select', desseleciona todos os campos quando clicar no canvas vazio
      if (editorMode === 'select') {
        setFields((prev) => prev.map((field) => ({ ...field, isSelected: false })));
        setSelectedField(null);
        return;
      }

      const rect = canvasRef.current.getBoundingClientRect();
      const x = (event.clientX - rect.left) / zoom;
      const y = (event.clientY - rect.top) / zoom;

      const newField: EditorField = {
        id: `field-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        template_id: String(template.id),
        nome: editorMode === 'add_image' ? 'Assinatura' : editorMode === 'add_rich_text' ? 'Texto Composto' : 'Nome Completo',
        variavel: editorMode === 'add_rich_text' ? undefined : editorMode === 'add_image' ? 'assinatura.assinatura_base64' : 'cliente.nome_completo',
        tipo: editorMode === 'add_image' ? 'assinatura' : editorMode === 'add_rich_text' ? 'texto_composto' : 'texto',
        posicao: {
          x: Math.round(x),
          y: Math.round(y),
          width: editorMode === 'add_image' ? 120 : editorMode === 'add_rich_text' ? 400 : 200,
          height: editorMode === 'add_image' ? 60 : editorMode === 'add_rich_text' ? 80 : 20,
          pagina: currentPage,
        },
        estilo: {
          fonte: 'Open Sans',
          tamanho_fonte: 12,
          cor: '#000000',
          alinhamento: 'left',
        },
        obrigatorio: true,
        ordem: fields.length + 1,
        conteudo_composto: editorMode === 'add_rich_text' ? { json: { type: 'doc', content: [{ type: 'paragraph' }] }, template: '' } : undefined,
        criado_em: new Date(),
        atualizado_em: new Date(),
        isSelected: true,
        isDragging: false,
        justAdded: true,
      };

      setFields((prev) => [
        ...prev.map((field) => ({ ...field, isSelected: false })),
        newField,
      ]);

      setSelectedField(newField);
      setEditorMode('select');
      markDirty();
      toast.success('Campo adicionado com sucesso!');

      // Validar altura se for texto_composto (campo vazio não gera warning)
      if (editorMode === 'add_rich_text') {
        const hasWarning = validateFieldHeight(newField);
        if (hasWarning) {
          setFieldsWithHeightWarning((prev) => new Set(prev).add(newField.id));
        }
      }

      setTimeout(() => {
        setFields((prev) =>
          prev.map((field) => (field.id === newField.id ? { ...field, justAdded: false } : field)),
        );
      }, 1000);
    },
    [editorMode, zoom, fields.length, template.id, markDirty, currentPage, validateFieldHeight],
  );

  const handleFieldClick = useCallback(
    (field: EditorField, event: React.MouseEvent) => {
      event.stopPropagation();

      // Previne seleção durante drag
      if (dragState.isDragging) return;

      selectField(field.id);
    },
    [selectField, dragState.isDragging],
  );

  const handleFieldKeyboard = useCallback(
    (field: EditorField, event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        selectField(field.id);
      }

      if ((event.key === 'Delete' || event.key === 'Backspace') && field.isSelected) {
        event.preventDefault();
        setFields((prev) =>
          prev.map((item) =>
            item.id === field.id ? { ...item, isSelected: false, isDragging: true } : item,
          ),
        );
        setTimeout(() => {
          setFields((prev) => prev.filter((item) => item.id !== field.id));
          setSelectedField(null);
        }, 300);
        markDirty();
        toast.success('Campo removido com sucesso!');
      }
    },
    [selectField, markDirty],
  );

  const handleMouseDown = useCallback(
    (field: EditorField, event: React.MouseEvent) => {
      // Apenas permite drag no modo 'select'
      if (editorMode !== 'select') return;

      // Prevenir drag se clicou em resize handle
      const target = event.target as HTMLElement;
      const isResizeHandle = target.classList.contains('resize-handle') ||
                            target.closest('.resize-handle') !== null;
      if (isResizeHandle) {
        console.log('[DEBUG DRAG] Clique em resize handle detectado, não iniciando drag');
        return; // Não iniciar drag, deixar resize handle processar
      }

      event.stopPropagation();
      event.preventDefault();

      // DEBUG: Log início do drag
      console.log('[DEBUG DRAG START] fieldId:', field.id, 'nome:', field.nome, 'mode:', editorMode);
      console.log('[DEBUG DRAG START] Total campos no estado:', fields.length);
      console.log(
        '[DEBUG DRAG START] IDs atuais:',
        fields.map((f) => ({ id: f.id, nome: f.nome }))
      );

      // Seleciona o campo se não estiver selecionado
      if (!field.isSelected) {
        selectField(field.id);
      }

      if (!canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();

      setDragState({
        isDragging: true,
        fieldId: field.id,
        startX: event.clientX,
        startY: event.clientY,
        currentX: event.clientX,
        currentY: event.clientY,
        offsetX: event.clientX - rect.left - field.posicao.x * zoom,
        offsetY: event.clientY - rect.top - field.posicao.y * zoom,
        hasMoved: false,
        mode: 'move',
        resizeHandle: null,
        startWidth: field.posicao.width,
        startHeight: field.posicao.height,
      });
    },
    [editorMode, selectField, zoom, fields],
  );

  const handleResizeMouseDown = useCallback(
    (field: EditorField, handle: 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w', event: React.MouseEvent) => {
      if (editorMode !== 'select') return;

      event.stopPropagation();
      event.preventDefault();

      if (!field.isSelected) {
        selectField(field.id);
      }

      if (!canvasRef.current) return;

      setDragState({
        isDragging: true,
        fieldId: field.id,
        startX: event.clientX,
        startY: event.clientY,
        currentX: event.clientX,
        currentY: event.clientY,
        offsetX: 0,
        offsetY: 0,
        hasMoved: false,
        mode: 'resize',
        resizeHandle: handle,
        startWidth: field.posicao.width,
        startHeight: field.posicao.height,
      });
    },
    [editorMode, selectField],
  );

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!dragState.isDragging || !dragState.fieldId || !canvasRef.current) return;

      const DRAG_THRESHOLD = 3; // pixels
      const deltaX = Math.abs(event.clientX - dragState.startX);
      const deltaY = Math.abs(event.clientY - dragState.startY);

      // Só inicia o drag se mover mais que o threshold
      if (!dragState.hasMoved && (deltaX < DRAG_THRESHOLD && deltaY < DRAG_THRESHOLD)) {
        return;
      }

      const rect = canvasRef.current.getBoundingClientRect();

      // Marca que houve movimento real
      if (!dragState.hasMoved) {
        setDragState((prev) => ({ ...prev, hasMoved: true }));
        // Marca o campo como sendo arrastado
        setFields((prev) =>
          prev.map((f) => (f.id === dragState.fieldId ? { ...f, isDragging: true } : f)),
        );
      }

      // Modo MOVE
      if (dragState.mode === 'move') {
        const newX = (event.clientX - rect.left - dragState.offsetX) / zoom;
        const newY = (event.clientY - rect.top - dragState.offsetY) / zoom;

        // Atualiza a posição do campo
        setFields((prev) => {
          // DEBUG: Detectar múltiplos campos sendo movidos
          const fieldsToUpdate = prev.filter((f) => f.id === dragState.fieldId);
          if (fieldsToUpdate.length > 1) {
            console.error(
              '[DEBUG DRAG MOVE] ⚠️ MÚLTIPLOS CAMPOS COM MESMO ID!',
              dragState.fieldId,
              'Quantidade:',
              fieldsToUpdate.length,
              'Campos:',
              fieldsToUpdate.map((f) => ({ id: f.id, nome: f.nome }))
            );
          }
          if (fieldsToUpdate.length === 0) {
            console.warn(
              '[DEBUG DRAG MOVE] ⚠️ NENHUM CAMPO ENCONTRADO COM ID:',
              dragState.fieldId
            );
          }

          return prev.map((field) => {
            if (field.id === dragState.fieldId) {
              return {
                ...field,
                posicao: {
                  ...field.posicao,
                  x: Math.max(0, Math.min(canvasSize.width - field.posicao.width, Math.round(newX))),
                  y: Math.max(0, Math.min(canvasSize.height - field.posicao.height, Math.round(newY))),
                },
                atualizado_em: new Date(),
              };
            }
            return field;
          });
        });

        // Atualiza o selectedField também
        setSelectedField((prev) => {
          if (prev && prev.id === dragState.fieldId) {
            return {
              ...prev,
              posicao: {
                ...prev.posicao,
                x: Math.max(0, Math.min(canvasSize.width - prev.posicao.width, Math.round(newX))),
                y: Math.max(0, Math.min(canvasSize.height - prev.posicao.height, Math.round(newY))),
              },
              atualizado_em: new Date(),
            };
          }
          return prev;
        });
      }

      // Modo RESIZE
      if (dragState.mode === 'resize' && dragState.resizeHandle) {
        const deltaMouseX = (event.clientX - dragState.startX) / zoom;
        const deltaMouseY = (event.clientY - dragState.startY) / zoom;

        setFields((prev) =>
          prev.map((field) => {
            if (field.id !== dragState.fieldId) return field;

            const MIN_SIZE = 20;
            let newX = field.posicao.x;
            let newY = field.posicao.y;
            let newWidth = dragState.startWidth;
            let newHeight = dragState.startHeight;

            const handle = dragState.resizeHandle!;

            // Calcular novas dimensões baseado no handle
            if (handle.includes('e')) {
              newWidth = Math.max(MIN_SIZE, dragState.startWidth + deltaMouseX);
            }
            if (handle.includes('w')) {
              const proposedWidth = dragState.startWidth - deltaMouseX;
              if (proposedWidth >= MIN_SIZE) {
                newWidth = proposedWidth;
                newX = field.posicao.x + deltaMouseX;
              }
            }
            if (handle.includes('s')) {
              newHeight = Math.max(MIN_SIZE, dragState.startHeight + deltaMouseY);
            }
            if (handle.includes('n')) {
              const proposedHeight = dragState.startHeight - deltaMouseY;
              if (proposedHeight >= MIN_SIZE) {
                newHeight = proposedHeight;
                newY = field.posicao.y + deltaMouseY;
              }
            }

            // Aplicar limites do canvas
            newX = Math.max(0, Math.min(canvasSize.width - newWidth, newX));
            newY = Math.max(0, Math.min(canvasSize.height - newHeight, newY));
            newWidth = Math.min(newWidth, canvasSize.width - newX);
            newHeight = Math.min(newHeight, canvasSize.height - newY);

            return {
              ...field,
              posicao: {
                ...field.posicao,
                x: Math.round(newX),
                y: Math.round(newY),
                width: Math.round(newWidth),
                height: Math.round(newHeight),
              },
              atualizado_em: new Date(),
            };
          }),
        );

        // Atualizar selectedField
        setSelectedField((prev) => {
          if (!prev || prev.id !== dragState.fieldId) return prev;

          const MIN_SIZE = 20;
          let newX = prev.posicao.x;
          let newY = prev.posicao.y;
          let newWidth = dragState.startWidth;
          let newHeight = dragState.startHeight;

          const handle = dragState.resizeHandle!;

          if (handle.includes('e')) {
            newWidth = Math.max(MIN_SIZE, dragState.startWidth + deltaMouseX);
          }
          if (handle.includes('w')) {
            const proposedWidth = dragState.startWidth - deltaMouseX;
            if (proposedWidth >= MIN_SIZE) {
              newWidth = proposedWidth;
              newX = prev.posicao.x + deltaMouseX;
            }
          }
          if (handle.includes('s')) {
            newHeight = Math.max(MIN_SIZE, dragState.startHeight + deltaMouseY);
          }
          if (handle.includes('n')) {
            const proposedHeight = dragState.startHeight - deltaMouseY;
            if (proposedHeight >= MIN_SIZE) {
              newHeight = proposedHeight;
              newY = prev.posicao.y + deltaMouseY;
            }
          }

          newX = Math.max(0, Math.min(canvasSize.width - newWidth, newX));
          newY = Math.max(0, Math.min(canvasSize.height - newHeight, newY));
          newWidth = Math.min(newWidth, canvasSize.width - newX);
          newHeight = Math.min(newHeight, canvasSize.height - newY);

          return {
            ...prev,
            posicao: {
              ...prev.posicao,
              x: Math.round(newX),
              y: Math.round(newY),
              width: Math.round(newWidth),
              height: Math.round(newHeight),
            },
            atualizado_em: new Date(),
          };
        });
      }
    },
    [dragState, zoom, canvasSize.width, canvasSize.height],
  );

  const handleMouseUp = useCallback(
    (event: MouseEvent) => {
      // Prevenir propagação do evento para evitar handlers duplicados
      event.stopPropagation();
      event.preventDefault();

      if (dragState.isDragging && dragState.fieldId) {
        // DEBUG: Log fim do drag
        console.log('[DEBUG DRAG END] fieldId:', dragState.fieldId, 'hasMoved:', dragState.hasMoved);
        console.log('[DEBUG DRAG END] Total campos após drag:', fields.length);

        // Remove o estado de dragging do campo
        setFields((prev) => {
          const updated = prev.map((f) =>
            f.id === dragState.fieldId ? { ...f, isDragging: false } : f
          );
          console.log('[DEBUG DRAG END] Array length mantido:', prev.length, '→', updated.length);
          return updated;
        });

        // Marca como dirty apenas se houve movimento real
        if (dragState.hasMoved) {
          markDirty();
        }

        setDragState({
          isDragging: false,
          fieldId: null,
          startX: 0,
          startY: 0,
          currentX: 0,
          currentY: 0,
          offsetX: 0,
          offsetY: 0,
          hasMoved: false,
          mode: 'move',
          resizeHandle: null,
          startWidth: 0,
          startHeight: 0,
        });
      }
    },
    [dragState, markDirty, fields.length],
  );

  // Adiciona listeners globais de mouse para drag
  useEffect(() => {
    if (dragState.isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragState.isDragging, handleMouseMove, handleMouseUp]);

  // Toolbar drag handlers
  const handleToolbarMouseDown = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    setToolbarDragging(true);
    setToolbarDragOffset({
      x: event.clientX - toolbarPosition.x,
      y: event.clientY - toolbarPosition.y,
    });
  }, [toolbarPosition]);

  const handleToolbarMouseMove = useCallback((event: MouseEvent) => {
    if (toolbarDragging) {
      setToolbarPosition({
        x: event.clientX - toolbarDragOffset.x,
        y: event.clientY - toolbarDragOffset.y,
      });
    }
  }, [toolbarDragging, toolbarDragOffset]);

  const handleToolbarMouseUp = useCallback(() => {
    setToolbarDragging(false);
  }, []);

  // Toolbar touch handlers (mobile support)
  const handleToolbarTouchStart = useCallback((event: React.TouchEvent) => {
    event.stopPropagation();
    const touch = event.touches[0];
    setToolbarDragging(true);
    setToolbarDragOffset({
      x: touch.clientX - toolbarPosition.x,
      y: touch.clientY - toolbarPosition.y,
    });
  }, [toolbarPosition]);

  const handleToolbarTouchMove = useCallback((event: TouchEvent) => {
    if (toolbarDragging && event.touches.length > 0) {
      const touch = event.touches[0];
      setToolbarPosition({
        x: touch.clientX - toolbarDragOffset.x,
        y: touch.clientY - toolbarDragOffset.y,
      });
    }
  }, [toolbarDragging, toolbarDragOffset]);

  const handleToolbarTouchEnd = useCallback(() => {
    setToolbarDragging(false);
  }, []);

  // Add toolbar drag listeners (mouse + touch)
  useEffect(() => {
    if (toolbarDragging) {
      window.addEventListener('mousemove', handleToolbarMouseMove);
      window.addEventListener('mouseup', handleToolbarMouseUp);
      window.addEventListener('touchmove', handleToolbarTouchMove);
      window.addEventListener('touchend', handleToolbarTouchEnd);

      return () => {
        window.removeEventListener('mousemove', handleToolbarMouseMove);
        window.removeEventListener('mouseup', handleToolbarMouseUp);
        window.removeEventListener('touchmove', handleToolbarTouchMove);
        window.removeEventListener('touchend', handleToolbarTouchEnd);
      };
    }
  }, [toolbarDragging, handleToolbarMouseMove, handleToolbarMouseUp, handleToolbarTouchMove, handleToolbarTouchEnd]);

  const deleteField = useCallback(
    (fieldId: string) => {
      setFields((prev) =>
        prev.map((field) =>
          field.id === fieldId ? { ...field, isSelected: false, isDragging: true } : field,
        ),
      );

      setTimeout(() => {
        setFields((prev) => prev.filter((field) => field.id !== fieldId));
        setSelectedField(null);
      }, 300);

      markDirty();
      toast.success('Campo removido com sucesso!');
    },
    [markDirty],
  );

  const duplicateField = useCallback(
    (fieldId: string) => {
      const field = fields.find((f) => f.id === fieldId);
      if (!field) return;

      const newField: EditorField = {
        ...field,
        id: `field-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        nome: field.nome, // Mantém o nome original (que é o label da variável)
        posicao: {
          ...field.posicao,
          x: Math.min(field.posicao.x + 20, canvasSize.width - field.posicao.width),
          y: Math.min(field.posicao.y + 20, canvasSize.height - field.posicao.height),
        },
        isSelected: true,
        isDragging: false,
        justAdded: true,
        criado_em: new Date(),
        atualizado_em: new Date(),
      };

      setFields((prev) => [
        ...prev.map((f) => ({ ...f, isSelected: false })),
        newField,
      ]);

      setSelectedField(newField);
      markDirty();
      toast.success('Campo duplicado com sucesso!');

      // Remove justAdded animation after 1s
      setTimeout(() => {
        setFields((prev) =>
          prev.map((f) => (f.id === newField.id ? { ...f, justAdded: false } : f)),
        );
      }, 1000);
    },
    [fields, markDirty, canvasSize.width, canvasSize.height],
  );

  const updateSelectedField = useCallback(
    (updates: Partial<EditorField>) => {
      if (!selectedField) return;

      const updatedField: EditorField = {
        ...selectedField,
        ...updates,
        atualizado_em: new Date(),
      };

      setFields((prev) =>
        prev.map((field) => (field.id === selectedField.id ? { ...updatedField } : field)),
      );

      setSelectedField(updatedField);
      markDirty();

      // Revalidar altura se campo é texto_composto e houve mudança em conteúdo/dimensões/fonte
      if (updatedField.tipo === 'texto_composto' &&
          (updates.conteudo_composto || updates.posicao || updates.estilo)) {
        const hasWarning = validateFieldHeight(updatedField);
        setFieldsWithHeightWarning((prev) => {
          const next = new Set(prev);
          if (hasWarning) {
            next.add(updatedField.id);
          } else {
            next.delete(updatedField.id);
          }
          return next;
        });
      }
    },
    [selectedField, markDirty, validateFieldHeight],
  );

  const handleSave = useCallback(async () => {
    try {
      const templateCampos: TemplateCampo[] = fields.map(
        ({ isSelected, isDragging, justAdded, ...field }) => {
          // Remove editor-specific properties
          void isSelected;
          void isDragging;
          void justAdded;

          if (typeof field.id === 'string' && field.id.startsWith('field-')) {
            const { id, ...rest } = field;
            void id; // Temporary ID, omit from payload
            return rest as TemplateCampo;
          }
          return field;
        },
      );

      // IMPORTANTE: Enviar payload completo com TODAS as colunas da tabela templates
      // (exceto id, createdAt, updatedAt que são gerenciados pelo sistema)
      const response = await fetch(`/api/assinatura-digital/templates/${template.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          template_uuid: template.template_uuid,
          nome: template.nome,
          descricao: template.descricao || null,
          arquivo_original: template.arquivo_original,
          arquivo_nome: template.arquivo_nome,
          arquivo_tamanho: template.arquivo_tamanho,
          status: template.status,
          versao: template.versao,
          ativo: template.ativo,
          campos: JSON.stringify(templateCampos),
          conteudo_markdown: template.conteudo_markdown || null,
          criado_por: template.criado_por,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.message || 'Erro desconhecido ao salvar o template.';

        if (response.status === 401) {
          toast.error('Sessão expirada. Faça login novamente.');
        } else if (response.status === 404) {
          toast.error('Template não encontrado.');
        } else if (response.status === 403) {
          toast.error('Você não tem permissão para editar este template.');
        } else {
          toast.error('Erro ao salvar template.', {
            description: errorMessage,
          });
        }

        return;
      }

      toast.success('Template salvo com sucesso!');
      setHasUnsavedChanges(false);

      // Don't redirect - keep user on editor page for continued editing
    } catch (error) {
      console.error('Erro ao salvar:', error);
      const message =
        error instanceof Error ? error.message : 'Verifique sua conexão e tente novamente.';
      toast.error('Ocorreu um erro de conexão ao salvar.', {
        description: message,
      });
    }
  }, [
    fields,
    template.id,
    template.template_uuid,
    template.nome,
    template.descricao,
    template.arquivo_original,
    template.arquivo_nome,
    template.arquivo_tamanho,
    template.status,
    template.versao,
    template.ativo,
    template.conteudo_markdown,
    template.criado_por,
  ]); // router is not needed for save operation

  // Autosave hook - saves every 5 seconds when there are unsaved changes
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const autosaveTimer = setTimeout(async () => {
      try {
        const templateCampos: TemplateCampo[] = fields.map(
          ({ isSelected, isDragging, justAdded, ...field }) => {
            void isSelected;
            void isDragging;
            void justAdded;

            if (typeof field.id === 'string' && field.id.startsWith('field-')) {
              const { id, ...rest } = field;
              void id;
              return rest as TemplateCampo;
            }
            return field;
          },
        );

        // IMPORTANTE: Autosave também envia payload completo com TODAS as colunas
        const response = await fetch(`/api/assinatura-digital/templates/${template.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            template_uuid: template.template_uuid,
            nome: template.nome,
            descricao: template.descricao || null,
            arquivo_original: template.arquivo_original,
            arquivo_nome: template.arquivo_nome,
            arquivo_tamanho: template.arquivo_tamanho,
            status: template.status,
            versao: template.versao,
            ativo: template.ativo,
            campos: JSON.stringify(templateCampos),
            conteudo_markdown: template.conteudo_markdown || null,
            criado_por: template.criado_por,
          }),
        });

        if (response.ok) {
          setHasUnsavedChanges(false);
          toast.success('Autosaved', {
            duration: 1500,
            description: 'Changes saved automatically',
          });
        } else {
          // Keep dirty state on error, will retry on next interval
          console.warn('Autosave failed:', response.status);
        }
      } catch (error) {
        // Keep dirty state on error, will retry on next interval
        console.warn('Autosave error:', error);
      }
    }, 5000); // 5 seconds

    return () => clearTimeout(autosaveTimer);
  }, [
    hasUnsavedChanges,
    fields,
    template.id,
    template.template_uuid,
    template.nome,
    template.descricao,
    template.arquivo_original,
    template.arquivo_nome,
    template.arquivo_tamanho,
    template.status,
    template.versao,
    template.ativo,
    template.conteudo_markdown,
    template.criado_por,
  ]); // Necessary for autosave with all template properties

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        event.preventDefault();
        event.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (!hasUnsavedChanges) return;

      event.preventDefault();
      window.history.pushState(null, '', window.location.href);

      setPendingNavigation(() => () => router.back());
      setShowExitConfirmation(true);
    };

    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [hasUnsavedChanges, router]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleLinkClick = (event: MouseEvent) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey) return;

      const target = event.target as HTMLElement;
      const anchor = target.closest('a[href]') as HTMLAnchorElement | null;
      if (!anchor || !anchor.href) return;

      try {
        const linkUrl = new URL(anchor.href);
        const currentUrl = new URL(window.location.href);

        if (linkUrl.origin === currentUrl.origin && linkUrl.pathname !== currentUrl.pathname) {
          event.preventDefault();
          event.stopPropagation();
          setPendingNavigation(() => () =>
            router.push(linkUrl.pathname + linkUrl.search + linkUrl.hash),
          );
          setShowExitConfirmation(true);
        }
      } catch (error) {
        console.warn('Invalid URL in link:', anchor.href, error);
      }
    };

    document.addEventListener('click', handleLinkClick, true);
    return () => document.removeEventListener('click', handleLinkClick, true);
  }, [hasUnsavedChanges, router]);

  const handleCancel = useCallback(() => {
    if (hasUnsavedChanges) {
      setPendingNavigation(
        onCancel ? () => onCancel() : () => router.push('/assinatura-digital/templates'),
      );
      setShowExitConfirmation(true);
    } else if (onCancel) {
      onCancel();
    } else {
      router.push('/assinatura-digital/templates');
    }
  }, [hasUnsavedChanges, onCancel, router]);

  /**
   * Handler para gerar preview de teste com dados fictícios
   * Permite validar template com dados mock sem precisar salvar
   */
  const handleGenerateTestPreview = useCallback(async () => {
    try {
      // Prevenir preview em create mode sem template criado
      if (mode === 'create' && !createdTemplate?.id) {
        toast.error('Template ainda não foi criado', {
          description: 'Salve o template antes de gerar preview de teste',
        });
        return;
      }

      setIsGeneratingPreview(true);

      // Validar que há campos mapeados ou conteúdo markdown
      const hasCampos = fields && fields.length > 0;
      const hasMarkdown = template.conteudo_markdown && template.conteudo_markdown.trim().length > 0;

      if (!hasCampos && !hasMarkdown) {
        toast.error('Template precisa ter campos mapeados ou conteúdo Markdown para preview');
        return;
      }

      // Chamar API de preview com campos atuais (mesmo não salvos)
      const response = await fetch(`/api/assinatura-digital/templates/${template.id}/preview-test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          campos: fields.map(({ isSelected, isDragging, justAdded, ...field }) => {
            // Remove editor-specific properties
            void isSelected;
            void isDragging;
            void justAdded;

            // Remover IDs temporários (começam com 'field-')
            if (typeof field.id === 'string' && field.id.startsWith('field-')) {
              const { id, ...rest } = field;
              void id; // Temporary ID, omit from payload
              return rest;
            }
            return field;
          }),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.error || 'Erro desconhecido ao gerar preview';

        if (response.status === 401) {
          toast.error('Sessão expirada. Faça login novamente.');
        } else if (response.status === 404) {
          toast.error('Template não encontrado.');
        } else if (response.status === 400) {
          toast.error('Erro de validação', { description: errorMessage });
        } else {
          toast.error('Erro ao gerar PDF de teste', { description: errorMessage });
        }

        return;
      }

      const result: ApiPreviewTestResponse = await response.json();

      if (result.success && result.arquivo_url) {
        // Salvar URL do PDF preenchido para preview
        setPreviewPdfUrl(result.arquivo_url);

        // Se toggle está ativo, atualizar canvas background também
        if (showFilledPreview) {
          setPdfUrl(result.arquivo_url);
          setPreviewKey((prev) => prev + 1);
        }

        // Abrir modal com preview
        setIframeLoadFailed(false); // Reset estado de erro
        setShowPreviewModal(true);

        // Configurar timeout para detectar falha de embed (5 segundos)
        const timeout = setTimeout(() => {
          setIframeLoadFailed(true);
        }, 5000);
        setIframeLoadTimeout(timeout);

        toast.success('PDF de teste gerado com sucesso!', {
          description: result.avisos?.length && result.avisos.length > 0
            ? `${result.avisos.length} aviso(s) detectado(s)`
            : undefined,
          action: {
            label: 'Ver PDF',
            onClick: () => window.open(result.arquivo_url, '_blank'),
          },
        });

        // Logar avisos se houver
        if (result.avisos && result.avisos.length > 0) {
          console.warn('[Preview Test] Avisos:', result.avisos);
        }
      } else {
        throw new Error(result.error || 'Resposta inválida do servidor');
      }
    } catch (error) {
      console.error('Erro ao gerar preview de teste:', error);
      const message = error instanceof Error ? error.message : 'Erro de conexão';
      toast.error('Erro ao gerar PDF de teste', { description: message });
    } finally {
      setIsGeneratingPreview(false);
    }
  }, [fields, template.id, template.conteudo_markdown, mode, createdTemplate, showFilledPreview]);

  /**
   * Handler para sucesso no carregamento do iframe
   */
  const handleIframeLoad = useCallback(() => {
    // Limpar timeout se iframe carregou com sucesso
    if (iframeLoadTimeout) {
      clearTimeout(iframeLoadTimeout);
      setIframeLoadTimeout(null);
    }
    setIframeLoadFailed(false);
  }, [iframeLoadTimeout]);

  /**
   * Handler para erro no carregamento do iframe
   */
  const handleIframeError = useCallback(() => {
    // Limpar timeout
    if (iframeLoadTimeout) {
      clearTimeout(iframeLoadTimeout);
      setIframeLoadTimeout(null);
    }
    setIframeLoadFailed(true);
  }, [iframeLoadTimeout]);

  /**
   * Cleanup de timeout quando modal fecha
   */
  useEffect(() => {
    if (!showPreviewModal && iframeLoadTimeout) {
      clearTimeout(iframeLoadTimeout);
      setIframeLoadTimeout(null);
    }
  }, [showPreviewModal, iframeLoadTimeout]);

  /**
   * Helper para baixar PDF via link temporário
   */
  const downloadPdf = useCallback((url: string, filename: string) => {
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Download iniciado!');
    } catch (error) {
      console.error('Erro ao iniciar download:', error);
      toast.error('Erro ao iniciar download', {
        description: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  }, []);

  const handleZoomIn = useCallback(() => {
    setHasManualZoom(true);
    setZoom((prev) => clampZoomValue(prev + DEFAULT_ZOOM_CONFIG.step));
  }, [clampZoomValue]);

  const handleZoomOut = useCallback(() => {
    setHasManualZoom(true);
    setZoom((prev) => clampZoomValue(prev - DEFAULT_ZOOM_CONFIG.step));
  }, [clampZoomValue]);

  const handleResetZoom = useCallback(() => {
    setHasManualZoom(true);
    setZoom(DEFAULT_ZOOM_CONFIG.default);
  }, []);

  /**
   * Toggle entre template original e preview preenchido
   */
  const handleTogglePreview = useCallback(() => {
    setShowFilledPreview((prev) => {
      const newValue = !prev;

      // Alternar URL do PDF exibido no canvas
      if (newValue && previewPdfUrl) {
        // Mostrar preview preenchido se disponível
        setPdfUrl(previewPdfUrl);
      } else if (templatePdfUrl) {
        // Voltar para template original
        setPdfUrl(templatePdfUrl);
      }

      setPreviewKey((prev) => prev + 1); // Força re-render

      return newValue;
    });
  }, [previewPdfUrl, templatePdfUrl]);

  const handleNextPage = useCallback(() => {
    setCurrentPage((prev) => {
      const next = Math.min(prev + 1, totalPages);
      // Limpar seleção se o campo selecionado não está na próxima página
      setSelectedField((selected) => (selected && selected.posicao.pagina !== next ? null : selected));
      setFields((fields) => fields.map((f) => f.posicao.pagina !== next ? { ...f, isSelected: false } : f));
      return next;
    });
  }, [totalPages]);

  const handlePreviousPage = useCallback(() => {
    setCurrentPage((prev) => {
      const next = Math.max(prev - 1, 1);
      // Limpar seleção se o campo selecionado não está na página anterior
      setSelectedField((selected) => (selected && selected.posicao.pagina !== next ? null : selected));
      setFields((fields) => fields.map((f) => f.posicao.pagina !== next ? { ...f, isSelected: false } : f));
      return next;
    });
  }, []);

  const handlePdfLoadSuccess = useCallback((numPages: number) => {
    setTotalPages(numPages);
  }, []);

  const zoomPercentage = Math.round(zoom * 100);
  const canZoomIn = zoom < DEFAULT_ZOOM_CONFIG.max;
  const canZoomOut = zoom > DEFAULT_ZOOM_CONFIG.min;
  const canResetZoom = Math.abs(zoom - DEFAULT_ZOOM_CONFIG.default) >= 0.01;

  // Handlers para Context Menu e ações dos componentes
  const handleAddTextField = useCallback(() => {
    setEditorMode('add_text');
  }, []);

  const handleAddImageField = useCallback(() => {
    setEditorMode('add_image');
  }, []);

  const handleAddRichTextField = useCallback(() => {
    setEditorMode('add_rich_text');
  }, []);

  const handleOpenProperties = useCallback(() => {
    if (selectedField) {
      setShowProperties(true);
    }
  }, [selectedField]);

  const handleOpenTemplateInfo = useCallback(() => {
    setShowTemplateInfo(true);
  }, []);

  const handleReplacePdf = useCallback(() => {
    setShowReplacePdf(true);
  }, []);

  const handleEditRichText = useCallback((fieldId: string) => {
    const field = fields.find((f) => f.id === fieldId);
    if (field && field.tipo === 'texto_composto') {
      setEditingRichTextField(field);
      setShowRichTextEditor(true);
    }
  }, [fields]);

  const handleAdjustHeightAutomatically = useCallback((fieldId: string) => {
    const field = fields.find((f) => f.id === fieldId);
    if (!field || field.tipo !== 'texto_composto' || !field.conteudo_composto?.template) {
      return;
    }

    const fontSize = field.estilo?.tamanho_fonte || 12;
    const estimatedHeight = estimateRichTextHeight(
      field.conteudo_composto.template,
      field.posicao.width,
      fontSize
    );

    const newHeight = Math.ceil(estimatedHeight) + 14; // Margem de segurança aumentada (12-14px)

    // Atualizar campo com nova altura
    setFields((prev) =>
      prev.map((f) =>
        f.id === fieldId
          ? {
              ...f,
              posicao: { ...f.posicao, height: newHeight },
              atualizado_em: new Date(),
            }
          : f
      )
    );

    // Atualizar selectedField se for o campo atual
    if (selectedField?.id === fieldId) {
      setSelectedField((prev) =>
        prev
          ? {
              ...prev,
              posicao: { ...prev.posicao, height: newHeight },
              atualizado_em: new Date(),
            }
          : null
      );
    }

    // Remover warning
    setFieldsWithHeightWarning((prev) => {
      const next = new Set(prev);
      next.delete(fieldId);
      return next;
    });

    markDirty();
    toast.success('Altura ajustada automaticamente!');
  }, [fields, selectedField, estimateRichTextHeight, markDirty]);

  const handleTemplateInfoUpdate = useCallback(async (updates: Partial<Template>) => {
    try {
      if (mode === 'create') {
        // Modo criação: o TemplateInfoPopover já criou o template
        // Recebemos o template criado em 'updates'
        const newTemplate = updates as Template;
        setCreatedTemplate(newTemplate);

        // Usar endpoint de preview que faz proxy do PDF (evita CORS com Backblaze B2)
        setPdfUrl(`/api/assinatura-digital/templates/${newTemplate.id}/preview`);
        setPreviewKey((prev) => prev + 1);

        // Redirecionar para a página de edição do template criado
        router.replace(`/assinatura-digital/templates/${newTemplate.id}/edit`);

        toast.success('Template criado! Agora você pode mapear os campos.');
        return;
      }

      // Modo edição: atualizar metadados
      const response = await fetch(`/api/assinatura-digital/templates/${template.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.message || 'Erro desconhecido ao atualizar o template.';

        if (response.status === 401) {
          throw new Error('Sessão expirada. Faça login novamente.');
        } else if (response.status === 404) {
          throw new Error('Template não encontrado.');
        } else if (response.status === 403) {
          throw new Error('Você não tem permissão para editar este template.');
        } else {
          throw new Error(errorMessage);
        }
      }

      // Atualizar template local
      Object.assign(template, updates);
    } catch (error) {
      console.error('Erro ao atualizar informações do template:', error);
      throw error;
    }
  }, [template, mode, router]);

  /**
   * Callback executado após substituição bem-sucedida do PDF do template.
   * IMPORTANTE: Deve recarregar os dados do template do n8n antes de atualizar a URL do preview,
   * pois o campo arquivo_original foi atualizado no banco e o preview precisa do novo caminho.
   */
  const handleReplacePdfSuccess = useCallback(async () => {
    try {
      const templateId = createdTemplate?.id || template.id;

      console.log('[REPLACE_PDF_SUCCESS] Iniciando atualização do template:', {
        templateId,
        currentArquivoOriginal: template.arquivo_original,
      });

      // Aguardar 500ms para garantir que o n8n atualizou o banco
      await new Promise(resolve => setTimeout(resolve, 500));

      // Buscar dados atualizados do template (especialmente arquivo_original) via API route
      toast.loading('Atualizando dados do template...');
      const response = await fetch(`/api/assinatura-digital/templates/${templateId}`, {
        method: 'GET',
        credentials: 'include',
      });

      console.log('[REPLACE_PDF_SUCCESS] Resposta da API:', {
        status: response.status,
        ok: response.ok,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[REPLACE_PDF_SUCCESS] Erro na resposta:', errorText);
        throw new Error('Erro ao buscar dados atualizados do template');
      }

      const result = await response.json();

      console.log('[REPLACE_PDF_SUCCESS] Dados recebidos:', {
        success: result.success,
        hasData: !!result.data,
        novoArquivoOriginal: result.data?.arquivo_original,
        novoArquivoNome: result.data?.arquivo_nome,
      });

      if (!result.success || !result.data) {
        throw new Error('Erro ao buscar dados atualizados do template');
      }

      // Atualizar objeto do template com novos dados
      const updatedTemplate = result.data;
      const oldArquivoOriginal = template.arquivo_original;

      Object.assign(template, {
        arquivo_original: updatedTemplate.arquivo_original,
        arquivo_nome: updatedTemplate.arquivo_nome,
        arquivo_tamanho: updatedTemplate.arquivo_tamanho,
      });

      console.log('[REPLACE_PDF_SUCCESS] Template atualizado:', {
        oldArquivoOriginal,
        newArquivoOriginal: template.arquivo_original,
        changed: oldArquivoOriginal !== template.arquivo_original,
      });

      // Usar endpoint de preview que faz proxy do PDF (evita CORS com Backblaze B2)
      // Adicionar timestamp para forçar cache-bust
      const newPdfUrl = `/api/assinatura-digital/templates/${templateId}/preview?t=${Date.now()}`;
      console.log('[REPLACE_PDF_SUCCESS] Atualizando preview URL:', newPdfUrl);

      setPdfUrl(newPdfUrl);
      setPreviewKey((prev) => prev + 1);

      toast.dismiss();
      toast.success('PDF substituído com sucesso!');
    } catch (error) {
      console.error('[REPLACE_PDF_SUCCESS] Erro ao recarregar dados do template:', error);
      toast.dismiss();
      toast.error(
        error instanceof Error
          ? error.message
          : 'Erro ao atualizar preview. Recarregue a página.'
      );
    }
  }, [template, createdTemplate]);

  // Configuração do dropzone para modo create
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    handleFileUpload(acceptedFiles[0]);
  }, [handleFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    multiple: false,
    disabled: mode === 'edit' || !!uploadedFile,  // Desabilitar em modo edição ou após upload
  });

  // Cleanup: revogar URL do blob quando componente desmonta
  useEffect(() => {
    return () => {
      if (uploadedFilePreview) {
        URL.revokeObjectURL(uploadedFilePreview);
      }
    };
  }, [uploadedFilePreview]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
          <p className="font-medium text-muted-foreground">Carregando {template.nome}...</p>
          <p className="text-sm text-muted-foreground/80">Preparando editor de campos.</p>
        </div>
      </div>
    );
  }

  // Handler para criar template com formulário inline
  const handleCreateTemplateSubmit = async (data: {
    nome: string;
    descricao: string;
    conteudo_markdown?: string;
  }) => {
    if (!uploadedFile) {
      toast.error('Arquivo PDF não encontrado');
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('file', uploadedFile);
      formDataToSend.append('nome', data.nome.trim());
      formDataToSend.append('descricao', data.descricao.trim());
      if (data.conteudo_markdown && data.conteudo_markdown.trim()) {
        formDataToSend.append('conteudo_markdown', data.conteudo_markdown.trim());
      }

      const response = await fetch('/api/assinatura-digital/templates', {
        method: 'POST',
        body: formDataToSend,
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao criar template');
      }

      const result = await response.json();
      toast.success('Template criado com sucesso!');

      const newTemplate = result.data;
      setCreatedTemplate(newTemplate);

      // Usar endpoint de preview que faz proxy do PDF (evita CORS com Backblaze B2)
      setPdfUrl(`/api/assinatura-digital/templates/${newTemplate.id}/preview`);
      setPreviewKey((prev) => prev + 1);

      // Redirecionar para a página de edição do template criado
      router.replace(`/assinatura-digital/templates/${newTemplate.id}/edit`);
    } catch (error) {
      console.error('Erro ao criar template:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao criar template');
      throw error;
    }
  };

  // Modo create sem PDF ainda - usar formulário inline
  if (mode === 'create' && !uploadedFile) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        {/* Layout principal: Dropzone inicial e formulário inline */}
        <div className="flex-1 flex flex-col gap-6 items-center justify-center min-h-0 overflow-auto px-6 py-8">
          <div className="max-w-2xl w-full space-y-6">
            {/* Dropzone compacto */}
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-input hover:border-primary/50'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
              <h3 className="text-base font-semibold mb-1">
                {isDragActive ? 'Solte o arquivo aqui' : 'Faça upload do PDF do template'}
              </h3>
              <p className="text-sm text-muted-foreground mb-2">
                Arraste um arquivo PDF ou clique para selecionar
              </p>
              <p className="text-xs text-muted-foreground">
                Apenas arquivos PDF, máximo 10MB
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Modo create com PDF - mostrar formulário inline
  if (mode === 'create' && uploadedFile && !createdTemplate) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        {/* Layout principal: Dropzone e formulário inline */}
        <div className="flex-1 flex flex-col gap-6 items-center justify-center min-h-0 overflow-auto px-6 py-8">
          <div className="max-w-2xl w-full space-y-6">
            {/* Dropzone com preview */}
            <div className="border-2 border-primary/50 rounded-lg p-6 text-center bg-primary/5">
              <Upload className="mx-auto h-10 w-10 text-primary mb-2" />
              <h3 className="text-sm font-semibold mb-1">PDF carregado com sucesso!</h3>
              <p className="text-xs text-muted-foreground">
                {uploadedFile.name} ({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            </div>

            {/* Formulário inline */}
            <CreateTemplateForm
              pdfFile={uploadedFile}
              onSubmit={handleCreateTemplateSubmit}
              onCancel={() => {
                setUploadedFile(null);
                setUploadedFilePreview(null);
                setPdfUrl(null);
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Toolbar Mobile (horizontal no topo) */}
      <ToolbarButtonsMobile
        editorMode={editorMode}
        onModeChange={setEditorMode}
        onAddRichTextField={handleAddRichTextField}
        zoomPercentage={zoomPercentage}
        canZoomIn={canZoomIn}
        canZoomOut={canZoomOut}
        canResetZoom={canResetZoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
        currentPage={currentPage}
        totalPages={totalPages}
        onNextPage={handleNextPage}
        onPreviousPage={handlePreviousPage}
        hasSelectedField={!!selectedField}
        onOpenProperties={handleOpenProperties}
        onOpenTemplateInfo={handleOpenTemplateInfo}
        onReplacePdf={handleReplacePdf}
        onCancel={handleCancel}
        onSave={handleSave}
        onGenerateTestPreview={handleGenerateTestPreview}
        isGeneratingPreview={isGeneratingPreview}
        pdfUrl={pdfUrl}
        isCreateMode={mode === 'create'}
        hasTemplateId={!!template?.id}
        showFilledPreview={showFilledPreview}
        onTogglePreview={handleTogglePreview}
        hasPreviewPdf={!!previewPdfUrl}
      />

      {/* Layout principal: Toolbar vertical + Canvas */}
      <div className="flex-1 flex gap-3 items-center min-h-0 px-3 pb-6">
        {/* Toolbar Desktop - Floating & Draggable */}
        <div
          className={styles.floatingToolbar}
          style={{
            '--toolbar-x': `${toolbarPosition.x}px`,
            '--toolbar-y': `${toolbarPosition.y}px`,
          } as React.CSSProperties}
          onMouseDown={handleToolbarMouseDown}
          onTouchStart={handleToolbarTouchStart}
        >
          <ToolbarButtons
            editorMode={editorMode}
            onModeChange={setEditorMode}
            onAddRichTextField={handleAddRichTextField}
            zoomPercentage={zoomPercentage}
            canZoomIn={canZoomIn}
            canZoomOut={canZoomOut}
            canResetZoom={canResetZoom}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onResetZoom={handleResetZoom}
            currentPage={currentPage}
            totalPages={totalPages}
            onNextPage={handleNextPage}
            onPreviousPage={handlePreviousPage}
            hasSelectedField={!!selectedField}
            onOpenProperties={handleOpenProperties}
            onOpenTemplateInfo={handleOpenTemplateInfo}
            onReplacePdf={handleReplacePdf}
            onCancel={handleCancel}
            onSave={handleSave}
            onGenerateTestPreview={handleGenerateTestPreview}
            isGeneratingPreview={isGeneratingPreview}
            pdfUrl={pdfUrl}
            isCreateMode={mode === 'create'}
            hasTemplateId={!!template?.id}
            showFilledPreview={showFilledPreview}
            onTogglePreview={handleTogglePreview}
            hasPreviewPdf={!!previewPdfUrl}
          />
        </div>

        {/* Popovers separados - não aninhados */}
        <PropertiesPopover
          trigger={<div />}
          open={showProperties}
          onOpenChange={setShowProperties}
          selectedField={selectedField}
          fieldsLength={fields.length}
          onUpdateField={updateSelectedField}
          onDeleteField={deleteField}
          onEditRichText={handleEditRichText}
        />

        <TemplateInfoPopover
          trigger={<div />}
          open={showTemplateInfo}
          onOpenChange={setShowTemplateInfo}
          template={createdTemplate || template}
          onUpdate={handleTemplateInfoUpdate}
          isCreating={mode === 'create' && !createdTemplate}
          pdfFile={uploadedFile || undefined}
        />

        {/* Canvas PDF com Context Menu */}
        <PdfCanvasArea
          canvasRef={canvasRef}
          canvasSize={canvasSize}
          zoom={zoom}
          pdfUrl={pdfUrl}
          previewKey={previewKey}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onLoadSuccess={handlePdfLoadSuccess}
          onLoadError={(error) => {
            toast.error('Não foi possível carregar o preview do PDF.', {
              description: error.message,
            });
          }}
          fields={fields}
          fieldsWithHeightWarning={fieldsWithHeightWarning}
          onCanvasClick={handleCanvasClick}
          onFieldClick={handleFieldClick}
          onFieldMouseDown={handleMouseDown}
          onFieldKeyboard={handleFieldKeyboard}
          onResizeMouseDown={handleResizeMouseDown}
          selectedField={selectedField}
          onOpenProperties={handleOpenProperties}
          onDuplicateField={duplicateField}
          onDeleteField={deleteField}
          onAddTextField={handleAddTextField}
          onAddImageField={handleAddImageField}
          onAddRichTextField={handleAddRichTextField}
          onEditRichText={handleEditRichText}
          onAdjustHeight={handleAdjustHeightAutomatically}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetZoom={handleResetZoom}
        />
      </div>

      {/* Dialog de confirmação ao sair */}
      <Dialog open={showExitConfirmation} onOpenChange={setShowExitConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterações não salvas</DialogTitle>
            <DialogDescription>
              Você tem alterações não salvas. Deseja sair sem salvar?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setShowExitConfirmation(false)}>
              Continuar editando
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowExitConfirmation(false);
                setHasUnsavedChanges(false);
                const navigation =
                  pendingNavigation ??
                  (onCancel ? () => onCancel() : () => router.push('/assinatura-digital/templates'));
                setPendingNavigation(null);
                navigation();
              }}
            >
              Sair sem salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de preview de teste gerado */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>PDF de Teste Gerado com Sucesso</DialogTitle>
            <DialogDescription>
              Visualize o PDF gerado com dados fictícios para validar o layout do template.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Preview do PDF ou mensagem de erro */}
            {previewPdfUrl && (
              <>
                {!iframeLoadFailed ? (
                  <div className="border rounded-lg overflow-hidden bg-muted/20">
                    <iframe
                      src={previewPdfUrl}
                      className="w-full h-[400px]"
                      title="Preview do PDF de teste"
                      onLoad={handleIframeLoad}
                      onError={handleIframeError}
                    />
                  </div>
                ) : (
                  <div className="border rounded-lg p-8 text-center bg-muted/10">
                    <div className="space-y-3">
                      <div className="text-muted-foreground">
                        <svg className="mx-auto h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="font-medium">Não foi possível exibir o PDF aqui</p>
                        <p className="text-sm text-muted-foreground/80 mt-1">
                          O PDF foi gerado com sucesso, mas não pode ser embutido devido a restrições de segurança (CORS/CSP).
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                        <Button
                          variant="outline"
                          onClick={() => {
                            if (previewPdfUrl) {
                              downloadPdf(previewPdfUrl, `preview-teste-${template.nome}-${Date.now()}.pdf`);
                            }
                          }}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Baixar PDF
                        </Button>
                        <Button
                          onClick={() => {
                            if (previewPdfUrl) {
                              window.open(previewPdfUrl, '_blank');
                            }
                          }}
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Abrir em Nova Aba
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={() => {
                if (previewPdfUrl) {
                  downloadPdf(previewPdfUrl, `preview-teste-${template.nome}-${Date.now()}.pdf`);
                }
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              Baixar PDF
            </Button>
            <Button
              onClick={() => {
                if (previewPdfUrl) {
                  window.open(previewPdfUrl, '_blank');
                }
              }}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Abrir em Nova Aba
            </Button>
            <Button variant="secondary" onClick={() => setShowPreviewModal(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de substituição de PDF */}
      <ReplacePdfDialog
        open={showReplacePdf}
        onOpenChange={setShowReplacePdf}
        templateId={createdTemplate?.id || template.id}
        onSuccess={handleReplacePdfSuccess}
      />

      {/* Dialog do Rich Text Editor */}
      {editingRichTextField && (
        <RichTextEditorPopover
          open={showRichTextEditor}
          onOpenChange={setShowRichTextEditor}
          value={editingRichTextField.conteudo_composto}
          onChange={(conteudo) => {
            if (editingRichTextField) {
              updateSelectedField({ conteudo_composto: conteudo });
              // Atualizar também o estado local
              setEditingRichTextField({
                ...editingRichTextField,
                conteudo_composto: conteudo,
              });
            }
          }}
          fieldName={editingRichTextField.nome}
          formularios={[]}
          fieldWidth={editingRichTextField.posicao.width}
          fieldHeight={editingRichTextField.posicao.height}
          fontSize={editingRichTextField.estilo?.tamanho_fonte || 12}
          onHeightAdjust={(newHeight) => {
            if (editingRichTextField) {
              updateSelectedField({
                posicao: {
                  ...editingRichTextField.posicao,
                  height: newHeight,
                },
              });
              setEditingRichTextField({
                ...editingRichTextField,
                posicao: {
                  ...editingRichTextField.posicao,
                  height: newHeight,
                },
              });
            }
          }}
        />
      )}
    </div>
  );
}