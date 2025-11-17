'use client';

import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import type { CodigoTRT, GrauTRT } from '@/backend/types/captura/trt-types';
import type { CredencialDisponivel } from '@/lib/api/captura';
import { GRAUS } from '@/lib/api/captura';

interface CapturaFormBaseProps {
  credenciais: CredencialDisponivel[];
  credenciaisSelecionadas: number[];
  tribunaisDisponiveis: CodigoTRT[];
  grausDisponiveis: GrauTRT[];
  tribunaisSelecionados: CodigoTRT[];
  grausSelecionados: GrauTRT[];
  todosTribunais: boolean;
  todosGraus: boolean;
  onCredenciaisChange: (ids: number[]) => void;
  onTribunaisChange: (tribunais: CodigoTRT[], todos: boolean) => void;
  onGrausChange: (graus: GrauTRT[], todos: boolean) => void;
  children?: React.ReactNode;
  permiteMultiplaSelecao?: boolean;
}

/**
 * Componente base de formulário para captura
 * Com seleção de credenciais, tribunais e graus (múltipla seleção)
 */
export function CapturaFormBase({
  credenciais,
  credenciaisSelecionadas,
  tribunaisDisponiveis,
  grausDisponiveis,
  tribunaisSelecionados,
  grausSelecionados,
  todosTribunais,
  todosGraus,
  onCredenciaisChange,
  onTribunaisChange,
  onGrausChange,
  children,
  permiteMultiplaSelecao = false,
}: CapturaFormBaseProps) {
  // Agrupar credenciais por advogado
  const credenciaisPorAdvogado = credenciais.reduce((acc, cred) => {
    if (!acc[cred.advogado_id]) {
      acc[cred.advogado_id] = {
        advogado_id: cred.advogado_id,
        advogado_nome: cred.advogado_nome,
        advogado_oab: cred.advogado_oab,
        advogado_uf_oab: cred.advogado_uf_oab,
        credenciais: [],
      };
    }
    acc[cred.advogado_id].credenciais.push(cred);
    return acc;
  }, {} as Record<number, {
    advogado_id: number;
    advogado_nome: string;
    advogado_oab: string;
    advogado_uf_oab: string;
    credenciais: CredencialDisponivel[];
  }>);

  const handleCredencialToggle = (credencialId: number) => {
    if (credenciaisSelecionadas.includes(credencialId)) {
      onCredenciaisChange(credenciaisSelecionadas.filter((id) => id !== credencialId));
    } else {
      onCredenciaisChange([...credenciaisSelecionadas, credencialId]);
    }
  };

  const handleTribunalToggle = (tribunal: CodigoTRT) => {
    if (todosTribunais) {
      // Se "todos" está marcado, desmarcar e selecionar apenas este
      onTribunaisChange([tribunal], false);
    } else if (tribunaisSelecionados.includes(tribunal)) {
      // Desmarcar tribunal
      const novos = tribunaisSelecionados.filter((t) => t !== tribunal);
      onTribunaisChange(novos, false);
    } else {
      // Adicionar tribunal
      const novos = [...tribunaisSelecionados, tribunal];
      // Se selecionou todos os disponíveis, marcar "todos"
      if (permiteMultiplaSelecao && novos.length === tribunaisDisponiveis.length) {
        onTribunaisChange(tribunaisDisponiveis, true);
      } else {
        onTribunaisChange(novos, false);
      }
    }
  };

  const handleTodosTribunais = (checked: boolean) => {
    if (checked) {
      onTribunaisChange(tribunaisDisponiveis, true);
    } else {
      onTribunaisChange([], false);
    }
  };

  const handleGrauToggle = (grau: GrauTRT) => {
    if (todosGraus) {
      // Se "todos" está marcado, desmarcar e selecionar apenas este
      onGrausChange([grau], false);
    } else if (grausSelecionados.includes(grau)) {
      // Desmarcar grau
      const novos = grausSelecionados.filter((g) => g !== grau);
      onGrausChange(novos, false);
    } else {
      // Adicionar grau
      const novos = [...grausSelecionados, grau];
      // Se selecionou todos os disponíveis, marcar "todos"
      if (permiteMultiplaSelecao && novos.length === grausDisponiveis.length) {
        onGrausChange(grausDisponiveis, true);
      } else {
        onGrausChange(novos, false);
      }
    }
  };

  const handleTodosGraus = (checked: boolean) => {
    if (checked) {
      onGrausChange(grausDisponiveis, true);
    } else {
      onGrausChange([], false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Credenciais - Ocupa linha inteira */}
      <div className="space-y-3">
        <Label>Credenciais *</Label>
        <div className="space-y-3 rounded-lg border p-4">
          {Object.values(credenciaisPorAdvogado).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma credencial cadastrada. Cadastre credenciais antes de iniciar capturas.
            </p>
          ) : (
            Object.values(credenciaisPorAdvogado).map((grupo) => (
              <div key={grupo.advogado_id} className="space-y-2">
                <div className="font-medium text-sm">
                  {grupo.advogado_nome} - OAB {grupo.advogado_oab}/{grupo.advogado_uf_oab}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pl-4">
                  {grupo.credenciais.map((cred) => (
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
                        {cred.tribunal} - {GRAUS.find((g) => g.value === cred.grau)?.label || cred.grau}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Tribunal e Grau - Lado a lado, não ocupam linha inteira */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tribunal */}
        <div className="space-y-3">
          <Label>Tribunal *</Label>
          <div className="space-y-2 rounded-lg border p-4 max-h-64 overflow-y-auto">
            {permiteMultiplaSelecao && (
              <div className="flex items-center space-x-2 pb-2 border-b">
                <Checkbox
                  id="todos-tribunais"
                  checked={todosTribunais}
                  onCheckedChange={handleTodosTribunais}
                />
                <label htmlFor="todos-tribunais" className="text-sm font-medium cursor-pointer">
                  Todos os Tribunais
                </label>
              </div>
            )}
            <div className="space-y-2">
              {tribunaisDisponiveis.map((tribunal) => (
                <div key={tribunal} className="flex items-center space-x-2">
                  <Checkbox
                    id={`tribunal-${tribunal}`}
                    checked={todosTribunais || tribunaisSelecionados.includes(tribunal)}
                    disabled={todosTribunais}
                    onCheckedChange={() => handleTribunalToggle(tribunal)}
                  />
                  <label
                    htmlFor={`tribunal-${tribunal}`}
                    className="text-sm cursor-pointer flex-1"
                  >
                    {tribunal}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Grau */}
        <div className="space-y-3">
          <Label>Grau *</Label>
          <div className="space-y-2 rounded-lg border p-4">
            {permiteMultiplaSelecao && (
              <div className="flex items-center space-x-2 pb-2 border-b">
                <Checkbox
                  id="todos-graus"
                  checked={todosGraus}
                  onCheckedChange={handleTodosGraus}
                />
                <label htmlFor="todos-graus" className="text-sm font-medium cursor-pointer">
                  Todos os Graus
                </label>
              </div>
            )}
            <div className="space-y-2">
              {grausDisponiveis.map((grau) => {
                const grauLabel = GRAUS.find((g) => g.value === grau)?.label || grau;
                return (
                  <div key={grau} className="flex items-center space-x-2">
                    <Checkbox
                      id={`grau-${grau}`}
                      checked={todosGraus || grausSelecionados.includes(grau)}
                      disabled={todosGraus}
                      onCheckedChange={() => handleGrauToggle(grau)}
                    />
                    <label
                      htmlFor={`grau-${grau}`}
                      className="text-sm cursor-pointer flex-1"
                    >
                      {grauLabel}
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Campos específicos do formulário filho */}
      {children}
    </div>
  );
}

/**
 * Valida se há credenciais selecionadas e tribunais/graus selecionados
 */
export function validarCamposCaptura(
  credenciaisSelecionadas: number[],
  tribunaisSelecionados: CodigoTRT[],
  grausSelecionados: GrauTRT[],
  todosTribunais: boolean,
  todosGraus: boolean
): boolean {
  if (credenciaisSelecionadas.length === 0) {
    return false;
  }
  if (!todosTribunais && tribunaisSelecionados.length === 0) {
    return false;
  }
  if (!todosGraus && grausSelecionados.length === 0) {
    return false;
  }
  return true;
}

/**
 * Gera combinações de credenciais selecionadas com tribunais e graus
 */
export function gerarCombinacoesCaptura(
  credenciais: CredencialDisponivel[],
  credenciaisSelecionadas: number[],
  tribunaisSelecionados: CodigoTRT[],
  grausSelecionados: GrauTRT[],
  todosTribunais: boolean,
  todosGraus: boolean
): Array<{ advogado_id: number; trt_codigo: CodigoTRT; grau: GrauTRT }> {
  const combinacoes: Array<{ advogado_id: number; trt_codigo: CodigoTRT; grau: GrauTRT }> = [];

  // Filtrar credenciais selecionadas
  const credenciaisFiltradas = credenciais.filter((c) =>
    credenciaisSelecionadas.includes(c.id)
  );

  // Determinar tribunais a usar
  // Se "todos" marcado, usar todos os tribunais disponíveis nas credenciais selecionadas
  // Senão, usar apenas os selecionados
  const tribunaisParaUsar = todosTribunais
    ? Array.from(new Set(credenciaisFiltradas.map((c) => c.tribunal)))
    : tribunaisSelecionados;
  
  // Determinar graus a usar
  // Se "todos" marcado, usar todos os graus disponíveis nas credenciais selecionadas
  // Senão, usar apenas os selecionados
  const grausParaUsar = todosGraus
    ? Array.from(new Set(credenciaisFiltradas.map((c) => c.grau)))
    : grausSelecionados;

  // Para cada combinação de tribunal e grau, verificar se existe credencial correspondente
  for (const tribunal of tribunaisParaUsar) {
    for (const grau of grausParaUsar) {
      // Encontrar credenciais que correspondem a esta combinação
      const credenciaisCombinacao = credenciaisFiltradas.filter(
        (c) => c.tribunal === tribunal && c.grau === grau
      );

      // Para cada advogado único nesta combinação, criar uma combinação
      const advogadosUnicos = Array.from(new Set(credenciaisCombinacao.map((c) => c.advogado_id)));
      
      for (const advogadoId of advogadosUnicos) {
        combinacoes.push({
          advogado_id: advogadoId,
          trt_codigo: tribunal,
          grau,
        });
      }
    }
  }

  // Remover duplicatas
  const combinacoesUnicas = Array.from(
    new Map(combinacoes.map((c) => [`${c.advogado_id}-${c.trt_codigo}-${c.grau}`, c])).values()
  );

  return combinacoesUnicas;
}
