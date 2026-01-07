"use client";

import * as React from "react";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PublicStepLayout } from "../layout/PublicStepLayout";
import PdfPreviewDynamic from "../../pdf/PdfPreviewDynamic";

export interface ReviewDocumentStepProps {
  pdfUrl: string;
  documentTitle?: string | null;
  onPrevious: () => void;
  onNext: () => void;
  nextLabel?: string;
}

export function ReviewDocumentStep({
  pdfUrl,
  documentTitle,
  onPrevious,
  onNext,
  nextLabel = "Continuar para Selfie",
}: ReviewDocumentStepProps) {
  const [termosAceite, setTermosAceite] = useState(false);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + 25, 200));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev - 25, 50));
  }, []);

  const handleLoadSuccess = useCallback((pages: number) => {
    setNumPages(pages);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  return (
    <PublicStepLayout
      currentStep={2}
      totalSteps={3}
      title="Revisar Documento"
      description="Por favor, leia o documento abaixo com atenção antes de prosseguir."
      onPrevious={onPrevious}
      onNext={onNext}
      isNextDisabled={!termosAceite}
      nextLabel={nextLabel}
      previousLabel="Voltar"
    >
      <div className="space-y-4">
        {/* PDF Viewer Container */}
        <div className="relative w-full flex flex-col bg-muted dark:bg-muted rounded-xl border border-border overflow-hidden shadow-sm h-[65vh] sm:h-[70vh]">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-3 bg-card dark:bg-card border-b border-border z-10">
            {/* Document Title */}
            <div className="flex items-center gap-2">
              <span
                className="material-symbols-outlined text-red-500 text-[24px]"
                aria-hidden="true"
              >
                description
              </span>
              <span
                className="text-sm font-semibold truncate max-w-[150px] sm:max-w-xs text-foreground"
                title={documentTitle || "Documento.pdf"}
              >
                {documentTitle || "Documento.pdf"}
              </span>
            </div>

            {/* Zoom Controls and Download */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomOut}
                disabled={zoom <= 50}
                className="h-8 w-8 p-0"
                aria-label="Diminuir zoom"
              >
                <span
                  className="material-symbols-outlined text-[20px]"
                  aria-hidden="true"
                >
                  remove
                </span>
              </Button>
              <span className="text-xs font-medium w-12 text-center bg-muted dark:bg-muted py-1 rounded text-muted-foreground">
                {zoom}%
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomIn}
                disabled={zoom >= 200}
                className="h-8 w-8 p-0"
                aria-label="Aumentar zoom"
              >
                <span
                  className="material-symbols-outlined text-[20px]"
                  aria-hidden="true"
                >
                  add
                </span>
              </Button>
              {/* Separator */}
              <div className="h-5 w-px bg-border mx-1" />
              {/* Download Button */}
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="h-8 w-8 p-0"
                aria-label="Baixar documento"
              >
                <a href={pdfUrl} download={documentTitle || "documento.pdf"} title="Baixar documento">
                  <span
                    className="material-symbols-outlined text-[20px]"
                    aria-hidden="true"
                  >
                    download
                  </span>
                </a>
              </Button>
            </div>
          </div>

          {/* PDF Scrollable Area */}
          <div className="flex-grow overflow-y-auto pdf-scrollbar p-4 sm:p-8 flex flex-col items-center gap-6 relative">
            <PdfPreviewDynamic
              pdfUrl={pdfUrl}
              zoom={zoom / 100}
              showControls={false}
              showPageIndicator={false}
              onLoadSuccess={handleLoadSuccess}
              onPageChange={handlePageChange}
              className="w-full max-w-[600px]"
            />
          </div>

          {/* Page Indicator */}
          {numPages && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-foreground/80 backdrop-blur-sm text-background px-3 py-1.5 rounded-full text-xs font-medium shadow-lg pointer-events-none z-20">
              Página {currentPage} de {numPages}
            </div>
          )}
        </div>

        {/* Terms Checkbox */}
        <div className="flex items-start gap-3 p-3 bg-primary/5 dark:bg-primary/10 rounded-lg border border-primary/20">
          <Checkbox
            id="termos"
            checked={termosAceite}
            onCheckedChange={(checked) => setTermosAceite(Boolean(checked))}
            className="mt-0.5"
          />
          <div className="text-sm">
            <label
              htmlFor="termos"
              className="font-medium text-foreground cursor-pointer"
            >
              Li e concordo com os termos
            </label>
            <p className="text-muted-foreground text-xs mt-0.5">
              Ao clicar em continuar, você confirma que revisou o documento
              acima.
            </p>
          </div>
        </div>
      </div>

      {/* Custom scrollbar styles */}
      <style jsx global>{`
        .pdf-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .pdf-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .pdf-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(156, 163, 175, 0.5);
          border-radius: 20px;
        }
        .pdf-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(156, 163, 175, 0.7);
        }
      `}</style>
    </PublicStepLayout>
  );
}
