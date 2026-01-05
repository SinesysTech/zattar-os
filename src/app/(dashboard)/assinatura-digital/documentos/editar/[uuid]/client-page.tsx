"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { actionGetDocumento, actionSetDocumentoAnchors, usePresignedPdfUrl, PdfPreviewDynamic } from "@/features/assinatura-digital";

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

function normalizeRect(rect: { x: number; y: number; w: number; h: number }, container: DOMRect) {
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
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [documento, setDocumento] = useState<DocumentoCompleto | null>(null);
  const [titulo, setTitulo] = useState("");
  const [selfieHabilitada, setSelfieHabilitada] = useState(false);

  // Obter URL presigned para o PDF (necessário para buckets privados)
  const { presignedUrl: pdfPresignedUrl } = usePresignedPdfUrl(documento?.pdf_original_url);

  const [anchors, setAnchors] = useState<AnchorDraft[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(1);
  const [currentSignerId, setCurrentSignerId] = useState<number | null>(null);
  const [currentAnchorType, setCurrentAnchorType] = useState<AnchorType>("assinatura");
  const [drawRect, setDrawRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  
  const drawStartRef = React.useRef<{ x: number; y: number } | null>(null);
  const overlayRef = React.useRef<HTMLDivElement>(null);

  // Carregar dados do documento
  useEffect(() => {
    async function carregarDocumento() {
      setIsLoading(true);
      try {
        const resultado = await actionGetDocumento({ uuid });
        if (resultado?.data?.success && resultado.data.data) {
          const doc = resultado.data.data as DocumentoCompleto;
          
          // Verificar se pode editar
          const assinantesConcluidos = doc.assinantes.filter(a => a.status === "concluido").length;
          if (doc.status === "concluido" || (doc.status === "pronto" && assinantesConcluidos > 0)) {
            toast.error("Este documento não pode mais ser editado pois já possui assinaturas");
            router.push("/assinatura-digital/documentos/lista");
            return;
          }

          setDocumento(doc);
          setTitulo(doc.titulo || "");
          setSelfieHabilitada(doc.selfie_habilitada);
          
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
        } else {
          toast.error("Erro ao carregar documento");
          router.push("/assinatura-digital/documentos/lista");
        }
      } catch (error) {
        toast.error("Erro ao carregar documento");
        console.error(error);
        router.push("/assinatura-digital/documentos/lista");
      } finally {
        setIsLoading(false);
      }
    }

    carregarDocumento();
  }, [uuid, router]);

  const handleSaveAnchors = async () => {
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
      
      if (resultado?.data?.success) {
        toast.success("Âncoras salvas com sucesso! Documento está pronto para assinatura.");
        router.push("/assinatura-digital/documentos/lista");
      } else {
        toast.error(resultado?.data?.error || "Erro ao salvar âncoras");
      }
    } catch (error) {
      toast.error("Erro ao salvar âncoras");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!currentSignerId || !overlayRef.current) return;
    const rect = overlayRef.current.getBoundingClientRect();
    drawStartRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
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
  };

  const handleMouseUp = () => {
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
  };

  const handleRemoveAnchor = (key: string) => {
    setAnchors((prev) => prev.filter((a) => a.key !== key));
  };

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

  const assinantesAtivos = documento.assinantes.filter(a => a.status === "pendente");
  const anchorsOnPage = anchors.filter((a) => a.pagina === currentPage);

  return (
    <div className="space-y-4 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/assinatura-digital/documentos/lista")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Editar Documento</h1>
            <p className="text-sm text-muted-foreground">
              Configure as âncoras de assinatura no PDF
            </p>
          </div>
        </div>
        <Badge variant="secondary">{documento.status}</Badge>
      </div>

      {/* Informações do Documento */}
      <Card className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Título</Label>
            <Input value={titulo} disabled />
          </div>
          <div className="space-y-2">
            <Label>Selfie Habilitada</Label>
            <div className="flex items-center gap-2">
              <Switch checked={selfieHabilitada} disabled />
              <span className="text-sm text-muted-foreground">
                {selfieHabilitada ? "Sim" : "Não"}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Editor de Âncoras */}
      <Card className="p-6 space-y-6">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Definir Âncoras de Assinatura</h2>
          <p className="text-sm text-muted-foreground">
            Selecione um assinante, escolha o tipo (assinatura ou rubrica) e desenhe retângulos no PDF.
          </p>
        </div>

        {/* Controles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Assinante</Label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={currentSignerId ?? ""}
              onChange={(e) => setCurrentSignerId(Number(e.target.value))}
            >
              <option value="">Selecione um assinante</option>
              {assinantesAtivos.map((assinante) => (
                <option key={assinante.id} value={assinante.id}>
                  {assinante.dados_snapshot.nome_completo as string || `Assinante ${assinante.id}`} - {assinante.assinante_tipo}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Tipo de Âncora</Label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={currentAnchorType}
              onChange={(e) => setCurrentAnchorType(e.target.value as AnchorType)}
            >
              <option value="assinatura">Assinatura</option>
              <option value="rubrica">Rubrica</option>
            </select>
          </div>
        </div>

        {/* Lista de Âncoras */}
        {anchors.length > 0 && (
          <div className="space-y-2">
            <Label>Âncoras Definidas ({anchors.length})</Label>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {anchors.map((anchor) => {
                const assinante = documento.assinantes.find(a => a.id === anchor.documento_assinante_id);
                return (
                  <div key={anchor.key} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                    <span>
                      {assinante?.dados_snapshot.nome_completo as string || `Assinante ${anchor.documento_assinante_id}`} - {anchor.tipo} (Pág. {anchor.pagina})
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveAnchor(anchor.key)}
                    >
                      Remover
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PDF Preview com Desenho */}
        <div className="relative border rounded-lg overflow-hidden bg-gray-100">
          <div className="relative">
            <PdfPreviewDynamic
              pdfUrl={pdfPresignedUrl ?? undefined}
              mode="background"
              initialPage={currentPage}
              onPageChange={setCurrentPage}
              onLoadSuccess={setNumPages}
            />
            <div
              ref={overlayRef}
              className="absolute inset-0 cursor-crosshair"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              style={{ pointerEvents: currentSignerId ? "auto" : "none" }}
            >
              {/* Âncoras existentes na página atual */}
              {anchorsOnPage.map((anchor) => (
                <div
                  key={anchor.key}
                  className="absolute border-2 border-blue-500 bg-blue-500/20 pointer-events-none"
                  style={{
                    left: `${anchor.x_norm * 100}%`,
                    top: `${anchor.y_norm * 100}%`,
                    width: `${anchor.w_norm * 100}%`,
                    height: `${anchor.h_norm * 100}%`,
                  }}
                >
                  <div className="absolute -top-6 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                    {anchor.tipo}
                  </div>
                </div>
              ))}

              {/* Retângulo sendo desenhado */}
              {drawRect && (
                <div
                  className="absolute border-2 border-green-500 bg-green-500/20"
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

          {/* Controles de Página */}
          <div className="flex items-center justify-center gap-2 p-2 bg-white border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
            >
              Anterior
            </Button>
            <span className="text-sm">
              Página {currentPage} de {numPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
              disabled={currentPage >= numPages}
            >
              Próxima
            </Button>
          </div>
        </div>

        {/* Botão Salvar */}
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/assinatura-digital/documentos/lista")}
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
                <Save className="mr-2 h-4 w-4" />
                Salvar Âncoras
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}
