"use client";

import { cn } from '@/lib/utils';
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import {
  ArrowLeft,
  Download,
  FileText,
  Calendar,
  Copy,
  ChevronDown,
  ShieldCheck,
  Users,
  Info,
  FileDown,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { DocumentoVerificacaoData } from '@/shared/assinatura-digital/types/types';
import { usePresignedPdfUrl } from '@/shared/assinatura-digital/hooks/use-presigned-pdf-url';
import { actionGetPresignedPdfUrl } from '@/shared/assinatura-digital/actions/documentos-actions';
import PdfPreviewDynamic from '@/shared/assinatura-digital/components/pdf/PdfPreviewDynamic';
import { AssinanteCard } from "./components/assinante-card";
import { Heading, Text } from '@/components/ui/typography';

// =============================================================================
// HASH DISPLAY COMPONENT
// =============================================================================

function HashDisplay({ label, hash }: { label: string; hash: string | null | undefined }) {
  if (!hash) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(hash);
    toast.success("Hash copiado!");
  };

  return (
    <div className={cn("flex items-start justify-between inline-tight group")}>
      <div className="min-w-0 flex-1">
        <Text variant="caption">{label}</Text>
        <Text variant="caption" className="font-mono break-all text-foreground/80">{hash}</Text>
      </div>
      <Button
        variant="ghost"
        size="icon" aria-label="Copiar"
        className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={handleCopy}
      >
        <Copy className="h-3 w-3" />
      </Button>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

interface DocumentoVerificacaoClientProps {
  data: DocumentoVerificacaoData;
}

function getDisplayTitle(title: string) {
  return title.replace(/\.[a-z0-9]{2,5}$/i, "");
}

function SummaryMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className={cn("rounded-lg border border-border/60 bg-muted/30 px-4 py-3")}>
      <p className={cn( "text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground")}>
        {label}
      </p>
      <p className={cn( "mt-1 text-body font-semibold text-foreground")}>{value}</p>
    </div>
  );
}

function MetadataItem({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className={cn("rounded-lg border border-border/50 bg-background px-4 py-3")}>
      <p className={cn( "text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground")}>
        {label}
      </p>
      <div
        className={mono ? "mt-1 text-body-sm font-mono text-foreground" :  "mt-1 text-body-sm font-medium text-foreground"}
      >
        {value}
      </div>
    </div>
  );
}

