'use client';

import * as React from 'react';

import { AIChatPlugin } from '@platejs/ai/react';
import {
  type CursorData,
  type CursorOverlayState,
  useCursorOverlay,
} from '@platejs/selection/react';
import { RangeApi } from 'platejs';
import { usePluginOption } from 'platejs/react';

import { cn } from '@/app/_lib/utils/utils';

export function CursorOverlay() {
  const { cursors } = useCursorOverlay();

  return (
    <>
      {cursors.map((cursor) => (
        <Cursor key={cursor.id} {...cursor} />
      ))}
    </>
  );
}

function Cursor({
  id,
  caretPosition,
  data,
  selection,
  selectionRects,
}: CursorOverlayState<CursorData>) {
  const streaming = usePluginOption(AIChatPlugin, 'streaming');
  const { style, selectionStyle = style } = data ?? ({} as CursorData);
  const isCursor = RangeApi.isCollapsed(selection);

  if (streaming) return null;

  return (
    <>
      {selectionRects.map((position, i) => (
        // eslint-disable-next-line react/forbid-dom-props -- Inline styles required: dynamic positioning from cursor overlay plugin
        <div
          key={i}
          className={cn(
            'pointer-events-none absolute z-10',
            id === 'selection' && 'bg-brand/25',
            id === 'selection' && isCursor && 'bg-primary'
          )}
          style={{
            ...selectionStyle,
            ...position,
          }}
        />
      ))}
      {caretPosition && (
        // eslint-disable-next-line react/forbid-dom-props -- Inline styles required: dynamic caret positioning from plugin
        <div
          className={cn(
            'pointer-events-none absolute z-10 w-0.5',
            id === 'drag' && 'w-px bg-brand'
          )}
          style={{ ...caretPosition, ...style }}
        />
      )}
    </>
  );
}
