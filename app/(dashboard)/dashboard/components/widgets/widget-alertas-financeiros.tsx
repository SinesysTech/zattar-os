'use client';

import Link from 'next/link';
import { AlertTriangle, Bell } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAlertasFinanceiros } from '@/app/_lib/hooks/use-dashboard-financeiro';

export function WidgetAlertasFinanceiros() {
  const { alertas, isLoading, error } = useAlertasFinanceiros();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-44" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Alertas Financeiros</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Erro ao carregar dados</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Bell className="h-4 w-4" />
          Alertas Financeiros
        </CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/financeiro/alertas">Ver todos</Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {(alertas || []).slice(0, 5).map((alerta, idx) => (
          <Link
            key={idx}
            href="/financeiro"
            className="flex items-center gap-2 rounded-md border p-2 text-sm transition-colors hover:bg-muted/60"
          >
            <AlertTriangle
              className="h-4 w-4"
              color={alerta.nivel === 'danger' ? '#ef4444' : alerta.nivel === 'warning' ? '#f59e0b' : '#0ea5e9'}
            />
            <span>{alerta.mensagem || 'Alerta'}</span>
          </Link>
        ))}
        {!alertas?.length && <p className="text-xs text-muted-foreground">Nenhum alerta no momento.</p>}
      </CardContent>
    </Card>
  );
}
