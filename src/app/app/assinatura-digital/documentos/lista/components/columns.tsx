"use client";

import { ColumnDef } from "@tanstack/react-table";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { DataTableColumnHeader } from "./data-table-column-header";
import { statuses } from "./data/data";

export type DocumentoListItem = {
  id: number;
  documento_uuid: string;
  titulo: string | null;
  status: "rascunho" | "pronto" | "concluido" | "cancelado";
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

const STATUS_COLORS: Record<string, string> = {
  rascunho: "bg-gray-100 text-gray-800",
  pronto: "bg-blue-100 text-blue-800",
  concluido: "bg-green-100 text-green-800",
  cancelado: "bg-red-100 text-red-800",
};

export function createColumns(actions: ColumnActions): ColumnDef<DocumentoListItem>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Selecionar todos"
          className="translate-y-[2px]"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Selecionar linha"
          className="translate-y-[2px]"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "id",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="ID" />
      ),
      cell: ({ row }) => <div className="w-[60px] font-medium">#{row.getValue("id")}</div>,
      enableSorting: false,
      enableHiding: false,
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
          <div className="flex space-x-2">
            <span className="max-w-[300px] truncate font-medium">
              {titulo || `Documento #${id}`}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const statusValue = row.getValue("status") as string;
        const status = statuses.find((s) => s.value === statusValue);

        if (!status) {
          return null;
        }

        return (
          <Badge className={STATUS_COLORS[statusValue]} variant="secondary">
            <span className="flex items-center gap-1.5">
              {status.icon && <status.icon className="h-4 w-4" />}
              {status.label}
            </span>
          </Badge>
        );
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      id: "assinantes",
      accessorFn: (row) => `${row._assinantes_concluidos ?? 0}/${row._assinantes_count ?? 0}`,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Assinantes" />
      ),
      cell: ({ row }) => {
        const concluidos = row.original._assinantes_concluidos ?? 0;
        const total = row.original._assinantes_count ?? 0;
        return (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            {concluidos}/{total}
          </div>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Criado em" />
      ),
      cell: ({ row }) => {
        const date = row.getValue("created_at") as string;
        return (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            {format(new Date(date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const doc = row.original;
        const podeEditar = doc.status === "rascunho" || (doc.status === "pronto" && (doc._assinantes_concluidos ?? 0) === 0);
        const podeDeletar = doc.status !== "concluido" && (doc._assinantes_concluidos ?? 0) === 0;
        const pdfUrl = doc.pdf_final_url || doc.pdf_original_url;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Abrir menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[160px] bg-background">
              <DropdownMenuItem onClick={() => actions.onView(doc.documento_uuid)}>
                <Eye className="mr-2 h-4 w-4" />
                Ver detalhes
              </DropdownMenuItem>
              {podeEditar && (
                <DropdownMenuItem onClick={() => actions.onEdit(doc.documento_uuid)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => actions.onDownload(pdfUrl, doc.titulo || "documento")}>
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
        );
      },
    },
  ];
}
