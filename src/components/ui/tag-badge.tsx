'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TagBadgeProps {
  nome: string;
  cor?: string | null;
  variant?: 'default' | 'outline' | 'selected';
  onRemove?: () => void;
  showCheck?: boolean;
  className?: string;
}

/**
 * TagBadge - Badge especializado para tags/etiquetas
 *
 * Aplica estilos consistentes para tags com cores customizadas.
 */
export function TagBadge({
  nome,
  cor,
  variant = 'outline',
  onRemove,
  showCheck,
  className,
}: TagBadgeProps) {
  const isSelected = variant === 'selected';

  const style: React.CSSProperties = {
    backgroundColor: isSelected ? (cor || undefined) : (cor ? `${cor}20` : undefined),
    borderColor: cor || undefined,
    color: isSelected ? 'white' : (cor || undefined),
  };

  return (
    <Badge
      variant={isSelected ? 'default' : 'outline'}
      className={cn('gap-1 text-xs', onRemove && 'pr-1', className)}
      style={style}
    >
      {showCheck && <Check className="h-3 w-3" />}
      {nome}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 rounded-full hover:bg-muted p-0.5"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </Badge>
  );
}

/**
 * TagBadgeList - Lista de tags com contador de overflow
 */
interface TagBadgeListProps {
  tags: Array<{ id: number; nome: string; cor?: string | null }>;
  maxVisible?: number;
  onClick?: () => void;
  emptyText?: string;
  className?: string;
}

export function TagBadgeList({
  tags,
  maxVisible = 3,
  onClick,
  emptyText = 'Sem etiquetas',
  className,
}: TagBadgeListProps) {
  const visibleTags = tags.slice(0, maxVisible);
  const hiddenCount = tags.length - maxVisible;

  const content = (
    <div className={cn('flex flex-wrap gap-1 max-w-full', className)}>
      {tags.length === 0 ? (
        <span className="text-xs text-muted-foreground">{emptyText}</span>
      ) : (
        <>
          {visibleTags.map((tag) => (
            <TagBadge key={tag.id} nome={tag.nome} cor={tag.cor} />
          ))}
          {hiddenCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              +{hiddenCount}
            </Badge>
          )}
        </>
      )}
    </div>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 rounded px-1 -mx-1"
        title="Clique para gerenciar etiquetas"
      >
        {content}
      </button>
    );
  }

  return content;
}
