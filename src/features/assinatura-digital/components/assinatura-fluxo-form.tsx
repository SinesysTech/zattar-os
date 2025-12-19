"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ClienteSelect } from "./cliente-select";
import { SegmentoSelect } from "./segmento-select";
import { TemplateSelect } from "./template-select";
import { FormularioSelect } from "./formulario-select";
import { FileImage, MapPin, Eye, CheckCircle, Loader2 } from "lucide-react";

type PreviewResponse = {
  success?: boolean;
  data?: { pdf_url: string };
  error?: string;
};
type FinalizeResponse = {
  success?: boolean;
  data?: { assinatura_id: number; protocolo: string; pdf_url: string };
  error?: string;
};

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

interface FormData {
  clienteId: number | null;
  templateId: string | null;
  segmentoId: number | null;
  formularioId: number | null;
  assinaturaBase64: string | null;
  fotoBase64: string | null;
  useGeo: boolean;
  geo: {
    lat: string;
    lng: string;
    acc: string;
    ts: string;
  };
}

const initialFormData: FormData = {
  clienteId: null,
  templateId: null,
  segmentoId: null,
  formularioId: null,
  assinaturaBase64: null,
  fotoBase64: null,
  useGeo: false,
  geo: { lat: "", lng: "", acc: "", ts: "" },
};

export interface AssinaturaFluxoFormProps {
  onPreviewSuccess?: (url: string) => void;
  onFinalizeSuccess?: (result: { protocolo: string; pdf_url: string }) => void;
}

