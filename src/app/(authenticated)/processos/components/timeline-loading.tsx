/**
 * Timeline Loading State
 *
 * Exibe skeleton e mensagens contextuais durante carregamento ou captura.
 */

'use client';

import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/typography';
import { Progress } from '@/components/ui/progress';

import { LoadingSpinner } from "@/components/ui/loading-state"
interface TimelineLoadingProps {
  message?: string;
  isCapturing?: boolean;
  embedded?: boolean;
}

export function TimelineLoading({
  message = 'Carregando processo...',
  isCapturing = false,
  embedded = false,
}: TimelineLoadingProps) {
  if (embedded) {
    return (
      <div className={cn("flex flex-col stack-default")}>
        <div className={cn("grid inline-default lg:grid-cols-[minmax(280px,0.36fr)_minmax(0,1fr)]")}>
          <div className={cn("flex flex-col rounded-2xl border bg-muted/20 inset-card-compact stack-medium")}>
            <Skeleton className="h-5 w-28" />
            <div className={cn("flex flex-col stack-tight")}>
              {[...Array(5)].map((_, index) => (
                <div key={index} className={cn("flex flex-col rounded-xl border bg-background inset-medium stack-tight")}>
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))}
            </div>
          </div>

          <div className={cn("flex flex-col rounded-2xl border bg-muted/10 inset-default-plus stack-default-plus")}>
            <div className={cn("flex flex-col stack-tight")}>
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <div className={cn("flex flex-col rounded-2xl border bg-background inset-default-plus stack-default min-h-120")}>
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
          </div>
        </div>

        <div className={cn("rounded-2xl border bg-card px-6 py-8")}>
          <div className={cn("flex items-center justify-center inline-medium")}>
            <LoadingSpinner size="lg" className="text-primary" />
            <div className={cn("flex flex-col text-center stack-tight")}>
              <Text variant="label" weight="medium" as="p" className={cn( "text-body")}>{message}</Text>
              {isCapturing && (
                <>
                  <Progress value={undefined} className="w-64 mx-auto" />
                  <p className={cn("text-body-sm text-muted-foreground")}>
                    Você pode seguir navegando. A captura continua integrada ao workspace.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col stack-loose")}>
      {/* Header Skeleton */}
      <Card className={cn("flex flex-col inset-dialog stack-default")}>
        <div className={cn("flex flex-col stack-tight")}>
          <Skeleton className="h-8 w-3/4" />
          <div className={cn("flex inline-tight")}>
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-24" />
          </div>
        </div>
        <div className="h-px bg-border" />
        <div className={cn("grid inline-default md:grid-cols-2")}>
          <div className={cn("flex flex-col stack-tight")}>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-full" />
          </div>
          <div className={cn("flex flex-col stack-tight")}>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      </Card>

      {/* Timeline Loading Message */}
      <Card className={cn("flex flex-col inset-dialog stack-default")}>
        <div className={cn("flex items-center justify-center inline-medium py-8")}>
          <LoadingSpinner className="size-6 text-primary" />
          <div className={cn("flex flex-col text-center stack-tight")}>
            <p className={cn( "text-body font-medium")}>{message}</p>
            {isCapturing && (
              <>
                <Progress value={undefined} className="w-64 mx-auto" />
                <p className={cn("text-body-sm text-muted-foreground")}>
                  Você pode navegar para outras páginas. A captura continuará em segundo
                  plano.
                </p>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Timeline Items Skeleton (apenas se não estiver capturando) */}
      {!isCapturing && (
        <div className={cn("flex flex-col stack-default")}>
          {[...Array(5)].map((_, i) => (
            <div key={i} className={cn("flex inline-default")}>
              <div className="relative flex flex-col items-center">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="w-0.5 h-20 bg-border" />
              </div>
              <Card className={cn("flex flex-col flex-1 inset-card-compact stack-medium")}>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
                <div className={cn("flex inline-tight mt-3")}>
                  <Skeleton className="h-9 w-32" />
                  <Skeleton className="h-9 w-24" />
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
