'use client';

import { AlertCircle, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProcessoStats } from '../service-estatisticas';

interface ProcessosInsightBannerProps {
  stats: ProcessoStats;
  onFilterSemResponsavel: () => void;
  onFilterComEventos: () => void;
}

interface BannerConfig {
  type: 'warning' | 'alert';
  message: string;
  onClick: () => void;
}

const TYPE_STYLES = {
  warning: 'border-warning/10 bg-warning/4 text-warning/70 hover:bg-warning/6',
  alert: 'border-destructive/10 bg-destructive/4 text-destructive/70 hover:bg-destructive/6',
};

export function ProcessosInsightBanner({
  stats,
  onFilterSemResponsavel,
  onFilterComEventos,
}: ProcessosInsightBannerProps) {
  const banners: BannerConfig[] = [];

  if (stats.semResponsavel > 0) {
    banners.push({
      type: 'warning',
      message: `${stats.semResponsavel} processo${stats.semResponsavel > 1 ? 's' : ''} sem responsável atribuído`,
      onClick: onFilterSemResponsavel,
    });
  }

  if (stats.comEventos > 0) {
    banners.push({
      type: 'alert',
      message: `${stats.comEventos} processo${stats.comEventos > 1 ? 's' : ''} com eventos pendentes`,
      onClick: onFilterComEventos,
    });
  }

  if (banners.length === 0) return null;

  return (
    <div className="space-y-2">
      {banners.map((banner, index) => (
        <button
          key={index}
          type="button"
          onClick={banner.onClick}
          className={cn(
            'w-full rounded-lg border px-3.5 py-2 text-[11px] font-medium',
            'flex items-center gap-2 transition-colors cursor-pointer',
            TYPE_STYLES[banner.type]
          )}
        >
          <AlertCircle className="size-3.5 shrink-0" />
          <span>{banner.message}</span>
          <ChevronRight className="size-3 ml-auto shrink-0" />
        </button>
      ))}
    </div>
  );
}
