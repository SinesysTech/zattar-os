"use client";

import * as React from "react";
import { Plus, Trash2, Copy, ArrowRight, ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ServerCombobox, type ComboboxOption } from "@/components/ui/server-combobox";
import PdfPreviewDynamic from "@/features/assinatura-digital/components/pdf/PdfPreviewDynamic";

type SignerType =
  | "cliente"
  | "parte_contraria"
  | "representante"
  | "terceiro"
  | "usuario"
  | "convidado";

type AnchorType = "assinatura" | "rubrica";

type CreatedState = {
  documento: { documento_uuid: string; pdf_original_url: string; selfie_habilitada: boolean; titulo?: string | null };
  assinantes: Array<{ id: number; assinante_tipo: SignerType; token: string; public_link: string; dados_snapshot: Record<string, unknown> }>;
};

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

type SignerDraft =
  | {
      kind: "entidade";
      tipo: Exclude<SignerType, "convidado">;
      entidadeId?: string;
    }
  | {
      kind: "convidado";
      tipo: "convidado";
      nome_completo?: string;
      cpf?: string;
      email?: string;
      telefone?: string;
    };

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

function asComboboxOptions(rows: Array<Record<string, unknown>>, tipo: Exclude<SignerType, "convidado">): ComboboxOption[] {
  return rows.map((r) => {
    const id = String(r.id);
    const nome =
      tipo === "usuario"
        ? String(r.nome_completo ?? "")
        : String(r.nome ?? "");
    const doc = String((r.cpf ?? r.cnpj ?? "") as string);
    const label = doc ? `${nome} - ${doc}` : nome || `ID: ${id}`;
    return { value: id, label };
  });
}

