'use client';

import * as React from 'react';
import { FileDown, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/typography';
import { actionValidarGeracaoPdfs } from '@/app/(authenticated)/contratos/actions/gerar-pdfs-contrato-action';
import { actionEnviarContratoParaAssinatura } from '../../actions/enviar-contrato-assinatura-action';
import type { CampoFaltante } from '@/shared/assinatura-digital/services/mapeamento-contrato-input-data';
import { ModalCamposFaltantesDialog } from './modal-campos-faltantes-dialog';
import { ModalLinkAssinaturaDialog } from './modal-link-assinatura-dialog';

interface DocumentosContratacaoCardProps {
  contratoId: number;
  segmentoId: number | null;
}

async function baixarZip(
  contratoId: number,
  overrides: Record<string, string> = {},
) {
  const response = await fetch(`/api/contratos/${contratoId}/pdfs-contratacao`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ overrides }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: 'Falha no download' }));
    throw new Error(body.error ?? 'Falha no download');
  }

  const blob = await response.blob();
  const cd = response.headers.get('Content-Disposition') ?? '';
  const match = cd.match(/filename="(.+)"/);
  const filename = match?.[1] ?? `contratacao-${contratoId}.zip`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function DocumentosContratacaoCard({
  contratoId,
  segmentoId,
}: DocumentosContratacaoCardProps) {
  const [loading, setLoading] = React.useState(false);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [camposFaltantes, setCamposFaltantes] = React.useState<CampoFaltante[]>([]);
  const [linkModalOpen, setLinkModalOpen] = React.useState(false);
  const [linkPayload, setLinkPayload] = React.useState<{
    token: string;
    expiraEm: string;
    reaproveitado: boolean;
  } | null>(null);
  const [modoOverride, setModoOverride] = React.useState<'baixar' | 'enviar'>('baixar');

  // Sem segmento não há como descobrir qual formulário aplicar.
  // Para contratos com segmento, mostramos o card e deixamos o servidor
  // responder se existe ou não formulário de contratação configurado.
  if (segmentoId == null) return null;

  const handleEnviar = async () => {
    setLoading(true);
    setModoOverride('enviar');
    try {
      const validation = await actionEnviarContratoParaAssinatura({ contratoId });
      if (!validation.success) {
        toast.error(validation.message);
        return;
      }
      const r = validation.data;
      if (r.status === 'erro') {
        toast.error(r.mensagem);
        return;
      }
      if (r.status === 'campos_faltantes') {
        setCamposFaltantes(r.camposFaltantes);
        setModalOpen(true);
        return;
      }
      // criado | reaproveitado
      setLinkPayload({
        token: r.token,
        expiraEm: r.expiraEm,
        reaproveitado: r.status === 'reaproveitado',
      });
      setLinkModalOpen(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao enviar');
    } finally {
      setLoading(false);
    }
  };

  const handleBaixar = async () => {
    setModoOverride('baixar');
    setLoading(true);
    try {
      const validation = await actionValidarGeracaoPdfs({ contratoId });
      if (!validation.success) {
        toast.error(validation.message);
        return;
      }
      const result = validation.data;
      if (result.status === 'erro') {
        toast.error(result.mensagem);
        return;
      }
      if (result.status === 'campos_faltantes') {
        setCamposFaltantes(result.camposFaltantes);
        setModalOpen(true);
        return;
      }
      await baixarZip(contratoId);
      toast.success('PDFs gerados com sucesso');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao gerar PDFs');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitOverrides = async (overrides: Record<string, string>) => {
    setLoading(true);
    try {
      if (modoOverride === 'enviar') {
        const validation = await actionEnviarContratoParaAssinatura({ contratoId, overrides });
        if (!validation.success) {
          toast.error(validation.message);
          return;
        }
        const r = validation.data;
        if (r.status === 'erro') { toast.error(r.mensagem); return; }
        if (r.status === 'campos_faltantes') {
          // Still missing something — leave modal open
          setCamposFaltantes(r.camposFaltantes);
          return;
        }
        setLinkPayload({
          token: r.token,
          expiraEm: r.expiraEm,
          reaproveitado: r.status === 'reaproveitado',
        });
        setLinkModalOpen(true);
        setModalOpen(false);
        toast.success('Link gerado com sucesso');
      } else {
        await baixarZip(contratoId, overrides);
        toast.success('PDFs gerados com sucesso');
        setModalOpen(false);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-3 px-4 py-3.5 rounded-[14px] bg-primary/5 border border-primary/15">
        <div className="inline-flex size-9 items-center justify-center rounded-[10px] bg-primary/10 text-primary shrink-0">
          <FileDown className="size-4" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <Text variant="label" as="h4" className="font-semibold text-foreground">
            Documentos de contratação
          </Text>
          <Text variant="caption" className="text-muted-foreground mt-0.5 leading-relaxed">
            Gera os documentos do formulário de contratação deste segmento
            preenchidos com os dados do contrato. Se faltar informação,
            complete antes do download ou envio.
          </Text>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBaixar}
            disabled={loading}
            className="rounded-xl"
          >
            <FileDown className="size-3.5" />
            {loading ? 'Gerando…' : 'Baixar ZIP'}
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleEnviar}
            disabled={loading}
            className="rounded-xl"
          >
            <Send className="size-3.5" />
            Enviar para assinar
          </Button>
        </div>
      </div>

      <ModalCamposFaltantesDialog
        open={modalOpen}
        onOpenChange={setModalOpen}
        camposFaltantes={camposFaltantes}
        onSubmit={handleSubmitOverrides}
        isSubmitting={loading}
      />

      {linkPayload && (
        <ModalLinkAssinaturaDialog
          open={linkModalOpen}
          onOpenChange={setLinkModalOpen}
          token={linkPayload.token}
          expiraEm={linkPayload.expiraEm}
          reaproveitado={linkPayload.reaproveitado}
        />
      )}
    </>
  );
}
