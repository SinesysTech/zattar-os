"use client";

import * as React from "react";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PublicStepLayout } from "../layout/PublicStepLayout";
import PdfPreviewDynamic from "../../pdf/PdfPreviewDynamic";
import { useCSPNonce } from "@/hooks/use-csp-nonce";

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
  const nonce = useCSPNonce();

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
        {/* PDF Viewer - Clean floating style */}
        <div className="relative w-full h-[65vh] sm:h-[70vh]">
          {/* Floating Toolbar */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-background/95 backdrop-blur-sm border border-border rounded-full shadow-lg px-2 py-1.5 mt-3">
            {/* Document icon */}
            <span
              className="material-symbols-outlined text-red-500 text-xl ml-1"
              aria-hidden="true"
            >
              description
            </span>

            {/* Zoom Controls */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoom <= 50}
              className="h-7 w-7 p-0 rounded-full"
              aria-label="Diminuir zoom"
            >
              <span
                className="material-symbols-outlined text-[18px]"
                aria-hidden="true"
              >
                remove
              </span>
            </Button>
            <span className="text-xs font-medium w-10 text-center text-muted-foreground">
              {zoom}%
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoom >= 200}
              className="h-7 w-7 p-0 rounded-full"
              aria-label="Aumentar zoom"
            >
              <span
                className="material-symbols-outlined text-[18px]"
                aria-hidden="true"
              >
                add
              </span>
            </Button>

            {/* Separator */}
            <div className="h-4 w-px bg-border mx-0.5" />

            {/* Download Button */}
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-7 w-7 p-0 rounded-full mr-1"
              aria-label="Baixar documento"
            >
              <a href={pdfUrl} download={documentTitle || "documento.pdf"} title="Baixar documento">
                <span
                  className="material-symbols-outlined text-lg"
                  aria-hidden="true"
                >
                  download
                </span>
              </a>
            </Button>
          </div>

          {/* PDF Scrollable Area - Clean background */}
          <div className="h-full overflow-y-auto pdf-scrollbar bg-muted/30 rounded-lg p-4 pt-16 sm:p-8 sm:pt-16 flex flex-col items-center gap-6">
            <PdfPreviewDynamic
              pdfUrl={pdfUrl}
              zoom={zoom / 100}
              showControls={false}
              showPageIndicator={false}
              onLoadSuccess={handleLoadSuccess}
              onPageChange={handlePageChange}
              className="w-full max-w-150 [&_.react-pdf__Page]:shadow-xl [&_.react-pdf__Page]:rounded-sm [&_.react-pdf__Page]:bg-white"
            />
          </div>

          {/* Page Indicator - Bottom floating pill */}
          {numPages && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-foreground/80 backdrop-blur-sm text-background px-3 py-1.5 rounded-full text-xs font-medium shadow-lg pointer-events-none z-20">
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
      <style nonce={nonce} dangerouslySetInnerHTML={{__html: `
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
      `}} />
    </PublicStepLayout>
  );
}
