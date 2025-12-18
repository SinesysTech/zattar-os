"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
// Import direto para evitar carregar todo o barrel export do módulo assinatura-digital
import { ClienteAutocomplete } from "@/features/assinatura-digital/components/cliente-autocomplete";

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
  const [templates, setTemplates] = useState<{ id: string; label: string }[]>([]);
  const [segmentos, setSegmentos] = useState<{ id: string; label: string }[]>([]);
  const [formularios, setFormularios] = useState<{ id: string; label: string }[]>([]);
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
  const [loadingLists, setLoadingLists] = useState(false);

  const canPreview = useMemo(() => {
    return clienteId && templateId;
  }, [clienteId, templateId]);

  const canSubmit = useMemo(() => {
    return clienteId && templateId && segmentoId && formularioId && assinaturaBase64;
  }, [clienteId, templateId, segmentoId, formularioId, assinaturaBase64]);

  useEffect(() => {
    async function fetchLists() {
      try {
        setLoadingLists(true);
        const [tplRes, segRes, formRes] = await Promise.all([
          fetch("/api/assinatura-digital/templates"),
          fetch("/api/assinatura-digital/segmentos"),
          fetch("/api/assinatura-digital/formularios"),
        ]);

        const errors: string[] = [];

        // Templates
        if (tplRes.ok) {
          const tplJson = await tplRes.json();
          if (tplJson.data) {
            setTemplates(tplJson.data.map((t: { template_uuid?: string; id: number; nome: string }) => ({ id: t.template_uuid || String(t.id), label: t.nome })));
          }
        } else {
          errors.push("templates");
        }

        // Segmentos
        if (segRes.ok) {
          const segJson = await segRes.json();
          if (segJson.data) {
            setSegmentos(segJson.data.map((s: { id: number; nome: string }) => ({ id: String(s.id), label: s.nome })));
          }
        } else {
          errors.push("segmentos");
        }

        // Formulários
        if (formRes.ok) {
          const formJson = await formRes.json();
          if (formJson.data) {
            setFormularios(formJson.data.map((f: { formulario_uuid?: string; id: number; nome: string }) => ({ id: f.formulario_uuid || String(f.id), label: f.nome })));
          }
        } else {
          errors.push("formulários");
        }

        if (errors.length > 0) {
          const msg = `Erro ao carregar: ${errors.join(", ")}`;
          setError(msg);
          toast.error(msg);
        }
      } catch {
        const msg = "Erro ao carregar listas. Verifique sua conexão.";
        setError(msg);
        toast.error(msg);
      } finally {
        setLoadingLists(false);
      }
    }
    fetchLists();
  }, []);

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
      const res = await fetch("/api/assinatura-digital/signature/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json: PreviewResponse = await res.json();
      if (!res.ok || json.error || !json.data?.pdf_url) {
        throw new Error(json.error || "Erro ao gerar preview");
      }
      setPreviewUrl(json.data.pdf_url);
      toast.success("Preview gerado");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      toast.error(err instanceof Error ? err.message : "Erro ao gerar preview");
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
      const res = await fetch("/api/assinatura-digital/signature/finalizar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json: FinalizeResponse = await res.json();
      if (!res.ok || json.error || !json.data) {
        throw new Error(json.error || "Erro ao finalizar assinatura");
      }
      setFinalizeResult({ protocolo: json.data.protocolo, pdf_url: json.data.pdf_url });
      toast.success(`Assinatura concluída • Protocolo ${json.data.protocolo}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      toast.error(err instanceof Error ? err.message : "Erro ao finalizar assinatura");
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
            <Label>Cliente</Label>
            <ClienteAutocomplete value={clienteId} onChange={setClienteId} />
          </div>
          <div className="grid gap-2">
            <Label>Ação ID (opcional)</Label>
            <Input value={acaoId} onChange={(e) => setAcaoId(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Template ID/UUID</Label>
            <Select value={templateId} onValueChange={setTemplateId} disabled={loadingLists}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Templates</SelectLabel>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Segmento ID</Label>
            <Select value={segmentoId} onValueChange={setSegmentoId} disabled={loadingLists}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Segmentos</SelectLabel>
                  {segmentos.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Formulário ID</Label>
            <Select value={formularioId} onValueChange={setFormularioId} disabled={loadingLists}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Formulários</SelectLabel>
                  {formularios.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
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
            <Button type="button" variant="outline" onClick={handlePreview} disabled={loadingPreview || !canPreview}>
              {loadingPreview ? "Gerando preview..." : "Gerar preview"}
            </Button>
            <Button type="button" onClick={handleFinalize} disabled={loadingFinalize || !canSubmit}>
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
            <div className="aspect-3/4 border rounded overflow-hidden">
              <iframe src={previewUrl} className="w-full h-full" title="Preview do PDF" />
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

