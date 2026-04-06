import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface SettingsSectionHeaderProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

export function SettingsSectionHeader({
  icon: Icon,
  title,
  description,
  action,
}: SettingsSectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-muted-foreground/50" />
        <div>
          <h3 className="text-widget-title">{title}</h3>
          <p className="text-[10px] text-muted-foreground/60">{description}</p>
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
