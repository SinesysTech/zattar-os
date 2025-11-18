'use client';

import { useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { useAdvogados } from '@/lib/hooks/use-advogados';
import { useCredenciais } from '@/lib/hooks/use-credenciais';
import { AdvogadoCombobox } from './advogado-combobox';
import { CredenciaisCombobox } from './credenciais-combobox';

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


  return (
    <div className="space-y-6">
      {/* Passo 1: Selecionar Advogado */}
      <div className="space-y-3">
        <Label>Advogado *</Label>
        <AdvogadoCombobox
          advogados={advogados}
          selectedId={advogadoId}
          onSelectionChange={onAdvogadoChange}
          disabled={isLoadingAdvogados}
          isLoading={isLoadingAdvogados}
          placeholder="Selecione um advogado"
        />
        {advogados.length === 0 && !isLoadingAdvogados && (
          <p className="text-sm text-muted-foreground">
            Nenhum advogado com credenciais cadastradas encontrado. Cadastre credenciais antes de iniciar capturas.
          </p>
        )}
      </div>

      {/* Passo 2: Selecionar Credenciais do Advogado */}
      {advogadoId && (
        <div className="space-y-3">
          <Label>Credenciais *</Label>
          {isLoadingCredenciais ? (
            <div className="text-sm text-muted-foreground">Carregando credenciais...</div>
          ) : credenciais.length === 0 ? (
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">
                Nenhuma credencial ativa encontrada para este advogado.
              </p>
            </div>
          ) : (
            <CredenciaisCombobox
              credenciais={credenciais}
              selectedIds={credenciaisSelecionadas}
              onSelectionChange={onCredenciaisChange}
              disabled={isLoadingCredenciais}
              placeholder="Selecione credenciais..."
            />
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
