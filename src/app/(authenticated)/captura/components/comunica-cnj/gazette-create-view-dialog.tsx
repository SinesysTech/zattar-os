'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useGazetteStore } from './hooks/use-gazette-store';
import type { GazetteFilters } from '@/app/(authenticated)/captura/comunica-cnj/domain';

// ── Types ──

interface GazetteCreateViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ── Constants ──

const ICONES = ['📋', '⚡', '🔔', '⭐', '📌', '🏛️'] as const;

const CHIP_STYLES: Record<string, string> = {
  fonte: 'bg-info/5 border-info/15 text-info',
  tipo: 'bg-success/5 border-success/15 text-success',
  periodo: 'bg-warning/5 border-warning/15 text-warning',
  meio: 'bg-muted/10 border-border text-muted-foreground',
};

const CATEGORY_LABELS: Record<string, string> = {
  fonte: 'Fonte',
  tipo: 'Tipo',
  periodo: 'Período',
  meio: 'Meio',
};

const MEIO_LABELS: Record<string, string> = {
  E: 'Edital',
  D: 'Diário Eletrônico',
};

// ── Filter chips helper ──

interface ChipData {
  key: string;
  category: string;
  label: string;
  value: string;
}

function buildChips(filtros: GazetteFilters): ChipData[] {
  const chips: ChipData[] = [];

  if (filtros.fonte?.length) {
    for (const f of filtros.fonte) {
      chips.push({ key: `fonte-${f}`, category: 'fonte', label: CATEGORY_LABELS.fonte, value: f });
    }
  }

  if (filtros.tipo?.length) {
    for (const t of filtros.tipo) {
      chips.push({ key: `tipo-${t}`, category: 'tipo', label: CATEGORY_LABELS.tipo, value: t });
    }
  }

  if (filtros.periodo) {
    chips.push({
      key: 'periodo',
      category: 'periodo',
      label: CATEGORY_LABELS.periodo,
      value: `${filtros.periodo.inicio} — ${filtros.periodo.fim}`,
    });
  }

  if (filtros.meio) {
    chips.push({
      key: 'meio',
      category: 'meio',
      label: CATEGORY_LABELS.meio,
      value: MEIO_LABELS[filtros.meio] ?? filtros.meio,
    });
  }

  return chips;
}

// ── Main Component ──

export function GazetteCreateViewDialog({ open, onOpenChange }: GazetteCreateViewDialogProps) {
  const filtros = useGazetteStore((s) => s.filtros);

  const [nome, setNome] = useState('');
  const [icone, setIcone] = useState<string>(ICONES[0]);
  const [visibilidade, setVisibilidade] = useState<'pessoal' | 'equipe'>('pessoal');

  const chips = buildChips(filtros);

  const handleCriar = () => {
    // Actual actionSalvarViewSafe call will be wired later
    toast.success('View criada com sucesso', {
      description: nome || 'Nova view salva',
    });
    onOpenChange(false);
    setNome('');
    setIcone(ICONES[0]);
    setVisibilidade('pessoal');
  };

  const handleCancel = () => {
    onOpenChange(false);
    setNome('');
    setIcone(ICONES[0]);
    setVisibilidade('pessoal');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-dialog max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">Criar Nova View</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Nome */}
          <div className="space-y-1.5">
            <Label htmlFor="view-nome" className="text-xs font-medium text-muted-foreground">
              Nome
            </Label>
            <Input
              id="view-nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Intimações TJ-PR urgentes"
              className="h-8 text-sm"
            />
          </div>

          {/* Ícone */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Ícone</Label>
            <div className="flex items-center gap-1.5">
              {ICONES.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcone(emoji)}
                  className={cn(
                    'size-8 flex items-center justify-center rounded-md border text-base transition-colors',
                    icone === emoji
                      ? 'bg-primary/10 border-primary/25'
                      : 'border-border/40 hover:border-border/70 hover:bg-muted/40',
                  )}
                  aria-label={`Selecionar ícone ${emoji}`}
                  aria-pressed={icone === emoji}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Filtros incluídos */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Filtros incluídos</Label>
            {chips.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {chips.map((chip) => (
                  <span
                    key={chip.key}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px]',
                      CHIP_STYLES[chip.category] ?? 'bg-muted/10 border-border text-muted-foreground',
                    )}
                  >
                    <span className="opacity-70">{chip.label}:</span>
                    <span className="font-medium">{chip.value}</span>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground/60 italic">Nenhum filtro ativo</p>
            )}
          </div>

          {/* Visibilidade */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Visibilidade</Label>
            <div className="flex items-center p-0.5 bg-muted/30 rounded-md w-fit">
              {(['pessoal', 'equipe'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVisibilidade(v)}
                  className={cn(
                    'px-3 py-1 rounded-sm text-xs font-medium transition-all capitalize',
                    visibilidade === v
                      ? 'bg-background shadow-sm text-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                  aria-pressed={visibilidade === v}
                >
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={handleCancel} className="h-8 text-xs">
            Cancelar
          </Button>
          <Button size="sm" onClick={handleCriar} className="h-8 text-xs" disabled={!nome.trim()}>
            Criar View
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