export function AssinaturaFluxoForm({
  onPreviewSuccess,
  onFinalizeSuccess,
}: AssinaturaFluxoFormProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [finalizeResult, setFinalizeResult] = useState<{
    protocolo: string;
    pdf_url: string;
  } | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingFinalize, setLoadingFinalize] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validation
  const canPreview = useMemo(() => {
    return formData.clienteId && formData.templateId;
  }, [formData.clienteId, formData.templateId]);

  const canSubmit = useMemo(() => {
    return (
      formData.clienteId &&
      formData.templateId &&
      formData.segmentoId &&
      formData.formularioId &&
      formData.assinaturaBase64
    );
  }, [
    formData.clienteId,
    formData.templateId,
    formData.segmentoId,
    formData.formularioId,
    formData.assinaturaBase64,
  ]);

  // Calculate progress
  const progress = useMemo(() => {
    const steps = [
      !!formData.clienteId,
      !!formData.segmentoId,
      !!formData.templateId,
      !!formData.formularioId,
      !!formData.assinaturaBase64,
    ];
    return (steps.filter(Boolean).length / steps.length) * 100;
  }, [
    formData.clienteId,
    formData.segmentoId,
    formData.templateId,
    formData.formularioId,
    formData.assinaturaBase64,
  ]);

  const updateForm = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const updateGeo = (key: keyof FormData["geo"], value: string) => {
    setFormData((prev) => ({
      ...prev,
      geo: { ...prev.geo, [key]: value },
    }));
  };

  async function handleFileAsBase64(
    fileList: FileList | null,
    key: "assinaturaBase64" | "fotoBase64"
  ) {
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];
    const dataUrl = await fileToDataUrl(file);
    updateForm(key, dataUrl);
  }

  async function handlePreview() {
    setLoadingPreview(true);
    setError(null);
    setPreviewUrl(null);
    try {
      const body = {
        cliente_id: formData.clienteId,
        template_id: formData.templateId,
        foto_base64: formData.fotoBase64 ?? undefined,
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
      onPreviewSuccess?.(json.data.pdf_url);
      toast.success("Preview gerado com sucesso");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      setError(message);
      toast.error(message);
    } finally {
      setLoadingPreview(false);
    }
  }

  async function handleFinalize() {
    setLoadingFinalize(true);
    setError(null);
    setFinalizeResult(null);
    try {
      if (!formData.assinaturaBase64) {
        throw new Error("Assinatura (imagem) é obrigatória");
      }
      const body = {
        cliente_id: formData.clienteId,
        template_id: formData.templateId,
        segmento_id: formData.segmentoId,
        formulario_id: formData.formularioId,
        assinatura_base64: formData.assinaturaBase64,
        foto_base64: formData.fotoBase64 ?? undefined,
        latitude:
          formData.useGeo && formData.geo.lat
            ? Number(formData.geo.lat)
            : undefined,
        longitude:
          formData.useGeo && formData.geo.lng
            ? Number(formData.geo.lng)
            : undefined,
        geolocation_accuracy:
          formData.useGeo && formData.geo.acc
            ? Number(formData.geo.acc)
            : undefined,
        geolocation_timestamp:
          formData.useGeo && formData.geo.ts ? formData.geo.ts : undefined,
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
      const result = {
        protocolo: json.data.protocolo,
        pdf_url: json.data.pdf_url,
      };
      setFinalizeResult(result);
      onFinalizeSuccess?.(result);
      toast.success(`Assinatura concluída - Protocolo ${json.data.protocolo}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      setError(message);
      toast.error(message);
    } finally {
      setLoadingFinalize(false);
    }
  }

  function handleReset() {
    setFormData(initialFormData);
    setPreviewUrl(null);
    setFinalizeResult(null);
    setError(null);
  }

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Progresso do preenchimento</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Main Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Dados da Assinatura</CardTitle>
          <CardDescription>
            Preencha os campos abaixo para gerar e finalizar a assinatura
            digital.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Section 1: Cliente e Acao */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                1
              </span>
              Identificação
            </h3>
            <div className="space-y-2">
              <Label htmlFor="cliente">
                Cliente <span className="text-destructive">*</span>
              </Label>
              <ClienteSelect
                value={formData.clienteId}
                onChange={(id) => updateForm("clienteId", id)}
              />
            </div>
          </div>

          <Separator />

          {/* Section 2: Segmento e Template */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                2
              </span>
              Segmento e Template
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="segmento">
                  Segmento <span className="text-destructive">*</span>
                </Label>
                <SegmentoSelect
                  value={formData.segmentoId}
                  onChange={(id) => updateForm("segmentoId", id)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="template">
                  Template <span className="text-destructive">*</span>
                </Label>
                <TemplateSelect
                  value={formData.templateId}
                  onChange={(id) => updateForm("templateId", id)}
                  segmentoId={formData.segmentoId ?? undefined}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Section 3: Formulario */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                3
              </span>
              Formulario
            </h3>
            <div className="space-y-2">
              <Label htmlFor="formulario">
                Formulario <span className="text-destructive">*</span>
              </Label>
              <FormularioSelect
                value={formData.formularioId}
                onChange={(id) => updateForm("formularioId", id)}
                segmentoId={formData.segmentoId ?? undefined}
              />
            </div>
          </div>

          <Separator />

          {/* Section 4: Assinatura e Foto */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                4
              </span>
              Arquivos
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="assinatura" className="flex items-center gap-2">
                  <FileImage className="h-4 w-4" />
                  Assinatura (imagem) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="assinatura"
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    handleFileAsBase64(e.target.files, "assinaturaBase64")
                  }
                />
                {formData.assinaturaBase64 && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Imagem da assinatura anexada
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="foto" className="flex items-center gap-2">
                  <FileImage className="h-4 w-4" />
                  Foto (opcional)
                </Label>
                <Input
                  id="foto"
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    handleFileAsBase64(e.target.files, "fotoBase64")
                  }
                />
                {formData.fotoBase64 && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Foto anexada
                  </p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Section 5: Geolocalizacao */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                5
              </span>
              Geolocalizacao
            </h3>
            <div className="flex items-center gap-3">
              <Switch
                id="useGeo"
                checked={formData.useGeo}
                onCheckedChange={(checked) => updateForm("useGeo", checked)}
              />
              <Label
                htmlFor="useGeo"
                className="flex items-center gap-2 cursor-pointer"
              >
                <MapPin className="h-4 w-4" />
                Incluir geolocalizacao
              </Label>
            </div>
            {formData.useGeo && (
              <div className="grid gap-3 md:grid-cols-4">
                <div className="space-y-1">
                  <Label htmlFor="lat">Latitude</Label>
                  <Input
                    id="lat"
                    type="number"
                    step="any"
                    value={formData.geo.lat}
                    onChange={(e) => updateGeo("lat", e.target.value)}
                    placeholder="-23.5505"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="lng">Longitude</Label>
                  <Input
                    id="lng"
                    type="number"
                    step="any"
                    value={formData.geo.lng}
                    onChange={(e) => updateGeo("lng", e.target.value)}
                    placeholder="-46.6333"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="acc">Precisao (m)</Label>
                  <Input
                    id="acc"
                    type="number"
                    value={formData.geo.acc}
                    onChange={(e) => updateGeo("acc", e.target.value)}
                    placeholder="10"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ts">Timestamp</Label>
                  <Input
                    id="ts"
                    type="datetime-local"
                    value={formData.geo.ts}
                    onChange={(e) => updateGeo("ts", e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handlePreview}
              disabled={loadingPreview || !canPreview}
            >
              {loadingPreview ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando preview...
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  Gerar preview
                </>
              )}
            </Button>
            <Button
              type="button"
              onClick={handleFinalize}
              disabled={loadingFinalize || !canSubmit}
            >
              {loadingFinalize ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Finalizando...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Finalizar assinatura
                </>
              )}
            </Button>
            <Button type="button" variant="ghost" onClick={handleReset}>
              Limpar formulario
            </Button>
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Preview Card */}
      {previewUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Preview do PDF
            </CardTitle>
            <CardDescription>
              Visualize o documento antes de finalizar a assinatura.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="aspect-3/4 border rounded-lg overflow-hidden bg-muted">
              <iframe
                src={previewUrl}
                className="w-full h-full"
                title="Preview do PDF"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success Card */}
      {finalizeResult && (
        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <CheckCircle className="h-5 w-5" />
              Assinatura Concluida
            </CardTitle>
            <CardDescription className="text-green-600 dark:text-green-400">
              O documento foi assinado com sucesso.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm">
              <span className="font-medium">Protocolo: </span>
              <code className="bg-green-100 dark:bg-green-900 px-2 py-1 rounded">
                {finalizeResult.protocolo}
              </code>
            </div>
            <a
              href={finalizeResult.pdf_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-primary hover:underline text-sm"
            >
              Abrir PDF assinado
            </a>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
