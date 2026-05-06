"use client";

import { Upload, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { UploadContextPanelProps } from '../types';
import { Text } from '@/components/ui/typography';

/**
 * UploadContextPanel - Painel informativo lateral com instruções de upload
 *
 * Exibe badge de step, título, descrição dos tipos suportados,
 * botão de seleção de arquivo e informação de segurança.
 *
 * @example
 * ```tsx
 * <UploadContextPanel
 *   onSelectFile={() => inputRef.current?.click()}
 *   isUploading={false}
 * />
 * ```
 */
export function UploadContextPanel({
  onSelectFile,
  isUploading,
}: UploadContextPanelProps) {
  return (
    <div className={cn(/* design-system-escape: lg:p-8 sem equivalente DS */ "group relative flex flex-col justify-center stack-loose inset-dialog lg:p-8 animate-fade-in-left animate-duration-500")}>
      {/* Blob decorativo de fundo */}
      <div
        className={cn(
          "absolute -left-10 -top-10 size-40 rounded-full blur-3xl transition-all duration-700",
          "bg-primary/5 group-hover:bg-primary/10",
          "hidden lg:block",
        )}
        aria-hidden="true"
      />

      {/* Badge Step */}
      <div className="relative">
        <span
          className={cn(
            /* design-system-escape: px-3 padding direcional sem Inset equiv.; py-1 padding direcional sem Inset equiv. */ "inline-flex items-center rounded-full px-3 py-1",
            "bg-primary/10 text-primary",
            /* design-system-escape: font-medium → className de <Text>/<Heading>; tracking-wider sem token DS */ "text-caption font-medium uppercase tracking-wider",
          )}
        >
          Passo 1
        </span>
      </div>

      {/* Título */}
      <h2
        className={cn(
          /* design-system-escape: font-bold → className de <Text>/<Heading>; leading-tight sem token DS; tracking-tight sem token DS */ "relative font-heading font-bold leading-tight tracking-tight",
          /* design-system-escape: text-3xl → migrar para <Heading level="display-*"> */ /* design-system-escape: text-3xl → migrar para <Heading level="display-*"> */ "text-3xl text-foreground md:text-4xl lg:text-5xl",
        )}
      >
        Vamos assinar seu documento
      </h2>

      {/* Descrição */}
      <p className={cn(/* design-system-escape: leading-relaxed sem token DS */ "relative text-body-lg leading-relaxed text-muted-foreground")}>
        Suportamos arquivos <strong className="text-foreground">PDF</strong> com até{" "}
        <strong className="text-foreground">10MB</strong>.
      </p>

      {/* Botão de seleção */}
      <div className="relative">
        <Button
          type="button"
          size="lg"
          onClick={onSelectFile}
          disabled={isUploading}
          className={cn(
            "w-full inline-tight lg:w-auto rounded-xl",
            "bg-primary text-primary-foreground hover:bg-primary/90",
            "shadow-lg shadow-primary/20 hover:shadow-primary/40",
            "hover:-translate-y-0.5 transition-all duration-200",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0",
          )}
        >
          <Upload className="size-5" />
          {isUploading ? "Enviando..." : "Selecionar Arquivo do Computador"}
        </Button>
      </div>

      {/* Informação de segurança */}
      <Text variant="caption" className="relative flex items-center gap-2">
        <Shield className="size-4" />
        <span>Seus arquivos são criptografados e seguros</span>
      </Text>
    </div >
  );
}
