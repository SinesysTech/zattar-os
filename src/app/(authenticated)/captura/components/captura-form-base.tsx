'use client';

import { cn } from '@/lib/utils';
import { useEffect, useMemo } from 'react';
import { AlertCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAdvogados } from '@/app/(authenticated)/advogados';
import { useCredenciais } from '@/app/(authenticated)/advogados';
import { formatOabs } from '@/app/(authenticated)/advogados';
import { GRAUS } from '@/app/(authenticated)/captura/constants';
import type { Credencial } from '@/app/(authenticated)/captura/types';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty';

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
  if (grau === 'primeiro_grau') return 1;
  if (grau === 'segundo_grau') return 2;
  if (grau === 'tribunal_superior') return 3;
  return 4;
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

  return (
    <div className={cn("space-y-5")}>
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
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 max-h-44 overflow-y-auto [scrollbar-width:thin]">
              {credenciaisOrdenadas.map((cred) => {
                const grauLabel = GRAUS.find((g) => g.value === cred.grau)?.label ?? cred.grau;
                const label = `${cred.tribunal} — ${grauLabel}`;
                return (
                  <label
                    key={cred.id}
                    className="flex items-center gap-2.5 rounded-md border px-3 py-2 text-sm cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      checked={credenciaisSelecionadas.includes(cred.id)}
                      onCheckedChange={(checked) => toggleCredencial(cred.id, !!checked)}
                    />
                    <span className="flex-1 leading-tight">{label}</span>
                  </label>
                );
              })}
            </div>
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
