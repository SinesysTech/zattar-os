'use client';

import { cn } from '@/lib/utils';

interface ProTipProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * ProTip - Contextual tip component using highlight color from design system
 * Uses --highlight token (Action Orange) for visual emphasis
 */
export function ProTip({ children, className }: ProTipProps) {
  return (
    <div
      className={cn(
        /* design-system-escape: gap-3 gap sem token DS; p-4 → migrar para <Inset variant="card-compact"> */ 'flex items-start gap-3 p-4 rounded-lg',
        'bg-chart-2/10', // Using chart-2 (highlight/orange) with opacity
        className
      )}
    >
      {/* Orange dot indicator */}
      <div className="h-5 w-5 rounded-full bg-chart-2 flex items-center justify-center shrink-0">
        <span className="h-2 w-2 rounded-full bg-white" />
      </div>
      <p className={cn("text-body-sm text-muted-foreground")}>
        {children}
      </p>
    </div>
  );
}

/**
 * ProTip label component for inline usage
 */
export function ProTipLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "font-medium text-chart-2")}>
      {children}
    </span>
  );
}

/**
 * Keyboard shortcut badge for ProTip content
 */
export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className={cn(/* design-system-escape: px-1.5 padding direcional sem Inset equiv.; py-0.5 padding direcional sem Inset equiv. */ "px-1.5 py-0.5 bg-muted rounded text-caption font-mono")}>
      {children}
    </kbd>
  );
}

export default ProTip;
