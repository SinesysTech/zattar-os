/**
 * WIDGET GALLERY — Primitivas de Design
 * ============================================================================
 * Componentes compartilhados para a galeria de widgets da dashboard.
 * Seguem a estética "Glass Briefing" — vidro fumê, prioridade, compacto.
 *
 * USO: import { GlassPanel, Sparkline, MiniDonut, ... } from './primitives'
 * ============================================================================
 */

'use client';

import { type LucideIcon } from 'lucide-react';

// ─── Glass Panel (container principal) ──────────────────────────────────

export function GlassPanel({
  children,
  className = '',
  depth = 1,
}: {
  children: React.ReactNode;
  className?: string;
  depth?: 1 | 2 | 3;
}) {
  const depthStyles = {
    1: 'glass-widget bg-transparent border-border/20',
    2: 'glass-kpi bg-transparent border-border/30',
    3: 'bg-primary/[0.04] backdrop-blur-xl border-primary/10',
  };

  return (
    <div className={`rounded-2xl border transition-all duration-300 ${depthStyles[depth]} ${className}`}>
      {children}
    </div>
  );
}

// ─── Widget Container (GlassPanel + header padrão) ──────────────────────

export function WidgetContainer({
  title,
  icon: Icon,
  subtitle,
  action,
  children,
  className = '',
  depth = 1,
}: {
  title: string;
  icon?: LucideIcon;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  depth?: 1 | 2 | 3;
}) {
  return (
    <GlassPanel depth={depth} className={`p-5 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="size-4 text-muted-foreground/50" />}
          <div>
            <h3 className="font-heading text-sm font-semibold">{title}</h3>
            {subtitle && <p className="text-[10px] text-muted-foreground/40">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
      {children}
    </GlassPanel>
  );
}

// ─── Sparkline SVG ──────────────────────────────────────────────────────

export function Sparkline({
  data,
  alert = false,
  width = 80,
  height = 24,
  color,
}: {
  data: number[];
  alert?: boolean;
  width?: number;
  height?: number;
  color?: string;
}) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * height}`)
    .join(' ');

  const strokeColor = color || (alert ? 'hsl(var(--destructive))' : 'hsl(var(--primary))');

  return (
    <svg width={width} height={height} className="overflow-visible shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="opacity-60"
      />
      <circle
        cx={width}
        cy={height - ((data[data.length - 1] - min) / range) * height}
        r="3"
        fill={strokeColor}
      />
    </svg>
  );
}

// ─── Mini Area Chart ────────────────────────────────────────────────────

export function MiniArea({
  data,
  width = 120,
  height = 40,
  color = 'hsl(var(--primary))',
}: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}) {
  if (data.length < 2) return null;
  const min = Math.min(...data) * 0.9;
  const max = Math.max(...data) * 1.05;
  const range = max - min || 1;
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * height}`)
    .join(' ');
  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <svg width={width} height={height} className="overflow-visible shrink-0">
      <defs>
        <linearGradient id={`area-${color.replace(/[^a-z0-9]/g, '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={areaPoints}
        fill={`url(#area-${color.replace(/[^a-z0-9]/g, '')})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="opacity-70"
      />
    </svg>
  );
}

// ─── Mini Bar Chart ─────────────────────────────────────────────────────

export function MiniBar({
  data,
  height = 48,
  barColor = 'bg-primary/60',
  barColor2,
}: {
  data: { label: string; value: number; value2?: number }[];
  height?: number;
  barColor?: string;
  barColor2?: string;
}) {
  const maxVal = Math.max(...data.flatMap((d) => [d.value, d.value2 || 0]));

  return (
    <div className="flex items-end gap-2 w-full" style={{ height }}>
      {data.map((d) => (
        <div key={d.label} className="flex-1 flex flex-col items-center gap-0.5">
          <div className="flex gap-0.5 items-end w-full" style={{ height: height - 14 }}>
            <div
              className={`flex-1 rounded-t-sm ${barColor} transition-all duration-500`}
              style={{ height: `${(d.value / maxVal) * 100}%` }}
            />
            {d.value2 !== undefined && barColor2 && (
              <div
                className={`flex-1 rounded-t-sm ${barColor2} transition-all duration-500`}
                style={{ height: `${(d.value2 / maxVal) * 100}%` }}
              />
            )}
          </div>
          <span className="text-[9px] text-muted-foreground/40">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Mini Donut Chart ───────────────────────────────────────────────────

export function MiniDonut({
  segments,
  size = 80,
  strokeWidth = 10,
  centerLabel,
}: {
  segments: { value: number; color: string; label?: string }[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
}) {
  const total = segments.reduce((acc, s) => acc + s.value, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let accumulated = 0;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {segments.map((seg, i) => {
          const percent = seg.value / total;
          const dashLength = percent * circumference;
          const dashOffset = -(accumulated / total) * circumference;
          accumulated += seg.value;
          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dashLength} ${circumference - dashLength}`}
              strokeDashoffset={dashOffset}
              className="transition-all duration-500"
            />
          );
        })}
      </svg>
      {centerLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] font-medium text-muted-foreground">{centerLabel}</span>
        </div>
      )}
    </div>
  );
}

