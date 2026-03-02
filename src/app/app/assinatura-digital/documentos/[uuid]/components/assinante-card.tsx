"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Mail,
  Phone,
  CreditCard,
  Clock,
  Copy,
  ExternalLink,
  Check,
  Shield,
  PenLine,
  Camera,
  Stamp,
  ImageIcon,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { SignatarioVerificacaoData } from "../../../feature/types/types";
import { actionGetPresignedPdfUrl } from "../../../feature/actions/documentos-actions";
import { SegurancaSection } from "./seguranca-section";

interface AssinanteCardProps {
  signatario: SignatarioVerificacaoData;
  index: number;
}

/**
 * Busca presigned URL para uma imagem armazenada no Backblaze.
 */
function usePresignedImageUrl(originalUrl: string | null | undefined) {
  const [url, setUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!originalUrl) {
      setUrl(null);
      return;
    }

    let cancelled = false;

    async function fetch() {
      setIsLoading(true);
      try {
        const result = await actionGetPresignedPdfUrl({ url: originalUrl! });
        if (!cancelled && result?.success && result.data?.presignedUrl) {
          setUrl(result.data.presignedUrl);
        }
      } catch {
        // Silently fail for images
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetch();
    return () => {
      cancelled = true;
    };
  }, [originalUrl]);

  return { url, isLoading };
}

function ImagePreview({
  originalUrl,
  label,
  icon: Icon,
}: {
  originalUrl: string | null | undefined;
  label: string;
  icon: React.ElementType;
}) {
  const { url, isLoading } = usePresignedImageUrl(originalUrl);
  const [showDialog, setShowDialog] = useState(false);

  if (!originalUrl) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => url && setShowDialog(true)}
        className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-dashed hover:bg-muted/50 transition-colors cursor-pointer"
      >
        {isLoading ? (
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        ) : url ? (
          <img
            src={url}
            alt={label}
            className="h-16 w-16 object-contain rounded"
          />
        ) : (
          <Icon className="h-8 w-8 text-muted-foreground" />
        )}
        <span className="text-xs text-muted-foreground">{label}</span>
      </button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{label}</DialogTitle>
          </DialogHeader>
          {url && (
            <img
              src={url}
              alt={label}
              className="w-full h-auto rounded-md"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export function AssinanteCard({ signatario, index }: AssinanteCardProps) {
  const [linkCopied, setLinkCopied] = useState(false);

  const isConcluido = signatario.status === "concluido";

  const handleCopyLink = useCallback(() => {
    if (!signatario.token) return;
    const link = `${window.location.origin}/assinatura/${signatario.token}`;
    navigator.clipboard.writeText(link);
    setLinkCopied(true);
    toast.success("Link copiado!");
    setTimeout(() => setLinkCopied(false), 2000);
  }, [signatario.token]);

  const TIPO_LABELS: Record<string, string> = {
    cliente: "Cliente",
    parte_contraria: "Parte Contrária",
    representante: "Representante",
    terceiro: "Terceiro",
    usuario: "Usuário",
    convidado: "Convidado",
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">
              {signatario.nome || `Assinante ${index + 1}`}
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {TIPO_LABELS[signatario.tipo] || signatario.tipo}
            </Badge>
          </div>
          <Badge
            variant="secondary"
            className={
              isConcluido
                ? "bg-green-600/10 text-green-700 dark:text-green-400"
                : "bg-orange-600/10 text-orange-700 dark:text-orange-400"
            }
          >
            {isConcluido ? "Concluído" : "Pendente"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Dados pessoais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {signatario.cpf && (
            <div className="flex items-center gap-2 text-sm">
              <CreditCard className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">CPF:</span>
              <span className="font-medium">{signatario.cpf}</span>
            </div>
          )}
          {signatario.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Email:</span>
              <span className="font-medium truncate">{signatario.email}</span>
            </div>
          )}
          {signatario.telefone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Telefone:</span>
              <span className="font-medium">{signatario.telefone}</span>
            </div>
          )}
          {signatario.concluidoEm && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Assinado em:</span>
              <span className="font-medium">
                {format(new Date(signatario.concluidoEm), "dd/MM/yyyy HH:mm", {
                  locale: ptBR,
                })}
              </span>
            </div>
          )}
        </div>

        {/* Imagens: Assinatura, Selfie, Rubrica */}
        {(signatario.assinaturaUrl ||
          signatario.selfieUrl ||
          signatario.rubricaUrl) && (
          <>
            <Separator />
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5" />
                Evidências Visuais
              </h4>
              <div className="flex flex-wrap gap-3">
                <ImagePreview
                  originalUrl={signatario.assinaturaUrl}
                  label="Assinatura"
                  icon={PenLine}
                />
                <ImagePreview
                  originalUrl={signatario.selfieUrl}
                  label="Selfie"
                  icon={Camera}
                />
                <ImagePreview
                  originalUrl={signatario.rubricaUrl}
                  label="Rubrica"
                  icon={Stamp}
                />
              </div>
            </div>
          </>
        )}

        {/* Dados de Segurança */}
        {isConcluido && (
          <>
            <Separator />
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5" />
                Dados de Segurança
              </h4>
              <SegurancaSection signatario={signatario} />
            </div>
          </>
        )}

        {/* Ações (link) */}
        {signatario.token && !isConcluido && (
          <>
            <Separator />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
              >
                {linkCopied ? (
                  <Check className="h-3.5 w-3.5 mr-1.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5 mr-1.5" />
                )}
                Copiar Link
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  window.open(`/assinatura/${signatario.token}`, "_blank")
                }
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                Abrir Link
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
