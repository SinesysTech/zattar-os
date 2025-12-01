"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

type PreviewResponse = { success?: boolean; data?: { pdf_url: string }; error?: string };
type FinalizeResponse = { success?: boolean; data?: { assinatura_id: number; protocolo: string; pdf_url: string }; error?: string };

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function AssinaturaPage() {
  const [clienteId, setClienteId] = useState("");
  const [acaoId, setAcaoId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [segmentoId, setSegmentoId] = useState("");
  const [formularioId, setFormularioId] = useState("");
  const [fotoBase64, setFotoBase64] = useState<string | null>(null);
  const [assinaturaBase64, setAssinaturaBase64] = useState<string | null>(null);
  const [useGeo, setUseGeo] = useState(false);
  const [geo, setGeo] = useState<{ lat?: string; lng?: string; acc?: string; ts?: string }>({});
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [finalizeResult, setFinalizeResult] = useState<{ protocolo: string; pdf_url: string } | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingFinalize, setLoadingFinalize] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePreview() {
    setLoadingPreview(true);
    setError(null);
    setPreviewUrl(null);
    try {
      const body = {
        cliente_id: Number(clienteId),
        acao_id: acaoId ? Number(acaoId) : undefined,
        template_id: templateId,
        foto_base64: fotoBase64 ?? undefined,
      };
      const res = await fetch("/api/formsign-signature/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json: PreviewResponse = await res.json();
      if (!res.ok || json.error || !json.data?.pdf_url) {
        throw new Error(json.error || "Erro ao gerar preview");
      }
      setPreviewUrl(json.data.pdf_url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoadingPreview(false);
    }
  }

  async function handleFinalize() {
    setLoadingFinalize(true);
    setError(null);
    setFinalizeResult(null);
    try {
      if (!assinaturaBase64) throw new Error("Assinatura (imagem) é obrigatória");
      const body = {
        cliente_id: Number(clienteId),
        acao_id: acaoId ? Number(acaoId) : undefined,
        template_id: templateId,
        segmento_id: Number(segmentoId),
        formulario_id: Number(formularioId),
        assinatura_base64: assinaturaBase64,
        foto_base64: fotoBase64 ?? undefined,
        latitude: useGeo && geo.lat ? Number(geo.lat) : undefined,
        longitude: useGeo && geo.lng ? Number(geo.lng) : undefined,
        geolocation_accuracy: useGeo && geo.acc ? Number(geo.acc) : undefined,
        geolocation_timestamp: useGeo && geo.ts ? geo.ts : undefined,
      };
      const res = await fetch("/api/formsign-signature/finalizar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json: FinalizeResponse = await res.json();
      if (!res.ok || json.error || !json.data) {
        throw new Error(json.error || "Erro ao finalizar assinatura");
      }
      setFinalizeResult({ protocolo: json.data.protocolo, pdf_url: json.data.pdf_url });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoadingFinalize(false);
    }
  }

  async function handleFileAsBase64(fileList: FileList | null, setter: (v: string) => void) {
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];
    const dataUrl = await fileToDataUrl(file);
    setter(dataUrl);
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Fluxo de Assinatura</h1>
        <p className="text-sm text-muted-foreground">
          Gere preview e finalize assinaturas usando templates e dados internos.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados principais</CardTitle>
          <CardDescription>Informe IDs e artefatos necessários.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label>Cliente ID</Label>
            <Input value={clienteId} onChange={(e) => setClienteId(e.target.value)} required />
          </div>
          <div className="grid gap-2">
            <Label>Ação ID (opcional)</Label>
            <Input value={acaoId} onChange={(e) => setAcaoId(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Template ID/UUID</Label>
            <Input value={templateId} onChange={(e) => setTemplateId(e.target.value)} required />
          </div>
          <div className="grid gap-2">
            <Label>Segmento ID</Label>
            <Input value={segmentoId} onChange={(e) => setSegmentoId(e.target.value)} required />
          </div>
          <div className="grid gap-2">
            <Label>Formulário ID</Label>
            <Input value={formularioId} onChange={(e) => setFormularioId(e.target.value)} required />
          </div>
          <div className="grid gap-2">
            <Label>Assinatura (imagem)</Label>
            <Input type="file" accept="image/*" onChange={(e) => handleFileAsBase64(e.target.files, setAssinaturaBase64)} />
            {assinaturaBase64 && <p className="text-xs text-muted-foreground">Imagem anexada.</p>}
          </div>
          <div className="grid gap-2">
            <Label>Foto (opcional)</Label>
            <Input type="file" accept="image/*" onChange={(e) => handleFileAsBase64(e.target.files, (v) => setFotoBase64(v))} />
            {fotoBase64 && <p className="text-xs text-muted-foreground">Foto anexada.</p>}
          </div>
          <div className="grid gap-2 md:col-span-2">
            <div className="flex items-center gap-2">
              <Switch checked={useGeo} onCheckedChange={(v) => setUseGeo(v)} />
              <Label>Incluir geolocalização</Label>
            </div>
            {useGeo && (
              <div className="grid gap-3 md:grid-cols-4">
                <div className="grid gap-1">
                  <Label>Latitude</Label>
                  <Input value={geo.lat || ""} onChange={(e) => setGeo((g) => ({ ...g, lat: e.target.value }))} />
                </div>
                <div className="grid gap-1">
                  <Label>Longitude</Label>
                  <Input value={geo.lng || ""} onChange={(e) => setGeo((g) => ({ ...g, lng: e.target.value }))} />
                </div>
                <div className="grid gap-1">
                  <Label>Accuracy</Label>
                  <Input value={geo.acc || ""} onChange={(e) => setGeo((g) => ({ ...g, acc: e.target.value }))} />
                </div>
                <div className="grid gap-1">
                  <Label>Timestamp</Label>
                  <Input value={geo.ts || ""} onChange={(e) => setGeo((g) => ({ ...g, ts: e.target.value }))} />
                </div>
              </div>
            )}
          </div>
          <div className="md:col-span-2 flex gap-3">
            <Button type="button" variant="outline" onClick={handlePreview} disabled={loadingPreview}>
              {loadingPreview ? "Gerando preview..." : "Gerar preview"}
            </Button>
            <Button type="button" onClick={handleFinalize} disabled={loadingFinalize}>
              {loadingFinalize ? "Finalizando..." : "Finalizar assinatura"}
            </Button>
          </div>
          {error && <p className="text-sm text-red-600 md:col-span-2">{error}</p>}
        </CardContent>
      </Card>

      {previewUrl && (
        <Card>
          <CardHeader>
            <CardTitle>Preview do PDF</CardTitle>
            <CardDescription>Gerado via template.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="aspect-[3/4] border rounded overflow-hidden">
              <iframe src={previewUrl} className="w-full h-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {finalizeResult && (
        <Card>
          <CardHeader>
            <CardTitle>Assinatura concluída</CardTitle>
            <CardDescription>Protocolo e PDF gerado.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm">
              <strong>Protocolo: </strong>
              {finalizeResult.protocolo}
            </div>
            <a href={finalizeResult.pdf_url} target="_blank" rel="noreferrer" className="text-primary underline text-sm">
              Abrir PDF
            </a>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
