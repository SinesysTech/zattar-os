"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { Table as TanstackTable, SortingState } from "@tanstack/react-table";
import {
  Copy,
  CheckCircle2,
  Clock,
  FileText,
  FileUp,
  XCircle,
  Loader2,
  ExternalLink,
  Download,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DataTable,
  DataShell,
  DataTableToolbar,
  DataPagination,
} from "@/components/shared/data-shell";
import { DialogFormShell } from "@/components/shared/dialog-shell/dialog-form-shell";
import { FilterPopover, type FilterOption } from "@/features/partes/components/shared";
import { useDebounce } from "@/hooks/use-debounce";

import {
  actionListDocumentos,
  actionGetDocumento,
  actionGetPresignedPdfUrl,
  actionDeleteDocumento,
} from "../../feature";
import type { AssinaturaDigitalDocumentoStatus } from "../../feature/domain";
import { createColumns, type DocumentoListItem } from "./components/columns";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

interface DocumentosTableWrapperProps {
  initialData?: DocumentoListItem[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

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

const STATUS_ICONS: Record<AssinaturaDigitalDocumentoStatus, React.ReactNode> = {
  rascunho: <FileText className="h-4 w-4" />,
  pronto: <Clock className="h-4 w-4" />,
  concluido: <CheckCircle2 className="h-4 w-4" />,
  cancelado: <XCircle className="h-4 w-4" />,
};

const STATUS_FILTER_OPTIONS: readonly FilterOption[] = [
  { value: "rascunho", label: "Rascunho" },
  { value: "pronto", label: "Pronto" },
  { value: "concluido", label: "Concluído" },
  { value: "cancelado", label: "Cancelado" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DocumentosTableWrapper({
  initialData = [],
}: DocumentosTableWrapperProps) {
  const router = useRouter();

  // -- State: Data
  const [documentos, setDocumentos] = React.useState<DocumentoListItem[]>(initialData);
  const [table, setTable] = React.useState<TanstackTable<DocumentoListItem> | null>(null);

  // -- State: Pagination (0-based for UI)
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(50);

  // -- State: Loading/Error
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // -- State: Filters
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [sorting, setSorting] = React.useState<SortingState>([]);

  // -- State: Dialogs
  const [documentoSelecionado, setDocumentoSelecionado] =
    React.useState<DocumentoCompleto | null>(null);
  const [isLoadingDetalhes, setIsLoadingDetalhes] = React.useState(false);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [documentoParaDeletar, setDocumentoParaDeletar] =
    React.useState<DocumentoListItem | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // -- Debounce search
  const buscaDebounced = useDebounce(globalFilter, 500);

  // -- Data fetching
  const refetch = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const resultado = await actionListDocumentos({
        page: 1,
        pageSize: 200,
      });

      if (resultado.success && resultado.data && "documentos" in resultado.data) {
        const { documentos: docs } = resultado.data as {
          documentos: DocumentoListItem[];
        };
        setDocumentos(docs ?? []);
      } else {
        const errorMessage =
          !resultado.success && "error" in resultado
            ? resultado.error
            : "Erro desconhecido ao carregar documentos";
        setError(typeof errorMessage === "string" ? errorMessage : "Erro ao carregar");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar documentos");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Skip first render if initialData provided
  const isFirstRender = React.useRef(true);

  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (initialData.length > 0) return;
    }
    refetch();
  }, [refetch, initialData.length]);

  // -- Client-side search + status filter
  const filteredDocumentos = React.useMemo(() => {
    let result = documentos;

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((d) => d.status === statusFilter);
    }

    // Search filter
    if (buscaDebounced) {
      const lower = buscaDebounced.toLowerCase();
      result = result.filter(
        (d) =>
          d.titulo?.toLowerCase().includes(lower) ||
          d.documento_uuid.toLowerCase().includes(lower) ||
          String(d.id).includes(lower)
      );
    }

    return result;
  }, [documentos, statusFilter, buscaDebounced]);

  // -- Client-side pagination
  const totalFiltered = filteredDocumentos.length;
  const totalPages = Math.ceil(totalFiltered / pageSize);
  const paginatedDocumentos = React.useMemo(() => {
    const start = pageIndex * pageSize;
    return filteredDocumentos.slice(start, start + pageSize);
  }, [filteredDocumentos, pageIndex, pageSize]);

  // -- Stats (always from full dataset, not filtered)
  const stats = React.useMemo(() => ({
    total: documentos.length,
    rascunho: documentos.filter((d) => d.status === "rascunho").length,
    pronto: documentos.filter((d) => d.status === "pronto").length,
    concluido: documentos.filter((d) => d.status === "concluido").length,
    cancelado: documentos.filter((d) => d.status === "cancelado").length,
  }), [documentos]);

  // -- Handlers: Actions
  const handleCopyLink = React.useCallback(async (token: string) => {
    const link = `${window.location.origin}/assinatura/${token}`;
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Link copiado para a área de transferência");
    } catch {
      toast.error("Erro ao copiar link");
    }
  }, []);