export function DocumentoVerificacaoClient({
  data,
}: DocumentoVerificacaoClientProps) {
  const router = useRouter();
  const [zoom, setZoom] = useState(1);
  const { presignedUrl, isLoading: isPdfLoading } = usePresignedPdfUrl(
    data.pdfUrl,
    data.uuid
  );

  // Download handlers
  const handleDownloadPdf = useCallback(
    async (url: string, filename: string) => {
      try {
        const result = await actionGetPresignedPdfUrl({ url });
        if (!result?.success || !result.data?.presignedUrl) {
          toast.error("Erro ao gerar link de download");
          return;
        }
        const link = document.createElement("a");
        link.href = result.data.presignedUrl;
        link.download = `${filename}.pdf`;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch {
        toast.error("Erro ao baixar documento");
      }
    },
    []
  );

  const handleDownloadSemManifesto = useCallback(() => {
    window.open(
      `/api/assinatura-digital/documentos/${data.uuid}/download-sem-manifesto`,
      "_blank"
    );
  }, [data.uuid]);

  const assinantesConcluidos = data.signatarios.filter(
    (s) => s.status === "concluido"
  ).length;

  const createdAtLabel = format(new Date(data.createdAt), "dd/MM/yyyy 'às' HH:mm", {
    locale: ptBR,
  });
  const displayTitle = getDisplayTitle(data.titulo);

  const handleZoomOut = useCallback(() => {
    setZoom((currentZoom) => Math.max(0.6, Number((currentZoom - 0.1).toFixed(2))));
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoom((currentZoom) => Math.min(2.2, Number((currentZoom + 0.1).toFixed(2))));
  }, []);

  return (
    <div className="flex min-h-0 flex-col lg:h-[calc(100dvh-9rem)]">
      <Card className={cn("flex min-h-0 flex-1 flex-col overflow-hidden py-0 shadow-sm")}>
        <CardHeader className={cn("border-b border-border/60 px-5 py-4 lg:px-6")}>
          <div className={cn("flex flex-col inline-default lg:flex-row lg:items-center lg:justify-between")}>
            <div className={cn("flex min-w-0 items-start inline-medium md:items-center")}>
              <Button
                variant="outline"
                size="icon" aria-label="Voltar"
                className="shrink-0 rounded-full"
                onClick={() =>
                  router.push("/app/assinatura-digital/documentos/lista")
                }
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>

              <div className="min-w-0">
                <Heading level="page" className="truncate lg:text-[2rem]">
                  {displayTitle}
                </Heading>
                <div className={cn("mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-body-sm text-muted-foreground")}>
                  <span className={cn("inline-flex items-center inline-snug")}>
                    <Calendar className="h-3.5 w-3.5" />
                    Criado em {createdAtLabel}
                  </span>
                  <span>{assinantesConcluidos}/{data.signatarios.length} assinaturas concluídas</span>
                </div>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="self-start lg:self-auto">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {data.pdfFinalUrl && (
                  <DropdownMenuItem
                    onClick={() =>
                      handleDownloadPdf(
                        data.pdfFinalUrl!,
                        `${data.titulo}-assinado`
                      )
                    }
                  >
                    <FileDown className="h-4 w-4 mr-2" />
                    PDF Assinado
                  </DropdownMenuItem>
                )}
                {data.pdfOriginalUrl && data.tipo === "documento" && (
                  <DropdownMenuItem
                    onClick={() =>
                      handleDownloadPdf(
                        data.pdfOriginalUrl!,
                        `${data.titulo}-original`
                      )
                    }
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    PDF Original
                  </DropdownMenuItem>
                )}
                {!data.pdfFinalUrl && data.pdfOriginalUrl && (
                  <DropdownMenuItem
                    onClick={() =>
                      handleDownloadPdf(
                        data.pdfOriginalUrl!,
                        data.titulo
                      )
                    }
                  >
                    <FileDown className="h-4 w-4 mr-2" />
                    {data.tipo === "formulario"
                      ? "PDF Assinado"
                      : "PDF do Documento"}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDownloadSemManifesto}>
                  <FileText className="h-4 w-4 mr-2" />
                  PDF sem Dados de Verificação
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className={cn(/* design-system-escape: p-0 → usar <Inset> */ "min-h-0 flex-1 p-0")}>
          <div className="grid h-full min-h-0 grid-cols-1 lg:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)]">
            <section className="relative min-h-0 border-b border-border/60 lg:border-b-0 lg:border-r">
              <div className={cn(/* design-system-escape: p-1 → usar <Inset> */ "absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center inline-micro rounded-full border border-border/60 bg-background/95 p-1 shadow-sm backdrop-blur")}>
                    <Button
                      variant="ghost"
                      size="icon" aria-label="Reduzir"
                      className="h-8 w-8 rounded-full"
                      onClick={handleZoomOut}
                      disabled={zoom <= 0.6}
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <div className={cn( "min-w-14 text-center text-body-sm font-medium text-foreground")}>
                      {Math.round(zoom * 100)}%
                    </div>
                    <Button
                      variant="ghost"
                      size="icon" aria-label="Ampliar"
                      className="h-8 w-8 rounded-full"
                      onClick={handleZoomIn}
                      disabled={zoom >= 2.2}
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
              </div>

              {presignedUrl ? (
                <PdfPreviewDynamic
                  pdfUrl={presignedUrl}
                  mode="default"
                  zoom={zoom}
                  onZoomChange={setZoom}
                  showControls={false}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  viewportClassName=/* design-system-escape: p-0 → usar <Inset>; pb-20 padding direcional sem Inset equiv. */ "bg-background p-0 pb-20"
                  className="h-full [&_.react-pdf__Document]:flex [&_.react-pdf__Document]:justify-center [&_.react-pdf__Page]:max-w-full [&_.react-pdf__Page]:overflow-hidden [&_.react-pdf__Page]:bg-white [&_.react-pdf__Page]:shadow-lg"
                />
              ) : isPdfLoading ? (
                <div className="flex h-full items-center justify-center">
                  <div className={cn("flex flex-col items-center inline-tight")}>
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className={cn("text-body-sm text-muted-foreground")}>
                      Carregando PDF...
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  <div className={cn("flex flex-col items-center inline-medium text-center")}>
                    <div className={cn("rounded-full border border-border/60 bg-muted/40 inset-card-compact")}>
                      <FileText className="h-8 w-8" />
                    </div>
                    <div>
                      <p className={cn( "text-body-sm font-medium text-foreground")}>
                        Visualização indisponível
                      </p>
                      <Text variant="caption">
                        O arquivo continua disponível para download no menu acima.
                      </Text>
                    </div>
                  </div>
                </div>
              )}
            </section>

            <ScrollArea
              className="h-full min-h-0"
              viewportClassName="px-5 pb-5 pt-6 lg:px-6 lg:pb-6 lg:pt-6"
            >
              <section className={cn("flex flex-col stack-default")}>
                <CardTitle className={cn("flex items-center inline-tight text-body-lg")}>
                  <Info className="h-4 w-4" />
                  Resumo de verificação
                </CardTitle>

                <div className={cn("grid grid-cols-2 inline-medium")}>
                  <SummaryMetric
                    label="Assinantes"
                    value={`${data.signatarios.length}`}
                  />
                  <SummaryMetric
                    label="Concluídos"
                    value={`${assinantesConcluidos}`}
                  />
                </div>
              </section>

              <section className={cn("flex flex-col mt-6 stack-medium")}>
                <div className={cn("flex items-center inline-tight")}>
                  <Info className="h-4 w-4 text-muted-foreground" />
                  <Heading level="section" className={cn("text-body-sm uppercase tracking-[0.14em] text-foreground/90")}>
                    Documento
                  </Heading>
                </div>

                <div className={cn("grid grid-cols-1 inline-medium sm:grid-cols-2")}>
                  <MetadataItem
                    label="Identificador"
                    value={data.protocolo || data.uuid}
                    mono
                  />
                  <MetadataItem
                    label="Criado em"
                    value={createdAtLabel}
                  />
                  {data.clienteNome && (
                    <MetadataItem label="Cliente" value={data.clienteNome} />
                  )}
                  {data.clienteCpf && (
                    <MetadataItem label="CPF" value={data.clienteCpf} mono />
                  )}
                  {data.tipo === "documento" && (
                    <MetadataItem
                      label="Selfie habilitada"
                      value={data.selfieHabilitada ? "Sim" : "Não"}
                    />
                  )}
                  <MetadataItem
                    label="Assinaturas"
                    value={`${assinantesConcluidos}/${data.signatarios.length} concluídas`}
                  />
                </div>
              </section>

              {(data.hashOriginal || data.hashFinal) && (
                <>
                  <Separator className={cn("my-6")} />
                  <section className={cn("flex flex-col stack-medium")}>
                    <div className={cn("flex items-center inline-tight")}>
                      <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                      <Heading level="section" className={cn("text-body-sm uppercase tracking-[0.14em] text-foreground/90")}>
                        Integridade
                      </Heading>
                    </div>

                    <div className={cn("flex flex-col rounded-lg border border-border/60 bg-muted/20 inset-card-compact stack-medium")}>
                      <HashDisplay
                        label="Hash Original (SHA-256)"
                        hash={data.hashOriginal}
                      />
                      {data.hashFinal && (
                        <>
                          <Separator />
                          <HashDisplay
                            label="Hash Final (SHA-256)"
                            hash={data.hashFinal}
                          />
                        </>
                      )}
                      <Text variant="caption">
                        Os hashes confirmam que o arquivo não foi alterado após a assinatura.
                        Se qualquer byte mudar, a verificação deixa de bater.
                      </Text>
                    </div>
                  </section>
                </>
              )}

              <Separator className={cn("my-6")} />

              <section className={cn("flex flex-col stack-medium")}>
                <div className={cn("flex items-center justify-between inline-medium")}>
                  <Heading level="section" className={cn("text-body-lg flex items-center inline-tight")}>
                    <Users className="h-5 w-5" />
                    Assinantes ({data.signatarios.length})
                  </Heading>
                </div>

                <div className={cn("flex flex-col stack-medium")}>
                  {data.signatarios.map((signatario, index) => (
                    <AssinanteCard
                      key={signatario.id}
                      signatario={signatario}
                      index={index}
                    />
                  ))}
                </div>
              </section>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
