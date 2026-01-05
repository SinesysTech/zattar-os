"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import SignatureCanvas from "react-signature-canvas";
import Webcam from "react-webcam";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Download, RefreshCcw, Camera, PenTool } from "lucide-react";

type PublicContext = {
  documento: {
    documento_uuid: string;
    titulo?: string | null;
    status: string;
    selfie_habilitada: boolean;
    pdf_original_url: string;
    pdf_final_url?: string | null;
  };
  assinante: {
    id: number;
    status: "pendente" | "concluido";
    dados_snapshot: Record<string, unknown>;
    dados_confirmados: boolean;
  };
  anchors: Array<{ tipo: "assinatura" | "rubrica" }>;
};

function safeString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function AssinaturaPublicaClient() {
  const params = useParams<{ token: string }>();
  const token = params?.token;

  const [ctx, setCtx] = React.useState<PublicContext | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [nome, setNome] = React.useState("");
  const [cpf, setCpf] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [telefone, setTelefone] = React.useState("");
  const [isSavingId, setIsSavingId] = React.useState(false);

  const [selfieDataUrl, setSelfieDataUrl] = React.useState<string | null>(null);
  const webcamRef = React.useRef<Webcam>(null);

  const assinaturaRef = React.useRef<SignatureCanvas>(null);
  const rubricaRef = React.useRef<SignatureCanvas>(null);
  const [termosAceite, setTermosAceite] = React.useState(false);
  const [isFinalizing, setIsFinalizing] = React.useState(false);

  const hasRubrica = (ctx?.anchors ?? []).some((a) => a.tipo === "rubrica");

  const load = React.useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/assinatura-digital/public/${token}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Link inválido.");

      const data = json.data as PublicContext;
      setCtx(data);

      const snap = data.assinante.dados_snapshot || {};
      setNome(safeString(snap.nome_completo));
      setCpf(safeString(snap.cpf));
      setEmail(safeString(snap.email));
      setTelefone(safeString(snap.telefone));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar link.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const handleSaveIdentification = async () => {
    if (!token) return;
    setIsSavingId(true);
    try {
      const res = await fetch(`/api/assinatura-digital/public/${token}/identificacao`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome_completo: nome.trim(),
          cpf: cpf.trim(),
          email: email.trim(),
          telefone: telefone.trim(),
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Erro ao salvar dados.");
      await load();
    } finally {
      setIsSavingId(false);
    }
  };

  const handleCaptureSelfie = () => {
    const screenshot = webcamRef.current?.getScreenshot();
    if (screenshot) setSelfieDataUrl(screenshot);
  };

  const handleFinalize = async () => {
    if (!token || !ctx) return;
    if (!ctx.assinante.dados_confirmados) {
      throw new Error("Confirme seus dados antes de assinar.");
    }
    if (!termosAceite) {
      throw new Error("Aceite os termos para continuar.");
    }

    const assinaturaBase64 = assinaturaRef.current?.toDataURL("image/png");
    if (!assinaturaBase64) {
      throw new Error("Assinatura é obrigatória.");
    }

    const rubricaBase64 = hasRubrica ? rubricaRef.current?.toDataURL("image/png") : null;
    if (hasRubrica && !rubricaBase64) {
      throw new Error("Rubrica é obrigatória para este documento.");
    }

    if (ctx.documento.selfie_habilitada && !selfieDataUrl) {
      throw new Error("Selfie é obrigatória para este documento.");
    }

    setIsFinalizing(true);
    try {
      const res = await fetch(`/api/assinatura-digital/public/${token}/finalizar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selfie_base64: selfieDataUrl,
          assinatura_base64: assinaturaBase64,
          rubrica_base64: rubricaBase64,
          termos_aceite: true,
          termos_aceite_versao: "v1.0-MP2200-2",
          dispositivo_fingerprint_raw: {
            screen: typeof window !== "undefined" ? `${window.screen.width}x${window.screen.height}` : null,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            user_agent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform ?? null,
            touch: "ontouchstart" in window,
          },
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Erro ao finalizar assinatura.");
      await load();
    } finally {
      setIsFinalizing(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Carregando…</div>;
  }

  if (error) {
    return <div className="text-sm text-destructive">{error}</div>;
  }

  if (!ctx) return null;

  if (ctx.documento.status !== "pronto" && ctx.documento.status !== "concluido") {
    return (
      <div className="text-sm text-muted-foreground">
        Este documento ainda não está pronto para assinatura. Tente novamente mais tarde.
      </div>
    );
  }

  if (ctx.assinante.status === "concluido") {
    return (
      <Card className="p-6 space-y-3">
        <div className="text-lg font-semibold">Assinatura concluída</div>
        <div className="text-sm text-muted-foreground">
          Obrigado. Sua assinatura foi registrada com sucesso.
        </div>
        {ctx.documento.pdf_final_url && (
          <Button asChild variant="outline">
            <a href={ctx.documento.pdf_final_url} target="_blank" rel="noreferrer">
              <Download className="h-4 w-4 mr-2" />
              Baixar PDF
            </a>
          </Button>
        )}
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-6 space-y-4">
        <div className="space-y-1">
          <div className="text-lg font-semibold">
            {ctx.documento.titulo || "Documento para assinatura"}
          </div>
          <div className="text-sm text-muted-foreground">
            Confirme seus dados para continuar.
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nome completo</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>CPF</Label>
            <Input value={cpf} onChange={(e) => setCpf(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>E-mail</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Telefone</Label>
            <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSaveIdentification} disabled={isSavingId}>
            Confirmar dados
          </Button>
        </div>
      </Card>

      {ctx.assinante.dados_confirmados && (
        <Card className="p-6 space-y-4">
          <div className="space-y-1">
            <div className="text-lg font-semibold flex items-center gap-2">
              <PenTool className="h-5 w-5" />
              Assinatura
            </div>
            <div className="text-sm text-muted-foreground">
              Assine abaixo. Se houver múltiplas posições no PDF, sua assinatura será replicada automaticamente.
            </div>
          </div>

          {ctx.documento.selfie_habilitada && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="text-sm font-medium flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Selfie
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                  <div className="rounded-md border overflow-hidden">
                    <Webcam
                      ref={webcamRef}
                      audio={false}
                      screenshotFormat="image/jpeg"
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Button type="button" variant="outline" onClick={handleCaptureSelfie}>
                      <Camera className="h-4 w-4 mr-2" />
                      Capturar selfie
                    </Button>
                    {selfieDataUrl && (
                      <img
                        src={selfieDataUrl}
                        alt="Selfie capturada"
                        className="rounded-md border max-h-48"
                      />
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          <Separator />

          <div className="space-y-2">
            <div className="text-sm font-medium">Assinatura</div>
            <div className="rounded-md border">
              <SignatureCanvas
                ref={assinaturaRef}
                penColor="black"
                canvasProps={{ className: "w-full h-40" }}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => assinaturaRef.current?.clear()}
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              Limpar assinatura
            </Button>
          </div>

          {hasRubrica && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Rubrica</div>
              <div className="rounded-md border">
                <SignatureCanvas
                  ref={rubricaRef}
                  penColor="black"
                  canvasProps={{ className: "w-full h-28" }}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => rubricaRef.current?.clear()}
              >
                <RefreshCcw className="h-4 w-4 mr-2" />
                Limpar rubrica
              </Button>
            </div>
          )}

          <Separator />

          <div className="flex items-center gap-2">
            <Checkbox checked={termosAceite} onCheckedChange={(v) => setTermosAceite(Boolean(v))} />
            <div className="text-sm">
              Li e aceito os termos de assinatura digital.
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => void handleFinalize()} disabled={isFinalizing}>
              Finalizar assinatura
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}



