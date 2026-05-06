import { cn } from '@/lib/utils';

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();

  const day = date.getDate();
  const month = MONTH_NAMES[date.getMonth()];
  const year = date.getFullYear();

  if (date.toDateString() === today.toDateString()) {
    return `Hoje, ${day} de ${month}`;
  }

  if (year === today.getFullYear()) {
    return `${day} de ${month}`;
  }

  return `${day} de ${month} de ${year}`;
}

interface DateSeparatorProps {
  date: string; // ISO date string
}

export function DateSeparator({ date }: DateSeparatorProps) {
  const label = formatDateLabel(date);

  return (
    <div
      role="separator"
      aria-label={label}
      className={cn(/* design-system-escape: my-4 margin sem primitiva DS */ "flex items-center inline-default my-4 w-full")}
    >
      <span className="flex-1 h-px bg-foreground/4" />
      <span className={cn( "text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground/55 whitespace-nowrap")}>
        {label}
      </span>
      <span className="flex-1 h-px bg-foreground/4" />
    </div>
  );
}
