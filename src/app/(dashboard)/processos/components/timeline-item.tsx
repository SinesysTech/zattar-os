/**
 * Timeline Item
 *
 * Renderiza um item individual da timeline (documento ou movimento processual).
 * Documentos têm ações (ver/download), movimentos são informativos.
 */

'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FileText, Activity, Download, ExternalLink, Lock, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import type { TimelineItemEnriquecido } from '@/backend/types/pje-trt/timeline';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TimelineItemProps {
  item: TimelineItemEnriquecido;
  index: number;
}

export function TimelineItem({ item, index }: TimelineItemProps) {
  const [isLoadingPresignedUrl, setIsLoadingPresignedUrl] = useState(false);

  const formatarDataHora = (data: string) => {
    try {
      return format(new Date(data), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return data;
    }
  };

  const isDocumento = item.documento;
  const hasBackblaze = !!item.backblaze;
  const isAssinado = item.idSignatario !== null && item.idSignatario !== undefined;

  /**
   * Gera presigned URL e abre o documento
   */
  const handleOpenDocument = async () => {
    if (!item.backblaze?.key) return;

    setIsLoadingPresignedUrl(true);
    try {
      const response = await fetch('/api/documentos/presigned-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: item.backblaze.key }),
      });

      if (!response.ok) {
        throw new Error('Erro ao gerar URL de acesso');
      }

      const { url } = await response.json();
      window.open(url, '_blank');
    } catch (error) {
      console.error('Erro ao abrir documento:', error);
      alert('Erro ao abrir documento. Tente novamente.');
    } finally {
      setIsLoadingPresignedUrl(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="relative flex gap-4"
    >
      {/* Linha vertical */}
      <div className="relative flex flex-col items-center">
        {/* Círculo do item */}
        <div
          className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
            isDocumento
              ? 'bg-blue-50 border-blue-500'
              : 'bg-gray-50 border-gray-400'
          }`}
        >
          {isDocumento ? (
            <FileText className="h-5 w-5 text-blue-600" />
          ) : (
            <Activity className="h-5 w-5 text-gray-600" />
          )}
        </div>

        {/* Linha conectando ao próximo item */}
        <div className="w-0.5 h-full min-h-[60px] bg-border" />
      </div>

      {/* Conteúdo do item */}
      <Card className="flex-1 p-4 mb-4">
        {/* Header do item */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-base">{item.titulo}</h3>
                {item.documentoSigiloso && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className="gap-1">
                          <Lock className="h-3 w-3" />
                          Sigiloso
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Documento sigiloso - visualização restrita</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {formatarDataHora(item.data)}
              </p>
            </div>

            {/* Badges de tipo e status */}
            <div className="flex flex-col gap-2 items-end">
              {isDocumento && item.tipo && (
                <Badge variant="secondary">{item.tipo}</Badge>
              )}
              {isDocumento && (
                <Badge
                  variant={isAssinado ? 'default' : 'outline'}
                  className={
                    isAssinado
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-gray-50 text-gray-600 border-gray-200'
                  }
                >
                  {isAssinado ? (
                    <CheckCircle className="h-3 w-3 mr-1" />
                  ) : (
                    <XCircle className="h-3 w-3 mr-1" />
                  )}
                  {isAssinado ? 'Assinado' : 'Não Assinado'}
                </Badge>
              )}
            </div>
          </div>

          {/* Informações adicionais */}
          <div className="text-sm text-muted-foreground space-y-1">
            {item.nomeResponsavel && (
              <p>
                <span className="font-medium">
                  {isDocumento && isAssinado ? 'Assinado por:' : 'Responsável:'}
                </span>{' '}
                {item.nomeSignatario || item.nomeResponsavel}
              </p>
            )}
            {item.instancia && (
              <p>
                <span className="font-medium">Instância:</span> {item.instancia}
              </p>
            )}
          </div>
        </div>

        {/* Ações (apenas para documentos com Backblaze) */}
        {isDocumento && (
          <div className="mt-4 flex gap-2">
            {hasBackblaze ? (
              <>
                <Button
                  size="sm"
                  variant="default"
                  className="gap-2"
                  onClick={handleOpenDocument}
                  disabled={isLoadingPresignedUrl}
                >
                  <ExternalLink className="h-4 w-4" />
                  {isLoadingPresignedUrl ? 'Carregando...' : 'Ver Documento'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2"
                  onClick={handleOpenDocument}
                  disabled={isLoadingPresignedUrl}
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </>
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Button size="sm" variant="outline" disabled>
                        Documento não disponível
                      </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {item.documentoSigiloso
                        ? 'Documento sigiloso não pode ser baixado'
                        : 'Documento não foi capturado ou enviado para o Backblaze'}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        )}
      </Card>
    </motion.div>
  );
}
