'use client';

import { useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GlassPanel } from '@/components/shared/glass-panel';
import { Heading, Text } from '@/components/ui/typography';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, PenLine, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import CanvasAssinatura, {
  type CanvasAssinaturaRef,
} from '@/shared/assinatura-digital/components/signature/canvas-assinatura';
import { DadosBancariosStep } from './steps/DadosBancariosStep';
import { actionFinalizarPrestacaoContas } from '@/shared/prestacao-contas/actions/finalizar-prestacao-contas';
import type {
  DadosBancariosCliente,
  DadosBancariosInput,
} from '@/shared/prestacao-contas/types';
import { TIPO_CONTA_LABELS, TIPO_CHAVE_PIX_LABELS } from '@/shared/prestacao-contas/constants';

interface Props {
  token: string;
  clienteNome: string;
  clienteCpfMascara: string;
  dadosBancariosAtivos: DadosBancariosCliente | null;
  jaAssinado: boolean;
  linkExpirado: boolean;
  templateMarkdown: string;
}

type Etapa = 'cpf' | 'dados' | 'revisao' | 'assinar' | 'sucesso';

export function PrestacaoContasFlow({
  token,
  clienteNome,
  clienteCpfMascara,
  dadosBancariosAtivos,
  jaAssinado,
  linkExpirado,
  templateMarkdown,
}: Props) {
  const [etapa, setEtapa] = useState<Etapa>('cpf');
  const [cpfConfirmado, setCpfConfirmado] = useState('');
  const [dados, setDados] = useState<DadosBancariosInput | null>(null);
  const [submetendo, setSubmetendo] = useState(false);
  const [termosAceitos, setTermosAceitos] = useState(false);
  const canvasRef = useRef<CanvasAssinaturaRef>(null);

  if (jaAssinado) {
    return <EstadoFinal ok={true} titulo="Declaração já assinada" texto="Este link já foi utilizado. Em caso de dúvida, procure o escritório." />;
  }
  if (linkExpirado) {
    return <EstadoFinal ok={false} titulo="Link expirado" texto="O prazo para assinatura deste link venceu. Solicite um novo link ao escritório." />;
  }

  const handleSubmit = async () => {
    if (!dados) return;
    if (canvasRef.current?.isEmpty()) {
      toast.error('Assine no espaço indicado antes de prosseguir.');
      return;
    }
    const assinaturaBase64 = canvasRef.current?.getSignatureBase64() ?? '';
    if (!assinaturaBase64) {
      toast.error('Falha ao capturar assinatura. Tente novamente.');
      return;
    }

    setSubmetendo(true);
    try {
      const geo = await capturarGeolocation();
      const res = await actionFinalizarPrestacaoContas({
        token,
        cpfConfirmado,
        dadosBancarios: dados,
        assinaturaBase64,
        termosAceiteVersao: 'v1.0-MP2200-2',
        ipAddress: null,
        userAgent:
          typeof navigator !== 'undefined' ? navigator.userAgent : null,
        geolocation: geo,
        dispositivoFingerprint: null,
      });

      if (res.success) {
        setEtapa('sucesso');
      } else {
        toast.error(res.error || res.message || 'Erro ao finalizar');
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro inesperado');
    } finally {
      setSubmetendo(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-4">
      {etapa === 'cpf' && (
        <GlassPanel depth={1} className="p-6 space-y-5">
          <div>
            <Heading level="section">Confirme seu CPF</Heading>
            <Text variant="caption" className="mt-1">
              Identificamos você como <strong>{clienteNome}</strong> (CPF {clienteCpfMascara}). Digite o CPF completo para continuar.
            </Text>
          </div>
          <div className="space-y-1.5">
            <Label>CPF (somente números)</Label>
            <Input
              inputMode="numeric"
              maxLength={11}
              value={cpfConfirmado}
              onChange={(e) =>
                setCpfConfirmado(e.target.value.replace(/\D/g, ''))
              }
              placeholder="00000000000"
            />
          </div>
          <Button
            disabled={cpfConfirmado.length !== 11}
            onClick={() => setEtapa('dados')}
            className="w-full rounded-xl"
            size="sm"
          >
            Continuar
          </Button>
        </GlassPanel>
      )}

      {etapa === 'dados' && (
        <DadosBancariosStep
          clienteNome={clienteNome}
          clienteCpf={cpfConfirmado}
          dadosAtivos={dadosBancariosAtivos}
          onBack={() => setEtapa('cpf')}
          onConfirm={(d) => {
            setDados(d);
            setEtapa('revisao');
          }}
        />
      )}

      {etapa === 'revisao' && dados && (
        <GlassPanel depth={1} className="p-6 space-y-4">
          <Heading level="section">Revise a declaração</Heading>
          <GlassPanel depth={2} className="p-4">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {resolveClientSide(
                  templateMarkdown,
                  clienteNome,
                  cpfConfirmado,
                  dados,
                )}
              </ReactMarkdown>
            </div>
          </GlassPanel>
          <Alert>
            <AlertTitle>Atenção</AlertTitle>
            <AlertDescription>
              Ao prosseguir, você declara que as informações são verdadeiras e autoriza o escritório a realizar o depósito na conta informada.
            </AlertDescription>
          </Alert>
          <div className="flex justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEtapa('dados')}
              className="rounded-xl"
            >
              Voltar
            </Button>
            <Button
              size="sm"
              onClick={() => setEtapa('assinar')}
              className="rounded-xl gap-1.5"
            >
              <PenLine className="size-3.5" /> Prosseguir para assinatura
            </Button>
          </div>
        </GlassPanel>
      )}

      {etapa === 'assinar' && dados && (
        <GlassPanel depth={1} className="p-6 space-y-4">
          <div>
            <Heading level="section">Assinatura</Heading>
            <Text variant="caption" className="mt-1">
              Assine no espaço abaixo usando o dedo (mobile) ou mouse (desktop).
            </Text>
          </div>

          <CanvasAssinatura ref={canvasRef} hideClearButton />

          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => canvasRef.current?.clear()}
              className="rounded-xl gap-1.5"
            >
              <RotateCcw className="size-3.5" /> Limpar
            </Button>
          </div>

          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={termosAceitos}
              onChange={(e) => setTermosAceitos(e.target.checked)}
              className="mt-1"
            />
            <span>
              Declaro que li e concordo com os termos da declaração e que todas as informações prestadas são verdadeiras (MP 2.200-2/2001).
            </span>
          </label>

          <div className="flex justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEtapa('revisao')}
              className="rounded-xl"
              disabled={submetendo}
            >
              Voltar
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={submetendo || !termosAceitos}
              className="rounded-xl"
            >
              {submetendo ? 'Enviando...' : 'Confirmar e enviar'}
            </Button>
          </div>
        </GlassPanel>
      )}

      {etapa === 'sucesso' && (
        <EstadoFinal
          ok
          titulo="Declaração assinada com sucesso"
          texto="O escritório foi notificado e irá providenciar a transferência do valor."
        />
      )}
    </div>
  );
}

function EstadoFinal({
  ok,
  titulo,
  texto,
}: {
  ok: boolean;
  titulo: string;
  texto: string;
}) {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <GlassPanel depth={1} className="p-8 text-center space-y-4">
        <CheckCircle2
          className={`size-12 mx-auto ${ok ? 'text-success' : 'text-destructive'}`}
        />
        <Heading level="section">{titulo}</Heading>
        <Text variant="caption">{texto}</Text>
      </GlassPanel>
    </div>
  );
}

function resolveClientSide(
  tpl: string,
  nome: string,
  cpf: string,
  d: DadosBancariosInput,
): string {
  const agCompleta = d.agenciaDigito ? `${d.agencia}-${d.agenciaDigito}` : d.agencia;
  const ctCompleta = d.contaDigito ? `${d.conta}-${d.contaDigito}` : d.conta;

  return tpl
    .replace(/\{\{cliente\.nome\}\}/g, nome)
    .replace(/\{\{cliente\.cpf\}\}/g, cpf)
    .replace(/\{\{banco\.nome\}\}/g, d.bancoNome)
    .replace(/\{\{banco\.codigo\}\}/g, d.bancoCodigo)
    .replace(/\{\{banco\.agencia_completa\}\}/g, agCompleta)
    .replace(/\{\{banco\.conta_completa\}\}/g, ctCompleta)
    .replace(/\{\{banco\.tipo_conta_label\}\}/g, TIPO_CONTA_LABELS[d.tipoConta])
    .replace(/\{\{banco\.titular_nome\}\}/g, d.titularNome)
    .replace(/\{\{banco\.titular_cpf\}\}/g, d.titularCpf)
    .replace(
      /\{\{#banco\.chave_pix\}\}([\s\S]*?)\{\{\/banco\.chave_pix\}\}/g,
      (_m, inner: string) =>
        d.chavePix
          ? inner
              .replace(/\{\{banco\.chave_pix\}\}/g, d.chavePix)
              .replace(
                /\{\{banco\.tipo_chave_pix_label\}\}/g,
                d.tipoChavePix ? TIPO_CHAVE_PIX_LABELS[d.tipoChavePix] : '',
              )
          : '',
    )
    .replace(/\{\{[^}]+\}\}/g, (m) => m);
}

async function capturarGeolocation(): Promise<{
  latitude: number;
  longitude: number;
  accuracy?: number;
} | null> {
  if (typeof navigator === 'undefined' || !('geolocation' in navigator))
    return null;
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (p) =>
        resolve({
          latitude: p.coords.latitude,
          longitude: p.coords.longitude,
          accuracy: p.coords.accuracy,
        }),
      () => resolve(null),
      { timeout: 5000, enableHighAccuracy: false },
    );
  });
}
