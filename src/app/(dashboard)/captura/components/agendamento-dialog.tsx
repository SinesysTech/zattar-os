'use client';

import * as React from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

import type { TipoCaptura } from '@/features/captura';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export function AgendamentoDialog({ open, onOpenChange, onSuccess }: Props) {
  const [tipoCaptura, setTipoCaptura] = React.useState<TipoCaptura>('acervo_geral');
  const [advogadoId, setAdvogadoId] = React.useState('');
  const [credencialIds, setCredencialIds] = React.useState('');
  const [periodicidade, setPeriodicidade] = React.useState<'diario' | 'a_cada_N_dias'>('diario');
  const [diasIntervalo, setDiasIntervalo] = React.useState('');
  const [horario, setHorario] = React.useState('07:00');
  const [ativo, setAtivo] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      const advogado_id = Number(advogadoId);
      const credencial_ids = credencialIds
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean)
        .map((x) => Number(x))
        .filter((x) => Number.isFinite(x) && x > 0);

      if (!advogado_id || credencial_ids.length === 0) {
        throw new Error('Informe advogado_id e ao menos um credencial_id');
      }

      const payload: Record<string, unknown> = {
        tipo_captura: tipoCaptura,
        advogado_id,
        credencial_ids,
        periodicidade,
        horario,
        ativo,
      };

      if (periodicidade === 'a_cada_N_dias') {
        const dias = Number(diasIntervalo);
        if (!dias || dias <= 0) throw new Error('dias_intervalo obrigatório quando periodicidade = a_cada_N_dias');
        payload.dias_intervalo = dias;
      }

      const res = await fetch('/api/captura/agendamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = (json && typeof json === 'object' && 'error' in json && typeof (json as { error?: unknown }).error === 'string')
          ? (json as { error: string }).error
          : 'Erro ao criar agendamento';
        throw new Error(msg);
      }

      toast.success('Agendamento criado');
      onSuccess?.();
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao salvar');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo agendamento</DialogTitle>
          <DialogDescription>Cria um agendamento de captura.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo de captura</Label>
            <Select value={tipoCaptura} onValueChange={(v) => setTipoCaptura(v as TipoCaptura)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="acervo_geral">Acervo geral</SelectItem>
                <SelectItem value="arquivados">Arquivados</SelectItem>
                <SelectItem value="audiencias">Audiências</SelectItem>
                <SelectItem value="pendentes">Pendentes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Advogado ID</Label>
              <Input value={advogadoId} onChange={(e) => setAdvogadoId(e.target.value)} inputMode="numeric" />
            </div>
            <div className="space-y-2">
              <Label>Credencial IDs (separados por vírgula)</Label>
              <Input value={credencialIds} onChange={(e) => setCredencialIds(e.target.value)} placeholder="1, 2, 3" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Periodicidade</Label>
              <Select value={periodicidade} onValueChange={(v) => setPeriodicidade(v as 'diario' | 'a_cada_N_dias')}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="diario">Diário</SelectItem>
                  <SelectItem value="a_cada_N_dias">A cada N dias</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Horário (HH:mm)</Label>
              <Input value={horario} onChange={(e) => setHorario(e.target.value)} placeholder="07:00" />
            </div>
          </div>

          {periodicidade === 'a_cada_N_dias' && (
            <div className="space-y-2">
              <Label>Dias de intervalo</Label>
              <Input value={diasIntervalo} onChange={(e) => setDiasIntervalo(e.target.value)} inputMode="numeric" />
            </div>
          )}

          <div className="flex items-center justify-between rounded-md border p-3">
            <div className="space-y-1">
              <p className="text-sm font-medium">Ativo</p>
              <p className="text-xs text-muted-foreground">Agendamentos inativos não executam automaticamente.</p>
            </div>
            <Switch checked={ativo} onCheckedChange={setAtivo} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


