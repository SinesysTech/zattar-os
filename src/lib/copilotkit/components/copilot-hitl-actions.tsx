'use client';

/**
 * CopilotHITLActions — Human-in-the-Loop
 *
 * Ações que pausam a execução e exibem um card de confirmação no chat.
 * O agente DEVE usar estas ações antes de executar operações destrutivas.
 *
 * Fluxo:
 * 1. Pedrinho decide excluir/cancelar algo
 * 2. Chama `confirmar_acao` com detalhes da operação
 * 3. Card de confirmação aparece no chat com botões
 * 4. Usuário confirma ou cancela
 * 5. Resposta volta ao Pedrinho que executa (ou não) a operação MCP
 */

import { useHumanInTheLoop } from '@copilotkit/react-core';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, XCircle, Loader2 } from 'lucide-react';

// ─── Componente de Confirmação ──────────────────────────────────────

function ConfirmationCard({
  operacao,
  detalhes,
  onConfirm,
  onCancel,
}: {
  operacao: string;
  detalhes: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Card className="w-full max-w-md border-orange-500/50">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-sm font-medium flex items-center gap-2 text-orange-600">
          <AlertTriangle className="h-4 w-4" />
          Confirmar: {operacao}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-2">
        <p className="text-xs text-muted-foreground">{detalhes}</p>
      </CardContent>
      <CardFooter className="px-4 pb-3 pt-1 gap-2">
        <Button size="sm" variant="destructive" onClick={onConfirm} className="h-7 text-xs">
          <CheckCircle className="h-3 w-3 mr-1" />
          Confirmar
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel} className="h-7 text-xs">
          <XCircle className="h-3 w-3 mr-1" />
          Cancelar
        </Button>
      </CardFooter>
    </Card>
  );
}

function ConfirmationResult({ confirmed }: { confirmed: boolean }) {
  return (
    <Card className={`w-full max-w-md ${confirmed ? 'border-green-500/50' : 'border-muted'}`}>
      <CardContent className="p-3 flex items-center gap-2">
        {confirmed ? (
          <>
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-xs text-green-600">Operacao confirmada pelo usuario</span>
          </>
        ) : (
          <>
            <XCircle className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Operacao cancelada pelo usuario</span>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function LoadingConfirmation() {
  return (
    <Card className="w-full max-w-md">
      <CardContent className="p-3 flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Preparando confirmacao...</span>
      </CardContent>
    </Card>
  );
}

// ─── Hook: Registrar Human-in-the-Loop Actions ─────────────────────

export function useCopilotHITLActions() {
  // ── Confirmação genérica para ações destrutivas ──
  useHumanInTheLoop({
    name: 'confirmar_acao',
    description:
      'OBRIGATÓRIO: Use esta ação ANTES de executar qualquer operação destrutiva (excluir, cancelar, estornar, remover). Apresenta um card de confirmação ao usuário e espera a resposta. Se o usuário confirmar, prossiga com a operação. Se cancelar, informe que a operação foi cancelada.',
    parameters: [
      {
        name: 'operacao',
        type: 'string' as const,
        description: 'Nome curto da operação (ex: "Excluir Lançamento", "Cancelar Contrato")',
        required: true,
      },
      {
        name: 'detalhes',
        type: 'string' as const,
        description: 'Detalhes da operação para o usuário avaliar (ex: "Lançamento #123 de R$ 5.000,00 será excluído permanentemente")',
        required: true,
      },
    ],
    render: ({ status, args, respond }) => {
      if (status === 'inProgress') {
        return <LoadingConfirmation />;
      }

      if (status === 'executing' && respond) {
        return (
          <ConfirmationCard
            operacao={args.operacao || 'Operação'}
            detalhes={args.detalhes || 'Tem certeza que deseja prosseguir?'}
            onConfirm={() => respond({ confirmed: true })}
            onCancel={() => respond({ confirmed: false })}
          />
        );
      }

      if (status === 'complete') {
        const confirmed = (args as Record<string, unknown>)?.confirmed !== false;
        return <ConfirmationResult confirmed={confirmed} />;
      }

      return <LoadingConfirmation />;
    },
  });
}
