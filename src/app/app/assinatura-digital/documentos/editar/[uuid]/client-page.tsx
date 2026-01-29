"use client";

import { useDocumentEditor } from "../../../feature/components/editor/hooks/use-document-editor";
import { PDF_CANVAS_SIZE } from "../../../feature/types/pdf-preview.types";
import EditorCanvas from "../../../feature/components/editor/components/EditorCanvas";
import FloatingSidebar from "../../../feature/components/editor/components/FloatingSidebar";
import { Loader2, FileText } from "lucide-react";

/**
 * Format relative time in Portuguese
 */
function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return '';

  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'agora mesmo';
  if (diffMins < 60) return `há ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
  if (diffHours < 24) return `há ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
  if (diffDays < 7) return `há ${diffDays} dia${diffDays > 1 ? 's' : ''}`;

  return then.toLocaleDateString('pt-BR');
}

interface EditarDocumentoClientProps {
  uuid: string;
}

export function EditarDocumentoClient({ uuid }: EditarDocumentoClientProps) {
  const { state, actions, refs } = useDocumentEditor({ uuid });

  const {
    documento,
    isLoading,
    isSaving,
    pdfUrl,
    currentPage,
    totalPages,
    fields,
    selectedField,
    zoom,
    signers,
    activeSigner,
    dragState,
  } = state;

  const {
    setCurrentPage,
    setTotalPages,
    setFields,
    handleZoomIn,
    handleZoomOut,
    handleResetZoom,
    setActiveSigner,
    handleAddSigner,
    handleDeleteSigner,
    handleUpdateSigner,
    getSignerById,
    getSignerColor,
    handleFieldClick,
    handleCanvasClick,
    handleFieldMouseDown,
    handleResizeMouseDown,
    handleFieldKeyboard,
    duplicateField,
    deleteField,
    handleCanvasDragOver,
    handleCanvasDrop,
    handleSaveAndReview
  } = actions;

  const { canvasRef } = refs;

  if (isLoading || !documento) {
    return (
      <div className="flex w-full h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Carregando documento...</span>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex overflow-hidden bg-slate-50/50 dark:bg-zinc-950">
      {/* PDF Canvas Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Document Title - Sticky */}
        <div className="flex items-center gap-3 px-6 py-2 bg-background border-b shrink-0 h-12 z-10">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <div className="flex items-baseline gap-2 overflow-hidden">
            <h1 className="text-sm font-medium text-foreground truncate max-w-[300px]" title={documento.titulo || 'Documento sem título'}>
              {documento.titulo || 'Documento sem título'}
            </h1>
            <p className="text-xs text-muted-foreground shrink-0">
              • Editado {formatRelativeTime(documento.updated_at)}
            </p>
          </div>
          {isSaving && (
            <span className="ml-auto text-xs animate-pulse font-bold text-primary">
              Salvando...
            </span>
          )}
        </div>

        {/* PDF Canvas - Scrollable */}
        <div className="flex-1 overflow-auto p-6 relative scroll-smooth scrollbar-custom mr-1">
          <div className="flex justify-center min-h-full pb-20">
            <EditorCanvas
              canvasRef={canvasRef}
              canvasSize={PDF_CANVAS_SIZE}
              zoom={zoom}
              pdfUrl={pdfUrl}
              previewKey={1}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              onLoadSuccess={setTotalPages}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onLoadError={(e: any) => console.error("Error loading PDF", e)}
              fields={fields}
              fieldsWithHeightWarning={new Set()}
              onCanvasClick={handleCanvasClick}
              onFieldClick={(f, e) => handleFieldClick(f, e, dragState.isDragging)}
              onFieldMouseDown={handleFieldMouseDown}
              onFieldKeyboard={handleFieldKeyboard}
              onResizeMouseDown={handleResizeMouseDown}
              onDragOver={handleCanvasDragOver}
              onDrop={(e) => handleCanvasDrop(e, activeSigner)}
              selectedField={selectedField}
              onOpenProperties={() => { }}
              onDuplicateField={duplicateField}
              onDeleteField={deleteField}
              onAddTextField={() => { }}
              onAddImageField={() => { }}
              onAddRichTextField={() => { }}
              onEditRichText={() => { }}
              onAdjustHeight={() => { }}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onResetZoom={handleResetZoom}
              getSignerColor={getSignerColor}
              getSignerById={getSignerById}
              signers={signers}
              onReassignField={(fId, sId) => {
                setFields(prev => prev.map(f => f.id === fId ? { ...f, signatario_id: sId } : f));
              }}
            />
          </div>
        </div>
      </div>

      {/* Right Sidebar - hidden on mobile, FloatingSidebar renders Sheet on small viewports */}
      <div className="hidden lg:block w-[340px] py-3 pr-3 shrink-0">
        <aside className="h-full bg-white dark:bg-card rounded-xl border shadow-lg flex flex-col overflow-hidden">
          <FloatingSidebar
            className="flex-1 flex flex-col"
            signers={signers}
            activeSigner={activeSigner}
            onSelectSigner={setActiveSigner}
            onAddSigner={handleAddSigner}
            onUpdateSigner={handleUpdateSigner}
            onDeleteSigner={handleDeleteSigner}
            fields={fields}
            onPaletteDragStart={() => { }}
            onPaletteDragEnd={() => { }}
            onReviewAndSend={handleSaveAndReview}
          />
        </aside>
      </div>
    </div>
  );
}
