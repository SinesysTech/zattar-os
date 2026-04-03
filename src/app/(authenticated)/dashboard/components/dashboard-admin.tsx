'use client';

import { AppBadge as Badge } from '@/components/ui/app-badge';
import { getSemanticBadgeVariant } from '@/lib/design-system';
import { WidgetWrapper } from './widgets/widget-wrapper';
import { Users, Radio } from 'lucide-react';
import type { PerformanceAdvogado, StatusCaptura } from '../domain';

interface AdminWidgetsProps {
  performanceAdvogados: PerformanceAdvogado[];
  statusCapturas: StatusCaptura[];
}

export function AdminWidgets({ performanceAdvogados, statusCapturas }: AdminWidgetsProps) {
  const hasPerformance = performanceAdvogados.length > 0;
  const hasCapturas = statusCapturas.length > 0;

  if (!hasPerformance && !hasCapturas) return null;

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
      {hasPerformance && (
        <WidgetWrapper title="Performance de Advogados" icon={Users}>
          <div className="space-y-3">
            {performanceAdvogados.slice(0, 5).map((adv) => (
              <div key={adv.usuario_id} className="flex items-center justify-between p-3 rounded-lg border bg-background">
                <span className="text-sm font-medium truncate flex-1 min-w-0">{adv.usuario_nome}</span>
                <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                  <span>{adv.baixasMes} baixas/mês</span>
                  <Badge variant={adv.taxaCumprimentoPrazo >= 80 ? 'success' : adv.taxaCumprimentoPrazo >= 50 ? 'warning' : 'destructive'}>
                    {adv.taxaCumprimentoPrazo}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </WidgetWrapper>
      )}

      {hasCapturas && (
        <WidgetWrapper title="Status de Capturas" icon={Radio}>
          <div className="space-y-3">
            {statusCapturas.slice(0, 6).map((captura) => {
              const statusMap: Record<string, string> = {
                sucesso: 'completed',
                erro: 'failed',
                pendente: 'pending',
                executando: 'in_progress',
              };
              return (
                <div key={`${captura.trt}-${captura.grau}`} className="flex items-center justify-between p-3 rounded-lg border bg-background">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      {captura.trt} - {captura.grau === 'primeiro_grau' ? '1º Grau' : '2º Grau'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {captura.ultimaExecucao
                        ? new Date(captura.ultimaExecucao).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
                        : 'Nunca executado'}
                    </p>
                  </div>
                  <Badge variant={getSemanticBadgeVariant('captura_status', statusMap[captura.status] || 'pending')}>
                    {captura.status}
                  </Badge>
                </div>
              );
            })}
          </div>
        </WidgetWrapper>
      )}
    </div>
  );
}
