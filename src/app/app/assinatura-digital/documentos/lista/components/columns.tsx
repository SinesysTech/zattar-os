"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  Eye,
  Download,
  Pencil,
  Trash2,
  Users,
  Calendar,
  MoreHorizontal,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTableColumnHeader } from "@/components/shared/data-shell/data-table-column-header";
import type { AssinaturaDigitalDocumentoStatus } from "../../../feature/domain";
import { statuses } from "./data/data";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DocumentoListItem = {
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

interface ColumnActions {
  onEdit: (uuid: string) => void;
  onView: (uuid: string) => void;
  onDelete: (doc: DocumentoListItem) => void;
  onDownload: (url: string, titulo: string) => void;
}

const STATUS_COLORS: Record<AssinaturaDigitalDocumentoStatus, string> = {
  rascunho: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  pronto: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  concluido: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  cancelado: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

// ---------------------------------------------------------------------------
// Column factory
// ---------------------------------------------------------------------------

export function createColumns(actions: ColumnActions): ColumnDef<DocumentoListItem>[] {
  return [
    {
      accessorKey: "id",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="ID" />
      ),
      cell: ({ row }) => (
        <div className="min-h-10 flex items-center text-sm font-medium">
          #{row.getValue("id")}
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
      size: 80,
      meta: { align: "left" as const, headerLabel: "ID" },
    },
    {
      accessorKey: "titulo",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Título" />
      ),
      cell: ({ row }) => {
        const titulo = row.getValue("titulo") as string | null;
        const id = row.original.id;
        return (
          <div className="min-h-10 flex items-center text-sm">
            <span className="max-w-[300px] truncate font-medium">
              {titulo || `Documento #${id}`}
            </span>
          </div>
        );
      },
      enableSorting: true,
      size: 250,
      meta: { align: "left" as const, headerLabel: "Título" },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const statusValue = row.getValue("status") as AssinaturaDigitalDocumentoStatus;
        const status = statuses.find((s) => s.value === statusValue);
        if (!status) return null;

        return (
          <div className="min-h-10 flex items-center">
            <Badge className={STATUS_COLORS[statusValue]} variant="secondary">
              <span className="flex items-center gap-1.5">
                {status.icon && <status.icon className="h-3.5 w-3.5" />}
                {status.label}
              </span>
            </Badge>
          </div>
        );
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
      enableSorting: true,
      size: 180,
      meta: { align: "left" as const, headerLabel: "Status" },
    },
    {
      id: "assinantes",
      accessorFn: (row) =>
        `${row._assinantes_concluidos ?? 0}/${row._assinantes_count ?? 0}`,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Assinantes" />
      ),
      cell: ({ row }) => {
        const concluidos = row.original._assinantes_concluidos ?? 0;
        const total = row.original._assinantes_count ?? 0;
        return (
          <div className="min-h-10 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            {concluidos}/{total}
          </div>
        );
      },
      enableSorting: false,
      size: 120,
      meta: { align: "left" as const, headerLabel: "Assinantes" },
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Criado em" />
      ),
      cell: ({ row }) => {
        const date = row.getValue("created_at") as string;
        return (
          <div className="min-h-10 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            {format(new Date(date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
          </div>
        );
      },
      enableSorting: true,
      size: 180,
      meta: { align: "left" as const, headerLabel: "Criado em" },
    },
    {
      id: "acoes",
      header: () => <span className="text-sm font-medium">Ações</span>,
      cell: ({ row }) => {
        const doc = row.original;
        const podeEditar =
          doc.status === "rascunho" ||
          (doc.status === "pronto" && (doc._assinantes_concluidos ?? 0) === 0);
        const podeDeletar =
          doc.status !== "concluido" &&
          (doc._assinantes_concluidos ?? 0) === 0;
        const pdfUrl = doc.pdf_final_url || doc.pdf_original_url;

        return (
          <div className="min-h-10 flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Abrir menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[160px]">
                <DropdownMenuItem
                  onClick={() => actions.onView(doc.documento_uuid)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Ver detalhes
                </DropdownMenuItem>
                {podeEditar && (
                  <DropdownMenuItem
                    onClick={() => actions.onEdit(doc.documento_uuid)}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() =>
                    actions.onDownload(pdfUrl, doc.titulo || "documento")
                  }
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </DropdownMenuItem>
                {podeDeletar && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => actions.onDelete(doc)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Deletar
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
      size: 80,
      meta: { headerLabel: "Ações" },
    },
  ];
}