  const handleDownloadPdf = React.useCallback(async (url: string, titulo: string) => {
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

  const handleVerDetalhes = React.useCallback(async (uuid: string) => {
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
          assinantes: DocumentoCompleto["assinantes"];
          ancoras: DocumentoCompleto["ancoras"];
        };
        setDocumentoSelecionado({
          ...docData.documento,
          assinantes: docData.assinantes,
          ancoras: docData.ancoras,
        });
      } else {
        toast.error("Erro ao carregar detalhes do documento");
        setIsDialogOpen(false);
      }
    } catch {
      toast.error("Erro ao carregar detalhes do documento");
      setIsDialogOpen(false);
    } finally {
      setIsLoadingDetalhes(false);
    }
  }, []);

  const handleEditarDocumento = React.useCallback(
    (uuid: string) => {
      router.push(`/app/assinatura-digital/documentos/editar/${uuid}`);
    },
    [router]
  );

  const handleConfirmarDelete = React.useCallback((doc: DocumentoListItem) => {
    setDocumentoParaDeletar(doc);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleDeletarDocumento = React.useCallback(async () => {
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
        refetch();
      } else {
        const errorMessage =
          "error" in resultado ? resultado.error : "Erro ao deletar documento";
        toast.error(typeof errorMessage === "string" ? errorMessage : "Erro ao deletar");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao deletar documento"
      );
    } finally {
      setIsDeleting(false);
    }
  }, [documentoParaDeletar, refetch]);

  // -- Columns
  const columns = React.useMemo(
    () =>
      createColumns({
        onEdit: handleEditarDocumento,
        onView: handleVerDetalhes,
        onDelete: handleConfirmarDelete,
        onDownload: handleDownloadPdf,
      }),
    [handleEditarDocumento, handleVerDetalhes, handleConfirmarDelete, handleDownloadPdf]
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <>
      {/* Row 1: Título + Botão "Novo Documento" */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight font-heading">
          Documentos
        </h1>
        <Button
          size="sm"
          className="h-9"
          onClick={() =>
            router.push("/app/assinatura-digital/documentos/novo")
          }
        >
          <FileUp className="h-4 w-4" />
          Novo Documento
        </Button>
      </div>

      {/* Row 2: Stats Cards */}
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

      {/* Row 3: DataShell (Toolbar + Table + Pagination) */}
      <DataShell
        header={
          table ? (
            <DataTableToolbar
              table={table}
              searchValue={globalFilter}
              onSearchValueChange={(value) => {
                setGlobalFilter(value);
                setPageIndex(0);
              }}
              searchPlaceholder="Buscar documentos..."
              filtersSlot={
                <FilterPopover
                  label="Status"
                  options={STATUS_FILTER_OPTIONS}
                  value={statusFilter}
                  onValueChange={(v) => {
                    setStatusFilter(v);
                    setPageIndex(0);
                  }}
                  defaultValue="all"
                />
              }
            />
          ) : (
            <div className="p-6" />
          )
        }
        footer={
          totalPages > 0 ? (
            <DataPagination
              pageIndex={pageIndex}
              pageSize={pageSize}
              total={totalFiltered}
              totalPages={totalPages}
              onPageChange={setPageIndex}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPageIndex(0);
              }}
              isLoading={isLoading}
            />
          ) : null
        }
      >
        <DataTable
          data={paginatedDocumentos}
          columns={columns}
          pagination={{
            pageIndex,
            pageSize,
            total: totalFiltered,
            totalPages,
            onPageChange: setPageIndex,
            onPageSizeChange: setPageSize,
          }}
          sorting={sorting}
          onSortingChange={setSorting}
          isLoading={isLoading}
          error={error}
          emptyMessage="Nenhum documento encontrado."
          onTableReady={(t) =>
            setTable(t as TanstackTable<DocumentoListItem>)
          }
          hidePagination
        />
      </DataShell>

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
                                  { locale: ptBR }
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
    </>
  );
}
