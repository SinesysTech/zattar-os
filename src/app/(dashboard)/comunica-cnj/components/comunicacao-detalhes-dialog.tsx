'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TribunalBadge } from '@/components/ui/tribunal-badge';
import { FileText, ExternalLink } from 'lucide-react';
import { useIsMobile } from '@/app/_lib/hooks/use-mobile';
import type { ComunicacaoItem } from '@/core/comunica-cnj';

interface ComunicacaoDetalhesDialogProps {
  comunicacao: ComunicacaoItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onViewPdf: (hash: string) => void;
}

/**
 * Dialog para exibir detalhes completos de uma comunicação
 * Usa Sheet em mobile para melhor UX
 */
export function ComunicacaoDetalhesDialog({
  comunicacao,
  open,
  onOpenChange,
  onViewPdf,
}: ComunicacaoDetalhesDialogProps) {
  const isMobile = useIsMobile();

  if (!comunicacao) return null;

  // Conteúdo compartilhado entre Dialog e Sheet
  const renderContent = () => (
    <div className="space-y-6">
      {/* Processo */}
      <div>
        <h3 className="font-semibold mb-3 text-sm">Processo</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">Número:</span>
            <p className="font-mono font-medium break-all">{comunicacao.numeroProcessoComMascara}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Tribunal:</span>
            <div className="mt-1">
              <TribunalBadge codigo={comunicacao.siglaTribunal} />
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Classe:</span>
            <p>{comunicacao.nomeClasse || '-'}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Órgão:</span>
            <p>{comunicacao.nomeOrgao || '-'}</p>
          </div>
        </div>
      </div>

      {/* Comunicação */}
      <div>
        <h3 className="font-semibold mb-3 text-sm">Comunicação</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">Tipo:</span>
            <div className="mt-1">
              <Badge variant="outline">{comunicacao.tipoComunicacao}</Badge>
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Documento:</span>
            <div className="mt-1">
              <Badge variant="secondary">{comunicacao.tipoDocumento}</Badge>
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Data de Disponibilização:</span>
            <p>{comunicacao.dataDisponibilizacaoFormatada || '-'}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Meio:</span>
            <p>{comunicacao.meioCompleto || (comunicacao.meio === 'E' ? 'Edital' : 'Diário Eletrônico')}</p>
          </div>
          {comunicacao.numeroComunicacao && (
            <div>
              <span className="text-muted-foreground">Número da Comunicação:</span>
              <p>{comunicacao.numeroComunicacao}</p>
            </div>
          )}
          <div className="sm:col-span-2">
            <span className="text-muted-foreground">Hash:</span>
            <p className="font-mono text-xs break-all">{comunicacao.hash}</p>
          </div>
        </div>
      </div>

      {/* Partes */}
      <div>
        <h3 className="font-semibold mb-3 text-sm">Partes</h3>
        <div className="space-y-3 text-sm">
          {comunicacao.partesAutoras && comunicacao.partesAutoras.length > 0 && (
            <div>
              <span className="text-muted-foreground">Autor(es):</span>
              <ul className="mt-1 ml-4 list-disc">
                {comunicacao.partesAutoras.map((autor, idx) => (
                  <li key={idx}>{autor}</li>
                ))}
              </ul>
            </div>
          )}
          {comunicacao.partesReus && comunicacao.partesReus.length > 0 && (
            <div>
              <span className="text-muted-foreground">Réu(s):</span>
              <ul className="mt-1 ml-4 list-disc">
                {comunicacao.partesReus.map((reu, idx) => (
                  <li key={idx}>{reu}</li>
                ))}
              </ul>
            </div>
          )}
          {(!comunicacao.partesAutoras || comunicacao.partesAutoras.length === 0) &&
            (!comunicacao.partesReus || comunicacao.partesReus.length === 0) && (
              <p className="text-muted-foreground">Nenhuma parte identificada</p>
            )}
        </div>
      </div>

      {/* Advogados */}
      {comunicacao.advogados && comunicacao.advogados.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3 text-sm">Advogados</h3>
          <ul className="ml-4 list-disc text-sm">
            {comunicacao.advogados.map((advogado, idx) => (
              <li key={idx}>
                {advogado}
                {comunicacao.advogadosOab && comunicacao.advogadosOab[idx] && (
                  <span className="text-muted-foreground ml-1">
                    (OAB {comunicacao.advogadosOab[idx]})
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Conteúdo da comunicação */}
      {comunicacao.texto && (
        <div>
          <h3 className="font-semibold mb-3 text-sm">Conteúdo</h3>
          <div
            className="text-sm p-3 bg-muted/50 rounded-md border prose prose-sm max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: comunicacao.texto }}
          />
        </div>
      )}

      {/* Ações */}
      <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onViewPdf(comunicacao.hash)}
          className="flex-1 sm:flex-none"
        >
          <FileText className="h-4 w-4 mr-2" />
          Ver Certidão
        </Button>
        <Button variant="outline" size="sm" asChild className="flex-1 sm:flex-none">
          <a href={comunicacao.link} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-2" />
            Abrir no PJE
          </a>
        </Button>
      </div>
    </div>
  );

  // Mobile: usar Sheet
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
          <SheetHeader className="pb-4">
            <SheetTitle>Detalhes da Comunicação</SheetTitle>
            <SheetDescription>
              Informações completas sobre a comunicação processual
            </SheetDescription>
          </SheetHeader>
          {renderContent()}
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: usar Dialog
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes da Comunicação</DialogTitle>
          <DialogDescription>
            Informações completas sobre a comunicação processual
          </DialogDescription>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
