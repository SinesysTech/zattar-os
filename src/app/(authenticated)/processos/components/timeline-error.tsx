/**
 * Timeline Error State
 *
 * Exibe mensagens de erro com opção de retry.
 */

'use client';

import { cn } from '@/lib/utils';
import { AlertTriangle, RotateCw, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface TimelineErrorProps {
  error: Error;
  onRetry: () => void;
  message?: string;
}

export function TimelineError({ error, onRetry, message }: TimelineErrorProps) {
  const router = useRouter();

  // Determinar tipo de erro e mensagem apropriada
  const getErrorDetails = (error: Error) => {
    const message = error.message.toLowerCase();

    if (message.includes('processo não encontrado')) {
      return {
        title: 'Processo Não Encontrado',
        description:
          'Este processo não foi encontrado no sistema. Verifique se o ID está correto.',
        canRetry: false,
      };
    }

    if (message.includes('autenticação') || message.includes('credenciais')) {
      return {
        title: 'Erro de Autenticação',
        description:
          'Não foi possível autenticar no PJE com as credenciais do advogado. Verifique se as credenciais estão corretas e atualizadas.',
        canRetry: true,
      };
    }

    if (message.includes('timeout')) {
      return {
        title: 'Timeout na Captura',
        description:
          'A captura está demorando mais que o esperado. A operação pode estar em andamento. Recarregue a página em alguns minutos.',
        canRetry: true,
      };
    }

    if (message.includes('advogado não configurado')) {
      return {
        title: 'Configuração Incompleta',
        description: error.message,
        canRetry: false,
      };
    }

    // Erro genérico
    return {
      title: 'Erro ao Carregar Timeline',
      description: 'Ocorreu um erro ao carregar a timeline do processo. Tente novamente.',
      canRetry: true,
    };
  };

  const { title, description, canRetry } = getErrorDetails(error);

  return (
    <div className={cn("stack-loose")}>
      <Card className={cn("inset-dialog")}>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{title}</AlertTitle>
          <AlertDescription className={cn("mt-2 stack-tight")}>
            {message && <p className={cn( "font-medium")}>{message}</p>}
            <p>{description}</p>

            {/* Detalhes técnicos (colapsível) */}
            <details className="mt-3">
              <summary className={cn( "cursor-pointer text-body-sm font-medium")}>
                Detalhes técnicos
              </summary>
              <pre className={cn(/* design-system-escape: p-3 → usar <Inset> */ "mt-2 text-caption bg-muted p-3 rounded overflow-x-auto")}>
                {error.message}
              </pre>
            </details>
          </AlertDescription>
        </Alert>

        {/* Ações */}
        <div className={cn("flex inline-medium mt-6")}>
          {canRetry && (
            <Button onClick={onRetry} className={cn("inline-tight")}>
              <RotateCw className="h-4 w-4" />
              Tentar Novamente
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => router.push('/processos')}
            className={cn("inline-tight")}
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para Processos
          </Button>
        </div>
      </Card>
    </div>
  );
}
