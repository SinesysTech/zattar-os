import * as React from 'react';

import type { SlateElementProps } from 'platejs/static';
import { SlateElement } from 'platejs/static';

import { cn } from '@/core/app/_lib/utils/utils';

export function CalloutElementStatic({
  children,
  className,
  ...props
}: SlateElementProps) {
  const backgroundColor =
    typeof props.element.backgroundColor === 'string'
      ? props.element.backgroundColor
      : undefined;
  const icon =
    typeof props.element.icon === 'string' ? props.element.icon : '??';

  return (
    <SlateElement
      className={cn('my-1 flex rounded-sm bg-muted p-4 pl-3', className)}
      style={{ backgroundColor }}
      {...props}
    >
      <div className="flex w-full gap-2 rounded-md">
        <div
          className="size-6 select-none text-[18px]"
          style={{
            fontFamily:
              '"Apple Color Emoji", "Segoe UI Emoji", NotoColorEmoji, "Noto Color Emoji", "Segoe UI Symbol", "Android Emoji", EmojiSymbols',
          }}
        >
          <span data-plate-prevent-deserialization>{icon}</span>
        </div>
        <div className="w-full">{children}</div>
      </div>
    </SlateElement>
  );
}
