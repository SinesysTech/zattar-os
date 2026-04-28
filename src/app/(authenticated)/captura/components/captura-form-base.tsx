'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ChevronDown, Check } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useAdvogados } from '@/app/(authenticated)/advogados';
import { useCredenciais } from '@/app/(authenticated)/advogados';
import { formatOabs } from '@/app/(authenticated)/advogados';
import type { Credencial } from '@/app/(authenticated)/captura/types';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty';
import { cn } from '@/lib/utils';

interface CapturaFormBaseProps {
  advogadoId: number | null;
  credenciaisSelecionadas: number[];
  onAdvogadoChange: (advogadoId: number | null) => void;
  onCredenciaisChange: (ids: number[]) => void;
  onCredenciaisDisponiveisChange?: (credenciais: Credencial[]) => void;
  children?: React.ReactNode;
}

function extrairNumeroTribunal(tribunal: string): number {
  if (tribunal === 'TST') return 999;
  const match = tribunal.match(/TRT(\d+)/);
  return match ? parseInt(match[1], 10) : 998;
}

function pesoGrau(grau: string): number {
  if (grau === 'primeiro_grau' || grau === '1') return 1;
  if (grau === 'segundo_grau' || grau === '2') return 2;
  if (grau === 'tribunal_superior' || grau === '3') return 3;
  return 4;
}

function formatGrau(grau: string): string {
  if (grau === 'primeiro_grau' || grau === '1') return '1º Grau';
  if (grau === 'segundo_grau' || grau === '2') return '2º Grau';
  if (grau === 'tribunal_superior' || grau === '3') return 'Tribunal Superior';
  return grau;
}

function ordenarCredenciais(credenciais: Credencial[]): Credencial[] {
  return [...credenciais].sort((a, b) => {
    const numA = extrairNumeroTribunal(a.tribunal);
    const numB = extrairNumeroTribunal(b.tribunal);
    if (numA !== numB) return numA - numB;
    return pesoGrau(a.grau) - pesoGrau(b.grau);
  });
}

