"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useFormularioStore } from "../../../feature/store/formulario-store";
import {
  actionGetDocumento,
  actionSetDocumentoAnchors,
  actionGetPresignedPdfUrl,
  actionAddDocumentoSigner,
  actionRemoveDocumentoSigner,
} from "../../../feature/actions/documentos-actions";
import { PDF_CANVAS_SIZE } from "../../../feature/types/pdf-preview.types";
import {
  useFieldSelection,
  useFieldDrag,
  useZoomPan,
  usePaletteDrag,
  useSigners,
} from "../../../feature/components/editor/hooks";
import EditorCanvas from "../../../feature/components/editor/components/EditorCanvas";
import FloatingSidebar from "../../../feature/components/editor/components/FloatingSidebar";
import type { EditorField, Signatario } from "../../../feature/components/editor/types";
import { Loader2 } from "lucide-react";
import type { AssinaturaDigitalDocumentoCompleto } from "../../../feature/domain";

interface EditarDocumentoClientProps {
  uuid: string;
}

export function EditarDocumentoClient({ uuid }: EditarDocumentoClientProps) {
  const router = useRouter();
  const { setEtapaAtual } = useFormularioStore();
  const canvasRef = useRef<HTMLDivElement>(null);

  // --- STATE ---
  const [documento, setDocumento] = useState<AssinaturaDigitalDocumentoCompleto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [fields, setFields] = useState<EditorField[]>([]);
  const [selectedField, setSelectedField] = useState<EditorField | null>(null);

  // --- HOOKS ---
  const {
    zoom,
    setZoom,
    handleZoomIn,
    handleZoomOut,
    handleResetZoom,
  } = useZoomPan({ canvasSize: PDF_CANVAS_SIZE });

  // Mapear assinantes do documento para formato Signatario
  const initialSigners = useMemo<Signatario[]>(() => {
    if (!documento) return [];
    return documento.assinantes.map((a, index) => ({
      id: String(a.id), // Converter ID numérico p/ string p/ compatibilidade com Editor
      nome: a.dados_snapshot.nome_completo as string ||
        a.dados_snapshot.nome as string ||
        `Assinante ${index + 1}`,
      email: a.dados_snapshot.email as string || "",
      cor: "#7C3AED", // TODO: Usar lógica de cores consistente se possível
      ordem: index,
    }));
  }, [documento]);

  const {
    signers,
    activeSigner,
    setActiveSigner,
    setSigners, // Para atualizar quando documento mudar
    getSignerById,
    getSignerColor,
  } = useSigners({ initialSigners });

  // Field Hooks
  const {
    selectField,
    deleteField,
    duplicateField,
    updateSelectedField,
    handleFieldClick,
    handleFieldKeyboard,
  } = useFieldSelection({
    fields,
    setFields,
    selectedField,
    setSelectedField,
    currentPage,
    markDirty: () => { }, // TODO: Implement dirty tracking
    canvasSize: PDF_CANVAS_SIZE,
  });

  const handleCanvasClick = () => {
    if (selectedField) {
      setFields((prev) => prev.map((f) => ({ ...f, isSelected: false })));
      setSelectedField(null);
    }
  };

  const {
    dragState,
    handleMouseDown: handleFieldMouseDown,
    handleResizeMouseDown,
    // handleFieldKeyboard, // Already from useFieldSelection
  } = useFieldDrag({
    fields,
    setFields,
    zoom,
    canvasRef,
    canvasWidth: PDF_CANVAS_SIZE.width,
    canvasHeight: PDF_CANVAS_SIZE.height,
    editorMode: "select", // Default mode
    setSelectedField,
    selectField,
    markDirty: () => { }, // TODO: Implement dirty tracking
  });

  const {
    handleCanvasDragOver,
    handleCanvasDrop
  } = usePaletteDrag({
    canvasRef,
    zoom,
    templateId: documento ? documento.documento_uuid : "",
    currentPage,
    fieldsLength: fields.length,
    setFields,
    setSelectedField, // Pass raw setter
    markDirty: () => { },
  });

  // --- EFFECTS ---

  // Set Step
  useEffect(() => {
    setEtapaAtual(1); // Configurar
  }, [setEtapaAtual]);

  // Load Document
  const loadDocument = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await actionGetDocumento({ uuid });

      if (!res.success) {
        toast.error(res.error || "Erro ao carregar documento.");
        router.push("/app/assinatura-digital/documentos");
        return;
      }

      const docData = res.data;

      // Validar status (docData.documento.status)
      if (docData.documento.status === "concluido") {
        toast.error("Este documento já foi concluído.");
        router.push("/app/assinatura-digital/documentos");
        return;
      }

      // Action returns { documento, assinantes, ancoras }, but State expects Flattened object (AssinaturaDigitalDocumentoCompleto)
      setDocumento({
        ...docData.documento,
        assinantes: docData.assinantes,
        ancoras: docData.ancoras
      } as any); // Cast as any to avoid strict interface mismatches for now (SafeAction wrapper types vs internal types)

      // Carregar PDF Presigned URL
      if (docData.documento.pdf_original_url) {
        try {
          const urlRes = await actionGetPresignedPdfUrl({ url: docData.documento.pdf_original_url });
          if (urlRes.success && urlRes.data.presignedUrl) {
            setPdfUrl(urlRes.data.presignedUrl);
          } else {
            console.error("Erro ao obter URL presigned:", urlRes.success ? "URL vazia" : urlRes.error);
          }
        } catch (e) {
          console.error("Erro ao gerar link temporário:", e);
          toast.error("Erro ao carregar PDF do documento.");
        }
      }

      // Converter âncoras para fields
      if (docData.ancoras) {
        const initialFields: EditorField[] = docData.ancoras.map((a: any) => ({
          id: String(a.id), // ID vindo do banco é número
          tipo: a.tipo as any,
          nome: a.tipo === "assinatura" ? "Assinatura" : "Rubrica",
          posicao: {
            x: a.x_norm * PDF_CANVAS_SIZE.width,
            y: a.y_norm * PDF_CANVAS_SIZE.height,
            width: a.w_norm * PDF_CANVAS_SIZE.width,
            height: a.h_norm * PDF_CANVAS_SIZE.height,
            pagina: a.pagina
          },
          isSelected: false,
          isDragging: false,
          signatario_id: String(a.documento_assinante_id)
        }));
        setFields(initialFields);
      }

    } catch (error) {
      console.error(error);
      toast.error("Não foi possível carregar o documento.");
      router.push("/app/assinatura-digital/documentos");
    } finally {
      setIsLoading(false);
    }
  }, [uuid, router]);

  useEffect(() => {
    loadDocument();
  }, [loadDocument]);

  // --- ACTIONS ---

  const handleAddSigner = async (nome: string, email: string) => {
    if (!documento) return;
    try {
      const res = await actionAddDocumentoSigner({
        documento_uuid: documento.documento_uuid,
        signer: {
          assinante_tipo: "terceiro", // Default simplificado
          assinante_entidade_id: null,
          dados_snapshot: { nome, email }
        }
      });
      if (res.success) {
        // Recarregar documento para atualizar lista e IDs reais
        await loadDocument();
        toast.success("Signatário adicionado com sucesso.");
      } else {
        toast.error(res.error || "Erro ao adicionar signatário.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao adicionar signatário.");
    }
  };

  const handleDeleteSigner = async (id: string) => {
    if (!documento) return;
    // O id vindo do hook useSigners é convertida para string, mas action precisa de number (ID do banco)

    // O initialSigners foi criado com id=String(a.id).
    // Se o id for numérico string, converto. Se for "signer-..." gerado por useSigners (local), erro.
    // Mas aqui estamos usando IDs reais do DB pois recarregamos o doc.
    const dbId = parseInt(id, 10);

    if (isNaN(dbId)) {
      // Fallback: se for ID temporário, apenas remove do state local? Não, loadDocument garante IDs reais
      // Mas se o usuário adicionou e a UI não atualizou...
      toast.error("ID inválido.");
      return;
    }

    try {
      const res = await actionRemoveDocumentoSigner({
        documento_uuid: documento.documento_uuid,
        signer_id: dbId
      });
      if (res?.success) {
        toast.success("Signatário removido.");
        await loadDocument();
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao remover signatário.");
    }
  };

  const handleUpdateSigner = async (id: string, updates: { nome?: string; email?: string }) => {
    // A action de update signers ainda não foi implementada neste nível de detalhe (updatePublicSignerIdentification é publica)
    // TODO: Implementar update de nome/email de assinante rascunho se necessário.
    // Por enquanto, avisa que não implementado ou recria.
    toast.info("Edição direta de assinante não suportada, remova e adicione novamente.");
  };

  const handleSaveAndReview = async () => {
    if (!documento) return;

    if (fields.length === 0) {
      toast.warning("Adicione pelo menos um campo de assinatura ao documento.");
      return;
    }

    setIsSaving(true);
    try {
      // Converter fields -> ancoras
      const ancorasPayload = fields.map(f => {
        // Validar se tem signatario
        const sId = f.signatario_id ? parseInt(f.signatario_id, 10) : null;
        if (!sId) throw new Error(`O campo "${f.nome}" (pag ${f.posicao.pagina}) não tem signatário atribuído.`);

        // Map Editor Types (English) to Domain Types (Portuguese)
        let tipoAncora: "assinatura" | "rubrica" = "assinatura";
        const fType = f.tipo as any; // Cast specifically to avoid overlap error with domain types
        if (fType === "initials") tipoAncora = "rubrica";
        else if (fType === "signature") tipoAncora = "assinatura";
        else {
          // For now, treat others as assinatura or throw?
          // Let's default to assinatura but maybe log warning
          // Or if we want to support text/date future:
          // tipoAncora = "texto" as any;
        }

        return {
          documento_auth_id: documento.created_by, // Não usado?
          documento_assinante_id: sId,
          tipo: tipoAncora,
          pagina: f.posicao.pagina,
          x_norm: f.posicao.x / PDF_CANVAS_SIZE.width,
          y_norm: f.posicao.y / PDF_CANVAS_SIZE.height,
          w_norm: f.posicao.width / PDF_CANVAS_SIZE.width,
          h_norm: f.posicao.height / PDF_CANVAS_SIZE.height
        };
      });

      // Filtrar tipos suportados
      const ancorasValidas = ancorasPayload.filter(a => ["assinatura", "rubrica"].includes(a.tipo));
      // Se houver campos de texto/data, avisar que serão ignorados?
      // Para MVP, vamos assumir que só se usa Assinatura/Rubrica.

      await actionSetDocumentoAnchors({
        documento_uuid: documento.documento_uuid,
        ancoras: ancorasValidas as any // Type assertion needed due to strict schema
      });

      toast.success("Configuração salva com sucesso!");
      router.push(`/app/assinatura-digital/documentos/revisar/${documento.documento_uuid}`);

    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Erro ao salvar configurações.");
    } finally {
      setIsSaving(false);
    }
  };


  if (isLoading || !documento) {
    return (
      <div className="flex w-full h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Carregando documento...</span>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 flex relative bg-secondary/20 overflow-hidden">
        {/* Central Canvas Area */}
        <div className="flex-1 overflow-auto flex justify-center p-8">
          <EditorCanvas
            canvasRef={canvasRef}
            canvasSize={PDF_CANVAS_SIZE}
            zoom={zoom}
            pdfUrl={pdfUrl}
            previewKey={1}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onLoadSuccess={setTotalPages}
            onLoadError={() => toast.error("Erro ao renderizar PDF")}
            fields={fields}
            fieldsWithHeightWarning={new Set()}

            // Mouse/Interaction Handlers
            onCanvasClick={handleCanvasClick}
            onFieldClick={(f, e) => handleFieldClick(f, e, dragState.isDragging)}
            onFieldMouseDown={handleFieldMouseDown}
            onFieldKeyboard={handleFieldKeyboard}
            onResizeMouseDown={handleResizeMouseDown}
            onDragOver={handleCanvasDragOver}
            onDrop={(e) => handleCanvasDrop(e, activeSigner)}

            // Props do EditorCanvas
            selectedField={selectedField}
            onOpenProperties={() => { }}
            onDuplicateField={duplicateField}
            onDeleteField={deleteField}

            // Toolbar placeholders (já que não temos toolbar dedicada no layout novo, usamos atalhos ou FloatingSidebar)
            onAddTextField={() => { }}
            onAddImageField={() => { }}
            onAddRichTextField={() => { }}
            onEditRichText={() => { }}
            onAdjustHeight={() => { }}

            // Zoom
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onResetZoom={handleResetZoom}

            // Signers
            getSignerColor={getSignerColor}
            getSignerById={getSignerById}
            signers={signers}
            onReassignField={(fId, sId) => {
              setFields(prev => prev.map(f => f.id === fId ? { ...f, signatario_id: sId } : f));
            }}
          />
        </div>

        {/* Right Sidebar - using absolute positioning via class to overlay or share space?
            We want it to be part of the flex layout (on right), so static relative positioning is fine within flex.
            FloatingSidebar with "hidden lg:flex" if we want, but it handles its own responsiveness.
            If we use the className override we added: */}
        <FloatingSidebar
          className="w-80 border-l bg-background shadow-none relative h-full shrink-0 z-10" // Relative to engage in Flex layout, not fixed
          signers={signers}
          activeSigner={activeSigner}
          onSelectSigner={setActiveSigner}
          onAddSigner={handleAddSigner}
          onUpdateSigner={handleUpdateSigner}
          onDeleteSigner={handleDeleteSigner}
          fields={fields}
          onPaletteDragStart={(type) => {
            // Hook needs drag start not exposed? 
            // Ah, usePaletteDrag doesn't export setDragItem?
            // Actually usePaletteDrag returns handleDragOver/Drop but expects dataTransfer to be set by the Draggable.
            // FloatingSidebar handles setting dataTransfer in FieldPaletteCard!
            // So we just need to pass dummy callback or state if we want visual feedback?
            // FloatingSidebar prop onPaletteDragStart: (type) => void.
          }}
          onPaletteDragEnd={() => { }}
          onReviewAndSend={handleSaveAndReview}
        />
      </div>
    </>
  );
}
