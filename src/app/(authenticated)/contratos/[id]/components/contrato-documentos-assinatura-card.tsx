'use client';

import { cn } from '@/lib/utils';
import * as React from 'react';
import {
  FileSignature,
  FileText,
  Download,
  Copy,
  ExternalLink,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  DetailSection,
  DetailSectionCard,
} from '@/components/shared/detail-section';
import { Button } from '@/components/ui/button';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import {
  actionListarDocumentosAssinaturaDoContrato,
  actionGetPresignedPdfUrl,
} from '@/shared/assinatura-digital/actions/documentos-actions';
import type {
  DocumentoAssinaturaDoContrato,
  PacoteAtivoResumo,
} from '@/shared/assinatura-digital/services/documentos-do-contrato.service';

interface ContratoDocumentosAssinaturaCardProps {
  contratoId: number;
  initialDocumentos: DocumentoAssinaturaDoContrato[];
  initialPacoteAtivo: PacoteAtivoResumo | null;
}

const STATUS_LABELS: Record<DocumentoAssinaturaDoContrato['status'], string> = {
  rascunho: 'Rascunho',
  pronto: 'Pronto para assinar',
  enviado: 'Aguardando assinatura',
  concluido: 'Assinado',
  cancelado: 'Cancelado',
  expirado: 'Expirado',
};

function formatDateTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function diasAteExpiracao(iso: string): number {
  const diff = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function ContratoDocumentosAssinaturaCard({
  contratoId,
  initialDocumentos,
  initialPacoteAtivo,
}: ContratoDocumentosAssinaturaCardProps) {
  const [documentos, setDocumentos] =
    React.useState<DocumentoAssinaturaDoContrato[]>(initialDocumentos);
  const [pacote, setPacote] = React.useState<PacoteAtivoResumo | null>(
    initialPacoteAtivo,
  );
  const [refreshing, setRefreshing] = React.useState(false);
  const [downloadingId, setDownloadingId] = React.useState<number | null>(null);

  const handleRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await actionListarDocumentosAssinaturaDoContrato({ contratoId });
      if (res.success && res.data) {
        setDocumentos(res.data.documentos);
        setPacote(res.data.pacoteAtivo);
      } else {
        toast.error(res.message ?? 'Falha ao atualizar lista');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar');
    } finally {
      setRefreshing(false);
    }
  }, [contratoId]);

  const handleCopyLink = React.useCallback(async () => {
    if (!pacote) return;
    const url =
      typeof window !== 'undefined'
        ? new URL(`/assinatura-pacote/${pacote.token}`, window.location.origin).toString()
        : `/assinatura-pacote/${pacote.token}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copiado para a área de transferência');
    } catch {
      toast.error('Não foi possível copiar o link');
    }
  }, [pacote]);

  const handleDownload = React.useCallback(
    async (doc: DocumentoAssinaturaDoContrato) => {
      const sourceUrl = doc.pdf_final_url ?? doc.pdf_original_url;
      if (!sourceUrl) {
        toast.error('PDF ainda não disponível');
        return;
      }
      setDownloadingId(doc.id);
      try {
        const res = await actionGetPresignedPdfUrl({ url: sourceUrl });
        if (!res.success || !res.data) {
          toast.error(res.message ?? 'Falha ao gerar link de download');
          return;
        }
        if (typeof window !== 'undefined') {
          window.open(res.data.presignedUrl, '_blank', 'noopener,noreferrer');
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erro no download');
      } finally {
        setDownloadingId(null);
      }
    },
    [],
  );

  const totalAssinados = documentos.filter((d) => d.status === 'concluido').length;
  const totalPendentes = documentos.filter(
    (d) => d.status === 'enviado' || d.status === 'pronto',
  ).length;

  return (
    <DetailSection
      icon={FileSignature}
      label="Documentos para assinatura"
      action={
        <div className={cn("flex items-center inline-snug")}>
          {pacote ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className={cn(/* design-system-escape: px-2.5 padding direcional sem Inset equiv.; */ "flex h-7 px-2.5 rounded-lg text-[11.5px] font-medium inline-snug")}
              >
                <Copy className="size-3" />
                Copiar link
              </Button>
              <span className="text-[10.5px] text-muted-foreground">
                expira em {diasAteExpiracao(pacote.expira_em)}d
              </span>
            </>
          ) : null}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className={cn(/* design-system-escape: px-2 padding direcional sem Inset equiv.; */ "flex h-7 px-2 rounded-lg text-[11.5px] font-medium inline-snug")}
          >
            <RefreshCw className={`size-3 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      }
    >
      <DetailSectionCard>
        {documentos.length === 0 ? (
          <div className={cn("flex flex-col items-center justify-center py-8 text-center")}>
            <div className="inline-flex size-10 items-center justify-center rounded-xl bg-muted/40 text-muted-foreground mb-2">
              <FileSignature className="size-4" aria-hidden="true" />
            </div>
            <p className="text-[12.5px] text-muted-foreground">
              Nenhum documento enviado para assinatura ainda.
            </p>
            <p className="text-[11px] text-muted-foreground/70 mt-0.5">
              Use o botão &quot;Enviar para assinar&quot; acima para gerar o link público.
            </p>
          </div>
        ) : (
          <div className={cn("flex flex-col stack-tight")}>
            <div className={cn("flex items-center inline-medium px-1 pb-1")}>
              <p className="text-[11px] text-muted-foreground">
                <span className={cn( "font-medium text-foreground")}>{totalAssinados}</span>{' '}
                assinado{totalAssinados === 1 ? '' : 's'}
                {totalPendentes > 0 ? (
                  <>
                    {' · '}
                    <span className={cn( "font-medium text-foreground")}>{totalPendentes}</span>{' '}
                    pendente{totalPendentes === 1 ? '' : 's'}
                  </>
                ) : null}
              </p>
            </div>
            {documentos.map((doc) => (
              <DocumentoRow
                key={doc.id}
                doc={doc}
                downloading={downloadingId === doc.id}
                onDownload={() => handleDownload(doc)}
              />
            ))}
          </div>
        )}
      </DetailSectionCard>
    </DetailSection>
  );
}

