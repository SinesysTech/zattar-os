"use client";

import * as React from "react";
import { useEffect, useState, useCallback } from "react";
import {
  Eye,
  Download,
  Copy,
  CheckCircle2,
  Clock,
  FileText,
  XCircle,
  Loader2,
  ExternalLink,
  Users,
  Calendar,
  Pencil,
  FileUp,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DialogFormShell } from "@/components/shared/dialog-shell/dialog-form-shell";
import { toast } from "sonner";
import { actionListDocumentos, actionGetDocumento, actionGetPresignedPdfUrl } from "../../feature";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type AssinaturaDigitalDocumentoStatus = "rascunho" | "pronto" | "concluido" | "cancelado";

type DocumentoListItem = {
  id: number;
  documento_uuid: string;
  titulo: string | null;
  status: AssinaturaDigitalDocumentoStatus;
  selfie_habilitada: boolean;
  pdf_original_url: string;
  pdf_final_url: string | null;
  created_at: string;
  updated_at: string;
  _assinantes_count?: number;
  _assinantes_concluidos?: number;
};

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
  rascunho: "bg-gray-100 text-gray-800",
  pronto: "bg-blue-100 text-blue-800",
  concluido: "bg-green-100 text-green-800",
  cancelado: "bg-red-100 text-red-800",
};

const STATUS_ICONS: Record<AssinaturaDigitalDocumentoStatus, React.ReactNode> = {
  rascunho: <FileText className="h-4 w-4" />,
  pronto: <Clock className="h-4 w-4" />,
  concluido: <CheckCircle2 className="h-4 w-4" />,
  cancelado: <XCircle className="h-4 w-4" />,
};

