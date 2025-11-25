'use client';

import { useDroppable } from '@dnd-kit/core';

interface DroppableAreaProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

export function DroppableArea({ id, children, className }: DroppableAreaProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`${className} ${isOver ? 'bg-accent/20 border-dashed' : ''} transition-colors`}
    >
      {children}
    </div>
  );
}