"use client";

import {
  AlignLeft,
  Copy,
  Edit,
  Image,
  RotateCcw,
  Settings,
  Trash2,
  Type,
  ZoomIn,
  ZoomOut,
  UserCheck,
} from "lucide-react";
import { AppBadge } from "@/components/ui/app-badge";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
} from "@/components/ui/context-menu";
import { cn } from "@/lib/utils";

import { PosicaoCampo, TemplateCampo } from "../../types/template.types";

type TipoCampo = TemplateCampo["tipo"];
import PdfPreviewDynamic from "../pdf/PdfPreviewDynamic";
const PdfPreview = PdfPreviewDynamic;

interface EditorField extends Omit<TemplateCampo, "posicao"> {
  posicao: PosicaoCampo;
  isSelected: boolean;
  isDragging: boolean;
  justAdded?: boolean;
  template_id?: string;
  criado_em?: Date;
  atualizado_em?: Date;
  signatario_id?: string;
}

const FIELD_TYPE_LABEL: Record<TipoCampo, string> = {
  texto: "Texto",
  cpf: "CPF",
  cnpj: "CNPJ",
  data: "Data",
  assinatura: "Assinatura",
  foto: "Foto",
  texto_composto: "Texto Composto",
};

interface PdfCanvasAreaProps {
  // Canvas
  canvasRef: React.RefObject<HTMLDivElement>;
  canvasSize: { width: number; height: number };
  zoom: number;

  // PDF
  pdfUrl: string | null;
  previewKey: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onLoadSuccess: (numPages: number) => void;
  onLoadError: (error: Error) => void;

  // Fields
  fields: EditorField[];
  fieldsWithHeightWarning?: Set<string>;

  // Interactions
  onCanvasClick: (event: React.MouseEvent) => void;
  onFieldClick: (field: EditorField, event: React.MouseEvent) => void;
  onFieldMouseDown: (field: EditorField, event: React.MouseEvent) => void;
  onFieldKeyboard: (
    field: EditorField,
    event: React.KeyboardEvent<HTMLDivElement>
  ) => void;
  onResizeMouseDown: (
    field: EditorField,
    handle: "nw" | "ne" | "sw" | "se" | "n" | "s" | "e" | "w",
    event: React.MouseEvent
  ) => void;

  // Context Menu Actions
  selectedField: EditorField | null;
  onOpenProperties: () => void;
  onDuplicateField: (fieldId: string) => void;
  onDeleteField: (fieldId: string) => void;
  onAddTextField: () => void;
  onAddImageField: () => void;
  onAddRichTextField?: () => void;
  onEditRichText?: (fieldId: string) => void;
  onAdjustHeight?: (fieldId: string) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;

  // Drag & drop from palette
  onDragOver?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDrop?: (event: React.DragEvent<HTMLDivElement>) => void;

  // Signer information
  getSignerColor?: (signerId: string | undefined) => string;
  getSignerById?: (id: string) => { id: string; nome: string; cor: string } | undefined;

  // Signer reassignment
  signers?: Array<{ id: string; nome: string; cor: string }>;
  onReassignField?: (fieldId: string, signerId: string) => void;
}

