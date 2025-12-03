'use client';

import { AlignLeft, Copy, Edit, Image, RotateCcw, Settings, Trash2, Type, ZoomIn, ZoomOut } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { cn } from '@/lib/utils';

import type { TemplateCampo, TipoCampo } from '@/types/formsign';
import { PdfPreviewDynamic as PdfPreview } from '@/components/formsign/pdf';

interface EditorField extends TemplateCampo {
  isSelected: boolean;
  isDragging: boolean;
  justAdded?: boolean;
}

const FIELD_TYPE_LABEL: Record<TipoCampo, string> = {
  texto: 'Texto',
  cpf: 'CPF',
  cnpj: 'CNPJ',
  data: 'Data',
  telefone: 'Telefone',
  endereco: 'Endereço',
  assinatura: 'Assinatura',
  foto: 'Foto',
  sistema: 'Sistema',
  segmento: 'Segmento',
  texto_composto: 'Texto Composto',
};

interface PdfCanvasAreaProps {
  // Canvas
  canvasRef: React.RefObject<HTMLDivElement | null>;
  canvasSize: { width: number; height: number };
  zoom: number;

  // PDF
  pdfUrl: string | null;
  previewKey: number;
  currentPage: number;
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
  onFieldKeyboard: (field: EditorField, event: React.KeyboardEvent<HTMLDivElement>) => void;
  onResizeMouseDown: (field: EditorField, handle: 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w', event: React.MouseEvent) => void;

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
}

export default function PdfCanvasArea({
  canvasRef,
  canvasSize,
  zoom,
  pdfUrl,
  previewKey,
  currentPage,
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
}: PdfCanvasAreaProps) {
  // Filtrar campos pela página atual (verificar se posicao existe)
  const fieldsOnCurrentPage = fields.filter((field) => field.posicao?.pagina === currentPage);
  return (
    <ContextMenu>
      <ContextMenuTrigger className="flex-1 overflow-auto bg-white flex items-center justify-center p-8">
        <div className="relative pb-20">
          <div
            className="relative"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'top center',
            }}
          >
            <div
              ref={canvasRef}
              className="relative bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)]"
              style={{
                width: canvasSize.width,
                height: canvasSize.height,
              }}
              onClick={onCanvasClick}
              role="presentation"
            >
              {/* PDF Background */}
              <div className="absolute inset-0">
                {pdfUrl ? (
                  <PdfPreview
                    key={previewKey}
                    pdfUrl={pdfUrl}
                    initialPage={currentPage}
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
                    onLoadSuccess={onLoadSuccess}
                    onLoadError={onLoadError}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center border bg-white">
                    <div className="text-center text-muted-foreground">
                      <p>Carregando preview do PDF...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Fields Overlay - apenas campos da página atual */}
              {fieldsOnCurrentPage.map((field, index) => {
                const typeLabel = FIELD_TYPE_LABEL[field.tipo] ?? 'Campo';
                const isImageField = field.tipo === 'assinatura' || field.tipo === 'foto';
                const isRichTextField = field.tipo === 'texto_composto';
                const hasHeightWarning = fieldsWithHeightWarning.has(field.id);

                // Preview de texto composto (substituir {{variavel}} por ⟨variavel⟩)
                // NOTE: This substitution with symbols ⟨variavel⟩ is preview-only and does NOT affect
                // PDF positioning. The PDF generator (lib/pdf/generator.ts) substitutes variables with
                // actual data after coordinate conversion has been applied.
                let displayText = field.nome;
                if (isRichTextField && field.conteudo_composto?.template) {
                  const cleanedTemplate = field.conteudo_composto.template
                    .replace(/\{\{([^}]+)\}\}/g, '⟨$1⟩')  // Substituir {{var}} por ⟨var⟩
                    .replace(/\s+/g, ' ')                   // Colapsar espaços em branco
                    .trim();
                  displayText = cleanedTemplate || field.nome;
                }

                // Garantir key única do React
                // Se campo tem ID válido: usa ID + página (estável)
                // Se não tem ID: usa página + índice + posição (único mas instável durante drag)
                const uniqueKey = field.id
                  ? `${field.id}-${currentPage}`
                  : `temp-${currentPage}-${index}-${field.posicao.x}-${field.posicao.y}`;

                return (
                  <div
                    key={uniqueKey}
                    className={cn(
                      'group absolute select-none rounded border-2 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                      hasHeightWarning && 'border-red-500 animate-pulse',
                      !hasHeightWarning && field.isSelected && 'cursor-move border-primary/80 bg-primary/10 shadow-sm',
                      !hasHeightWarning && !field.isSelected && 'cursor-pointer border-border/70 bg-yellow-100/70 hover:border-muted-foreground/80 hover:shadow-sm',
                      field.justAdded && 'animate-pulse',
                      field.isDragging && 'opacity-50',
                    )}
                    title={hasHeightWarning ? '⚠️ Texto pode não caber completamente no campo' : 'Duplo clique para editar propriedades'}
                    style={{
                      left: field.posicao.x,
                      top: field.posicao.y,
                      width: field.posicao.width,
                      height: field.posicao.height,
                    }}
                    onClick={(event) => onFieldClick(field, event)}
                    onDoubleClick={(event) => {
                      event.stopPropagation();
                      if (isRichTextField && onEditRichText) {
                        // Composite text fields open rich text editor
                        onEditRichText(field.id);
                      } else {
                        // Simple text and image fields open properties modal
                        onFieldClick(field, event); // Ensure field is selected
                        onOpenProperties();
                      }
                    }}
                    onMouseDown={(event) => onFieldMouseDown(field, event)}
                    onKeyDown={(event) => onFieldKeyboard(field, event)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Campo ${field.nome} do tipo ${typeLabel}`}
                    data-state={field.isSelected ? 'selected' : 'idle'}
                  >
                    <div className="absolute inset-0 flex items-center justify-center px-1 text-center">
                      {isRichTextField ? (
                        <span
                          className="text-xs font-medium text-foreground overflow-hidden"
                          style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            lineHeight: '1.2em',
                            maxHeight: '3.6em',
                          }}
                        >
                          {displayText}
                        </span>
                      ) : (
                        <span className="truncate text-xs font-medium text-foreground">
                          {displayText}
                        </span>
                      )}
                    </div>

                    {field.isSelected && (
                      <>
                        <Badge
                          variant="secondary"
                          className="pointer-events-none absolute -top-6 left-0 flex items-center gap-1 rounded-full px-2 py-0 text-[11px] shadow-sm"
                        >
                          {isImageField ? (
                            <Image className="h-3 w-3" aria-hidden="true" />
                          ) : isRichTextField ? (
                            <AlignLeft className="h-3 w-3" aria-hidden="true" />
                          ) : (
                            <Type className="h-3 w-3" aria-hidden="true" />
                          )}
                          {typeLabel}
                        </Badge>

                        {/* Resize Handles - com suporte a foco para acessibilidade
                            IMPORTANTE: stopPropagation previne conflito com drag do campo pai
                            A classe 'resize-handle' permite identificação no handleFieldMouseDown */}
                        {/* Corner handles */}
                        <div
                          className="resize-handle absolute -top-1.5 -left-1.5 w-3 h-3 bg-primary rounded-full cursor-nw-resize z-10 hover:scale-125 transition-transform focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
                          onMouseDown={(e) => {
                            e.stopPropagation(); // Prevenir propagação para campo pai
                            onResizeMouseDown(field, 'nw', e);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          role="button"
                          tabIndex={0}
                          aria-label="Redimensionar canto superior esquerdo (arraste com mouse)"
                        />
                        <div
                          className="resize-handle absolute -top-1.5 -right-1.5 w-3 h-3 bg-primary rounded-full cursor-ne-resize z-10 hover:scale-125 transition-transform focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
                          onMouseDown={(e) => {
                            e.stopPropagation(); // Prevenir propagação para campo pai
                            onResizeMouseDown(field, 'ne', e);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          role="button"
                          tabIndex={0}
                          aria-label="Redimensionar canto superior direito (arraste com mouse)"
                        />
                        <div
                          className="resize-handle absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-primary rounded-full cursor-sw-resize z-10 hover:scale-125 transition-transform focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
                          onMouseDown={(e) => {
                            e.stopPropagation(); // Prevenir propagação para campo pai
                            onResizeMouseDown(field, 'sw', e);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          role="button"
                          tabIndex={0}
                          aria-label="Redimensionar canto inferior esquerdo (arraste com mouse)"
                        />
                        <div
                          className="resize-handle absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-primary rounded-full cursor-se-resize z-10 hover:scale-125 transition-transform focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
                          onMouseDown={(e) => {
                            e.stopPropagation(); // Prevenir propagação para campo pai
                            onResizeMouseDown(field, 'se', e);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          role="button"
                          tabIndex={0}
                          aria-label="Redimensionar canto inferior direito (arraste com mouse)"
                        />

                        {/* Edge handles */}
                        <div
                          className="resize-handle absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary rounded-full cursor-n-resize z-10 hover:scale-125 transition-transform focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
                          onMouseDown={(e) => {
                            e.stopPropagation(); // Prevenir propagação para campo pai
                            onResizeMouseDown(field, 'n', e);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          role="button"
                          tabIndex={0}
                          aria-label="Redimensionar borda superior (arraste com mouse)"
                        />
                        <div
                          className="resize-handle absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary rounded-full cursor-s-resize z-10 hover:scale-125 transition-transform focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
                          onMouseDown={(e) => {
                            e.stopPropagation(); // Prevenir propagação para campo pai
                            onResizeMouseDown(field, 's', e);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          role="button"
                          tabIndex={0}
                          aria-label="Redimensionar borda inferior (arraste com mouse)"
                        />
                        <div
                          className="resize-handle absolute top-1/2 -translate-y-1/2 -left-1.5 w-3 h-3 bg-primary rounded-full cursor-w-resize z-10 hover:scale-125 transition-transform focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
                          onMouseDown={(e) => {
                            e.stopPropagation(); // Prevenir propagação para campo pai
                            onResizeMouseDown(field, 'w', e);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          role="button"
                          tabIndex={0}
                          aria-label="Redimensionar borda esquerda (arraste com mouse)"
                        />
                        <div
                          className="resize-handle absolute top-1/2 -translate-y-1/2 -right-1.5 w-3 h-3 bg-primary rounded-full cursor-e-resize z-10 hover:scale-125 transition-transform focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
                          onMouseDown={(e) => {
                            e.stopPropagation(); // Prevenir propagação para campo pai
                            onResizeMouseDown(field, 'e', e);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          role="button"
                          tabIndex={0}
                          aria-label="Redimensionar borda direita (arraste com mouse)"
                        />
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
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
            {selectedField.tipo === 'texto_composto' && onEditRichText && (
              <ContextMenuItem onClick={() => onEditRichText(selectedField.id)}>
                <Edit className="mr-2 h-4 w-4" />
                <span>Editar Texto Composto</span>
              </ContextMenuItem>
            )}
            {selectedField.tipo === 'texto_composto' && fieldsWithHeightWarning.has(selectedField.id) && onAdjustHeight && (
              <ContextMenuItem onClick={() => onAdjustHeight(selectedField.id)} className="text-orange-600 focus:text-orange-600">
                <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Ajustar Altura Automaticamente</span>
              </ContextMenuItem>
            )}
            <ContextMenuItem onClick={() => onDuplicateField(selectedField.id)}>
              <Copy className="mr-2 h-4 w-4" />
              <span>Duplicar Campo</span>
            </ContextMenuItem>
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
          <Image className="mr-2 h-4 w-4" aria-hidden="true" aria-label="Ícone de imagem" />
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