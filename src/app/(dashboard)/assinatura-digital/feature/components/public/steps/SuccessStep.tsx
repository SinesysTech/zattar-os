"use client";

import * as React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { Download, ArrowLeft, FileText, Eye, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface SuccessStepProps {
  documento: {
    titulo?: string | null;
    pdf_final_url?: string | null;
  };
  onDownload?: () => void;
  onReturnToDashboard?: () => void;
}

export function SuccessStep({
  documento,
  onDownload,
  onReturnToDashboard,
}: SuccessStepProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);

    try {
      if (!documento.pdf_final_url) {
        throw new Error("URL do PDF não disponível");
      }

      // Abrir PDF em nova aba
      window.open(documento.pdf_final_url, "_blank");

      onDownload?.();
      toast.success("Documento aberto em nova aba");
    } catch (error) {
      console.error("Erro ao baixar documento:", error);
      toast.error(
        error instanceof Error ? error.message : "Erro ao baixar documento"
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const handleView = () => {
    if (documento.pdf_final_url) {
      window.open(documento.pdf_final_url, "_blank");
    }
  };

  const handleShare = async () => {
    if (navigator.share && documento.pdf_final_url) {
      try {
        await navigator.share({
          title: documento.titulo || "Documento Assinado",
          url: documento.pdf_final_url,
        });
      } catch (error) {
        // Usuário cancelou ou erro
        console.warn("Erro ao compartilhar:", error);
      }
    } else {
      // Fallback: copiar link
      if (documento.pdf_final_url) {
        await navigator.clipboard.writeText(documento.pdf_final_url);
        toast.success("Link copiado para a área de transferência");
      }
    }
  };

  const fileName = documento.titulo || "Documento Assinado";

  return (
    <div className="max-w-[480px] mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
      {/* Seção de Sucesso */}
      <div className="text-center space-y-4">
        {/* Ícone Animado */}
        <div className="relative flex items-center justify-center mx-auto">
          <div className="absolute inset-0 w-20 h-20 bg-green-500/20 rounded-full animate-ping opacity-75 mx-auto" />
          <div className="relative flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full text-green-600 dark:text-green-400">
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 48, fontWeight: 600 }}
              aria-hidden="true"
            >
              check
            </span>
          </div>
        </div>

        {/* Título */}
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Assinatura Confirmada!
        </h1>

        {/* Descrição */}
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Seu documento foi assinado com sucesso e está seguro. Uma cópia foi
          enviada para seu e-mail.
        </p>
      </div>

      {/* Card do Documento */}
      <div className="bg-card rounded-xl border border-border shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
        {/* Thumbnail PDF */}
        <div className="relative h-32 bg-gradient-to-br from-muted to-muted/80 flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
          <div className="relative z-10 flex items-center justify-center w-16 h-16 bg-red-500/10 rounded-lg text-red-500">
            <FileText className="w-8 h-8" aria-hidden="true" />
          </div>
          {/* Badge de Status */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 text-xs font-medium rounded-full">
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 14 }}
              aria-hidden="true"
            >
              verified
            </span>
            Assinado
          </div>
        </div>

        {/* Informações do Documento */}
        <div className="p-4 space-y-3">
          <div>
            <h3 className="font-medium text-foreground truncate">
              {fileName}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Assinado agora
            </p>
          </div>

          {/* Ações Rápidas */}
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={handleView}
              className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" aria-hidden="true" />
              Visualizar
            </button>
            <span className="text-border">|</span>
            <button
              onClick={handleShare}
              className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" aria-hidden="true" />
              Compartilhar
            </button>
          </div>
        </div>

        {/* Barra de Progresso Animada */}
        <div className="h-1 bg-muted">
          <div
            className="h-full bg-green-500 animate-[loading_1s_ease-out_forwards]"
            style={{ width: "100%" }}
          />
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="space-y-3">
        <Button
          type="button"
          onClick={handleDownload}
          disabled={isDownloading || !documento.pdf_final_url}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 active:scale-[0.98] transition-all group"
        >
          <Download
            className="w-4 h-4 mr-2 group-hover:-translate-y-0.5 transition-transform"
            aria-hidden="true"
          />
          {isDownloading ? "Abrindo..." : "Baixar PDF Assinado"}
        </Button>

        {onReturnToDashboard && (
          <Button
            type="button"
            variant="outline"
            onClick={onReturnToDashboard}
            className="w-full border-border text-foreground hover:bg-muted"
          >
            <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
            Voltar ao Início
          </Button>
        )}
      </div>

      {/* Footer */}
      <footer className="text-xs text-muted-foreground text-center py-6 border-t border-border">
        <p>
          Este documento foi assinado eletronicamente em conformidade com a MP
          2.200-2/2001.
        </p>
        <p className="mt-2">&copy; {new Date().getFullYear()} Zattar Advogados. Todos os direitos reservados.</p>
      </footer>

      {/* CSS para animação loading */}
      <style jsx>{`
        @keyframes loading {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
