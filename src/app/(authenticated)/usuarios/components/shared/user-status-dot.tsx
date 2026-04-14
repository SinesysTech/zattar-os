'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export type UserStatus = 'online' | 'away' | 'offline';

interface UserStatusDotProps {
  status: UserStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_MAP = {
  sm: 'w-2.5 h-2.5 border-[2px]',
  md: 'w-3 h-3 border-[2.5px]',
  lg: 'w-4 h-4 border-[3px]',
} as const;

const COLOR_MAP = {
  online: 'bg-success animate-pulse',
  away: 'bg-warning',
  offline: 'bg-muted-foreground/25',
} as const;

const ARIA_LABEL_MAP = {
  online: 'Online',
  away: 'Ausente',
  offline: 'Offline',
} as const;

export function UserStatusDot({
  status,
  size = 'md',
  className,
}: UserStatusDotProps) {
  return (
    <span
      role="img"
      aria-label={ARIA_LABEL_MAP[status]}
      className={cn(
        'rounded-full border-background block shrink-0',
        SIZE_MAP[size],
        COLOR_MAP[status],
        className,
      )}
    />
  );
}

export function getStatusFromLastLogin(lastLoginAt: string | null): UserStatus {
  if (!lastLoginAt) return 'offline';
  const diff = Date.now() - new Date(lastLoginAt).getTime();
  const minutes = diff / 60_000;
  if (minutes < 15) return 'online';
  if (minutes < 120) return 'away';
  return 'offline';
}
