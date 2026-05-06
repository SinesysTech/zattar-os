'use client';

import { FileText, FileType, Image } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Configuração de cada tipo de arquivo suportado
 * Utiliza tokens do design system Zattar para consistência de marca
 */
const FILE_TYPES = [
  {
    type: 'pdf' as const,
    label: 'PDF',
    icon: FileText,
    color: 'text-destructive',
    hoverColor: 'group-hover/type:text-destructive/80',
  },
];

interface FileTypeIndicatorsProps {
  className?: string;
  compact?: boolean;
}

/**
 * FileTypeIndicators - Exibe os tipos de arquivo suportados com ícones
 *
 * Componente visual que mostra quais tipos de arquivo são aceitos no upload.
 * Cada tipo possui ícone colorido, label e animação de hover.
 *
 * @example
 * ```tsx
 * <FileTypeIndicators />
 * <FileTypeIndicators compact />
 * ```
 */
export function FileTypeIndicators({
  className,
  compact = false,
}: FileTypeIndicatorsProps) {
  return (
    <div
      className={cn(
        /* design-system-escape: gap-4 → migrar para <Inline gap="default"> */ 'flex items-center justify-center gap-4',
        compact ? /* design-system-escape: gap-3 gap sem token DS */ 'gap-3' : /* design-system-escape: gap-6 → migrar para <Inline gap="loose"> */ 'gap-6',
        className
      )}
    >
      {FILE_TYPES.map((fileType, index) => {
        const Icon = fileType.icon;
        const isLast = index === FILE_TYPES.length - 1;

        return (
          <div key={fileType.type} className={cn(/* design-system-escape: gap-4 → migrar para <Inline gap="default"> */ "flex items-center gap-4")}>
            <div
              className={cn(
                /* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ 'group/type flex items-center gap-2 transition-all duration-300',
                'opacity-80 hover:opacity-100',
                'cursor-default'
              )}
            >
              <Icon
                className={cn(
                  'transition-colors duration-500',
                  compact ? 'size-4' : 'size-5',
                  fileType.color,
                  fileType.hoverColor
                )}
              />
              <span
                className={cn(
                  /* design-system-escape: font-medium → className de <Text>/<Heading>; tracking-wider sem token DS */ 'font-medium uppercase tracking-wider transition-colors duration-500',
                  'text-muted-foreground group-hover/type:text-foreground',
                  compact ? 'text-caption' : 'text-body-sm'
                )}
              >
                {fileType.label}
              </span>
            </div>

            {/* Separador vertical */}
            {!isLast && (
              <div
                className={cn(
                  'h-4 w-px bg-border',
                  compact ? 'h-3' : 'h-4'
                )}
                aria-hidden="true"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Retorna o ícone apropriado para um tipo de arquivo
 * Utiliza tokens do design system Zattar
 */
export function getFileTypeIcon(mimeType: string) {
  if (mimeType === 'application/pdf') {
    return { icon: FileText, color: 'text-destructive' };
  }
  if (
    mimeType ===
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return { icon: FileType, color: 'text-primary' };
  }
  if (mimeType === 'image/png') {
    return { icon: Image, color: 'text-highlight' };
  }
  return { icon: FileText, color: 'text-muted-foreground' };
}

/**
 * Retorna a cor de fundo para um tipo de arquivo
 * Utiliza tokens do design system Zattar com suporte a dark mode
 */
export function getFileTypeBgColor(mimeType: string) {
  if (mimeType === 'application/pdf') {
    return 'bg-destructive/10 dark:bg-destructive/20';
  }
  if (
    mimeType ===
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return 'bg-primary/10 dark:bg-primary/20';
  }
  if (mimeType === 'image/png') {
    return 'bg-highlight/10 dark:bg-highlight/20';
  }
  return 'bg-muted';
}