export function CapturaFormBase({
  advogadoId,
  credenciaisSelecionadas,
  onAdvogadoChange,
  onCredenciaisChange,
  onCredenciaisDisponiveisChange,
  children,
}: CapturaFormBaseProps) {
  const [credenciaisOpen, setCredenciaisOpen] = useState(false);

  const { advogados, isLoading: isLoadingAdvogados } = useAdvogados({
    com_credenciais: true,
  });

  const { credenciais, isLoading: isLoadingCredenciais } = useCredenciais(
    advogadoId ? { advogado_id: advogadoId, active: true } : { advogado_id: 0, active: true }
  );

  const credenciaisOrdenadas = useMemo(() => ordenarCredenciais(credenciais), [credenciais]);

  useEffect(() => {
    if (advogadoId) {
      const idsValidos = credenciais
        .map((c) => c.id)
        .filter((id) => credenciaisSelecionadas.includes(id));
      if (idsValidos.length !== credenciaisSelecionadas.length) {
        onCredenciaisChange(idsValidos);
      }
    } else {
      onCredenciaisChange([]);
    }
  }, [advogadoId, credenciais]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    onCredenciaisDisponiveisChange?.(credenciais);
  }, [credenciais, onCredenciaisDisponiveisChange]);

  const toggleCredencial = (id: number, checked: boolean) => {
    if (checked) {
      onCredenciaisChange([...credenciaisSelecionadas, id]);
    } else {
      onCredenciaisChange(credenciaisSelecionadas.filter((v) => v !== id));
    }
  };

  const allIds = useMemo(() => credenciaisOrdenadas.map((c) => c.id), [credenciaisOrdenadas]);
  const allSelected = allIds.length > 0 && allIds.every((id) => credenciaisSelecionadas.includes(id));
  const someSelected = credenciaisSelecionadas.length > 0 && !allSelected;

  const toggleAll = () => {
    if (allSelected) {
      onCredenciaisChange([]);
    } else {
      onCredenciaisChange(allIds);
    }
  };

  const credenciaisTriggerLabel = useMemo(() => {
    if (credenciaisSelecionadas.length === 0) return 'Selecione credenciais';
    if (allSelected) return 'Todas as credenciais';
    return `${credenciaisSelecionadas.length} de ${allIds.length} selecionadas`;
  }, [credenciaisSelecionadas.length, allSelected, allIds.length]);

  return (
    <div className="space-y-5">
      {/* Advogado */}
      <div className="space-y-2">
        <Label>Advogado *</Label>
        <Select
          value={advogadoId?.toString() ?? ''}
          onValueChange={(val) => onAdvogadoChange(val ? parseInt(val, 10) : null)}
          disabled={isLoadingAdvogados}
        >
          <SelectTrigger>
            <SelectValue placeholder={isLoadingAdvogados ? 'Carregando...' : 'Selecione um advogado'} />
          </SelectTrigger>
          <SelectContent>
            {advogados.map((advogado) => (
              <SelectItem key={advogado.id} value={advogado.id.toString()}>
                {advogado.nome_completo} — OAB {formatOabs(advogado.oabs)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {advogados.length === 0 && !isLoadingAdvogados && (
          <Empty className="border-0 py-3">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <AlertCircle className="h-5 w-5" />
              </EmptyMedia>
              <EmptyTitle className="text-sm">Nenhum advogado encontrado</EmptyTitle>
              <EmptyDescription className="text-xs">
                Cadastre credenciais antes de iniciar capturas.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>

      {/* Credenciais */}
      {advogadoId && (
        <div className="space-y-2">
          <Label>Credenciais *</Label>
          {isLoadingCredenciais ? (
            <p className="text-sm text-muted-foreground">Carregando credenciais...</p>
          ) : credenciais.length === 0 ? (
            <Empty className="border-0 py-3">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <AlertCircle className="h-5 w-5" />
                </EmptyMedia>
                <EmptyTitle className="text-sm">Nenhuma credencial ativa</EmptyTitle>
                <EmptyDescription className="text-xs">
                  Não há credenciais ativas para este advogado.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Popover open={credenciaisOpen} onOpenChange={setCredenciaisOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={credenciaisOpen}
                  className="w-full justify-between font-normal"
                >
                  <span className={cn(credenciaisSelecionadas.length === 0 && 'text-muted-foreground')}>
                    {credenciaisTriggerLabel}
                  </span>
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="p-0 w-[--radix-popover-trigger-width]"
                align="start"
                sideOffset={4}
              >
                {/* Selecionar todos */}
                <div className="border-b">
                  <label className="flex items-center gap-3 px-3 py-2.5 text-sm cursor-pointer hover:bg-muted/50 transition-colors">
                    <Checkbox
                      checked={allSelected}
                      data-state={someSelected ? 'indeterminate' : allSelected ? 'checked' : 'unchecked'}
                      onCheckedChange={toggleAll}
                    />
                    <span className="font-medium">Selecionar todos</span>
                    {someSelected && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        {credenciaisSelecionadas.length}/{allIds.length}
                      </span>
                    )}
                  </label>
                </div>

                {/* Lista de credenciais */}
                <div className="max-h-52 overflow-y-auto [scrollbar-width:thin]">
                  {credenciaisOrdenadas.map((cred) => {
                    const label = `${cred.tribunal} — ${formatGrau(cred.grau)}`;
                    const checked = credenciaisSelecionadas.includes(cred.id);
                    return (
                      <label
                        key={cred.id}
                        className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(v) => toggleCredencial(cred.id, !!v)}
                        />
                        <span className="flex-1">{label}</span>
                        {checked && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                      </label>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      )}

      {children}
    </div>
  );
}

export function validarCamposCaptura(
  advogadoId: number | null,
  credenciaisSelecionadas: number[]
): boolean {
  if (!advogadoId) return false;
  if (credenciaisSelecionadas.length === 0) return false;
  return true;
}
