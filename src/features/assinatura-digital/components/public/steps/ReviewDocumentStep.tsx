"use client";

import * as React from "react";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PublicStepLayout } from "../layout/PublicStepLayout";
import PdfPreview from "../../pdf/PdfPreview";

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
  nextLabel = "Continue to Selfie",
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
      title="Review Document"
      description="Please read the document below carefully before proceeding."
      onPrevious={onPrevious}
      onNext={onNext}
      isNextDisabled={!termosAceite}
      nextLabel={nextLabel}
      previousLabel="Back"
    >
      <div className="space-y-4">
        {/* PDF Viewer Container */}
        <div className="relative w-full flex flex-col bg-slate-100 dark:bg-[#1a202c] rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm h-[65vh] sm:h-[70vh]">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-[#1e2736] border-b border-slate-200 dark:border-slate-700 z-10">
            {/* Document Title */}
            <div className="flex items-center gap-2">
              <span
                className="material-symbols-outlined text-red-500 text-[24px]"
                aria-hidden="true"
              >
                description
              </span>
              <span
                className="text-sm font-semibold truncate max-w-[150px] sm:max-w-xs text-slate-900 dark:text-white"
                title={documentTitle || "Document.pdf"}
              >
                {documentTitle || "Document.pdf"}
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
                aria-label="Zoom out"
              >
                <span
                  className="material-symbols-outlined text-[20px]"
                  aria-hidden="true"
                >
                  remove
                </span>
              </Button>
              <span className="text-xs font-medium w-12 text-center bg-slate-50 dark:bg-slate-800 py-1 rounded text-slate-700 dark:text-slate-300">
                {zoom}%
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomIn}
                disabled={zoom >= 200}
                className="h-8 w-8 p-0"
                aria-label="Zoom in"
              >
                <span
                  className="material-symbols-outlined text-[20px]"
                  aria-hidden="true"
                >
                  add
                </span>
              </Button>
              {/* Separator */}
              <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 mx-1" />
              {/* Download Button */}
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="h-8 w-8 p-0"
                aria-label="Download document"
              >
                <a href={pdfUrl} download={documentTitle || "document.pdf"} title="Download document">
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
            <PdfPreview
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
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-medium shadow-lg pointer-events-none z-20">
              Page {currentPage} of {numPages}
            </div>
          )}
        </div>

        {/* Terms Checkbox */}
        <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-900/50">
          <Checkbox
            id="termos"
            checked={termosAceite}
            onCheckedChange={(checked) => setTermosAceite(Boolean(checked))}
            className="mt-0.5"
          />
          <div className="text-sm">
            <label
              htmlFor="termos"
              className="font-medium text-slate-900 dark:text-slate-100 cursor-pointer"
            >
              I have read and agree to the terms
            </label>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
              By clicking continue, you acknowledge that you have reviewed the
              document above.
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
