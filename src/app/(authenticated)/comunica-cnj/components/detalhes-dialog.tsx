'use client';

import { cn } from '@/lib/utils';
import DOMPurify from 'dompurify';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import { Button } from '@/components/ui/button';
import { TribunalBadge } from '@/components/ui/tribunal-badge';
import { Heading, Text } from '@/components/ui/typography';
import { FileText, ExternalLink } from 'lucide-react';
import type { ComunicacaoItem } from '../domain';

interface ComunicacaoDetalhesDialogProps {
  comunicacao: ComunicacaoItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onViewPdf: (hash: string) => void;
}

function DetailRow({
  label,
  children,
  span = 1,
}: {
  label: string;
  children: React.ReactNode;
  span?: 1 | 2;
}) {
  return (
    <div className={span === 2 ? 'sm:col-span-2' : undefined}>
      <Text variant="meta-label" className="text-muted-foreground">
        {label}
      </Text>
      <div className={cn(/* design-system-escape: text-sm → migrar para <Text variant="body-sm"> */ "mt-1 text-sm text-foreground")}>{children}</div>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <Heading level="widget" className="mb-3">
      {children}
    </Heading>
  );
}

/**
 * Dialog para exibir detalhes completos de uma comunicação.
 * Usa Dialog com `` — sem variação mobile separada
 * (padrão do design system Glass Briefing).
 */
export function ComunicacaoDetalhesDialog({
  comunicacao,
  open,
  onOpenChange,
  onViewPdf,
}: ComunicacaoDetalhesDialogProps) {
  if (!comunicacao) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className=" max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes da Comunicação</DialogTitle>
          <DialogDescription>
            Informações completas sobre a comunicação processual
          </DialogDescription>
        </DialogHeader>

        <div className={cn(/* design-system-escape: space-y-6 → migrar para <Stack gap="loose"> */ "space-y-6")}>
          {/* Processo */}
          <div>
            <SectionHeading>Processo</SectionHeading>
            <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ "grid grid-cols-1 gap-3 sm:grid-cols-2")}>
              <DetailRow label="Número">
                <span className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "break-all font-medium tabular-nums")}>
                  {comunicacao.numeroProcessoComMascara}
                </span>
              </DetailRow>
              <DetailRow label="Tribunal">
                <TribunalBadge codigo={comunicacao.siglaTribunal} />
              </DetailRow>
              <DetailRow label="Classe">{comunicacao.nomeClasse || '—'}</DetailRow>
              <DetailRow label="Órgão">{comunicacao.nomeOrgao || '—'}</DetailRow>
            </div>
          </div>

          {/* Comunicação */}
          <div>
            <SectionHeading>Comunicação</SectionHeading>
            <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ "grid grid-cols-1 gap-3 sm:grid-cols-2")}>
              <DetailRow label="Tipo">
                <Badge variant="outline">{comunicacao.tipoComunicacao}</Badge>
              </DetailRow>
              <DetailRow label="Documento">
                <Badge variant="secondary">{comunicacao.tipoDocumento}</Badge>
              </DetailRow>
              <DetailRow label="Data de disponibilização">
                {comunicacao.dataDisponibilizacaoFormatada || '—'}
              </DetailRow>
              <DetailRow label="Meio">
                {comunicacao.meioCompleto ||
                  (comunicacao.meio === 'E' ? 'Edital' : 'Diário Eletrônico')}
              </DetailRow>
              {comunicacao.numeroComunicacao && (
                <DetailRow label="Número da comunicação">
                  {comunicacao.numeroComunicacao}
                </DetailRow>
              )}
              <DetailRow label="Hash" span={2}>
                <span className={cn(/* design-system-escape: text-xs → migrar para <Text variant="caption"> */ "break-all text-xs tabular-nums text-muted-foreground")}>
                  {comunicacao.hash}
                </span>
              </DetailRow>
            </div>
          </div>

          {/* Partes */}
          <div>
            <SectionHeading>Partes</SectionHeading>
            <div className={cn(/* design-system-escape: space-y-3 sem token DS; text-sm → migrar para <Text variant="body-sm"> */ "space-y-3 text-sm")}>
              {comunicacao.partesAutoras && comunicacao.partesAutoras.length > 0 && (
                <div>
                  <Text variant="meta-label" className="text-muted-foreground">
                    Autor(es)
                  </Text>
                  <ul className="ml-4 mt-1 list-disc">
                    {comunicacao.partesAutoras.map((autor, idx) => (
                      <li key={idx}>{autor}</li>
                    ))}
                  </ul>
                </div>
              )}
              {comunicacao.partesReus && comunicacao.partesReus.length > 0 && (
                <div>
                  <Text variant="meta-label" className="text-muted-foreground">
                    Réu(s)
                  </Text>
                  <ul className="ml-4 mt-1 list-disc">
                    {comunicacao.partesReus.map((reu, idx) => (
                      <li key={idx}>{reu}</li>
                    ))}
                  </ul>
                </div>
              )}
              {(!comunicacao.partesAutoras || comunicacao.partesAutoras.length === 0) &&
                (!comunicacao.partesReus || comunicacao.partesReus.length === 0) && (
                  <Text variant="caption" className="text-muted-foreground">
                    Nenhuma parte identificada
                  </Text>
                )}
            </div>
          </div>

          {/* Advogados */}
          {comunicacao.advogados && comunicacao.advogados.length > 0 && (
            <div>
              <SectionHeading>Advogados</SectionHeading>
              <ul className={cn(/* design-system-escape: text-sm → migrar para <Text variant="body-sm"> */ "ml-4 list-disc text-sm")}>
                {comunicacao.advogados.map((advogado, idx) => (
                  <li key={idx}>
                    {advogado}
                    {comunicacao.advogadosOab && comunicacao.advogadosOab[idx] && (
                      <span className="ml-1 text-muted-foreground">
                        (OAB {comunicacao.advogadosOab[idx]})
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Conteúdo da comunicação - sanitizado com DOMPurify */}
          {comunicacao.texto && (
            <div>
              <SectionHeading>Conteúdo</SectionHeading>
              <div
                className={cn(/* design-system-escape: p-3 → usar <Inset>; text-sm → migrar para <Text variant="body-sm"> */ "prose prose-sm max-w-none rounded-md border border-border/40 bg-muted/40 p-3 text-sm dark:prose-invert")}
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(comunicacao.texto) }}
              />
            </div>
          )}

          {/* Ações */}
          <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight">; pt-4 padding direcional sem Inset equiv. */ "flex flex-col gap-2 border-t border-border/40 pt-4 sm:flex-row")}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewPdf(comunicacao.hash)}
              className="flex-1 sm:flex-none"
            >
              <FileText className="mr-2 size-4" aria-hidden />
              Ver Certidão
            </Button>
            {comunicacao.link && (
              <Button variant="outline" size="sm" asChild className="flex-1 sm:flex-none">
                <a href={comunicacao.link} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 size-4" aria-hidden />
                  Abrir no PJE
                </a>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
