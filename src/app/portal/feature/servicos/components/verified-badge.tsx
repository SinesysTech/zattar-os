"use client";

import { ShieldCheck } from "lucide-react";

interface VerifiedBadgeProps {
  text?: string;
}

export function VerifiedBadge({
  text = "Cálculo verificado pela legislação CLT vigente",
}: VerifiedBadgeProps) {
  return (
    <div className="bg-portal-primary-soft rounded-lg p-4 flex items-center gap-3">
      <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
      <p className="text-xs text-muted-foreground leading-relaxed">{text}</p>
    </div>
  );
}