export default function PdfCanvasArea({
  canvasRef,
  canvasSize,
  zoom,
  pdfUrl,
  previewKey,
  currentPage,
  totalPages,
  onPageChange,
  onLoadSuccess,
  onLoadError,
  fields,
  fieldsWithHeightWarning = new Set(),
  onCanvasClick,
  onFieldClick,
  onFieldMouseDown,
  onFieldKeyboard,
  onResizeMouseDown,
  selectedField,
  onOpenProperties,
  onDuplicateField,
  onDeleteField,
  onAddTextField,
  onAddImageField,
  onAddRichTextField,
  onEditRichText,
  onAdjustHeight,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onDragOver,
  onDrop,
  getSignerColor,
  getSignerById,
  signers,
  onReassignField,
}: PdfCanvasAreaProps) {
  // Criar array de páginas para renderizar (scroll contínuo)
  const pages = Array.from({ length: totalPages || 1 }, (_, i) => i + 1);

  // Função para renderizar um campo
  const renderField = (field: EditorField, _pageNumber: number, index: number) => {
    if (!field.posicao) return null;

    const typeLabel = FIELD_TYPE_LABEL[field.tipo] ?? "Campo";
    const isImageField = field.tipo === "assinatura" || field.tipo === "foto";
    const isRichTextField = field.tipo === "texto_composto";
    const hasHeightWarning = fieldsWithHeightWarning.has(field.id);

    const signer = field.signatario_id && getSignerById
      ? getSignerById(field.signatario_id)
      : null;
    const signerColor = getSignerColor
      ? getSignerColor(field.signatario_id)
      : '#6B7280';

    let displayText = field.nome;
    if (isRichTextField && field.conteudo_composto?.template) {
      displayText = field.conteudo_composto.template
        .replace(/\{\{([^}]+)\}\}/g, "⟨$1⟩")
        .replace(/\s+/g, " ")
        .trim() || field.nome;
    }

    const uniqueKey = field.id
      ? `${field.id}-${pageNumber}`
      : `temp-${pageNumber}-${index}-${field.posicao.x}-${field.posicao.y}`;

    return (
      <div
        key={uniqueKey}
        className={cn(
          "group absolute select-none rounded border-2 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          hasHeightWarning && "border-red-500 animate-pulse",
          !hasHeightWarning && field.isSelected && !signer && "cursor-move border-primary/80 bg-primary/10 shadow-sm",
          !hasHeightWarning && field.isSelected && signer && "cursor-move shadow-sm",
          !hasHeightWarning && !field.isSelected && !signer && "cursor-pointer border-border/70 bg-yellow-100/70 hover:border-muted-foreground/80 hover:shadow-sm",
          !hasHeightWarning && !field.isSelected && signer && "cursor-pointer hover:shadow-sm",
          field.justAdded && "animate-in fade-in-0 zoom-in-95",
          field.isDragging && "opacity-50"
        )}
        title={hasHeightWarning ? "⚠️ Texto pode não caber" : signer ? `${signer.nome}` : "Duplo clique para editar"}
        style={{
          left: field.posicao.x,
          top: field.posicao.y,
          width: field.posicao.width,
          height: field.posicao.height,
          ...(signer && !hasHeightWarning && {
            borderColor: field.isSelected ? signerColor : `${signerColor}70`,
            backgroundColor: `${signerColor}10`,
          }),
        }}
        onClick={(e) => onFieldClick(field, e)}
        onDoubleClick={(e) => {
          e.stopPropagation();
          if (isRichTextField && onEditRichText) onEditRichText(field.id);
          else { onFieldClick(field, e); onOpenProperties(); }
        }}
        onMouseDown={(e) => onFieldMouseDown(field, e)}
        onKeyDown={(e) => onFieldKeyboard(field, e)}
        role="button"
        tabIndex={0}
        aria-label={`Campo ${field.nome} do tipo ${typeLabel}`}
        data-state={field.isSelected ? "selected" : "idle"}
      >
        <div className="absolute inset-0 flex items-center justify-center px-1 text-center">
          <span className="truncate text-xs font-medium text-foreground">{displayText}</span>
        </div>
        {signer && (
          <div className="pointer-events-none absolute -top-6 left-0 flex items-center gap-1 rounded-sm px-2 py-0.5 text-[10px] font-medium text-white shadow-sm" style={{ backgroundColor: signerColor }}>
            {signer.nome}
          </div>
        )}
        {field.isSelected && (
          <>
            <AppBadge variant="secondary" className={cn("pointer-events-none absolute flex items-center gap-1 rounded-full px-2 py-0 text-[11px] shadow-sm", signer ? "-top-12 left-0" : "-top-6 left-0")}>
              {isImageField ? <Image className="h-3 w-3" aria-hidden="true" /> : isRichTextField ? <AlignLeft className="h-3 w-3" aria-hidden="true" /> : <Type className="h-3 w-3" aria-hidden="true" />}
              {typeLabel}
            </AppBadge>
            {/* Resize handles */}
            {(["nw", "ne", "sw", "se", "n", "s", "e", "w"] as const).map(handle => (
              <div
                key={handle}
                className={cn(
                  "resize-handle absolute w-3 h-3 bg-primary rounded-full z-10 hover:scale-125 transition-transform focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1",
                  handle === "nw" && "-top-1.5 -left-1.5 cursor-nw-resize",
                  handle === "ne" && "-top-1.5 -right-1.5 cursor-ne-resize",
                  handle === "sw" && "-bottom-1.5 -left-1.5 cursor-sw-resize",
                  handle === "se" && "-bottom-1.5 -right-1.5 cursor-se-resize",
                  handle === "n" && "-top-1.5 left-1/2 -translate-x-1/2 cursor-n-resize",
                  handle === "s" && "-bottom-1.5 left-1/2 -translate-x-1/2 cursor-s-resize",
                  handle === "w" && "top-1/2 -translate-y-1/2 -left-1.5 cursor-w-resize",
                  handle === "e" && "top-1/2 -translate-y-1/2 -right-1.5 cursor-e-resize"
                )}
                onMouseDown={(e) => { e.stopPropagation(); onResizeMouseDown(field, handle, e); }}
                onClick={(e) => e.stopPropagation()}
                role="button"
                tabIndex={0}
                aria-label={`Redimensionar ${handle}`}
              />
            ))}
          </>
        )}
      </div>
    );
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          ref={canvasRef}
          className="flex flex-col items-center gap-4"
          style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}
        >
          {/* Renderizar todas as páginas em sequência (scroll contínuo) */}
          {pages.map((pageNumber) => {
            const fieldsOnPage = fields.filter(f => f.posicao?.pagina === pageNumber);

            return (
              <div
                key={pageNumber}
                className="relative bg-white shadow-lg rounded-sm"
                style={{ width: canvasSize.width, height: canvasSize.height }}
                onClick={onCanvasClick}
                onDragOver={onDragOver}
                onDrop={onDrop}
                data-page={pageNumber}
                role="presentation"
              >
                {/* PDF Background desta página */}
                <div className="absolute inset-0">
                  {pdfUrl ? (
                    <PdfPreview
                      key={`${previewKey}-${pageNumber}`}
                      pdfUrl={pdfUrl}
                      initialPage={pageNumber}
                      initialZoom={1}
                      mode="background"
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                      showControls={false}
                      showPageIndicator={false}
                      pageWidth={canvasSize.width}
                      pageHeight={canvasSize.height}
                      className="h-full w-full"
                      onPageChange={onPageChange}
                      onLoadSuccess={pageNumber === 1 ? onLoadSuccess : undefined}
                      onLoadError={pageNumber === 1 ? onLoadError : undefined}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center border bg-white">
                      <p className="text-muted-foreground">Carregando...</p>
                    </div>
                  )}
                </div>

                {/* Campos desta página */}
                {fieldsOnPage.map((field, index) => renderField(field, pageNumber, index))}

                {/* Indicador de página */}
                <div className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-white/80 px-2 py-0.5 rounded">
                  {pageNumber}/{totalPages}
                </div>
              </div>
            );
          })}
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-56">
        {/* Ações específicas do campo selecionado */}
        {selectedField && (
          <>
            <ContextMenuItem onClick={onOpenProperties}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Editar Propriedades</span>
            </ContextMenuItem>
            {selectedField.tipo === "texto_composto" && onEditRichText && (
              <ContextMenuItem onClick={() => onEditRichText(selectedField.id)}>
                <Edit className="mr-2 h-4 w-4" />
                <span>Editar Texto Composto</span>
              </ContextMenuItem>
            )}
            {selectedField.tipo === "texto_composto" &&
              fieldsWithHeightWarning.has(selectedField.id) &&
              onAdjustHeight && (
                <ContextMenuItem
                  onClick={() => onAdjustHeight(selectedField.id)}
                  className="text-orange-600 focus:text-orange-600"
                >
                  <svg
                    className="mr-2 h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>Ajustar Altura Automaticamente</span>
                </ContextMenuItem>
              )}
            <ContextMenuItem onClick={() => onDuplicateField(selectedField.id)}>
              <Copy className="mr-2 h-4 w-4" />
              <span>Duplicar Campo</span>
            </ContextMenuItem>
            {/* Signer reassignment submenu */}
            {signers && signers.length > 0 && onReassignField && (
              <ContextMenuSub>
                <ContextMenuSubTrigger>
                  <UserCheck className="mr-2 h-4 w-4" />
                  <span>Atribuir a...</span>
                </ContextMenuSubTrigger>
                <ContextMenuSubContent className="w-48">
                  {signers.map((s) => (
                    <ContextMenuItem
                      key={s.id}
                      onClick={() => onReassignField(selectedField.id, s.id)}
                      className={cn(
                        selectedField.signatario_id === s.id && "bg-accent"
                      )}
                    >
                      <div
                        className="mr-2 h-3 w-3 rounded-full shrink-0"
                        style={{ backgroundColor: s.cor }}
                      />
                      <span className="truncate">{s.nome}</span>
                      {selectedField.signatario_id === s.id && (
                        <span className="ml-auto text-xs text-muted-foreground">atual</span>
                      )}
                    </ContextMenuItem>
                  ))}
                </ContextMenuSubContent>
              </ContextMenuSub>
            )}
            <ContextMenuSeparator />
            <ContextMenuItem
              onClick={() => onDeleteField(selectedField.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Deletar Campo</span>
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        )}

        {/* Ações globais - sempre disponíveis */}
        <ContextMenuItem onClick={onAddTextField}>
          <Type className="mr-2 h-4 w-4" />
          <span>Adicionar Campo de Texto</span>
        </ContextMenuItem>
        <ContextMenuItem onClick={onAddImageField}>
          <Image className="mr-2 h-4 w-4" aria-hidden="true" />
          <span>Adicionar Campo de Imagem</span>
        </ContextMenuItem>
        <ContextMenuItem onClick={onAddRichTextField}>
          <AlignLeft className="mr-2 h-4 w-4" />
          <span>Adicionar Campo de Texto Composto</span>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onZoomIn}>
          <ZoomIn className="mr-2 h-4 w-4" />
          <span>Zoom In</span>
        </ContextMenuItem>
        <ContextMenuItem onClick={onZoomOut}>
          <ZoomOut className="mr-2 h-4 w-4" />
          <span>Zoom Out</span>
        </ContextMenuItem>
        <ContextMenuItem onClick={onResetZoom}>
          <RotateCcw className="mr-2 h-4 w-4" />
          <span>Reset Zoom</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
