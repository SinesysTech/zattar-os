'use client';

import { cn } from '@/lib/utils';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Check, Mail, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { actionEnviarNotificacaoLink } from '@/shared/prestacao-contas/actions/enviar-notificacao-link';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  token: string;
  expiresAt: string;
}

export function LinkGeradoDialog({
  open,
  onOpenChange,
  url,
  token,
  expiresAt,
}: Props) {
  const [copiado, setCopiado] = useState(false);
  const [enviando, setEnviando] = useState<'email' | 'whatsapp' | null>(null);
  const fullUrl =
    typeof window !== 'undefined' ? `${window.location.origin}${url}` : url;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopiado(true);
      toast.success('Link copiado');
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      toast.error('Não foi possível copiar');
    }
  };

  const handleEnviar = async (canal: 'email' | 'whatsapp') => {
    setEnviando(canal);
    try {
      const res = await actionEnviarNotificacaoLink({ token, canal });
      if (res.success) {
        const data = res.data;
        if (data.erros.length > 0) {
          toast.warning(data.mensagem);
        } else {
          toast.success(
            canal === 'email'
              ? 'E-mail enviado ao cliente'
              : 'Mensagem WhatsApp enviada',
          );
        }
      } else {
        toast.error(res.error || res.message || 'Erro ao enviar');
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro inesperado');
    } finally {
      setEnviando(null);
    }
  };

  const expiresLabel = expiresAt
    ? new Date(expiresAt).toLocaleDateString('pt-BR')
    : 'sem prazo';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className=" sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Link de prestação de contas gerado</DialogTitle>
          <DialogDescription>
            Envie ao cliente para que ele assine digitalmente a declaração. Válido até {expiresLabel}.
          </DialogDescription>
        </DialogHeader>

        <div className={cn("flex flex-col stack-default py-2")}>
          <div className={cn("flex inline-tight items-center")}>
            <Input readOnly value={fullUrl} className={cn("text-caption")} />
            <Button
              size="sm"
              onClick={handleCopy}
              variant="outline"
              className="rounded-xl shrink-0"
            >
              {copiado ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            </Button>
          </div>

          <div className={cn("grid grid-cols-1 sm:grid-cols-2 inline-tight")}>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleEnviar('email')}
              disabled={enviando !== null}
              className={cn("flex rounded-xl inline-snug justify-start")}
            >
              <Mail className="size-3.5" />
              {enviando === 'email' ? 'Enviando...' : 'Enviar por e-mail'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleEnviar('whatsapp')}
              disabled={enviando !== null}
              className={cn("flex rounded-xl inline-snug justify-start")}
            >
              <MessageCircle className="size-3.5" />
              {enviando === 'whatsapp' ? 'Enviando...' : 'Enviar por WhatsApp'}
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button
            size="sm"
            onClick={() => onOpenChange(false)}
            className="rounded-xl"
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
