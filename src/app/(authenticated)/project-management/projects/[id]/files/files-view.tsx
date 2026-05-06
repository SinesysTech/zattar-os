"use client";

import { cn } from '@/lib/utils';
import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft, Upload, FileIcon, Trash2, Download} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heading, Text } from '@/components/ui/typography';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Anexo, Projeto } from "../../../domain";
import {
  actionUploadAnexo,
  actionExcluirAnexo,
} from "../../../actions/file.actions";

import { LoadingSpinner } from "@/components/ui/loading-state"
interface FilesViewProps {
  projeto: Projeto;
  anexos: Anexo[];
}

function formatFileSize(bytes: number | null): string {
  if (bytes == null || bytes === 0) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let size = bytes;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function FilesView({
  projeto,
  anexos,
}: FilesViewProps) {
  const [isPending, startTransition] = React.useTransition();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [deleteAnexoId, setDeleteAnexoId] = React.useState<string | null>(null);

  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    const oversized = fileList.filter((f) => f.size > MAX_FILE_SIZE);
    if (oversized.length > 0) {
      toast.error(
        `Arquivo(s) excede(m) o limite de 50MB: ${oversized.map((f) => f.name).join(", ")}`
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    startTransition(async () => {
      let successCount = 0;
      let _errorCount = 0;
      for (const file of fileList) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("projetoId", projeto.id);
        const result = await actionUploadAnexo(formData);
        if (result.success) {
          successCount++;
        } else {
          _errorCount++;
          toast.error(
            result.error?.message ?? `Erro ao enviar ${file.name}.`
          );
        }
      }
      if (successCount > 0) {
        toast.success(
          successCount === 1
            ? "Arquivo enviado com sucesso."
            : `${successCount} arquivos enviados com sucesso.`
        );
      }
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDelete = (anexoId: string) => {
    startTransition(async () => {
      const result = await actionExcluirAnexo(anexoId, projeto.id);
      if (result.success) {
        toast.success("Arquivo excluído com sucesso.");
      } else {
        toast.error(result.error?.message ?? "Erro ao excluir arquivo.");
      }
      setDeleteAnexoId(null);
    });
  };

  return (
    <div className={cn("flex flex-col stack-default")}>
      <div className="flex items-center justify-between">
        <div className={cn("flex items-center inline-medium")}>
          <Button variant="ghost" size="icon" aria-label="Voltar" asChild>
            <Link href={`/app/project-management/projects/${projeto.id}`}>
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <Heading level="page">Arquivos</Heading>
            <p className={cn("text-muted-foreground text-body-sm")}>{projeto.nome}</p>
          </div>
        </div>

        <div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar"
            className="hidden"
            onChange={handleUpload}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isPending}
          >
            {isPending ? (
              <LoadingSpinner className="mr-1" />
            ) : (
              <Upload className="mr-1 size-4" />
            )}
            Upload
          </Button>
        </div>
      </div>

      {anexos.length === 0 ? (
        <Card>
          <CardContent className={cn("py-12 text-center")}>
            <FileIcon className="mx-auto size-10 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">
              Nenhum arquivo enviado. Clique em &quot;Upload&quot; para
              adicionar arquivos.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className={cn(/* design-system-escape: p-0 → usar <Inset> */ "p-0")}>
            <div className="divide-y">
              {anexos.map((anexo) => (
                <div
                  key={anexo.id}
                  className={cn("flex items-center justify-between px-4 py-3")}
                >
                  <div className={cn("flex items-center inline-medium min-w-0")}>
                    <FileIcon className="size-5 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className={cn( "text-body-sm font-medium truncate")}>
                        {anexo.nomeArquivo}
                      </p>
                      <Text variant="caption">
                        {formatFileSize(anexo.tamanhoBytes)}
                        {anexo.usuarioNome && ` · ${anexo.usuarioNome}`}
                        {" · "}
                        {new Date(anexo.createdAt).toLocaleDateString("pt-BR")}
                      </Text>
                    </div>
                  </div>

                  <div className={cn("flex items-center inline-micro")}>
                    <Button variant="ghost" size="icon" aria-label="Baixar" asChild>
                      <a
                        href={anexo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                      >
                        <Download className="size-4" />
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon" aria-label="Excluir"
                      className="text-destructive"
                      onClick={() => setDeleteAnexoId(anexo.id)}
                      disabled={isPending}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <AlertDialog
        open={!!deleteAnexoId}
        onOpenChange={(open) => !open && setDeleteAnexoId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir arquivo?</AlertDialogTitle>
            <AlertDialogDescription>
              O arquivo será removido permanentemente do projeto. Esta ação não
              pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteAnexoId) handleDelete(deleteAnexoId);
              }}
            >
              Sim, excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