interface DocumentoRowProps {
  doc: DocumentoAssinaturaDoContrato;
  downloading: boolean;
  onDownload: () => void;
}

function DocumentoRow({ doc, downloading, onDownload }: DocumentoRowProps) {
  const isAssinado = doc.status === 'concluido';
  const isPendente = doc.status === 'enviado' || doc.status === 'pronto';
  const isProblema = doc.status === 'cancelado' || doc.status === 'expirado';

  const statusIcon = isAssinado ? (
    <CheckCircle2 className="size-3.5 text-success" aria-hidden="true" />
  ) : isProblema ? (
    <AlertTriangle className="size-3.5 text-warning" aria-hidden="true" />
  ) : isPendente ? (
    <Clock className="size-3.5 text-info" aria-hidden="true" />
  ) : (
    <FileText className="size-3.5 text-muted-foreground" aria-hidden="true" />
  );

  const subtitle = isAssinado
    ? `Assinado em ${formatDateTime(doc.assinado_em ?? doc.criado_em)}`
    : `Enviado em ${formatDate(doc.criado_em)}`;

  const podeBaixar = doc.pdf_final_url !== null || doc.pdf_original_url !== null;

  return (
    <div className={cn("flex items-center inline-medium px-3 py-2.5 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors")}>
      <div className="inline-flex size-8 items-center justify-center rounded-[10px] bg-background shrink-0">
        {statusIcon}
      </div>
      <div className="flex-1 min-w-0">
        <div className={cn("flex items-center inline-tight min-w-0")}>
          <p className={cn( "text-[12.5px] font-medium text-foreground truncate")}>
            {doc.titulo}
          </p>
          <SemanticBadge
            category="document_signature_status"
            value={doc.status}
            className={cn("text-[10px] py-0 px-1.5 h-4 shrink-0")}
          >
            {STATUS_LABELS[doc.status]}
          </SemanticBadge>
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>
        {doc.assinantes.length > 0 ? (
          <p className="text-[10.5px] text-muted-foreground/80 mt-0.5 truncate">
            {doc.assinantes
              .map(
                (a) =>
                  `${a.nome}${a.concluido ? ' ✓' : ''}`,
              )
              .join(' · ')}
          </p>
        ) : null}
      </div>
      <div className={cn("flex items-center inline-micro shrink-0")}>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDownload}
          disabled={!podeBaixar || downloading}
          title={isAssinado ? 'Baixar PDF assinado' : 'Baixar PDF original'}
          className={cn(/* design-system-escape: px-2 padding direcional sem Inset equiv.; */ "flex h-7 px-2 rounded-lg text-[11px] font-medium inline-snug")}
        >
          <Download className={`size-3 ${downloading ? 'animate-pulse' : ''}`} />
          {downloading ? 'Abrindo…' : 'Baixar'}
        </Button>
        {!isAssinado && doc.assinantes[0]?.token ? (
          <Button
            variant="ghost"
            size="sm"
            asChild
            title="Abrir link de assinatura"
            className={cn("h-7 w-7 px-0 rounded-lg")}
          >
            <a
              href={`/assinatura/${doc.assinantes[0].token}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="size-3" />
            </a>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
