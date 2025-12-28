'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

type IconComponent = React.ElementType<{ className?: string }>;

export interface IconCircleProps extends React.HTMLAttributes<HTMLSpanElement> {
  icon: IconComponent;
  size?: 'sm' | 'md';
}

export function IconCircle({ icon: Icon, size = 'sm', className, ...props }: IconCircleProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full border',
        size === 'sm' ? 'h-5 w-5' : 'h-6 w-6',
        className
      )}
      {...props}
    >
      <Icon className={cn(size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
    </span>
  );
}
