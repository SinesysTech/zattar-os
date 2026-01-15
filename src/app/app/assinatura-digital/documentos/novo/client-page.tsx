"use client";

/**
 * NovoDocumentoClient - Cliente para criação de novo documento de assinatura
 *
 * Fluxo:
 * 1. Mostra instruções e botão para upload
 * 2. Abre modal DocumentUploadDropzone
 * 3. Após upload, cria documento e redireciona para /editar/[uuid]
 */

import * as React from "react";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload, FileText, Users, CheckCircle, ArrowRight, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ServerCombobox, type ComboboxOption } from "@/components/ui/server-combobox";
import {
  SignatureWorkflowStepper,
} from "../../feature/components/workflow";
import {
  DocumentUploadDropzone,
} from "../../feature/components/upload";
import { useFormularioStore } from "../../feature/store/formulario-store";
import { actionCreateDocumento } from "../../feature/actions/documentos-actions";

// Tipos de assinante suportados
type SignerType =
  | "cliente"
  | "parte_contraria"
  | "representante"
  | "terceiro"
  | "usuario"
  | "convidado";

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

function asComboboxOptions(
  rows: Array<Record<string, unknown>>,
  tipo: Exclude<SignerType, "convidado">
): ComboboxOption[] {
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

export function NovoDocumentoClient() {
  const router = useRouter();
  const { setEtapaAtual } = useFormularioStore();

  // Estado do modal de upload
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Estado do formulário
  const [titulo, setTitulo] = useState("");
  const [selfieHabilitada, setSelfieHabilitada] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Lista de assinantes
  const [signers, setSigners] = useState<SignerDraft[]>([
    { kind: "convidado", tipo: "convidado" },
  ]);

  // Inicializar etapa do stepper como 0 (Upload)
  React.useEffect(() => {
    setEtapaAtual(0);
  }, [setEtapaAtual]);

  // Handler de sucesso no upload
  const handleUploadSuccess = useCallback((url: string, name: string) => {
    setUploadedUrl(url);
    setUploadedFileName(name);
    toast.success("Documento carregado com sucesso!");
  }, []);

  // Adicionar assinante
  const handleAddSigner = useCallback(() => {
    setSigners((prev) => [...prev, { kind: "convidado", tipo: "convidado" }]);
  }, []);

  // Remover assinante
  const handleRemoveSigner = useCallback((index: number) => {
    setSigners((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Busca de entidades para assinantes
  const onSearch = useCallback(
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

  // Criar documento e redirecionar
  const handleCreate = useCallback(async () => {
    if (!uploadedUrl) {
      toast.error("Por favor, faça upload de um documento primeiro.");
      return;
    }

    if (signers.length === 0) {
      toast.error("Adicione pelo menos um assinante.");
      return;
    }

    setIsCreating(true);

    try {
      // Preparar payload de assinantes
      const assinantesPayload = signers.map((s) => {
        if (s.kind === "convidado") {
          return {
            assinante_tipo: "convidado" as const,
            assinante_entidade_id: null,
            dados_snapshot: {
              nome_completo: s.nome_completo ?? null,
              cpf: s.cpf ?? null,
              email: s.email ?? null,
              telefone: s.telefone ?? null,
            },
          };
        }
        return {
          assinante_tipo: s.tipo,
          assinante_entidade_id: s.entidadeId ? Number(s.entidadeId) : null,
          dados_snapshot: {},
        };
      });

      // Criar documento via server action
      const result = await actionCreateDocumento({
        titulo: titulo.trim() || uploadedFileName || "Documento sem título",
        selfie_habilitada: selfieHabilitada,
        pdf_original_url: uploadedUrl,
        assinantes: assinantesPayload,
      });

      if (!result.success) {
        throw new Error(result.error || "Falha ao criar documento.");
      }

      const { documento } = result.data as { documento: { documento_uuid: string } };

      toast.success("Documento criado com sucesso! Redirecionando para configuração...");

      // Avançar para etapa 1 (Configurar) e redirecionar
      setEtapaAtual(1);
      router.push(`/app/assinatura-digital/documentos/editar/${documento.documento_uuid}`);
    } catch (error) {
      console.error("Erro ao criar documento:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao criar documento.");
    } finally {
      setIsCreating(false);
    }
  }, [uploadedUrl, uploadedFileName, signers, titulo, selfieHabilitada, setEtapaAtual, router]);

  // Verificar se pode continuar
  const canContinue =
    !!uploadedUrl &&
    signers.length > 0 &&
    signers.every((s) => (s.kind === "convidado" ? true : !!s.entidadeId));

  return (
    <div className="space-y-6">
      {/* Stepper de progresso */}
      <SignatureWorkflowStepper />

      {/* Card principal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Novo Documento para Assinatura
          </CardTitle>
          <CardDescription>
            Envie um PDF e configure os assinantes para coletar assinaturas digitais.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Seção de Upload */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-sm font-medium">Documento PDF</h3>
                <p className="text-sm text-muted-foreground">
                  Faça upload do documento que será assinado.
                </p>
              </div>
              <Button onClick={() => setIsUploadOpen(true)} variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                {uploadedUrl ? "Alterar Documento" : "Enviar Documento"}
              </Button>
            </div>

            {uploadedUrl && uploadedFileName && (
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50">
                <FileText className="h-5 w-5 text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{uploadedFileName}</p>
                  <p className="text-xs text-muted-foreground">Documento carregado</p>
                </div>
                <CheckCircle className="h-5 w-5 text-primary" />
              </div>
            )}
          </div>

          <Separator />

          {/* Informações do documento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Titulo (opcional)</Label>
              <Input
                id="titulo"
                placeholder="Ex: Contrato de Prestacao de Servicos"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Selfie de Verificacao</Label>
              <div className="flex items-center justify-between rounded-md border p-3">
                <div className="space-y-0.5">
                  <div className="text-sm">Exigir selfie</div>
                  <div className="text-xs text-muted-foreground">
                    Assinante deve enviar foto para confirmacao
                  </div>
                </div>
                <Switch
                  id="selfie-habilitada"
                  checked={selfieHabilitada}
                  onCheckedChange={setSelfieHabilitada}
                  aria-label="Exigir selfie de verificação"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Assinantes */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Assinantes
                </h3>
                <p className="text-sm text-muted-foreground">
                  Adicione as pessoas que deverao assinar o documento.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleAddSigner} aria-label="Adicionar novo assinante">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </div>

            <div className="space-y-3">
              {signers.map((s, idx) => (
                <div key={idx} className="rounded-md border p-4 space-y-3">
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
                        <option value="parte_contraria">Parte Contraria</option>
                        <option value="representante">Representante</option>
                        <option value="terceiro">Terceiro</option>
                        <option value="usuario">Usuario</option>
                      </select>
                    </div>
                    <Button
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
                      <p className="text-xs text-muted-foreground">
                        Busque por nome, CPF/CNPJ ou e-mail.
                      </p>
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
                      <p className="md:col-span-2 text-xs text-muted-foreground">
                        Se nao informados, o assinante podera preencher ao acessar o link publico.
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Botao de acao */}
          <div className="flex justify-end">
            <Button
              onClick={handleCreate}
              disabled={!canContinue || isCreating}
              size="lg"
            >
              {isCreating ? (
                "Criando documento..."
              ) : (
                <>
                  Continuar para Configuracao
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modal de upload */}
      {/* Modal de upload */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="max-w-5xl h-[80vh] p-0 overflow-hidden">
          <DialogTitle className="sr-only">Upload de Documento</DialogTitle>
          <DocumentUploadDropzone
            onUploadSuccess={(url, name) => {
              handleUploadSuccess(url, name);
              setIsUploadOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
