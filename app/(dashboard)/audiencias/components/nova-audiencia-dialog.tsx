'use client';

// Componente de diálogo para criar nova audiência

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface NovaAudienciaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function NovaAudienciaDialog({ open, onOpenChange, onSuccess }: NovaAudienciaDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [processos, setProcessos] = React.useState<Array<{ id: number; numero_processo: string }>>([]);
  const [loadingProcessos, setLoadingProcessos] = React.useState(false);

  // Form state
  const [processoId, setProcessoId] = React.useState<number | null>(null);
  const [dataInicio, setDataInicio] = React.useState('');
  const [horaInicio, setHoraInicio] = React.useState('');
  const [dataFim, setDataFim] = React.useState('');
  const [horaFim, setHoraFim] = React.useState('');
  const [tipoDescricao, setTipoDescricao] = React.useState('');
  const [tipoIsVirtual, setTipoIsVirtual] = React.useState(false);
  const [salaNome, setSalaNome] = React.useState('');
  const [urlVirtual, setUrlVirtual] = React.useState('');
  const [observacoes, setObservacoes] = React.useState('');

  // Buscar processos quando o dialog abrir
  React.useEffect(() => {
    if (open && processos.length === 0) {
      buscarProcessos();
    }
  }, [open]);

  const buscarProcessos = async () => {
    setLoadingProcessos(true);
    try {
      const response = await fetch('/api/acervo?limite=100&ordenar_por=numero_processo&ordem=asc');
      if (!response.ok) throw new Error('Erro ao buscar processos');

      const data = await response.json();
      if (data.success && data.data?.acervo) {
        setProcessos(data.data.acervo.map((p: any) => ({
          id: p.id,
          numero_processo: p.numero_processo,
        })));
      }
    } catch (err) {
      console.error('Erro ao buscar processos:', err);
      setError('Erro ao carregar processos');
    } finally {
      setLoadingProcessos(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validações
    if (!processoId) {
      setError('Selecione um processo');
      return;
    }

    if (!dataInicio || !horaInicio) {
      setError('Data e hora de início são obrigatórias');
      return;
    }

    if (!dataFim || !horaFim) {
      setError('Data e hora de fim são obrigatórias');
      return;
    }

    // Converter para ISO timestamps
    const dataInicioISO = `${dataInicio}T${horaInicio}:00.000Z`;
    const dataFimISO = `${dataFim}T${horaFim}:00.000Z`;

    setIsLoading(true);

    try {
      const response = await fetch('/api/audiencias', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          processo_id: processoId,
          advogado_id: 1,
          data_inicio: dataInicioISO,
          data_fim: dataFimISO,
          tipo_descricao: tipoDescricao || undefined,
          tipo_is_virtual: tipoIsVirtual,
          sala_audiencia_nome: salaNome || undefined,
          url_audiencia_virtual: urlVirtual || undefined,
          observacoes: observacoes || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar audiência');
      }

      // Resetar form
      resetForm();
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      console.error('Erro ao criar audiência:', err);
      setError(err instanceof Error ? err.message : 'Erro ao criar audiência');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setProcessoId(null);
    setDataInicio('');
    setHoraInicio('');
    setDataFim('');
    setHoraFim('');
    setTipoDescricao('');
    setTipoIsVirtual(false);
    setSalaNome('');
    setUrlVirtual('');
    setObservacoes('');
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Audiência</DialogTitle>
          <DialogDescription>
            Adicione uma nova audiência manualmente ao sistema.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-800 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Processo */}
          <div className="space-y-2">
            <Label htmlFor="processo">Processo *</Label>
            <Select
              value={processoId?.toString()}
              onValueChange={(value) => setProcessoId(parseInt(value))}
              disabled={loadingProcessos}
            >
              <SelectTrigger id="processo">
                <SelectValue placeholder={loadingProcessos ? 'Carregando...' : 'Selecione um processo'} />
              </SelectTrigger>
              <SelectContent>
                {processos.map((processo) => (
                  <SelectItem key={processo.id} value={processo.id.toString()}>
                    {processo.numero_processo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Data e Hora de Início */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dataInicio">Data de Início *</Label>
              <Input
                id="dataInicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="horaInicio">Hora de Início *</Label>
              <Input
                id="horaInicio"
                type="time"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Data e Hora de Fim */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dataFim">Data de Fim *</Label>
              <Input
                id="dataFim"
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="horaFim">Hora de Fim *</Label>
              <Input
                id="horaFim"
                type="time"
                value={horaFim}
                onChange={(e) => setHoraFim(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Tipo de Audiência */}
          <div className="space-y-2">
            <Label htmlFor="tipoDescricao">Tipo de Audiência</Label>
            <Input
              id="tipoDescricao"
              placeholder="Ex: Una, Instrução, Conciliação"
              value={tipoDescricao}
              onChange={(e) => setTipoDescricao(e.target.value)}
            />
          </div>

          {/* Audiência Virtual */}
          <div className="flex items-center space-x-2">
            <Switch
              id="virtual"
              checked={tipoIsVirtual}
              onCheckedChange={setTipoIsVirtual}
            />
            <Label htmlFor="virtual" className="cursor-pointer">
              Audiência Virtual
            </Label>
          </div>

          {/* Sala ou URL */}
          {tipoIsVirtual ? (
            <div className="space-y-2">
              <Label htmlFor="urlVirtual">URL da Audiência Virtual</Label>
              <Input
                id="urlVirtual"
                type="url"
                placeholder="https://zoom.us/..."
                value={urlVirtual}
                onChange={(e) => setUrlVirtual(e.target.value)}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="sala">Sala de Audiência</Label>
              <Input
                id="sala"
                placeholder="Ex: Sala 101"
                value={salaNome}
                onChange={(e) => setSalaNome(e.target.value)}
              />
            </div>
          )}

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              placeholder="Anotações adicionais sobre a audiência..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
