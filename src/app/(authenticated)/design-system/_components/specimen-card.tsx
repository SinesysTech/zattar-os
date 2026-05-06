import * as React from "react";
import { cn } from "@/lib/utils";
import { GlassPanel } from "@/components/shared/glass-panel";
import { Heading, Text } from "@/components/ui/typography";

interface SpecimenCardProps {
  eyebrow: string;
  title?: string;
  aside?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

export function SpecimenCard({
  eyebrow,
  title,
  aside,
  className,
  children,
}: SpecimenCardProps) {
  return (
    <GlassPanel depth={1} className={cn(/* design-system-escape: p-5 → usar <Inset> */ "p-5 inline-default", className)}>
      <div className={cn("flex items-baseline justify-between inline-default")}>
        <div className={cn(/* design-system-escape: space-y-0.5 sem token DS */ "space-y-0.5")}>
          <Text variant="meta-label">{eyebrow}</Text>
          {title && <Heading level="card">{title}</Heading>}
        </div>
        {aside && (
          <Text variant="micro-caption" className="font-mono">
            {aside}
          </Text>
        )}
      </div>
      <div>{children}</div>
    </GlassPanel>
  );
}
