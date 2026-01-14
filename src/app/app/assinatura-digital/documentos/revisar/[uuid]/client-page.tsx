"use client";

/**
 * RevisarDocumentoClient - Página de revisão final do documento
 *
 * Fluxo:
 * 1. Mostra resumo do documento e assinantes
 * 2. Preview do PDF com âncoras (read-only)
 * 3. Links de assinatura para compartilhar
 * 4. Botão para finalizar e voltar à lista
 */

import * as React from "react";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Copy,
  FileText,
  Users,
  Loader2,
  ExternalLink,
  Pen,
  Stamp,
  ChevronLeft,
  ChevronRight,
  Camera,
  Link as LinkIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  actionGetDocumento,
  usePresignedPdfUrl,
  PdfPreviewDynamic,
} from "../../../feature";
import {
  SignatureWorkflowStepper,
} from "../../../feature/components/workflow";
import { useFormularioStore } from "../../../feature/store/formulario-store";

// Tipos
interface DocumentoCompleto {
  id: number;
  documento_uuid: string;
  titulo: string | null;
  status: string;
  selfie_habilitada: boolean;
  pdf_original_url: string;
  assinantes: Array<{
    id: number;
    assinante_tipo: string;
    dados_snapshot: Record<string, unknown>;
    token: string;
    public_link: string;
    status: "pendente" | "concluido";
  }>;
  ancoras: Array<{
    id: number;
    documento_assinante_id: number;
    tipo: "assinatura" | "rubrica";
    pagina: number;
    x_norm: number;
    y_norm: number;
    w_norm: number;
    h_norm: number;
  }>;
}

// Cores para assinantes (mesmas do editor)
const SIGNER_COLORS = [
  { bg: "bg-blue-500/20", border: "border-blue-500", text: "text-blue-700" },
  { bg: "bg-green-500/20", border: "border-green-500", text: "text-green-700" },
  { bg: "bg-purple-500/20", border: "border-purple-500", text: "text-purple-700" },
  { bg: "bg-orange-500/20", border: "border-orange-500", text: "text-orange-700" },
  { bg: "bg-pink-500/20", border: "border-pink-500", text: "text-pink-700" },
  { bg: "bg-teal-500/20", border: "border-teal-500", text: "text-teal-700" },
];

function getSignerColor(index: number) {
  return SIGNER_COLORS[index % SIGNER_COLORS.length];
}

function getSignerName(assinante: DocumentoCompleto["assinantes"][0]): string {
  const nome = assinante.dados_snapshot?.nome_completo as string | undefined;
  if (nome) return nome;

  const tipoLabels: Record<string, string> = {
    cliente: "Cliente",
    parte_contraria: "Parte Contrária",
    representante: "Representante",
    terceiro: "Terceiro",
    usuario: "Usuário",
    convidado: "Convidado",
  };

  return tipoLabels[assinante.assinante_tipo] || `Assinante ${assinante.id}`;
}

