'use client';

import Link from 'next/link';
import { FileText, ArrowRight } from 'lucide-react';
import { WidgetWrapper, WidgetEmpty } from './widget-wrapper';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import { Button } from '@/components/ui/button';
import type { ProcessoResumo } from '../../domain';

interface WidgetProcessosResumoProps {
  data: ProcessoResumo;
  loading?: boolean;
  error?: string;
}

export function WidgetProcessosResumo({
  data,
  loading,
  error,
}: WidgetProcessosResumoProps) {
  if (loading) {
    return (
      <WidgetWrapper title="Processos" icon={FileText} loading={true}>
        <div />
      </WidgetWrapper>
    );
  }

  if (error) {
    return (
      <WidgetWrapper title="Processos" icon={FileText} error={error}>
        <div />
      </WidgetWrapper>
    );
  }

  if (data.total === 0) {
    return (
      <WidgetWrapper title="Processos" icon={FileText}>
        <WidgetEmpty
          icon={FileText}
          title="Nenhum processo atribuído"
          description="Você ainda não possui processos atribuídos"
        />
      </WidgetWrapper>
    );
  }

  const ativosPercent = data.total > 0 ? Math.round((data.ativos / data.total) * 100) : 0;
  const arquivadosPercent = data.total > 0 ? Math.round((data.arquivados / data.total) * 100) : 0;

  return (
    <WidgetWrapper title="Processos" icon={FileText}>
      <div className="space-y-4">
        {/* Resumo principal */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-2xl font-bold">{data.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-foreground">{data.ativos}</p>
            <p className="text-xs text-muted-foreground">Ativos</p>
          </div>
        </div>

        {/* Distribuição */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Ativos</span>
            <span className="font-medium">{ativosPercent}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${ativosPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Arquivados</span>
            <span className="font-medium">{arquivadosPercent}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-muted-foreground transition-all"
              style={{ width: `${arquivadosPercent}%` }}
            />
          </div>
        </div>

        {/* Por Grau */}
        {data.porGrau.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Por Grau</p>
            <div className="flex flex-wrap gap-2">
              {data.porGrau.map((item) => (
                <Badge key={item.grau} variant="outline">
                  {item.grau}: {item.count}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Top TRTs */}
        {data.porTRT.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Top TRTs</p>
            <div className="space-y-1">
              {data.porTRT.slice(0, 3).map((item) => (
                <div key={item.trt} className="flex items-center justify-between text-xs">
                  <span>TRT {item.trt}</span>
                  <span className="font-medium">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Link para página de processos */}
        <Link href="/processos">
          <Button variant="ghost" size="sm" className="w-full mt-4">
            Ver todos os processos
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </div>
    </WidgetWrapper>
  );
}

