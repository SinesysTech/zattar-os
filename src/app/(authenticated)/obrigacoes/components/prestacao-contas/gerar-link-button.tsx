'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';
import { actionCriarLinkPrestacaoContas } from '@/shared/prestacao-contas/actions/criar-link-prestacao-contas';
import { LinkGeradoDialog } from './link-gerado-dialog';

interface Props {
  parcelaId: number;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'sm' | 'default';
  label?: string;
  withIcon?: boolean;
  className?: string;
  onGerado?: () => void;
}

export function GerarLinkButton({
  parcelaId,
  variant = 'default',
  size = 'sm',
  label = 'Gerar link de prestação de contas',
  withIcon = true,
  className,
  onGerado,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState<{ url: string; expiresAt: string } | null>(
    null,
  );

  const handle = async () => {
    setLoading(true);
    try {
      const result = await actionCriarLinkPrestacaoContas({ parcelaId });
      if (result.success) {
        setDialog({ url: result.data.url, expiresAt: result.data.expiresAt });
        onGerado?.();
      } else {
        toast.error(result.error || result.message || 'Erro ao gerar link');
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handle}
        disabled={loading}
        className={`rounded-xl gap-1.5 ${className ?? ''}`}
      >
        {withIcon && <LinkIcon className="size-3.5" />}
        {loading ? 'Gerando...' : label}
      </Button>
      {dialog && (
        <LinkGeradoDialog
          open={!!dialog}
          onOpenChange={(o) => !o && setDialog(null)}
          url={dialog.url}
          expiresAt={dialog.expiresAt}
        />
      )}
    </>
  );
}
