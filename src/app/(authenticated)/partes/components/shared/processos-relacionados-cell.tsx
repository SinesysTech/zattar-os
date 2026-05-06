'use client';

/**
 * Componente de celula para exibir processos relacionados a uma entidade
 * Usado nas tabelas de clientes, terceiros e representantes
 */

import { cn } from '@/lib/utils';
import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CalendarDays, Scale, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import type { ProcessoRelacionado } from '../../types';
import { CopyButton } from './copy-button';
import { formatarData } from '../../utils/format';
import { Text } from '@/components/ui/typography';

interface ProcessosRelacionadosCellProps {
  processos: ProcessoRelacionado[];
  maxExibidos?: number;
}

/**
 * Formata o numero do processo para exibicao
 * Mantem o numero completo para melhor legibilidade
 */
function formatarNumeroProcesso(numero: string): string {
  if (!numero) return '';
  return numero;
}

export function ProcessosRelacionadosCell({
  processos,
  maxExibidos = 2,
}: ProcessosRelacionadosCellProps) {
  if (!processos || processos.length === 0) {
    return (
      <div className={cn("min-h-10 flex items-center justify-center text-muted-foreground text-body-sm")}>
        -
      </div>
    );
  }

  // Mostrar apenas os primeiros N processos diretamente
  const processosExibidos = processos.slice(0, maxExibidos);
  const processosRestantes = processos.slice(maxExibidos);

  return (
    <div className={cn("min-h-10 flex flex-col inline-micro py-1 min-w-0")}>
      {processosExibidos.map((processo) => (
        <ProcessoItem key={processo.processo_id} processo={processo} />
      ))}

      {processosRestantes.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn("h-6 px-2 text-caption text-muted-foreground hover:text-foreground")}
            >
              +{processosRestantes.length} mais
            </Button>
          </PopoverTrigger>
          <PopoverContent className={cn("w-80 inset-tight")} align="start">
            <div className={cn("flex flex-col stack-snug max-h-60 overflow-y-auto")}>
              <Text variant="caption" className="font-medium mb-2">
                Todos os processos ({processos.length})
              </Text>
              {processos.map((processo) => (
                <ProcessoItem key={processo.processo_id} processo={processo} />
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

/**
 * Formata o grau do processo para exibição
 */
function formatarGrau(grau: string | null | undefined): string {
  if (!grau) return '-';
  const grauMap: Record<string, string> = {
    primeiro_grau: '1º Grau',
    segundo_grau: '2º Grau',
    tribunal_superior: 'TST',
  };
  return grauMap[grau] || grau;
}

/**
 * Item individual de processo com HoverCard rico
 */
function ProcessoItem({ processo }: { processo: ProcessoRelacionado }) {
  const router = useRouter();
  const numeroFormatado = formatarNumeroProcesso(processo.numero_processo);
  const processoHref = `/app/processos/${processo.processo_id}`;

  // Determina a parte contrária baseado no polo do cliente
  // Se o cliente está no polo ATIVO, a parte contrária é do polo passivo (nome_parte_re)
  // Se o cliente está no polo PASSIVO, a parte contrária é do polo ativo (nome_parte_autora)
  const parteContraria =
    processo.polo === 'ATIVO'
      ? processo.nome_parte_re
      : processo.nome_parte_autora;

  return (
    <div className={cn("flex items-start inline-micro min-w-0 max-w-full")}>
      <HoverCard openDelay={200} closeDelay={100}>
        <HoverCardTrigger asChild>
          <Link
            href={processoHref}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              router.push(processoHref);
            }}
            className={cn("inline-flex items-center text-caption min-h-6 px-2 py-0.5 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-w-0")}
          >
            <span className="break-all">{numeroFormatado}</span>
          </Link>
        </HoverCardTrigger>
        <HoverCardContent align="start" className={cn("w-80 inset-medium")}>
          <div className={cn("flex flex-col stack-medium")}>
            {/* Header: Grau e Status */}
            <div className={cn("flex items-center justify-between inline-tight")}>
              <SemanticBadge category="grau" value={processo.grau} className={cn("text-caption")}>
                {formatarGrau(processo.grau)}
              </SemanticBadge>
              {processo.codigo_status_processo && (
                <SemanticBadge category="status" value={processo.codigo_status_processo} className={cn("text-caption")}>
                  {processo.codigo_status_processo}
                </SemanticBadge>
              )}
            </div>

            {/* Parte Contrária */}
            <div className={cn("flex flex-col stack-micro")}>
              <Text variant="caption" className="flex items-center gap-1.5">
                <User className="h-3 w-3" />
                <span>Parte contrária</span>
              </Text>
              <p className={cn( "text-body-sm font-medium truncate")} title={parteContraria || undefined}>
                {parteContraria || '-'}
              </p>
            </div>

            {/* Classe Judicial */}
            {processo.classe_judicial && (
              <div className={cn("flex flex-col stack-micro")}>
                <Text variant="caption" className="flex items-center gap-1.5">
                  <Scale className="h-3 w-3" />
                  <span>Classe</span>
                </Text>
                <p className={cn("text-body-sm truncate")} title={processo.classe_judicial}>
                  {processo.classe_judicial}
                </p>
              </div>
            )}

            {/* Próxima Audiência */}
            {processo.data_proxima_audiencia && (
              <Text variant="caption" className="flex items-center gap-1.5 pt-1 border-t">
                <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Próxima audiência:</span>
                <span className={cn( "font-medium")}>{formatarData(processo.data_proxima_audiencia)}</span>
              </Text>
            )}
          </div>
        </HoverCardContent>
      </HoverCard>
      <CopyButton text={processo.numero_processo} label="Copiar número do processo" />
    </div>
  );
}
