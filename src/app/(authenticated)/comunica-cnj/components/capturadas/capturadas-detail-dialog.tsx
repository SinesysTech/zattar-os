'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import { TribunalBadge } from '@/components/ui/tribunal-badge';
import { Heading, Text } from '@/components/ui/typography';
import { FileText, ExternalLink, Link2 } from 'lucide-react';
import type { ComunicacaoCNJEnriquecida } from '@/app/(authenticated)/comunica-cnj/domain';
import { PdfViewerDialog } from '../pdf-viewer-dialog';

interface CapturadasDetailDialogProps {
  comunicacao: ComunicacaoCNJEnriquecida | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Heading level="widget">{title}</Heading>
      <div className="rounded-xl border border-border/40 bg-card/60 p-4">
        {children}
      </div>
    </div>
  );
}

function Field({
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
      <div className="mt-1 text-sm text-foreground">{children}</div>
    </div>
  );
}

/**
 * Detalhe de comunicação capturada — Dialog glass centralizado.
 * Substitui o antigo painel lateral (GazetteDetailPanel), eliminando
 * o layout quebrado de 3 colunas e seguindo o padrão Glass Briefing.
 */
export function CapturadasDetailDialog({
  comunicacao,
  open,
  onOpenChange,
}: CapturadasDetailDialogProps) {
  const [hashPdf, setHashPdf] = useState<string | null>(null);

  if (!comunicacao) return null;

  const processoNumero =
    comunicacao.numeroProcessoMascara ?? comunicacao.numeroProcesso;
  const partesAutor = comunicacao.partesAutor.join(' · ');
  const partesReu = comunicacao.partesReu.join(' · ');
  const data = comunicacao.dataDisponibilizacao
    ? new Date(comunicacao.dataDisponibilizacao).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : '—';

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="glass-dialog max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Comunicação</DialogTitle>
            <DialogDescription>
              Comunicação capturada do Diário Oficial — expediente vinculado quando disponível.
            </DialogDescription>
          </DialogHeader>

          {/* Status + Badges principais */}
          <div className="flex flex-wrap items-center gap-2">
            {comunicacao.statusVinculacao === 'vinculado' && (
              <Badge variant="info">
                <Link2 className="mr-1 size-3" aria-hidden />
                Vinculado ao expediente
              </Badge>
            )}
            {comunicacao.statusVinculacao === 'orfao' && (
              <Badge variant="warning">Órfão</Badge>
            )}
            <TribunalBadge codigo={comunicacao.siglaTribunal} />
            {comunicacao.tipoComunicacao && (
              <Badge variant="outline">{comunicacao.tipoComunicacao}</Badge>
            )}
            <Text variant="micro-caption" className="tabular-nums">
              {data}
            </Text>
          </div>

          <Section title="Processo">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Número" span={2}>
                <span className="break-all font-medium tabular-nums">
                  {processoNumero}
                </span>
              </Field>
              <Field label="Classe">{comunicacao.nomeClasse || '—'}</Field>
              <Field label="Órgão">{comunicacao.nomeOrgao || '—'}</Field>
            </div>
          </Section>

          {(partesAutor || partesReu) && (
            <Section title="Partes">
              <div className="space-y-3">
                {partesAutor && (
                  <div>
                    <Text variant="meta-label" className="text-muted-foreground">
                      Polo ativo
                    </Text>
                    <p className="mt-1 text-sm text-foreground">{partesAutor}</p>
                  </div>
                )}
                {partesReu && (
                  <div>
                    <Text variant="meta-label" className="text-muted-foreground">
                      Polo passivo
                    </Text>
                    <p className="mt-1 text-sm text-foreground">{partesReu}</p>
                  </div>
                )}
              </div>
            </Section>
          )}

          {comunicacao.texto && (
            <Section title="Conteúdo">
              <div
                className="prose prose-sm max-w-none text-sm dark:prose-invert"
                dangerouslySetInnerHTML={{
                  __html: comunicacao.texto,
                }}
              />
            </Section>
          )}

          <div className="flex flex-col gap-2 border-t border-border/40 pt-4 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setHashPdf(comunicacao.hash)}
            >
              <FileText className="mr-2 size-4" aria-hidden />
              Ver Certidão
            </Button>
            {comunicacao.link && (
              <Button variant="outline" size="sm" asChild>
                <a
                  href={comunicacao.link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="mr-2 size-4" aria-hidden />
                  Abrir no PJE
                </a>
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <PdfViewerDialog
        hash={hashPdf}
        open={hashPdf !== null}
        onOpenChange={(o) => {
          if (!o) setHashPdf(null);
        }}
      />
    </>
  );
}
