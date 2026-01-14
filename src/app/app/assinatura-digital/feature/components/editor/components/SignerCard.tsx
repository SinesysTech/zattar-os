'use client';

import { memo } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Signatario } from '../types';

interface SignerCardProps {
  signer: Signatario;
  isActive: boolean;
  isCurrentUser: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * Get initials from a name (first 2 letters uppercase)
 */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

/**
 * SignerCard - Individual signer card in the sidebar
 * Shows signer info with avatar, name, email and actions on hover
 */
const SignerCard = memo(function SignerCard({
  signer,
  isActive,
  isCurrentUser,
  onSelect,
  onEdit,
  onDelete,
}: SignerCardProps) {
  return (
    <div
      className={cn(
        'group relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200',
        isActive
          ? 'bg-primary/5 border border-primary/20'
          : 'bg-muted/50 border border-transparent hover:bg-muted/80 hover:scale-[1.02]'
      )}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Selecionar signatário ${signer.nome}`}
      aria-pressed={isActive}
    >
      {/* Active indicator bar */}
      {isActive && (
        <div
          className="absolute left-0 top-2 bottom-2 w-1 rounded-full"
          style={{ backgroundColor: signer.cor }}
        />
      )}

      {/* Avatar with initials */}
      <div
        className="flex items-center justify-center size-10 rounded-full shrink-0"
        style={{
          backgroundColor: `${signer.cor}20`,
          color: signer.cor,
        }}
      >
        <span className="text-sm font-bold">{getInitials(signer.nome)}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold truncate">{signer.nome}</p>
          {isCurrentUser && (
            <Badge variant="secondary" className="bg-primary/10 text-primary text-xs px-1.5 py-0">
              Você
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">{signer.email}</p>
      </div>

      {/* Actions - visible on hover */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          aria-label={`Editar signatário ${signer.nome}`}
        >
          <Pencil className="size-3.5" />
        </Button>
        {!isCurrentUser && (
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            aria-label={`Remover signatário ${signer.nome}`}
          >
            <Trash2 className="size-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
});

export default SignerCard;
