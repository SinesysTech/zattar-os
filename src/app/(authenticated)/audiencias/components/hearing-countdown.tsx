/**
 * HearingCountdown — Timer regressivo em tempo real
 * ============================================================================
 * Mostra quanto tempo falta para a proxima audiencia.
 * Atualiza a cada segundo. Usa cores semanticas por urgencia.
 * ============================================================================
 */

"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Text } from "@/components/ui/typography";

export interface HearingCountdownProps {
  targetDate: Date;
  className?: string;
  /** Formato compacto (ex: "2h 34m") vs. completo (ex: "02:34:12") */
  compact?: boolean;
}

function getTimeLeft(target: Date) {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0, total: 0 };

  return {
    hours: Math.floor(diff / (1000 * 60 * 60)),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    total: diff,
  };
}

function getUrgencyColor(totalMs: number) {
  if (totalMs <= 0) return "text-muted-foreground/55";
  if (totalMs <= 15 * 60 * 1000) return "text-destructive"; // < 15min
  if (totalMs <= 60 * 60 * 1000) return "text-warning"; // < 1h
  return "text-primary"; // > 1h
}

function getUrgencyBg(totalMs: number) {
  if (totalMs <= 0) return "bg-muted-foreground/5";
  if (totalMs <= 15 * 60 * 1000) return "bg-destructive/8";
  if (totalMs <= 60 * 60 * 1000) return "bg-warning/8";
  return "bg-primary/6";
}

export function HearingCountdown({ targetDate, className, compact = false }: HearingCountdownProps) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(targetDate));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(targetDate));
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  const pad = (n: number) => String(n).padStart(2, "0");
  const urgencyColor = getUrgencyColor(timeLeft.total);
  const urgencyBg = getUrgencyBg(timeLeft.total);

  if (timeLeft.total <= 0) {
    return (
      <Text variant="caption" as="span" className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "font-medium text-muted-foreground/60", className)}>
        Agora
      </Text>
    );
  }

  if (compact) {
    return (
      <span className={cn(/* design-system-escape: font-semibold → className de <Text>/<Heading> */ "text-caption tabular-nums font-semibold", urgencyColor, className)}>
        {timeLeft.hours > 0 ? `${timeLeft.hours}h ` : ""}{timeLeft.minutes}min
      </span>
    );
  }

  return (
    <div className={cn(/* design-system-escape: gap-1 gap sem token DS; px-2 padding direcional sem Inset equiv.; py-1 padding direcional sem Inset equiv. */ "inline-flex items-center gap-1 px-2 py-1 rounded-lg", urgencyBg, className)}>
      <div className={cn(/* design-system-escape: gap-0.5 gap sem token DS */ "flex items-center gap-0.5 tabular-nums")}>
        {timeLeft.hours > 0 && (
          <>
            <span className={cn(/* design-system-escape: font-bold → className de <Text>/<Heading> */ "text-body-sm font-bold", urgencyColor)}>{pad(timeLeft.hours)}</span>
            <span className="text-micro-caption text-muted-foreground/60">:</span>
          </>
        )}
        <span className={cn(/* design-system-escape: font-bold → className de <Text>/<Heading> */ "text-body-sm font-bold", urgencyColor)}>{pad(timeLeft.minutes)}</span>
        <span className="text-micro-caption text-muted-foreground/60">:</span>
        <span className={cn(/* design-system-escape: font-bold → className de <Text>/<Heading> */ "text-body-sm font-bold", urgencyColor)}>{pad(timeLeft.seconds)}</span>
      </div>
    </div>
  );
}