export function DocumentosClient() {
  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  const [titulo, setTitulo] = React.useState<string>("");
  const [selfieHabilitada, setSelfieHabilitada] = React.useState<boolean>(false);
  const [file, setFile] = React.useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [signers, setSigners] = React.useState<SignerDraft[]>([
    { kind: "convidado", tipo: "convidado" },
  ]);

  const [created, setCreated] = React.useState<CreatedState | null>(null);

  const [anchors, setAnchors] = React.useState<AnchorDraft[]>([]);
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const [numPages, setNumPages] = React.useState<number>(1);
  const [currentSignerId, setCurrentSignerId] = React.useState<number | null>(null);
  const [currentAnchorType, setCurrentAnchorType] = React.useState<AnchorType>("assinatura");

  const overlayRef = React.useRef<HTMLDivElement | null>(null);
  const drawStartRef = React.useRef<{ x: number; y: number } | null>(null);
  const [drawRect, setDrawRect] = React.useState<{ x: number; y: number; w: number; h: number } | null>(null);

  const handleAddSigner = () => {
    setSigners((prev) => [...prev, { kind: "convidado", tipo: "convidado" }]);
  };

  const handleRemoveSigner = (index: number) => {
    setSigners((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreate = async () => {
    if (!file) return;
    setIsSubmitting(true);
    try {
      const assinantesPayload = signers
        .map((s) => {
          if (s.kind === "convidado") {
            const snapshot: Record<string, unknown> = {
              nome_completo: s.nome_completo ?? null,
              cpf: s.cpf ?? null,
              email: s.email ?? null,
              telefone: s.telefone ?? null,
            };
            return {
              assinante_tipo: "convidado",
              assinante_entidade_id: null,
              dados_snapshot: snapshot,
            };
          }
          return {
            assinante_tipo: s.tipo,
            assinante_entidade_id: s.entidadeId ? Number(s.entidadeId) : null,
            dados_snapshot: {},
          };
        })
        .filter(Boolean);

      const form = new FormData();
      form.set("file", file);
      if (titulo.trim()) form.set("titulo", titulo.trim());
      form.set("selfie_habilitada", String(selfieHabilitada));
      form.set("assinantes", JSON.stringify(assinantesPayload));

      const res = await fetch("/api/assinatura-digital/documentos", {
        method: "POST",
        body: form,
      });
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || "Falha ao criar documento.");
      }

      const result = json.data as { documento: any; assinantes: any[] };
      const nextCreated: CreatedState = {
        documento: result.documento,
        assinantes: result.assinantes,
      };
      setCreated(nextCreated);
      setCurrentSignerId(result.assinantes?.[0]?.id ?? null);
      setStep(2);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveAnchors = async () => {
    if (!created) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(
        `/api/assinatura-digital/documentos/${created.documento.documento_uuid}/ancoras`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ anchors }),
        }
      );
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || "Falha ao salvar âncoras.");
      }
      setStep(3);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSearch = React.useCallback(
    async (tipo: Exclude<SignerType, "convidado">, query: string): Promise<ComboboxOption[]> => {
      if (!query || query.trim().length < 2) return [];
      const url = new URL("/api/assinatura-digital/assinantes/search", window.location.origin);
      url.searchParams.set("tipo", tipo);
      url.searchParams.set("q", query.trim());
      const res = await fetch(url.toString());
      const json = await res.json();
      if (!json.success) return [];
      return asComboboxOptions(json.data as Array<Record<string, unknown>>, tipo);
    },
    []
  );

  const handleOverlayMouseDown = (e: React.MouseEvent) => {
    if (!overlayRef.current || !currentSignerId) return;
    const rect = overlayRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    drawStartRef.current = { x, y };
    setDrawRect({ x, y, w: 0, h: 0 });
  };

  const handleOverlayMouseMove = (e: React.MouseEvent) => {
    if (!overlayRef.current) return;
    const start = drawStartRef.current;
    if (!start) return;
    const rect = overlayRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setDrawRect({ x: start.x, y: start.y, w: x - start.x, h: y - start.y });
  };

  const handleOverlayMouseUp = () => {
    if (!overlayRef.current || !drawRect || !currentSignerId) {
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

  const canContinueStep1 =
    !!file &&
    signers.length > 0 &&
    signers.every((s) => (s.kind === "convidado" ? true : !!s.entidadeId));

  return (
    <div className="space-y-4">
      {step === 1 && (
        <Card className="p-6 space-y-6">
          <div className="space-y-1">
            <div className="text-lg font-semibold">Enviar PDF para assinatura</div>
            <div className="text-sm text-muted-foreground">
              Faça upload do PDF pronto, escolha se haverá selfie e adicione os assinantes.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título (opcional)</Label>
              <Input id="titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pdf">PDF</Label>
              <Input
                id="pdf"
                type="file"
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <div className="space-y-0.5">
              <div className="text-sm font-medium">Selfie</div>
              <div className="text-xs text-muted-foreground">
                Única configuração opcional. Os demais elementos de segurança são padrão.
              </div>
            </div>
            <Switch checked={selfieHabilitada} onCheckedChange={setSelfieHabilitada} />
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Assinantes</div>
              <Button type="button" variant="outline" size="sm" onClick={handleAddSigner}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </div>

            <div className="space-y-3">
              {signers.map((s, idx) => (
                <div key={idx} className="rounded-md border p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Assinante {idx + 1}</Badge>
                      <select
                        className="h-9 rounded-md border bg-transparent px-2 text-sm"
                        aria-label={`Tipo do assinante ${idx + 1}`}
                        value={s.tipo}
                        onChange={(e) => {
                          const tipo = e.target.value as SignerType;
                          setSigners((prev) =>
                            prev.map((p, i) => {
                              if (i !== idx) return p;
                              if (tipo === "convidado") return { kind: "convidado", tipo: "convidado" };
                              return { kind: "entidade", tipo };
                            })
                          );
                        }}
                      >
                        <option value="convidado">Convidado</option>
                        <option value="cliente">Cliente</option>
                        <option value="parte_contraria">Parte Contrária</option>
                        <option value="representante">Representante</option>
                        <option value="terceiro">Terceiro</option>
                        <option value="usuario">Usuário</option>
                      </select>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveSigner(idx)}
                      disabled={signers.length <= 1}
                      aria-label="Remover assinante"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {s.kind === "entidade" ? (
                    <div className="space-y-2">
                      <Label>Selecionar registro</Label>
                      <ServerCombobox
                        multiple={false}
                        value={s.entidadeId ? [s.entidadeId] : []}
                        onValueChange={(v) => {
                          const entidadeId = v[0];
                          setSigners((prev) =>
                            prev.map((p, i) =>
                              i === idx && p.kind === "entidade" ? { ...p, entidadeId } : p
                            )
                          );
                        }}
                        onSearch={(q) => onSearch(s.tipo, q)}
                        placeholder="Buscar..."
                        searchPlaceholder="Digite para buscar..."
                        minSearchLength={2}
                      />
                      <div className="text-xs text-muted-foreground">
                        Dica: busque por nome, CPF/CNPJ ou e-mail (quando aplicável).
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Nome completo (opcional)</Label>
                        <Input
                          value={s.nome_completo ?? ""}
                          onChange={(e) =>
                            setSigners((prev) =>
                              prev.map((p, i) =>
                                i === idx && p.kind === "convidado"
                                  ? { ...p, nome_completo: e.target.value }
                                  : p
                              )
                            )
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>CPF (opcional)</Label>
                        <Input
                          value={s.cpf ?? ""}
                          onChange={(e) =>
                            setSigners((prev) =>
                              prev.map((p, i) =>
                                i === idx && p.kind === "convidado"
                                  ? { ...p, cpf: e.target.value }
                                  : p
                              )
                            )
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>E-mail (opcional)</Label>
                        <Input
                          value={s.email ?? ""}
                          onChange={(e) =>
                            setSigners((prev) =>
                              prev.map((p, i) =>
                                i === idx && p.kind === "convidado"
                                  ? { ...p, email: e.target.value }
                                  : p
                              )
                            )
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Telefone (opcional)</Label>
                        <Input
                          value={s.telefone ?? ""}
                          onChange={(e) =>
                            setSigners((prev) =>
                              prev.map((p, i) =>
                                i === idx && p.kind === "convidado"
                                  ? { ...p, telefone: e.target.value }
                                  : p
                              )
                            )
                          }
                        />
                      </div>
                      <div className="md:col-span-2 text-xs text-muted-foreground">
                        Se esses dados não forem informados agora, o assinante vai preencher/confirmar no link público.
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleCreate} disabled={!canContinueStep1 || isSubmitting}>
              Próximo
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </Card>
      )}

      {step === 2 && created && (
        <Card className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="text-lg font-semibold">Marcar posições no PDF</div>
              <div className="text-sm text-muted-foreground">
                Clique e arraste para criar uma âncora para o assinante selecionado.
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <Button onClick={handleSaveAnchors} disabled={anchors.length === 0 || isSubmitting}>
                <Save className="h-4 w-4 mr-2" />
                Salvar âncoras
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
            <div className="space-y-4">
              <div className="rounded-md border p-3 space-y-3">
                <div className="text-sm font-medium">Assinante</div>
                <select
                  className="h-9 w-full rounded-md border bg-transparent px-2 text-sm"
                  aria-label="Selecionar assinante"
                  value={currentSignerId ?? ""}
                  onChange={(e) => setCurrentSignerId(Number(e.target.value))}
                >
                  {created.assinantes.map((s) => (
                    <option key={s.id} value={s.id}>
                      #{s.id} - {String((s.dados_snapshot?.nome_completo as string) ?? s.assinante_tipo)}
                    </option>
                  ))}
                </select>

                <div className="text-sm font-medium">Tipo</div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={currentAnchorType === "assinatura" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentAnchorType("assinatura")}
                  >
                    Assinatura
                  </Button>
                  <Button
                    type="button"
                    variant={currentAnchorType === "rubrica" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentAnchorType("rubrica")}
                  >
                    Rubrica
                  </Button>
                </div>
              </div>

              <div className="rounded-md border p-3 space-y-2">
                <div className="text-sm font-medium">Páginas</div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div className="text-sm">
                    Página <span className="font-medium">{currentPage}</span> / {numPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
                    disabled={currentPage >= numPages}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="rounded-md border p-3 space-y-2">
                <div className="text-sm font-medium">Âncoras ({anchors.length})</div>
                <div className="space-y-2 max-h-[320px] overflow-auto pr-1">
                  {anchors.length === 0 ? (
                    <div className="text-sm text-muted-foreground">Nenhuma âncora criada ainda.</div>
                  ) : (
                    anchors
                      .slice()
                      .reverse()
                      .map((a) => (
                        <div key={a.key} className="flex items-center justify-between gap-2">
                          <div className="text-xs">
                            <Badge variant="secondary" className="mr-2">
                              {a.tipo}
                            </Badge>
                            pág {a.pagina} · assinante #{a.documento_assinante_id}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label="Remover âncora"
                            onClick={() => handleRemoveAnchor(a.key)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-md border overflow-hidden">
              <div className="relative bg-white">
                <PdfPreviewDynamic
                  pdfUrl={created.documento.pdf_original_url}
                  mode="background"
                  initialPage={currentPage}
                  onLoadSuccess={(n) => setNumPages(n)}
                  showControls={false}
                  showPageIndicator={false}
                  className="w-full"
                />

                {/* overlay desenhável */}
                <div
                  ref={overlayRef}
                  className="absolute inset-0 cursor-crosshair"
                  onMouseDown={handleOverlayMouseDown}
                  onMouseMove={handleOverlayMouseMove}
                  onMouseUp={handleOverlayMouseUp}
                >
                  {/* retângulo em desenho */}
                  {drawRect && (
                    <div
                      className="absolute border-2 border-primary bg-primary/10"
                      style={{
                        left: Math.min(drawRect.x, drawRect.x + drawRect.w),
                        top: Math.min(drawRect.y, drawRect.y + drawRect.h),
                        width: Math.abs(drawRect.w),
                        height: Math.abs(drawRect.h),
                      }}
                    />
                  )}

                  {/* retângulos existentes na página atual */}
                  {anchors
                    .filter((a) => a.pagina === currentPage)
                    .map((a) => (
                      <div
                        key={a.key}
                        className="absolute border border-foreground/40 bg-foreground/5"
                        title={`assinante #${a.documento_assinante_id} (${a.tipo})`}
                        style={{
                          left: `${a.x_norm * 100}%`,
                          top: `${a.y_norm * 100}%`,
                          width: `${a.w_norm * 100}%`,
                          height: `${a.h_norm * 100}%`,
                        }}
                      />
                    ))}
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {step === 3 && created && (
        <Card className="p-6 space-y-4">
          <div className="space-y-1">
            <div className="text-lg font-semibold">Links públicos</div>
            <div className="text-sm text-muted-foreground">
              Copie e compartilhe os links com cada assinante.
            </div>
          </div>

          <div className="space-y-3">
            {created.assinantes.map((s) => (
              <div key={s.id} className="rounded-md border p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">
                    {String((s.dados_snapshot?.nome_completo as string) ?? `Assinante #${s.id}`)}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">{s.public_link}</div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await navigator.clipboard.writeText(
                      `${window.location.origin}${s.public_link}`
                    );
                  }}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}



