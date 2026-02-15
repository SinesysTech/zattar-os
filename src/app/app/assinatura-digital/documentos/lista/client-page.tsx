"use client";

import * as React from "react";
import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Copy,
  CheckCircle2,
  Clock,
  FileText,
  XCircle,
  Loader2,
  ExternalLink,
  Download,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DialogFormShell } from "@/components/shared/dialog-shell/dialog-form-shell";
import { toast } from "sonner";
import {
  actionListDocumentos,
  actionGetDocumento,
  actionGetPresignedPdfUrl,
  actionDeleteDocumento,
} from "../../feature";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { DataTable } from "./components/data-table";
import { createColumns, DocumentoListItem } from "./components/columns";

type AssinaturaDigitalDocumentoStatus =
  | "rascunho"
  | "pronto"
  | "concluido"
  | "cancelado";

type DocumentoCompleto = DocumentoListItem & {
  assinantes: Array<{
    id: number;
    assinante_tipo: string;
    dados_snapshot: Record<string, unknown>;
    token: string;
    status: "pendente" | "concluido";
    concluido_em: string | null;
  }>;
  ancoras: Array<{
    id: number;
    tipo: "assinatura" | "rubrica";
    pagina: number;
  }>;
};

const STATUS_LABELS: Record<AssinaturaDigitalDocumentoStatus, string> = {
  rascunho: "Rascunho",
  pronto: "Pronto para Assinatura",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

const STATUS_COLORS: Record<AssinaturaDigitalDocumentoStatus, string> = {
  rascunho: "bg-gray-600/10 text-gray-600",
  pronto: "bg-blue-600/10 text-blue-600",
  concluido: "bg-green-600/10 text-green-600",
  cancelado: "bg-red-600/10 text-red-600",
};

const STATUS_ICONS: Record<AssinaturaDigitalDocumentoStatus, React.ReactNode> =
  {
    rascunho: <FileText className="h-4 w-4" />,
    pronto: <Clock className="h-4 w-4" />,
    concluido: <CheckCircle2 className="h-4 w-4" />,
    cancelado: <XCircle className="h-4 w-4" />,
  };

export function ListaDocumentosClient() {
  const router = useRouter();
  const [documentos, setDocumentos] = useState<DocumentoListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [documentoSelecionado, setDocumentoSelecionado] =
    useState<DocumentoCompleto | null>(null);
  const [isLoadingDetalhes, setIsLoadingDetalhes] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [documentoParaDeletar, setDocumentoParaDeletar] =
    useState<DocumentoListItem | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const carregarDocumentos = useCallback(async () => {
    setIsLoading(true);
    try {
      const resultado = await actionListDocumentos({
        page: 1,
        pageSize: 100,
      });

      if (resultado.success && resultado.data && "documentos" in resultado.data) {
        const { documentos } = resultado.data as {
          documentos: DocumentoListItem[];
        };
        setDocumentos(documentos ?? []);
      } else {
        const errorMessage =
          !resultado.success && "error" in resultado
            ? resultado.error
            : "Erro desconhecido ao carregar documentos";
        toast.error(`Não foi possível carregar os documentos: ${errorMessage}`);
        console.error("[ListaDocumentos] Erro:", resultado);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro desconhecido";
      toast.error(`Não foi possível carregar os documentos: ${errorMessage}`);
      console.error("[ListaDocumentos] Exception:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarDocumentos();
  }, [carregarDocumentos]);

  const handleCopyLink = useCallback(async (token: string) => {
    const link = `${window.location.origin}/assinatura/${token}`;
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Link copiado para a área de transferência");
    } catch {
      toast.error("Erro ao copiar link");
    }
  }, []);

  const handleDownloadPdf = useCallback(async (url: string, titulo: string) => {
    try {
      const result = await actionGetPresignedPdfUrl({ url });
      const presignedUrl =
        result.success && result.data && "presignedUrl" in result.data
          ? (result.data as { presignedUrl: string }).presignedUrl
          : null;

      if (!presignedUrl) {
        toast.error("Erro ao gerar link de download");
        return;
      }

      const link = document.createElement("a");
      link.href = presignedUrl;
      link.download = `${titulo || "documento"}.pdf`;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      toast.error("Erro ao baixar documento");
    }
  }, []);

  const handleVerDetalhes = useCallback(async (uuid: string) => {
    setIsLoadingDetalhes(true);
    setIsDialogOpen(true);
    try {
      const resultado = await actionGetDocumento({ uuid });
      if (resultado.success && resultado.data && "documento" in resultado.data) {
        const docData = resultado.data as unknown as {
          documento: {
            id: number;
            documento_uuid: string;
            titulo: string | null;
            status: AssinaturaDigitalDocumentoStatus;
            selfie_habilitada: boolean;
            pdf_original_url: string;
            pdf_final_url: string | null;
            created_at: string;
            updated_at: string;
          };
          assinantes: Array<{
            id: number;
            assinante_tipo: string;
            dados_snapshot: Record<string, unknown>;
            token: string;
            status: "pendente" | "concluido";
            concluido_em: string | null;
          }>;
          ancoras: Array<{
            id: number;
            tipo: "assinatura" | "rubrica";
            pagina: number;
          }>;
        };
        const documentoCompleto: DocumentoCompleto = {
          id: docData.documento.id,
          documento_uuid: docData.documento.documento_uuid,
          titulo: docData.documento.titulo,
          status: docData.documento.status,
          selfie_habilitada: docData.documento.selfie_habilitada,
          pdf_original_url: docData.documento.pdf_original_url,
          pdf_final_url: docData.documento.pdf_final_url,
          created_at: docData.documento.created_at,
          updated_at: docData.documento.updated_at,
          assinantes: docData.assinantes,
          ancoras: docData.ancoras,
        };
        setDocumentoSelecionado(documentoCompleto);
      } else {
        toast.error("Erro ao carregar detalhes do documento");
        setIsDialogOpen(false);
      }
    } catch (error) {
      toast.error("Erro ao carregar detalhes do documento");
      console.error(error);
      setIsDialogOpen(false);
    } finally {
      setIsLoadingDetalhes(false);
    }
  }, []);

  const handleEditarDocumento = useCallback(
    (uuid: string) => {
      router.push(`/app/assinatura-digital/documentos/editar/${uuid}`);
    },
    [router]
  );

  const handleConfirmarDelete = useCallback((doc: DocumentoListItem) => {
    setDocumentoParaDeletar(doc);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleDeletarDocumento = useCallback(async () => {
    if (!documentoParaDeletar) return;

    setIsDeleting(true);
    try {
      const resultado = await actionDeleteDocumento({
        uuid: documentoParaDeletar.documento_uuid,
      });

      if (resultado.success) {
        toast.success("Documento deletado com sucesso");
        setIsDeleteDialogOpen(false);
        setDocumentoParaDeletar(null);
        carregarDocumentos();
      } else {
        const errorMessage =
          "error" in resultado ? resultado.error : "Erro ao deletar documento";
        toast.error(errorMessage);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro ao deletar documento";
      toast.error(errorMessage);
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  }, [documentoParaDeletar, carregarDocumentos]);

  const columns = useMemo(
    () =>
      createColumns({
        onEdit: handleEditarDocumento,
        onView: handleVerDetalhes,
        onDelete: handleConfirmarDelete,
        onDownload: handleDownloadPdf,
      }),
    [handleEditarDocumento, handleVerDetalhes, handleConfirmarDelete, handleDownloadPdf]
  );

  const stats = useMemo(() => {
    return {
      total: documentos.length,
      rascunho: documentos.filter((d) => d.status === "rascunho").length,
      pronto: documentos.filter((d) => d.status === "pronto").length,
      concluido: documentos.filter((d) => d.status === "concluido").length,
      cancelado: documentos.filter((d) => d.status === "cancelado").length,
    };
  }, [documentos]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rascunhos</CardTitle>
            <FileText className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rascunho}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prontos</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pronto}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.concluido}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelados</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.cancelado}</div>
          </CardContent>
        </Card>
      </div>

      {/* DataTable com Toolbar e Paginação - sem cards envelopando */}
      <DataTable columns={columns} data={documentos} />

      {/* Dialog de Detalhes */}
      <DialogFormShell
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        title="Detalhes do Documento"
        maxWidth="3xl"
        footer={null}
      >
        {isLoadingDetalhes ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : documentoSelecionado ? (
          <div className="space-y-6">
            {/* Informações do Documento */}
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Título
                </h3>
                <p className="text-base font-medium">
                  {documentoSelecionado.titulo ||
                    `Documento #${documentoSelecionado.id}`}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Status
                </h3>
                <Badge
                  className={STATUS_COLORS[documentoSelecionado.status]}
                  variant="secondary"
                >
                  <span className="flex items-center gap-1.5">
                    {STATUS_ICONS[documentoSelecionado.status]}
                    {STATUS_LABELS[documentoSelecionado.status]}
                  </span>
                </Badge>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Selfie Habilitada
                </h3>
                <p className="text-base">
                  {documentoSelecionado.selfie_habilitada ? "Sim" : "Não"}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  UUID do Documento
                </h3>
                <p className="text-xs font-mono bg-muted p-2 rounded">
                  {documentoSelecionado.documento_uuid}
                </p>
              </div>
            </div>

            {/* Lista de Assinantes */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">
                Assinantes ({documentoSelecionado.assinantes.length})
              </h3>
              <div className="space-y-3">
                {documentoSelecionado.assinantes.map((assinante) => (
                  <Card key={assinante.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {assinante.assinante_tipo}
                            </Badge>
                            <Badge
                              className={
                                assinante.status === "concluido"
                                  ? "bg-green-600/10 text-green-600"
                                  : "bg-orange-600/10 text-orange-600"
                              }
                              variant="secondary"
                            >
                              {assinante.status === "concluido"
                                ? "Concluído"
                                : "Pendente"}
                            </Badge>
                          </div>
                          <div className="text-sm space-y-1">
                            {(assinante.dados_snapshot.nome_completo as
                              | string
                              | undefined) && (
                              <p>
                                <span className="font-medium">Nome:</span>{" "}
                                {String(assinante.dados_snapshot.nome_completo)}
                              </p>
                            )}
                            {(assinante.dados_snapshot.email as
                              | string
                              | undefined) && (
                              <p>
                                <span className="font-medium">Email:</span>{" "}
                                {String(assinante.dados_snapshot.email)}
                              </p>
                            )}
                            {(assinante.dados_snapshot.cpf as
                              | string
                              | undefined) && (
                              <p>
                                <span className="font-medium">CPF:</span>{" "}
                                {String(assinante.dados_snapshot.cpf)}
                              </p>
                            )}
                            {assinante.concluido_em && (
                              <p className="text-muted-foreground">
                                <span className="font-medium">
                                  Concluído em:
                                </span>{" "}
                                {format(
                                  new Date(assinante.concluido_em),
                                  "dd/MM/yyyy HH:mm",
                                  {
                                    locale: ptBR,
                                  }
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyLink(assinante.token)}
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            Copiar Link
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              window.open(
                                `/assinatura/${assinante.token}`,
                                "_blank"
                              )
                            }
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Downloads */}
            <div className="flex gap-3 pt-4 border-t">
              {documentoSelecionado.pdf_original_url && (
                <Button
                  variant="outline"
                  onClick={() =>
                    handleDownloadPdf(
                      documentoSelecionado.pdf_original_url,
                      `${documentoSelecionado.titulo || "documento"}_original`
                    )
                  }
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF Original
                </Button>
              )}
              {documentoSelecionado.pdf_final_url && (
                <Button
                  onClick={() =>
                    handleDownloadPdf(
                      documentoSelecionado.pdf_final_url!,
                      `${documentoSelecionado.titulo || "documento"}_assinado`
                    )
                  }
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF Assinado
                </Button>
              )}
            </div>
          </div>
        ) : null}
      </DialogFormShell>

      {/* Dialog de Confirmação de Exclusão */}
      <DialogFormShell
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          if (!isDeleting) {
            setIsDeleteDialogOpen(open);
            if (!open) setDocumentoParaDeletar(null);
          }
        }}
        title="Confirmar Exclusão"
        maxWidth="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setDocumentoParaDeletar(null);
              }}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeletarDocumento}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deletando...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Deletar
                </>
              )}
            </Button>
          </div>
        }
      >
        {documentoParaDeletar && (
          <div className="space-y-4">
            <p>
              Tem certeza que deseja deletar o documento{" "}
              <strong>
                {documentoParaDeletar.titulo || `#${documentoParaDeletar.id}`}
              </strong>
              ?
            </p>
            <div className="rounded-md bg-muted p-4 text-sm">
              <p className="text-muted-foreground">
                O documento e todos os dados relacionados (assinantes, âncoras)
                serão permanentemente removidos.
              </p>
            </div>
          </div>
        )}
      </DialogFormShell>
    </div>
  );
}