// ─── Horizontal Stacked Bar ─────────────────────────────────────────────

export function StackedBar({
  segments,
  height = 8,
}: {
  segments: { value: number; color: string; label?: string }[];
  height?: number;
}) {
  const total = segments.reduce((acc, s) => acc + s.value, 0);
  if (total === 0) return null;

  return (
    <div className="flex rounded-full overflow-hidden" style={{ height }}>
      {segments.map((seg, i) => (
        <div
          key={i}
          className="transition-all duration-500"
          style={{
            width: `${(seg.value / total) * 100}%`,
            backgroundColor: seg.color,
          }}
        />
      ))}
    </div>
  );
}

// ─── Urgency / Status Dot ───────────────────────────────────────────────

export function UrgencyDot({ level }: { level: 'critico' | 'alto' | 'medio' | 'baixo' | 'ok' }) {
  const styles: Record<string, string> = {
    critico: 'bg-destructive shadow-[0_0_8px_hsl(var(--destructive)/0.5)] animate-pulse',
    alto: 'bg-warning shadow-[0_0_6px_hsl(var(--warning)/0.4)]',
    medio: 'bg-primary/50',
    baixo: 'bg-muted-foreground/30',
    ok: 'bg-success/60',
  };
  return <div className={`size-2 rounded-full shrink-0 ${styles[level] || styles.baixo}`} />;
}

// ─── Stat (número grande + label + delta) ───────────────────────────────

export function Stat({
  label,
  value,
  delta,
  deltaType = 'neutral',
  small = false,
}: {
  label: string;
  value: string | number;
  delta?: string;
  deltaType?: 'positive' | 'negative' | 'neutral' | 'alert';
  small?: boolean;
}) {
  const deltaColors = {
    positive: 'text-success/70',
    negative: 'text-destructive/70',
    neutral: 'text-muted-foreground/50',
    alert: 'text-warning/70',
  };

  return (
    <div>
      <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">{label}</p>
      <p className={`font-display font-bold mt-0.5 ${small ? 'text-lg' : 'text-xl'}`}>{value}</p>
      {delta && (
        <p className={`text-[11px] mt-0.5 ${deltaColors[deltaType]}`}>{delta}</p>
      )}
    </div>
  );
}

// ─── Progress Ring (compacto) ───────────────────────────────────────────

export function ProgressRing({
  percent,
  size = 40,
  strokeWidth,
  color = 'hsl(var(--primary))',
}: {
  percent: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}) {
  const sw = strokeWidth || size * 0.12;
  const radius = (size - sw) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={sw} className="text-border/15" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={sw} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-700" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-bold">{percent}%</span>
      </div>
    </div>
  );
}

// ─── List Item (genérico para listas de items) ──────────────────────────

export function ListItem({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center gap-3 px-3 py-2.5 -mx-1 rounded-xl
                   hover:bg-white/4 transition-all duration-150 cursor-pointer ${className}`}
    >
      {children}
    </div>
  );
}

// ─── Section Title (título de seção na galeria) ─────────────────────────

export function GallerySection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-4">
        <h2 className="font-heading text-lg font-semibold tracking-tight">{title}</h2>
        {description && <p className="text-sm text-muted-foreground/50 mt-0.5">{description}</p>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {children}
      </div>
    </section>
  );
}

// ─── Helper: formatar moeda ─────────────────────────────────────────────

export const fmtMoeda = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const fmtNum = (v: number) => v.toLocaleString('pt-BR');

export const fmtData = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
};
