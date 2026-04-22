'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GlassPanel } from '@/components/shared/glass-panel';
import { Heading, Text } from '@/components/ui/typography';
import {
  TIPO_CONTA_LABELS,
  TIPO_CHAVE_PIX_LABELS,
} from '@/shared/prestacao-contas/constants';
import type {
  DadosBancariosCliente,
  DadosBancariosInput,
  TipoConta,
  TipoChavePix,
} from '@/shared/prestacao-contas/types';

interface Props {
  clienteNome: string;
  clienteCpf: string;
  dadosAtivos: DadosBancariosCliente | null;
  onConfirm: (dados: DadosBancariosInput) => void;
  onBack?: () => void;
}

export function DadosBancariosStep({
  clienteNome,
  clienteCpf,
  dadosAtivos,
  onConfirm,
  onBack,
}: Props) {
  const [modo, setModo] = useState<'existente' | 'novo'>(
    dadosAtivos ? 'existente' : 'novo',
  );
  const [form, setForm] = useState<DadosBancariosInput>({
    bancoCodigo: '',
    bancoNome: '',
    agencia: '',
    agenciaDigito: '',
    conta: '',
    contaDigito: '',
    tipoConta: 'corrente',
    chavePix: '',
    tipoChavePix: null,
    titularCpf: clienteCpf,
    titularNome: clienteNome,
  });

  const handleConfirmExistente = () => {
    if (!dadosAtivos) return;
    onConfirm({
      bancoCodigo: dadosAtivos.bancoCodigo,
      bancoNome: dadosAtivos.bancoNome,
      agencia: dadosAtivos.agencia,
      agenciaDigito: dadosAtivos.agenciaDigito,
      conta: dadosAtivos.conta,
      contaDigito: dadosAtivos.contaDigito,
      tipoConta: dadosAtivos.tipoConta,
      chavePix: dadosAtivos.chavePix,
      tipoChavePix: dadosAtivos.tipoChavePix,
      titularCpf: dadosAtivos.titularCpf,
      titularNome: dadosAtivos.titularNome,
    });
  };

  const handleConfirmNovo = () => {
    if (
      !form.bancoCodigo ||
      !form.bancoNome ||
      !form.agencia ||
      !form.conta ||
      !form.titularNome
    )
      return;
    onConfirm({
      ...form,
      chavePix: form.chavePix || null,
      tipoChavePix: form.chavePix ? form.tipoChavePix : null,
    });
  };

  if (modo === 'existente' && dadosAtivos) {
    return (
      <GlassPanel depth={1} className="p-6 space-y-5">
        <div>
          <Heading level="section">Confirme seus dados bancários</Heading>
          <Text variant="caption" className="mt-1">
            Você já tem uma conta cadastrada. Se ainda for válida, confirme para continuar.
          </Text>
        </div>

        <GlassPanel depth={2} className="p-4 space-y-2">
          <LinhaInfo label="Banco" value={`${dadosAtivos.bancoNome} (${dadosAtivos.bancoCodigo})`} />
          <LinhaInfo
            label="Agência"
            value={`${dadosAtivos.agencia}${dadosAtivos.agenciaDigito ? `-${dadosAtivos.agenciaDigito}` : ''}`}
          />
          <LinhaInfo
            label="Conta"
            value={`${dadosAtivos.conta}${dadosAtivos.contaDigito ? `-${dadosAtivos.contaDigito}` : ''} (${TIPO_CONTA_LABELS[dadosAtivos.tipoConta]})`}
          />
          <LinhaInfo label="Titular" value={dadosAtivos.titularNome} />
          {dadosAtivos.chavePix && <LinhaInfo label="PIX" value={dadosAtivos.chavePix} />}
        </GlassPanel>

        <div className="flex gap-2 justify-between flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setModo('novo')}
            className="rounded-xl"
          >
            Usar outra conta
          </Button>
          <div className="flex gap-2">
            {onBack && (
              <Button variant="outline" size="sm" onClick={onBack} className="rounded-xl">
                Voltar
              </Button>
            )}
            <Button size="sm" onClick={handleConfirmExistente} className="rounded-xl">
              Continuar com esta conta
            </Button>
          </div>
        </div>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel depth={1} className="p-6 space-y-5">
      <div>
        <Heading level="section">Dados bancários para o recebimento</Heading>
        <Text variant="caption" className="mt-1">
          Informe a conta onde deseja receber o valor. Será usada para este e futuros repasses.
        </Text>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Código do banco</Label>
          <Input
            value={form.bancoCodigo}
            onChange={(e) => setForm({ ...form, bancoCodigo: e.target.value })}
            maxLength={5}
            placeholder="001"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Nome do banco</Label>
          <Input
            value={form.bancoNome}
            onChange={(e) => setForm({ ...form, bancoNome: e.target.value })}
            placeholder="Banco do Brasil"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Agência</Label>
          <Input
            value={form.agencia}
            onChange={(e) => setForm({ ...form, agencia: e.target.value })}
            maxLength={10}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Dígito da agência (opcional)</Label>
          <Input
            value={form.agenciaDigito ?? ''}
            onChange={(e) => setForm({ ...form, agenciaDigito: e.target.value })}
            maxLength={2}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Conta</Label>
          <Input
            value={form.conta}
            onChange={(e) => setForm({ ...form, conta: e.target.value })}
            maxLength={20}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Dígito da conta</Label>
          <Input
            value={form.contaDigito ?? ''}
            onChange={(e) => setForm({ ...form, contaDigito: e.target.value })}
            maxLength={2}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Tipo de conta</Label>
          <Select
            value={form.tipoConta}
            onValueChange={(v) => setForm({ ...form, tipoConta: v as TipoConta })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TIPO_CONTA_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Titular</Label>
          <Input
            value={form.titularNome}
            onChange={(e) => setForm({ ...form, titularNome: e.target.value })}
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Chave PIX (opcional)</Label>
          <div className="flex gap-2">
            <Input
              className="flex-1"
              value={form.chavePix ?? ''}
              onChange={(e) => setForm({ ...form, chavePix: e.target.value })}
              placeholder="CPF, e-mail, telefone ou chave aleatória"
            />
            <Select
              value={form.tipoChavePix ?? ''}
              onValueChange={(v) =>
                setForm({ ...form, tipoChavePix: v as TipoChavePix })
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TIPO_CHAVE_PIX_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex gap-2 justify-between flex-wrap">
        {dadosAtivos && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setModo('existente')}
            className="rounded-xl"
          >
            Usar conta cadastrada
          </Button>
        )}
        <div className="flex gap-2 ml-auto">
          {onBack && (
            <Button variant="outline" size="sm" onClick={onBack} className="rounded-xl">
              Voltar
            </Button>
          )}
          <Button size="sm" onClick={handleConfirmNovo} className="rounded-xl">
            Continuar
          </Button>
        </div>
      </div>
    </GlassPanel>
  );
}

function LinhaInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-baseline gap-4">
      <Text variant="label">{label}</Text>
      <Text variant="caption" className="text-right">{value}</Text>
    </div>
  );
}
