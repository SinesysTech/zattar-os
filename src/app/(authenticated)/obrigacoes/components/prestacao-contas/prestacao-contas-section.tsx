'use client';

import { cn } from '@/lib/utils';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/typography';
import {
  actionStatusPrestacaoContas,
  type StatusPrestacaoContas,
} from '@/shared/prestacao-contas/actions/status-prestacao-contas';
import { GerarLinkButton } from './gerar-link-button';
import { LinkGeradoDialog } from './link-gerado-dialog';
import { CancelarLinkButton } from './cancelar-link-button';
import { VisualizarDeclaracaoDialog } from './visualizar-declaracao-dialog';
import {
  FileText,
  Link as LinkIcon,
  CheckCircle2,
  Clock,
  Ban,
} from 'lucide-react';

interface Props {
  parcelaId: number;
}

export function PrestacaoContasSection({ parcelaId }: Props) {
  const [status, setStatus] = useState<StatusPrestacaoContas | null>(null);
  const [loading, setLoading] = useState(true);
  const [linkDialog, setLinkDialog] = useState<{
    token: string;
    url: string;
    expiresAt: string;
  } | null>(null);
  const [verDialog, setVerDialog] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await actionStatusPrestacaoContas({ parcelaId });
      if (res.success) setStatus(res.data);
    } finally {
      setLoading(false);
    }
  }, [parcelaId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (loading) {
    return (
      <Text variant="caption" className={cn("text-muted-foreground py-2")}>
        Carregando status de prestação de contas…
      </Text>
    );
  }

  if (!status) {
    return (
      <Text variant="caption" className="text-destructive py-2">
        Não foi possível carregar o status.
      </Text>
    );
  }

  if (status.estado === 'assinado') {
    return (
      <div className={cn("flex flex-col stack-medium")}>
        <div className={cn("flex items-start inline-tight")}>
          <CheckCircle2 className="size-4 text-success mt-0.5 shrink-0" />
          <div>
            <p className={cn( "text-body-sm font-medium")}>Declaração assinada pelo cliente</p>
            {status.dataAssinatura && (
              <Text variant="caption">
                Em {new Date(status.dataAssinatura).toLocaleString('pt-BR')}
              </Text>
            )}
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setVerDialog(true)}
          className={cn("flex rounded-xl inline-snug")}
        >
          <FileText className="size-3.5" />
          Ver declaração assinada
        </Button>
        {verDialog && (
          <VisualizarDeclaracaoDialog
            open={verDialog}
            onOpenChange={setVerDialog}
            pdfUrl={status.pdfUrl}
          />
        )}
      </div>
    );
  }

  if (status.estado === 'link_ativo') {
    return (
      <div className={cn("flex flex-col stack-medium")}>
        <div className={cn("flex items-start inline-tight")}>
          <Clock className="size-4 text-warning mt-0.5 shrink-0" />
          <div>
            <p className={cn( "text-body-sm font-medium")}>Aguardando assinatura do cliente</p>
            {status.expiresAt && (
              <Text variant="caption">
                Link expira em {new Date(status.expiresAt).toLocaleDateString('pt-BR')}
              </Text>
            )}
          </div>
        </div>
        <div className={cn("flex inline-tight flex-wrap")}>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              setLinkDialog({
                token: status.token,
                url: status.url,
                expiresAt: status.expiresAt ?? '',
              })
            }
            className={cn("flex rounded-xl inline-snug")}
          >
            <LinkIcon className="size-3.5" />
            Ver link / reenviar
          </Button>
          <CancelarLinkButton parcelaId={parcelaId} onCancelado={refresh} />
        </div>
        {linkDialog && (
          <LinkGeradoDialog
            open={!!linkDialog}
            onOpenChange={(o) => !o && setLinkDialog(null)}
            token={linkDialog.token}
            url={linkDialog.url}
            expiresAt={linkDialog.expiresAt}
          />
        )}
      </div>
    );
  }

  if (status.estado === 'cancelado') {
    return (
      <div className={cn("flex flex-col stack-medium")}>
        <div className={cn("flex items-start inline-tight")}>
          <Ban className="size-4 text-muted-foreground mt-0.5 shrink-0" />
          <p className={cn("text-body-sm")}>Link anterior foi cancelado. Gere um novo se necessário.</p>
        </div>
        <GerarLinkButton parcelaId={parcelaId} onGerado={refresh} />
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col stack-medium")}>
      <Text variant="caption">
        Gere um link público para o cliente assinar digitalmente a declaração e informar os dados bancários.
      </Text>
      <GerarLinkButton parcelaId={parcelaId} onGerado={refresh} />
    </div>
  );
}
