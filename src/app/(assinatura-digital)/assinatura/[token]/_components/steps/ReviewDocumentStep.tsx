'use client'

import * as React from 'react'
import { useState, useCallback } from 'react'
import { Minus, Plus, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import PdfPreviewDynamic from '@/shared/assinatura-digital/components/pdf/PdfPreviewDynamic'
import { useCSPNonce } from '@/hooks/use-csp-nonce'
import { PublicStepCard, PublicStepFooter } from '@/shared/assinatura-digital'

export interface ReviewDocumentStepProps {
  pdfUrl: string
  documentTitle?: string | null
  currentStep?: number
  totalSteps?: number
  onPrevious: () => void
  onNext: () => void
  nextLabel?: string
}

export function ReviewDocumentStep({
  pdfUrl,
  documentTitle,
  onPrevious,
  onNext,
  nextLabel = 'Continuar',
}: ReviewDocumentStepProps) {
  const [numPages, setNumPages] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [zoom, setZoom] = useState(100)
  const nonce = useCSPNonce()

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + 25, 200))
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev - 25, 50))
  }, [])

  const handleLoadSuccess = useCallback((pages: number) => {
    setNumPages(pages)
  }, [])

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-0 flex-1 overflow-hidden p-4 sm:p-6 md:p-8">
        <div className="mx-auto flex h-full w-full max-w-3xl">
          <PublicStepCard
            title="Revise o documento"
            description="Role até o final para confirmar que leu todo o conteúdo."
            className="h-full"
          >
            <div className="relative flex-1 min-h-0">
              <div className="absolute top-0 left-1/2 z-20 mt-2 flex -translate-x-1/2 items-center gap-1 rounded-full border border-outline-variant/40 bg-background/95 px-2 py-1 shadow-lg backdrop-blur-sm">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleZoomOut}
                  disabled={zoom <= 50}
                  className="h-9 w-9 cursor-pointer rounded-full"
                  aria-label="Diminuir zoom"
                >
                  <Minus className="h-4 w-4" aria-hidden="true" />
                </Button>
                <span className="w-10 text-center text-xs font-medium text-muted-foreground">
                  {zoom}%
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleZoomIn}
                  disabled={zoom >= 200}
                  className="h-9 w-9 cursor-pointer rounded-full"
                  aria-label="Aumentar zoom"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                </Button>
                <div className="mx-0.5 h-4 w-px bg-outline-variant" />
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                  className="h-9 w-9 cursor-pointer rounded-full"
                  aria-label="Baixar documento"
                >
                  <a
                    href={pdfUrl}
                    download={documentTitle || 'documento.pdf'}
                    title="Baixar documento"
                  >
                    <Download className="h-4 w-4" aria-hidden="true" />
                  </a>
                </Button>
              </div>

              <div className="pdf-scrollbar flex h-full flex-col items-center gap-4 overflow-y-auto rounded-lg bg-muted/30 px-1 pb-2 pt-12 sm:px-2">
                <PdfPreviewDynamic
                  pdfUrl={pdfUrl}
                  zoom={zoom / 100}
                  showControls={false}
                  showPageIndicator={false}
                  onLoadSuccess={handleLoadSuccess}
                  onPageChange={handlePageChange}
                  className="w-full [&_.react-pdf__Page]:rounded-sm [&_.react-pdf__Page]:bg-white [&_.react-pdf__Page]:shadow-md"
                />
              </div>

              {numPages && (
                <div className="pointer-events-none absolute bottom-3 left-1/2 z-20 -translate-x-1/2 rounded-full bg-foreground/80 px-3 py-1 text-xs font-medium text-background shadow-lg backdrop-blur-sm">
                  {currentPage} / {numPages}
                </div>
              )}
            </div>

            <style
              nonce={nonce}
              dangerouslySetInnerHTML={{
                __html: `
                  .pdf-scrollbar::-webkit-scrollbar { width: 6px; }
                  .pdf-scrollbar::-webkit-scrollbar-track { background: transparent; }
                  .pdf-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(156, 163, 175, 0.5); border-radius: 20px; }
                  .pdf-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(156, 163, 175, 0.7); }
                `,
              }}
            />
          </PublicStepCard>
        </div>
      </div>
      <PublicStepFooter onPrevious={onPrevious} onNext={onNext} nextLabel={nextLabel} />
    </div>
  )
}
