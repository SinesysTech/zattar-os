'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import type { PdfPreviewProps, PdfLoadState } from '../../types/pdf-preview.types';
import { DEFAULT_ZOOM_CONFIG } from '../../types/pdf-preview.types';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configurar o worker do PDF.js (versão 5.x)
if (typeof window !== 'undefined') {
  // Usar worker local copiado para public/pdfjs/
  // Isso evita problemas de CORS e garante a versão correta
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs';
}

/**
 * Prepara o objeto file para o react-pdf Document
 * Para URLs de API locais, inclui withCredentials para enviar cookies de autenticação
 */
function prepareFileSource(url: string | undefined | null): string | { url: string; withCredentials: boolean } | null {
  // Retornar null se URL não for fornecida
  if (!url) {
    return null;
  }
  // Se for uma URL de API local, incluir credenciais
  if (url.startsWith('/api/') || url.startsWith('http://localhost') || url.startsWith('https://localhost')) {
    return { url, withCredentials: true };
  }
  // Para URLs externas (Backblaze, etc), usar string simples
  return url;
}

export default function PdfPreview({
  pdfUrl,
  initialZoom = DEFAULT_ZOOM_CONFIG.default,
  initialPage = 1,
  onZoomChange,
  onPageChange,
  onLoadSuccess,
  onLoadError,
  showControls = true,
  showPageIndicator = true,
  maxHeight = '100%',
  maxWidth = '100%',
  className = '',
  mode = 'default',
  renderTextLayer = true,
  renderAnnotationLayer = true,
  pageWidth,
  pageHeight,
}: PdfPreviewProps) {
  const [loadState, setLoadState] = useState<PdfLoadState>({
    isLoading: true,
    error: null,
    numPages: null,
    currentPageInfo: null,
  });

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [zoom, setZoom] = useState(initialZoom);

  // Preparar fonte do PDF com credenciais se for API local
  const fileSource = useMemo(() => prepareFileSource(pdfUrl), [pdfUrl]);

  // Sincronizar currentPage quando initialPage muda (necessário para modo background)
  useEffect(() => {
    setCurrentPage(initialPage);
  }, [initialPage]);

  // Callback quando PDF é carregado
  const handleLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setLoadState(prev => ({
      ...prev,
      isLoading: false,
      numPages,
      error: null,
    }));

    if (onLoadSuccess) {
      onLoadSuccess(numPages);
    }
  }, [onLoadSuccess]);

  // Callback quando ocorre erro
  const handleLoadError = useCallback((error: Error) => {
    console.error('[PDF_PREVIEW] Erro ao carregar PDF:', error);

    setLoadState(prev => ({
      ...prev,
      isLoading: false,
      error,
    }));

    if (onLoadError) {
      onLoadError(error);
    }
  }, [onLoadError]);

  // Controles de zoom
  const handleZoomIn = useCallback(() => {
    setZoom(prev => {
      const newZoom = Math.min(prev + DEFAULT_ZOOM_CONFIG.step, DEFAULT_ZOOM_CONFIG.max);
      if (onZoomChange) onZoomChange(newZoom);
      return newZoom;
    });
  }, [onZoomChange]);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => {
      const newZoom = Math.max(prev - DEFAULT_ZOOM_CONFIG.step, DEFAULT_ZOOM_CONFIG.min);
      if (onZoomChange) onZoomChange(newZoom);
      return newZoom;
    });
  }, [onZoomChange]);

  // Controles de página
  const handlePreviousPage = useCallback(() => {
    setCurrentPage(prev => {
      const newPage = Math.max(prev - 1, 1);
      if (onPageChange) onPageChange(newPage);
      return newPage;
    });
  }, [onPageChange]);

  const handleNextPage = useCallback(() => {
    setCurrentPage(prev => {
      const newPage = Math.min(prev + 1, loadState.numPages || 1);
      if (onPageChange) onPageChange(newPage);
      return newPage;
    });
  }, [loadState.numPages, onPageChange]);

  // Se não há URL, mostrar estado de espera
  if (!fileSource) {
    const emptyState = (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
        <Loader2 className="w-8 h-8 animate-spin mb-2" />
        <p className="text-sm">Aguardando URL do PDF...</p>
      </div>
    );

    if (mode === 'background') {
      return (
        <div className={`${className} pointer-events-none relative`} style={{ maxHeight, maxWidth }}>
          {emptyState}
        </div>
      );
    }

    return (
      <div className={`flex flex-col h-full ${className}`}>
        {showControls && (
          <div className="flex items-center justify-between p-2 bg-gray-100 border-b">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium min-w-[60px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button variant="outline" size="sm" disabled>
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
        <div
          className="flex-1 overflow-auto bg-gray-200 flex items-center justify-center p-4"
          style={{ maxHeight, maxWidth }}
        >
          {emptyState}
        </div>
      </div>
    );
  }

  // Background mode: render only the PDF without any layout/controls
  if (mode === 'background') {
    return (
      <div className={`${className} pointer-events-none relative`} style={{ maxHeight, maxWidth }}>
        <Document
          file={fileSource}
          onLoadSuccess={handleLoadSuccess}
          onLoadError={handleLoadError}
          loading={null}
          error={null}
        >
          <Page
            pageNumber={currentPage}
            scale={zoom}
            width={pageWidth}
            height={pageHeight}
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
        </Document>
        {/* Overlay for loading/error states */}
        {loadState.isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
            <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
          </div>
        )}
        {loadState.error && (
          <div className="absolute inset-0 flex items-center justify-center bg-white">
            <div className="text-center text-gray-600 p-4">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-amber-500" />
              <p className="text-sm font-medium text-gray-900 mb-1">Preview não disponível</p>
              <p className="text-xs text-gray-600 mb-2">
                Não foi possível carregar o PDF para visualização
              </p>
              <p className="text-xs text-gray-500 italic">
                Você ainda pode mapear campos nas coordenadas
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Default mode: full preview with controls
  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Controles */}
      {showControls && (
        <div className="flex items-center justify-between p-2 bg-gray-100 border-b">
          {/* Controles de Zoom */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoom <= DEFAULT_ZOOM_CONFIG.min}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium min-w-[60px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoom >= DEFAULT_ZOOM_CONFIG.max}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>

          {/* Controles de Página */}
          {loadState.numPages && loadState.numPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousPage}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              {showPageIndicator && (
                <span className="text-sm font-medium">
                  Página {currentPage} de {loadState.numPages}
                </span>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage >= loadState.numPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Área de Preview */}
      <div
        className="flex-1 overflow-auto bg-gray-200 flex items-center justify-center p-4 relative"
        style={{ maxHeight, maxWidth }}
      >
        <Document
          file={fileSource}
          onLoadSuccess={handleLoadSuccess}
          onLoadError={handleLoadError}
          loading={
            <div className="flex flex-col items-center gap-2 text-gray-600">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-sm">Carregando PDF...</p>
            </div>
          }
          error={
            <div className="flex flex-col items-center gap-3 p-6 max-w-md">
              <AlertCircle className="w-12 h-12 text-amber-500" />
              <div className="text-center space-y-2">
                <p className="text-base font-medium text-gray-900">Preview não disponível</p>
                <p className="text-sm text-gray-600">
                  Não foi possível carregar o arquivo PDF para visualização
                </p>
                {loadState.error?.message && (
                  <p className="text-xs text-gray-500 font-mono bg-gray-100 p-2 rounded">
                    {loadState.error.message}
                  </p>
                )}
                <p className="text-xs text-gray-500 italic mt-3">
                  💡 Você ainda pode adicionar e editar campos usando as coordenadas do painel lateral
                </p>
              </div>
            </div>
          }
        >
          <Page
            pageNumber={currentPage}
            scale={zoom}
            width={pageWidth}
            height={pageHeight}
            renderTextLayer={renderTextLayer}
            renderAnnotationLayer={renderAnnotationLayer}
            className="shadow-lg"
          />
        </Document>
      </div>
    </div>
  );
}