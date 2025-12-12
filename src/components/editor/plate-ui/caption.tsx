import * as React from 'react';

import { cn } from '@/lib/utils';

export function Caption({
  align = 'center',
  className,
  ...props
}: React.HTMLAttributes<HTMLElement> & { align?: 'left' | 'center' | 'right' }) {
  return (
    <figcaption
      className={cn(
        'mt-2 flex w-full',
        align === 'left' && 'justify-start',
        align === 'center' && 'justify-center',
        align === 'right' && 'justify-end',
        className
      )}
      {...props}
    />
  );
}

export const CaptionTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function CaptionTextarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        'min-h-9 w-full max-w-[55ch] resize-none rounded-md border bg-transparent px-3 py-2 text-sm',
        'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className
      )}
      {...props}
    />
  );
});

export function CaptionButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex h-7 items-center gap-2 rounded-md border px-2 text-sm',
        'hover:bg-accent hover:text-accent-foreground'
      )}
      {...props}
    >
      Legenda
    </button>
  );
}


