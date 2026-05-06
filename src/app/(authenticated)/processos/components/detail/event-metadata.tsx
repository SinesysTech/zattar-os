'use client';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/utils';
import type { TimelineItemUnificado } from '../timeline/types';

interface EventMetadataProps {
  item: TimelineItemUnificado;
}

/**
 * Linha de metadado com label e valor.
 */
function MetadataRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn(/* design-system-escape: gap-4 → migrar para <Inline gap="default"> */ "flex justify-between items-start gap-4")}>
      <Text variant="label" as="span" className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "text-muted-foreground font-medium shrink-0")}>
        {label}
      </Text>
      <span className="text-[13px] text-foreground text-right min-w-0">
        {children}
      </span>
    </div>
  );
}

/**
 * Exibe pares chave-valor com os metadados principais de um evento da timeline.
 *
 * @example
 * <EventMetadata item={timelineItem} />
 */
export function EventMetadata({ item }: EventMetadataProps) {
  // Formata a data como "dd MMM yyyy, HH:mm" em pt-BR
  const dataFormatada = (() => {
    try {
      return format(new Date(item.data), "dd MMM yyyy, HH:mm", { locale: ptBR });
    } catch {
      return item.data;
    }
  })();

  return (
    <div className={cn(/* design-system-escape: px-6 padding direcional sem Inset equiv.; py-6 padding direcional sem Inset equiv. */ "px-6 py-6 border-b")}>
      <div className={cn(/* design-system-escape: gap-4 → migrar para <Inline gap="default"> */ "flex flex-col gap-4")}>
        {/* ID */}
        <MetadataRow label="ID">
          <span
            className={cn(
              /* design-system-escape: px-2 padding direcional sem Inset equiv.; py-0.5 padding direcional sem Inset equiv. */ 'font-mono bg-muted px-2 py-0.5 rounded-lg border text-caption'
            )}
          >
            {item.id}
          </span>
        </MetadataRow>

        {/* Data de Publicação */}
        <MetadataRow label="Data de Publicação">
          {dataFormatada}
        </MetadataRow>

        {/* Tipo — sempre exibido */}
        <MetadataRow label="Tipo">
          <span className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "font-medium")}>
            {item.documento ? 'Documento' : 'Movimentação'}
          </span>
        </MetadataRow>

        {/* Responsável — exibido apenas quando disponível */}
        {item.nomeResponsavel && (
          <MetadataRow label="Responsável">
            {item.nomeResponsavel}
          </MetadataRow>
        )}

        {/* Arquivo — exibido apenas quando disponível */}
        {item.backblaze?.fileName && (
          <MetadataRow label="Arquivo">
            <span className="truncate max-w-50 block">
              {item.backblaze.fileName}
            </span>
          </MetadataRow>
        )}
      </div>
    </div>
  );
}
