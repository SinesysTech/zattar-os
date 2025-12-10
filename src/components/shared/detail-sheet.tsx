'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

interface DetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  side?: "left" | "right";
}

export function DetailSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
  side = "right",
}: DetailSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={side}
        className={cn(
          'w-[400px] sm:w-[540px] flex flex-col h-full',
          className
        )}
      >
        <SheetHeader className="border-b border-border pb-4">
          <SheetTitle className="text-xl font-heading font-bold">
            {title}
          </SheetTitle>
          {description && (
            <SheetDescription>{description}</SheetDescription>
          )}
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {children}
        </div>
        {footer && (
          <SheetFooter className="border-t border-t-border pt-4">
            {footer}
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
