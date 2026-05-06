'use client';

import { cn } from '@/lib/utils';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Heading, Text } from '@/components/ui/typography';

export default function ErrorBoundary({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('[EditarDocumento] Erro de renderização:', error);
    }, [error]);

    return (
        <div className={cn("flex h-screen w-full flex-col items-center justify-center inline-default bg-background inset-card-compact")}>
            <div className={cn("rounded-full bg-destructive/10 inset-card-compact")}>
                <AlertCircle className="h-12 w-12 text-destructive" />
            </div>

            <div className={cn("flex flex-col text-center stack-tight max-w-md")}>
                <Heading level="page">Algo deu errado!</Heading>
                <p className="text-muted-foreground">
                    Não foi possível carregar o editor de documentos.
                </p>

                {error.digest && (
                    <Text variant="caption" as="div" className="mt-4 rounded-md bg-muted p-3 font-mono text-left overflow-auto max-h-32">
                        <p className={cn( "font-semibold text-foreground mb-1")}>Código do erro (Digest):</p>
                        <p className="text-muted-foreground select-all">{error.digest}</p>
                    </Text>
                )}

                {process.env.NODE_ENV === 'development' && (
                    <Text variant="caption" as="div" className="mt-4 rounded-md bg-destructive/10 p-3 text-left overflow-auto max-h-48">
                        <p className={cn( "font-semibold text-destructive mb-1")}>Detalhes (Dev):</p>
                        <p className="whitespace-pre-wrap text-destructive/80 font-mono">{error.message}</p>
                        {error.stack && (
                            <details className="mt-2">
                                <summary className={cn( "cursor-pointer font-semibold text-destructive/90")}>Stack Trace</summary>
                                <pre className={cn(/* design-system-escape: p-2 → usar <Inset> */ "mt-1 whitespace-pre inset-tight overflow-auto text-[10px]")}>{error.stack}</pre>
                            </details>
                        )}
                    </Text>
                )}
            </div>

            <div className={cn("flex inline-tight mt-6")}>
                <Button variant="outline" onClick={() => window.location.href = '/app/assinatura-digital/documentos'}>
                    Voltar para Lista
                </Button>
                <Button onClick={() => reset()}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Tentar Novamente
                </Button>
            </div>
        </div>
    );
}