export function RevisarDocumentoClient({ uuid }: { uuid: string }) {
  const router = useRouter();
  const { setEtapaAtual } = useFormularioStore();

  // Estado
  const [isLoading, setIsLoading] = useState(true);
  const [documento, setDocumento] = useState<DocumentoCompleto | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(1);

  // PDF URL presigned
  const { presignedUrl: pdfPresignedUrl } = usePresignedPdfUrl(documento?.pdf_original_url);

  // Inicializar etapa do stepper como 2 (Revisar)
  useEffect(() => {
    setEtapaAtual(2);
  }, [setEtapaAtual]);

  // Carregar documento
  useEffect(() => {
    async function carregarDocumento() {
      setIsLoading(true);
      try {
        const resultado = await actionGetDocumento({ uuid });

        if (!resultado.success) {
          toast.error(resultado.error || "Erro ao carregar documento");
          router.push("/app/assinatura-digital/documentos/lista");
          return;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const docData = resultado.data as any;
        if (!docData?.documento) {
          toast.error("Documento não encontrado");
          router.push("/app/assinatura-digital/documentos/lista");
          return;
        }

        const doc: DocumentoCompleto = {
          id: docData.documento.id,
          documento_uuid: docData.documento.documento_uuid,
          titulo: docData.documento.titulo,
          status: docData.documento.status,
          selfie_habilitada: docData.documento.selfie_habilitada,
          pdf_original_url: docData.documento.pdf_original_url,
          assinantes: docData.assinantes,
          ancoras: docData.ancoras,
        };

        setDocumento(doc);
      } catch (error) {
        toast.error("Erro ao carregar documento");
        console.error(error);
        router.push("/app/assinatura-digital/documentos/lista");
      } finally {
        setIsLoading(false);
      }
    }

    carregarDocumento();
  }, [uuid, router]);

  // Copiar link individual
  const handleCopyLink = useCallback(async (assinante: DocumentoCompleto["assinantes"][0]) => {
    try {
      const fullUrl = `${window.location.origin}${assinante.public_link}`;
      await navigator.clipboard.writeText(fullUrl);
      toast.success(`Link copiado para ${getSignerName(assinante)}`);
    } catch {
      toast.error("Erro ao copiar link");
    }
  }, []);

  // Copiar todos os links
  const handleCopyAllLinks = useCallback(async () => {
    if (!documento) return;

    try {
      const linksList = documento.assinantes
        .map((a) => {
          const nome = getSignerName(a);
          const fullUrl = `${window.location.origin}${a.public_link}`;
          return `${nome}: ${fullUrl}`;
        })
        .join("\n\n");

      await navigator.clipboard.writeText(linksList);
      toast.success("Todos os links foram copiados!");
    } catch {
      toast.error("Erro ao copiar links");
    }
  }, [documento]);

  // Finalizar e voltar à lista
  const handleFinalize = useCallback(() => {
    toast.success("Documento pronto para assinatura! Os links foram gerados.");
    router.push("/app/assinatura-digital/documentos/lista");
  }, [router]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!documento) {
    return null;
  }

  const anchorsOnPage = documento.ancoras.filter((a) => a.pagina === currentPage);
  const assinantesPendentes = documento.assinantes.filter((a) => a.status === "pendente").length;
  const assinantesConcluidos = documento.assinantes.filter((a) => a.status === "concluido").length;

  return (
    <div className="space-y-6">
      {/* Stepper de progresso */}
      <SignatureWorkflowStepper />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/app/assinatura-digital/documentos/editar/${uuid}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Edição
          </Button>
          <div>
            <h1 className="text-xl font-bold">Revisar Documento</h1>
            <p className="text-sm text-muted-foreground">
              Confira as configurações antes de compartilhar os links
            </p>
          </div>
        </div>
        <Badge
          variant={documento.status === "pronto" ? "default" : "secondary"}
        >
          {documento.status}
        </Badge>
      </div>

      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coluna esquerda - Informações */}
        <div className="space-y-6">
          {/* Card de informações */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4" />
                Informações do Documento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Título</p>
                  <p className="font-medium">{documento.titulo || "Sem título"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant="outline" className="mt-1">
                    {documento.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Selfie de Verificação</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Camera className="h-4 w-4" />
                    <span>{documento.selfie_habilitada ? "Habilitada" : "Desabilitada"}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Âncoras Definidas</p>
                  <p className="font-medium">{documento.ancoras.length}</p>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="text-sm font-medium">Assinantes</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{assinantesPendentes} pendentes</Badge>
                  {assinantesConcluidos > 0 && (
                    <Badge variant="default" className="bg-green-600">
                      {assinantesConcluidos} concluídos
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card de links */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <LinkIcon className="h-4 w-4" />
                  Links de Assinatura
                </CardTitle>
                <Button variant="outline" size="sm" onClick={handleCopyAllLinks}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar Todos
                </Button>
              </div>
              <CardDescription>
                Compartilhe os links com cada assinante para que possam assinar o documento.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {documento.assinantes.map((assinante, idx) => {
                const color = getSignerColor(idx);
                const isConcluido = assinante.status === "concluido";

                return (
                  <div
                    key={assinante.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border",
                      isConcluido ? "bg-green-50 border-green-200" : color.bg,
                      isConcluido ? "border-green-300" : color.border
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0",
                          isConcluido ? "bg-green-500" : color.border.replace("border-", "bg-")
                        )}
                      >
                        {isConcluido ? (
                          <Check className="h-5 w-5" />
                        ) : (
                          getSignerName(assinante).charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{getSignerName(assinante)}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {assinante.assinante_tipo.replace("_", " ")}
                          {isConcluido && " • Assinado"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyLink(assinante)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                      >
                        <a
                          href={assinante.public_link}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Coluna direita - Preview PDF */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Preview do Documento</CardTitle>
            <CardDescription>
              Visualização do PDF com as áreas de assinatura definidas.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="relative bg-muted/30 rounded-b-lg overflow-hidden">
              {/* PDF com âncoras (read-only) */}
              <div className="relative">
                <PdfPreviewDynamic
                  pdfUrl={pdfPresignedUrl ?? undefined}
                  mode="background"
                  initialPage={currentPage}
                  onPageChange={setCurrentPage}
                  onLoadSuccess={setNumPages}
                  showControls={false}
                  showPageIndicator={false}
                />

                {/* Âncoras sobrepostas (read-only) */}
                <div className="absolute inset-0 pointer-events-none">
                  {anchorsOnPage.map((anchor) => {
                    const assinanteIdx = documento.assinantes.findIndex(
                      (s) => s.id === anchor.documento_assinante_id
                    );
                    const color = getSignerColor(assinanteIdx);
                    const assinante = documento.assinantes.find(
                      (s) => s.id === anchor.documento_assinante_id
                    );

                    return (
                      <div
                        key={anchor.id}
                        className={cn("absolute border-2", color.bg, color.border)}
                        style={{
                          left: `${anchor.x_norm * 100}%`,
                          top: `${anchor.y_norm * 100}%`,
                          width: `${anchor.w_norm * 100}%`,
                          height: `${anchor.h_norm * 100}%`,
                        }}
                      >
                        <div
                          className={cn(
                            "absolute -top-6 left-0 px-2 py-0.5 rounded text-xs font-medium text-white flex items-center gap-1",
                            color.border.replace("border-", "bg-")
                          )}
                        >
                          {anchor.tipo === "assinatura" ? (
                            <Pen className="h-3 w-3" />
                          ) : (
                            <Stamp className="h-3 w-3" />
                          )}
                          {assinante && getSignerName(assinante).split(" ")[0]}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Controles de página */}
              <div className="flex items-center justify-center gap-3 p-3 bg-background border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm min-w-[100px] text-center">
                  Página {currentPage} de {numPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
                  disabled={currentPage >= numPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Botões de ação */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => router.push(`/app/assinatura-digital/documentos/editar/${uuid}`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Edição
        </Button>
        <Button onClick={handleFinalize}>
          <Check className="mr-2 h-4 w-4" />
          Finalizar e Voltar à Lista
        </Button>
      </div>
    </div>
  );
}