export function ListaDocumentosClient() {
  const router = useRouter();
  const [documentos, setDocumentos] = useState<DocumentoListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<AssinaturaDigitalDocumentoStatus | "todos">("todos");
  const [documentoSelecionado, setDocumentoSelecionado] = useState<DocumentoCompleto | null>(null);
  const [isLoadingDetalhes, setIsLoadingDetalhes] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Verifica se documento pode ser editado (rascunho ou pronto sem assinantes concluídos)
  const podeEditar = useCallback((doc: DocumentoListItem) => {
    return doc.status === "rascunho" || (doc.status === "pronto" && (doc._assinantes_concluidos ?? 0) === 0);
  }, []);

  const carregarDocumentos = useCallback(async () => {
    setIsLoading(true);
    try {
      const resultado = await actionListDocumentos({
        page: 1,
        pageSize: 100,
        ...(statusFilter !== "todos" && { status: statusFilter }),
      });

      if (resultado.success && resultado.data && "documentos" in resultado.data) {
        const { documentos } = resultado.data as { documentos: DocumentoListItem[] };
        setDocumentos(documentos ?? []);
      } else {
        toast.error("Erro ao carregar documentos");
      }
    } catch (error) {
      toast.error("Erro ao carregar documentos");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

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
      // Buscar URL presigned para acesso ao bucket privado
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
      if (resultado.success && resultado.data && 'documento' in resultado.data) {
        const docData = (resultado.data as unknown) as {
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

  const handleEditarDocumento = useCallback((uuid: string) => {
    router.push(`/assinatura-digital/documentos/editar/${uuid}`);
  }, [router]);

  const documentosFiltrados = React.useMemo(() => {
    const base = documentos;
    if (!searchTerm.trim()) return base;
    const term = searchTerm.trim().toLowerCase();
    return base.filter((doc) => {
      const titulo = (doc.titulo || "").toLowerCase();
      const idLabel = `documento #${doc.id}`.toLowerCase();
      return titulo.includes(term) || idLabel.includes(term);
    });
  }, [documentos, searchTerm]);

  const stats = React.useMemo(() => {
    return {
      total: documentos.length,
      rascunho: documentos.filter((d) => d.status === "rascunho").length,
      pronto: documentos.filter((d) => d.status === "pronto").length,
      concluido: documentos.filter((d) => d.status === "concluido").length,
      cancelado: documentos.filter((d) => d.status === "cancelado").length,
    };
  }, [documentos]);

  return (
    <div className="space-y-6">
      {/* Header: apenas botão + (acima da tabela, alinhado à direita) */}
      <div className="flex items-center justify-end">
        <Button
          size="icon"
          className="size-8 bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={() => router.push("/assinatura-digital?tab=documentos&mode=novo")}
        >
          <FileUp className="h-5 w-5" />
          <span className="sr-only">Novo documento para assinatura</span>
        </Button>
      </div>

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
            <FileText className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rascunho}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prontos</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pronto}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.concluido}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelados</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.cancelado}</div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar acima da tabela: search + filtro de status */}
      <Card>
        <CardContent className="flex flex-col gap-3 border-b px-4 py-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full max-w-xs">
            <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8 w-full rounded-md border border-input bg-white ps-8 text-sm shadow-sm dark:bg-gray-950"
              placeholder="Filtrar documentos..."
            />
          </div>
          <div className="flex items-center gap-3">
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}
            >
              <SelectTrigger className="h-8 w-[220px] bg-white dark:bg-gray-950 border-dashed">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-950">
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="rascunho">Rascunho</SelectItem>
                <SelectItem value="pronto">Pronto para Assinatura</SelectItem>
                <SelectItem value="concluido">Concluído</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>

        {/* Tabela */}
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : documentosFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Nenhum documento encontrado</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {statusFilter !== "todos"
                  ? `Não há documentos com o status "${STATUS_LABELS[statusFilter]}"`
                  : "Comece criando um novo documento para assinatura"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assinantes</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documentosFiltrados.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">
                      {doc.titulo || `Documento #${doc.id}`}
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[doc.status]} variant="secondary">
                        <span className="flex items-center gap-1.5">
                          {STATUS_ICONS[doc.status]}
                          {STATUS_LABELS[doc.status]}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        {doc._assinantes_concluidos ?? 0}/{doc._assinantes_count ?? 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(doc.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {podeEditar(doc) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditarDocumento(doc.documento_uuid)}
                            title="Editar documento"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleVerDetalhes(doc.documento_uuid)}
                          title="Ver detalhes"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {doc.pdf_final_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadPdf(doc.pdf_final_url!, doc.titulo || "documento")}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        {!doc.pdf_final_url && doc.pdf_original_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadPdf(doc.pdf_original_url, doc.titulo || "documento")}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Detalhes */}
      <DialogFormShell
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        title="Detalhes do Documento"
        description="Informações completas e assinantes do documento"
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
                <h3 className="text-sm font-medium text-muted-foreground">Título</h3>
                <p className="text-base font-medium">
                  {documentoSelecionado.titulo || `Documento #${documentoSelecionado.id}`}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                <Badge className={STATUS_COLORS[documentoSelecionado.status]} variant="secondary">
                  <span className="flex items-center gap-1.5">
                    {STATUS_ICONS[documentoSelecionado.status]}
                    {STATUS_LABELS[documentoSelecionado.status]}
                  </span>
                </Badge>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Selfie Habilitada</h3>
                <p className="text-base">{documentoSelecionado.selfie_habilitada ? "Sim" : "Não"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">UUID do Documento</h3>
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
                            <Badge variant="outline">{assinante.assinante_tipo}</Badge>
                            <Badge
                              className={
                                assinante.status === "concluido"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }
                              variant="secondary"
                            >
                              {assinante.status === "concluido" ? "Concluído" : "Pendente"}
                            </Badge>
                          </div>
                          <div className="text-sm space-y-1">
                            {(assinante.dados_snapshot.nome_completo as string | undefined) && (
                              <p>
                                <span className="font-medium">Nome:</span>{" "}
                                {String(assinante.dados_snapshot.nome_completo)}
                              </p>
                            )}
                            {(assinante.dados_snapshot.email as string | undefined) && (
                              <p>
                                <span className="font-medium">Email:</span>{" "}
                                {String(assinante.dados_snapshot.email)}
                              </p>
                            )}
                            {(assinante.dados_snapshot.cpf as string | undefined) && (
                              <p>
                                <span className="font-medium">CPF:</span>{" "}
                                {String(assinante.dados_snapshot.cpf)}
                              </p>
                            )}
                            {assinante.concluido_em && (
                              <p className="text-muted-foreground">
                                <span className="font-medium">Concluído em:</span>{" "}
                                {format(new Date(assinante.concluido_em), "dd/MM/yyyy HH:mm", {
                                  locale: ptBR,
                                })}
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
                            onClick={() => window.open(`/assinatura/${assinante.token}`, "_blank")}
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
    </div>
  );
}
