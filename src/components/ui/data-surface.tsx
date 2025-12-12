import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DataSurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function DataSurface({
  title,
  subtitle,
  icon: Icon,
  actions,
  children,
  className,
  ...props
}: DataSurfaceProps) {
  return (
    <div
      className={cn(
        'h-full flex-1 flex-col space-y-8 p-8 md:flex',
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between space-y-2">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-6 w-6 text-muted-foreground/70" />}
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
            {subtitle && (
              <p className="text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <div className="flex-1 rounded-md border bg-card text-card-foreground shadow-sm">
        {children}
      </div>
    </div>
  );
}
