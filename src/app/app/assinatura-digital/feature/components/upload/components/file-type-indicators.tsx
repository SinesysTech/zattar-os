'use client';

import { FileText, FileType, Image } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Configuração de cada tipo de arquivo suportado
 */
const FILE_TYPES = [
  {
    type: 'pdf' as const,
    label: 'PDF',
    icon: FileText,
    color: 'text-red-500',
    hoverColor: 'group-hover/type:text-red-600',
  },
  {
    type: 'docx' as const,
    label: 'DOCX',
    icon: FileType,
    color: 'text-blue-500',
    hoverColor: 'group-hover/type:text-blue-600',
  },
  {
    type: 'png' as const,
    label: 'PNG',
    icon: Image,
    color: 'text-green-500',
    hoverColor: 'group-hover/type:text-green-600',
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
        'flex items-center justify-center gap-4',
        compact ? 'gap-3' : 'gap-6',
        className
      )}
    >
      {FILE_TYPES.map((fileType, index) => {
        const Icon = fileType.icon;
        const isLast = index === FILE_TYPES.length - 1;

        return (
          <div key={fileType.type} className="flex items-center gap-4">
            <div
              className={cn(
                'group/type flex items-center gap-2 transition-all duration-500',
                'opacity-60 grayscale hover:opacity-100 hover:grayscale-0',
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
                  'font-medium uppercase tracking-wider transition-colors duration-500',
                  'text-muted-foreground group-hover/type:text-foreground',
                  compact ? 'text-xs' : 'text-sm'
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
 */
export function getFileTypeIcon(mimeType: string) {
  if (mimeType === 'application/pdf') {
    return { icon: FileText, color: 'text-red-500' };
  }
  if (
    mimeType ===
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return { icon: FileType, color: 'text-blue-500' };
  }
  if (mimeType === 'image/png') {
    return { icon: Image, color: 'text-green-500' };
  }
  return { icon: FileText, color: 'text-muted-foreground' };
}

/**
 * Retorna a cor de fundo para um tipo de arquivo
 */
export function getFileTypeBgColor(mimeType: string) {
  if (mimeType === 'application/pdf') {
    return 'bg-red-50 dark:bg-red-950/50';
  }
  if (
    mimeType ===
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return 'bg-blue-50 dark:bg-blue-950/50';
  }
  if (mimeType === 'image/png') {
    return 'bg-green-50 dark:bg-green-950/50';
  }
  return 'bg-muted';
}
