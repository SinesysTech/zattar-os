'use client';

import * as React from 'react';
import { BarChart3 } from 'lucide-react';
import { GlassPanel } from '@/components/shared/glass-panel';
import { Heading } from '@/components/ui/typography';

interface HeatmapDay {
  date: string; // YYYY-MM-DD
  count: number;
}

interface ActivityHeatmapProps {
  data: HeatmapDay[];
  weeks?: number; // default 26
}

const CELL_SIZE = 12;
const CELL_GAP = 3;
const CELL_STEP = CELL_SIZE + CELL_GAP;

// Day-of-week labels (Mon–Sun) rendered to the left
const DOW_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DOW_LABEL_WIDTH = 24; // px reserved for day labels
const DOW_LABEL_OFFSET = 4; // vertical offset inside each cell row

/** Returns YYYY-MM-DD for a Date without timezone shift */
function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Build the week/day grid working backwards from today */
function buildGrid(weeks: number): { dateKey: string; col: number; row: number }[] {
  const cells: { dateKey: string; col: number; row: number }[] = [];
  const today = new Date();
  // Align to end of last week column — today lands in the rightmost column
  const todayDow = today.getDay(); // 0=Sun … 6=Sat

  for (let col = weeks - 1; col >= 0; col--) {
    for (let row = 0; row < 7; row++) {
      // days ago from today
      const daysAgo = (weeks - 1 - col) * 7 + (todayDow - row);
      if (daysAgo < 0) continue; // future day — skip
      const d = new Date(today);
      d.setDate(today.getDate() - daysAgo);
      cells.push({ dateKey: toDateKey(d), col, row });
    }
  }
  return cells;
}

/** Map count to intensity level 0-4 */
function getIntensity(count: number, maxCount: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0 || maxCount === 0) return 0;
  const ratio = count / maxCount;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

/** Tailwind fill classes per intensity level (Tailwind v4 compatible) */
const INTENSITY_FILL: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: 'fill-muted/8',
  1: 'fill-primary/15',
  2: 'fill-primary/30',
  3: 'fill-primary/50',
  4: 'fill-primary/75',
};

const INTENSITY_STROKE_HOVER: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: 'hover:stroke-muted-foreground/20',
  1: 'hover:stroke-primary/40',
  2: 'hover:stroke-primary/50',
  3: 'hover:stroke-primary/60',
  4: 'hover:stroke-primary/80',
};

/** Legend cells */
const LEGEND_LEVELS: (0 | 1 | 2 | 3 | 4)[] = [0, 1, 2, 3, 4];

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  text: string;
}

export function ActivityHeatmap({ data, weeks = 26 }: ActivityHeatmapProps) {
  const [tooltip, setTooltip] = React.useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    text: '',
  });

  // Build lookup map: dateKey -> count
  const countMap = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const d of data) {
      map.set(d.date, d.count);
    }
    return map;
  }, [data]);

  // Max count for normalization
  const maxCount = React.useMemo(
    () => (data.length === 0 ? 0 : Math.max(...data.map((d) => d.count))),
    [data],
  );

  const grid = React.useMemo(() => buildGrid(weeks), [weeks]);

  const svgWidth = DOW_LABEL_WIDTH + weeks * CELL_STEP - CELL_GAP;
  const svgHeight = 7 * CELL_STEP - CELL_GAP;

  const handleMouseEnter = React.useCallback(
    (e: React.MouseEvent<SVGRectElement>, dateKey: string, count: number) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const [y, m, d] = dateKey.split('-');
      const formatted = `${d}/${m}/${y}`;
      setTooltip({
        visible: true,
        x: rect.left + rect.width / 2,
        y: rect.top - 8,
        text: `${formatted} — ${count} ação${count !== 1 ? 'ões' : ''}`,
      });
    },
    [],
  );

  const handleMouseLeave = React.useCallback(() => {
    setTooltip((prev) => ({ ...prev, visible: false }));
  }, []);

  return (
    <GlassPanel depth={1} className="p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="size-4 text-muted-foreground/50" />
        <Heading level="widget">Atividade (últimos 6 meses)</Heading>
      </div>

      {/* Empty state */}
      {data.length === 0 ? (
        <p className="text-xs text-muted-foreground/40 text-center py-6">
          Sem atividade registrada nos últimos 6 meses.
        </p>
      ) : (
        <>
          {/* SVG heatmap */}
          <div className="overflow-x-auto">
            <svg
              width={svgWidth}
              height={svgHeight}
              aria-label="Heatmap de atividade"
              style={{ display: 'block' }}
            >
              {/* Day-of-week labels */}
              {DOW_LABELS.map((label, row) => (
                <text
                  key={label}
                  x={0}
                  y={row * CELL_STEP + CELL_SIZE / 2 + DOW_LABEL_OFFSET}
                  className="fill-muted-foreground/30 text-[8px]"
                  fontSize={8}
                  dominantBaseline="middle"
                >
                  {label}
                </text>
              ))}

              {/* Grid cells */}
              {grid.map(({ dateKey, col, row }) => {
                const count = countMap.get(dateKey) ?? 0;
                const intensity = getIntensity(count, maxCount);
                const x = DOW_LABEL_WIDTH + col * CELL_STEP;
                const y = row * CELL_STEP;

                return (
                  <rect
                    key={dateKey}
                    x={x}
                    y={y}
                    width={CELL_SIZE}
                    height={CELL_SIZE}
                    rx={2}
                    strokeWidth={1}
                    stroke="transparent"
                    cursor="pointer"
                    className={[
                      INTENSITY_FILL[intensity],
                      INTENSITY_STROKE_HOVER[intensity],
                      'transition-all duration-150',
                    ].join(' ')}
                    onMouseEnter={(e) => handleMouseEnter(e, dateKey, count)}
                    onMouseLeave={handleMouseLeave}
                  />
                );
              })}
            </svg>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-1.5 mt-3">
            <span className="text-[10px] text-muted-foreground/40">Menos</span>
            {LEGEND_LEVELS.map((level) => (
              <svg key={level} width={CELL_SIZE} height={CELL_SIZE} aria-hidden="true">
                <rect
                  x={0}
                  y={0}
                  width={CELL_SIZE}
                  height={CELL_SIZE}
                  rx={2}
                  className={INTENSITY_FILL[level]}
                />
              </svg>
            ))}
            <span className="text-[10px] text-muted-foreground/40">Mais</span>
          </div>
        </>
      )}

      {/* Fixed tooltip */}
      {tooltip.visible && (
        <div
          role="tooltip"
          className="fixed z-50 pointer-events-none -translate-x-1/2 -translate-y-full"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <div className="px-2 py-1 rounded-md text-[11px] bg-popover text-popover-foreground border border-border/30 shadow-md whitespace-nowrap">
            {tooltip.text}
          </div>
        </div>
      )}
    </GlassPanel>
  );
}
