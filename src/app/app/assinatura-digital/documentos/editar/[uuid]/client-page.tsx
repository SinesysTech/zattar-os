"use client";

/**
 * EditarDocumentoClient - Editor de âncoras de assinatura no PDF
 *
 * Fluxo:
 * 1. Carrega documento existente
 * 2. Permite desenhar âncoras (assinatura/rubrica) no PDF
 * 3. Cada assinante tem cor diferente
 * 4. Redireciona para /revisar após salvar
 */

import * as React from "react";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  User,
  Pen,
  Stamp,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  actionGetDocumento,
  actionSetDocumentoAnchors,
  usePresignedPdfUrl,
  PdfPreviewDynamic,
} from "../../../feature";
import {
  SignatureWorkflowStepper,
} from "../../../feature/components/workflow";
import { useFormularioStore } from "../../../feature/store/formulario-store";
import { useViewport } from "@/hooks/use-viewport";

// Tipos
type AnchorType = "assinatura" | "rubrica";

type AnchorDraft = {
  key: string;
  documento_assinante_id: number;
  tipo: AnchorType;
  pagina: number;
  x_norm: number;
  y_norm: number;
  w_norm: number;
  h_norm: number;
};

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

// Cores para assinantes (inspirado no FieldMappingEditor)
const SIGNER_COLORS = [
  { bg: "bg-blue-500/20", border: "border-blue-500", text: "text-blue-700 dark:text-blue-300", ring: "ring-blue-500" },
  { bg: "bg-green-500/20", border: "border-green-500", text: "text-green-700 dark:text-green-300", ring: "ring-green-500" },
  { bg: "bg-purple-500/20", border: "border-purple-500", text: "text-purple-700 dark:text-purple-300", ring: "ring-purple-500" },
  { bg: "bg-orange-500/20", border: "border-orange-500", text: "text-orange-700 dark:text-orange-300", ring: "ring-orange-500" },
  { bg: "bg-pink-500/20", border: "border-pink-500", text: "text-pink-700 dark:text-pink-300", ring: "ring-pink-500" },
  { bg: "bg-teal-500/20", border: "border-teal-500", text: "text-teal-700 dark:text-teal-300", ring: "ring-teal-500" },
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

function normalizeRect(
  rect: { x: number; y: number; w: number; h: number },
  container: DOMRect
) {
  const x1 = Math.max(0, Math.min(rect.x, rect.x + rect.w));
  const y1 = Math.max(0, Math.min(rect.y, rect.y + rect.h));
  const x2 = Math.min(container.width, Math.max(rect.x, rect.x + rect.w));
  const y2 = Math.min(container.height, Math.max(rect.y, rect.y + rect.h));
  const w = Math.max(1, x2 - x1);
  const h = Math.max(1, y2 - y1);

  return {
    x_norm: x1 / container.width,
    y_norm: y1 / container.height,
    w_norm: w / container.width,
    h_norm: h / container.height,
  };
}

export function EditarDocumentoClient({ uuid }: { uuid: string }) {
  const router = useRouter();
  const viewport = useViewport();
  const { setEtapaAtual } = useFormularioStore();

  // Estado principal
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [documento, setDocumento] = useState<DocumentoCompleto | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // PDF URL presigned
  const { presignedUrl: pdfPresignedUrl } = usePresignedPdfUrl(documento?.pdf_original_url);

  // Estado do editor
  const [anchors, setAnchors] = useState<AnchorDraft[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(1);
  const [currentSignerId, setCurrentSignerId] = useState<number | null>(null);
  const [currentAnchorType, setCurrentAnchorType] = useState<AnchorType>("assinatura");
  const [drawRect, setDrawRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  // Refs para desenho
  const drawStartRef = useRef<{ x: number; y: number } | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Inicializar etapa do stepper como 1 (Configurar)
  useEffect(() => {
    setEtapaAtual(1);
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

        // Verificar se pode editar
        const assinantesConcluidos = doc.assinantes.filter((a) => a.status === "concluido").length;
        if (doc.status === "concluido" || (doc.status === "pronto" && assinantesConcluidos > 0)) {
          toast.error("Este documento não pode mais ser editado pois já possui assinaturas");
          router.push("/app/assinatura-digital/documentos/lista");
          return;
        }

        setDocumento(doc);

        // Carregar âncoras existentes
        const ancorasCarregadas = doc.ancoras.map((ancora, idx) => ({
          key: `existing-${ancora.id}-${idx}`,
          documento_assinante_id: ancora.documento_assinante_id,
          tipo: ancora.tipo,
          pagina: ancora.pagina,
          x_norm: ancora.x_norm,
          y_norm: ancora.y_norm,
          w_norm: ancora.w_norm,
          h_norm: ancora.h_norm,
        }));
        setAnchors(ancorasCarregadas);

        // Definir primeiro assinante como selecionado
        if (doc.assinantes.length > 0) {
          setCurrentSignerId(doc.assinantes[0].id);
        }
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

  // Salvar âncoras
  const handleSaveAnchors = useCallback(async () => {
    if (!documento) return;

    if (anchors.length === 0) {
      toast.error("Adicione pelo menos uma âncora antes de salvar");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        documento_uuid: documento.documento_uuid,
        ancoras: anchors.map((a) => ({
          documento_assinante_id: a.documento_assinante_id,
          tipo: a.tipo,
          pagina: a.pagina,
          x_norm: a.x_norm,
          y_norm: a.y_norm,
          w_norm: a.w_norm,
          h_norm: a.h_norm,
        })),
      };

      const resultado = await actionSetDocumentoAnchors(payload);

      if (!resultado.success) {
        toast.error(resultado.error || "Erro ao salvar âncoras");
        return;
      }

      toast.success("Âncoras salvas com sucesso!");
      setEtapaAtual(2);
      router.push(`/app/assinatura-digital/documentos/revisar/${documento.documento_uuid}`);
    } catch (error) {
      toast.error("Erro ao salvar âncoras");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  }, [documento, anchors, setEtapaAtual, router]);

  // Handlers de desenho
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!currentSignerId || !overlayRef.current) return;
      const rect = overlayRef.current.getBoundingClientRect();
      drawStartRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    },
    [currentSignerId]
  );

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!drawStartRef.current || !overlayRef.current) return;
    const rect = overlayRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    setDrawRect({
      x: drawStartRef.current.x,
      y: drawStartRef.current.y,
      w: currentX - drawStartRef.current.x,
      h: currentY - drawStartRef.current.y,
    });
  }, []);

  const handleMouseUp = useCallback(() => {
    if (!drawStartRef.current || !drawRect || !overlayRef.current || !currentSignerId) {
      drawStartRef.current = null;
      setDrawRect(null);
      return;
    }
    const rect = overlayRef.current.getBoundingClientRect();
    const normalized = normalizeRect(drawRect, rect);
    const key = `${currentSignerId}:${currentAnchorType}:${currentPage}:${Date.now()}`;

    setAnchors((prev) => [
      ...prev,
      {
        key,
        documento_assinante_id: currentSignerId,
        tipo: currentAnchorType,
        pagina: currentPage,
        ...normalized,
      },
    ]);

    drawStartRef.current = null;
    setDrawRect(null);
  }, [drawRect, currentSignerId, currentAnchorType, currentPage]);

  const handleRemoveAnchor = useCallback((key: string) => {
    setAnchors((prev) => prev.filter((a) => a.key !== key));
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!documento) {
    return null;
  }

  const assinantesAtivos = documento.assinantes.filter((a) => a.status === "pendente");
  const anchorsOnPage = anchors.filter((a) => a.pagina === currentPage);

  // Encontrar índice do assinante atual para cor
  const currentSignerIndex = documento.assinantes.findIndex((a) => a.id === currentSignerId);
  const currentSignerColor = currentSignerIndex >= 0 ? getSignerColor(currentSignerIndex) : null;

  // Conteúdo da sidebar
  const SidebarContent = () => (
    <div className="space-y-4">
      {/* Seção Assinantes */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <User className="h-4 w-4" />
          Assinantes
        </h3>
        <div className="space-y-2">
          {assinantesAtivos.map((assinante, idx) => {
            const color = getSignerColor(idx);
            const isSelected = currentSignerId === assinante.id;
            const anchorCount = anchors.filter((a) => a.documento_assinante_id === assinante.id).length;

            return (
              <button
                key={assinante.id}
                onClick={() => setCurrentSignerId(assinante.id)}
                className={cn(
                  "w-full p-3 rounded-lg border-2 text-left transition-all",
                  isSelected
                    ? `${color.border} ${color.bg} ${color.ring} ring-2`
                    : "border-border hover:border-muted-foreground/50"
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium",
                      color.border.replace("border-", "bg-")
                    )}
                  >
                    {getSignerName(assinante).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{getSignerName(assinante)}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {assinante.assinante_tipo.replace("_", " ")}
                    </p>
                  </div>
                  {anchorCount > 0 && (
                    <Badge variant="secondary" className="ml-auto">
                      {anchorCount}
                    </Badge>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* Seção Ferramentas */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Tipo de Âncora</h3>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={currentAnchorType === "assinatura" ? "default" : "outline"}
            onClick={() => setCurrentAnchorType("assinatura")}
            className="justify-start"
          >
            <Pen className="h-4 w-4 mr-2" />
            Assinatura
          </Button>
          <Button
            variant={currentAnchorType === "rubrica" ? "default" : "outline"}
            onClick={() => setCurrentAnchorType("rubrica")}
            className="justify-start"
          >
            <Stamp className="h-4 w-4 mr-2" />
            Rubrica
          </Button>
        </div>
        {currentSignerId && currentSignerColor && (
          <p className="text-xs text-muted-foreground">
            Clique e arraste no PDF para criar uma área de{" "}
            <span className={currentSignerColor.text}>{currentAnchorType}</span>.
          </p>
        )}
      </div>

      <Separator />

      {/* Seção Âncoras Definidas */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Âncoras Definidas ({anchors.length})</h3>
        <ScrollArea className="h-50">
          <div className="space-y-2 pr-4">
            {anchors.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Nenhuma âncora criada ainda.
              </p>
            ) : (
              anchors
                .slice()
                .reverse()
                .map((a) => {
                  const assinanteIdx = documento.assinantes.findIndex(
                    (s) => s.id === a.documento_assinante_id
                  );
                  const color = getSignerColor(assinanteIdx);
                  const assinante = documento.assinantes.find((s) => s.id === a.documento_assinante_id);

                  return (
                    <div
                      key={a.key}
                      className={cn(
                        "flex items-center justify-between p-2 rounded-md border",
                        color.bg,
                        color.border
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Badge variant="secondary" className="shrink-0">
                          {a.tipo === "assinatura" ? <Pen className="h-3 w-3" /> : <Stamp className="h-3 w-3" />}
                        </Badge>
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">
                            {assinante ? getSignerName(assinante) : `#${a.documento_assinante_id}`}
                          </p>
                          <p className="text-xs text-muted-foreground">Pág. {a.pagina}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={() => handleRemoveAnchor(a.key)}
                        aria-label={`Remover âncora de ${a.tipo} do assinante ${assinante ? getSignerName(assinante) : ''}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  );
                })
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );

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
            onClick={() => router.push("/app/assinatura-digital/documentos/lista")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-xl font-bold">Configurar Âncoras</h1>
            <p className="text-sm text-muted-foreground">
              {documento.titulo || "Documento sem título"}
            </p>
          </div>
        </div>
        <Badge variant="secondary">{documento.status}</Badge>
      </div>

      {/* Layout principal */}
      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
        {/* Sidebar desktop */}
        <Card className="hidden lg:block">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Configuração</CardTitle>
          </CardHeader>
          <CardContent>
            <SidebarContent />
          </CardContent>
        </Card>

        {/* Mobile sidebar trigger */}
        <div className="lg:hidden fixed bottom-6 right-6 z-50">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button size="lg" className="rounded-full shadow-lg">
                <Menu className="h-5 w-5 mr-2" />
                Ferramentas
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[320px]">
              <SheetHeader>
                <SheetTitle>Configuração</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <SidebarContent />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Canvas do PDF */}
        <Card>
          <CardContent className="p-0">
            <div className="relative bg-muted/30 rounded-lg overflow-hidden">
              {/* PDF com overlay */}
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

                {/* Overlay para desenho */}
                <div
                  ref={overlayRef}
                  className={cn(
                    "absolute inset-0",
                    currentSignerId ? "cursor-crosshair" : "cursor-not-allowed"
                  )}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  style={{ pointerEvents: currentSignerId ? "auto" : "none" }}
                >
                  {/* Âncoras existentes na página atual */}
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
                        key={anchor.key}
                        className={cn(
                          "absolute border-2 pointer-events-none",
                          color.bg,
                          color.border
                        )}
                        style={{
                          left: `${anchor.x_norm * 100}%`,
                          top: `${anchor.y_norm * 100}%`,
                          width: `${anchor.w_norm * 100}%`,
                          height: `${anchor.h_norm * 100}%`,
                        }}
                      >
                        <div
                          className={cn(
                            "absolute -top-6 left-0 px-2 py-0.5 rounded text-xs font-medium text-white",
                            color.border.replace("border-", "bg-")
                          )}
                        >
                          {anchor.tipo === "assinatura" ? "Assinatura" : "Rubrica"}
                          {assinante && ` - ${getSignerName(assinante).split(" ")[0]}`}
                        </div>
                      </div>
                    );
                  })}

                  {/* Retângulo sendo desenhado */}
                  {drawRect && currentSignerColor && (
                    <div
                      className={cn("absolute border-2", currentSignerColor.bg, currentSignerColor.border)}
                      style={{
                        left: Math.min(drawRect.x, drawRect.x + drawRect.w),
                        top: Math.min(drawRect.y, drawRect.y + drawRect.h),
                        width: Math.abs(drawRect.w),
                        height: Math.abs(drawRect.h),
                      }}
                    />
                  )}
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
                <span className="text-sm min-w-25 text-center">
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
          onClick={() => router.push("/app/assinatura-digital/documentos/lista")}
        >
          Cancelar
        </Button>
        <Button onClick={handleSaveAnchors} disabled={isSaving || anchors.length === 0}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              Salvar e Continuar
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
