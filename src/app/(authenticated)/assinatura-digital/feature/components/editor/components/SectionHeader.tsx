'use client';

import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  /** Section title (will be displayed uppercase) */
  title: string;
  /** Optional action element (e.g., "+ Add" button) */
  action?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * SectionHeader - Uppercase label with optional action
 * Used for sidebar sections like "WHO IS SIGNING?" and "DRAG & DROP FIELDS"
 */
export function SectionHeader({ title, action, className }: SectionHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </span>
      {action}
    </div>
  );
}

export default SectionHeader;
