'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAdvogados } from '@/lib/hooks/use-advogados';
import { useCredenciais } from '@/lib/hooks/use-credenciais';
import { GRAUS } from '@/lib/api/captura';
import type { CredencialComAdvogado } from '@/backend/types/credenciais/types';

interface CapturaFormBaseProps {
  advogadoId: number | null;
  credenciaisSelecionadas: number[];
  onAdvogadoChange: (advogadoId: number | null) => void;
  onCredenciaisChange: (ids: number[]) => void;
  children?: React.ReactNode;
}

/**
 * Componente base de formulário para captura
 * Novo fluxo: Selecionar Advogado → Selecionar Credenciais
 */
export function CapturaFormBase({
  advogadoId,
  credenciaisSelecionadas,
  onAdvogadoChange,
  onCredenciaisChange,
  children,
}: CapturaFormBaseProps) {
  // Buscar advogados com credenciais ativas
  const { advogados, isLoading: isLoadingAdvogados } = useAdvogados({
    com_credenciais: true,
  });

  // Buscar credenciais do advogado selecionado
  const { credenciais, isLoading: isLoadingCredenciais } = useCredenciais(advogadoId, {
    active: true,
  });

  // Limpar credenciais selecionadas quando mudar advogado
  useEffect(() => {
    if (advogadoId) {
      // Manter apenas credenciais que ainda existem para o novo advogado
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

  const handleCredencialToggle = (credencialId: number) => {
    if (credenciaisSelecionadas.includes(credencialId)) {
      onCredenciaisChange(credenciaisSelecionadas.filter((id) => id !== credencialId));
    } else {
      onCredenciaisChange([...credenciaisSelecionadas, credencialId]);
    }
  };

  const handleTodasCredenciais = (checked: boolean) => {
    if (checked) {
      onCredenciaisChange(credenciais.map((c) => c.id));
    } else {
      onCredenciaisChange([]);
    }
  };

  const todasCredenciaisSelecionadas =
    credenciais.length > 0 && credenciaisSelecionadas.length === credenciais.length;

  return (
    <div className="space-y-6">
      {/* Passo 1: Selecionar Advogado */}
      <div className="space-y-3">
        <Label htmlFor="advogado-select">Advogado *</Label>
        <Select
          value={advogadoId?.toString() || ''}
          onValueChange={(value) => {
            onAdvogadoChange(value ? parseInt(value, 10) : null);
          }}
          disabled={isLoadingAdvogados}
        >
          <SelectTrigger id="advogado-select">
            <SelectValue placeholder="Selecione um advogado" />
          </SelectTrigger>
          <SelectContent>
            {isLoadingAdvogados ? (
              <SelectItem value="loading" disabled>
                Carregando...
              </SelectItem>
            ) : advogados.length === 0 ? (
              <SelectItem value="empty" disabled>
                Nenhum advogado com credenciais encontrado
              </SelectItem>
            ) : (
              advogados.map((advogado) => (
                <SelectItem key={advogado.id} value={advogado.id.toString()}>
                  {advogado.nome_completo} - OAB {advogado.oab}/{advogado.uf_oab}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        {advogados.length === 0 && !isLoadingAdvogados && (
          <p className="text-sm text-muted-foreground">
            Nenhum advogado com credenciais cadastradas encontrado. Cadastre credenciais antes de iniciar capturas.
          </p>
        )}
      </div>

      {/* Passo 2: Selecionar Credenciais do Advogado */}
      {advogadoId && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Credenciais *</Label>
            {credenciais.length > 0 && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="todas-credenciais"
                  checked={todasCredenciaisSelecionadas}
                  onCheckedChange={handleTodasCredenciais}
                />
                <label htmlFor="todas-credenciais" className="text-sm font-medium cursor-pointer">
                  Marcar todas
                </label>
              </div>
            )}
          </div>
          {isLoadingCredenciais ? (
            <div className="text-sm text-muted-foreground">Carregando credenciais...</div>
          ) : credenciais.length === 0 ? (
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">
                Nenhuma credencial ativa encontrada para este advogado.
              </p>
            </div>
          ) : (
            <div className="space-y-2 rounded-lg border p-4">
              {credenciais.map((cred) => {
                const grauLabel = GRAUS.find((g) => g.value === cred.grau)?.label || cred.grau;
                return (
                  <div key={cred.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`cred-${cred.id}`}
                      checked={credenciaisSelecionadas.includes(cred.id)}
                      onCheckedChange={() => handleCredencialToggle(cred.id)}
                    />
                    <label
                      htmlFor={`cred-${cred.id}`}
                      className="text-sm cursor-pointer flex-1"
                    >
                      {cred.tribunal} - {grauLabel}
                    </label>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Campos específicos do formulário filho */}
      {children}
    </div>
  );
}

/**
 * Valida se há advogado selecionado e credenciais selecionadas
 */
export function validarCamposCaptura(
  advogadoId: number | null,
  credenciaisSelecionadas: number[]
): boolean {
  if (!advogadoId) {
    return false;
  }
  if (credenciaisSelecionadas.length === 0) {
    return false;
  }
  return true;
}
