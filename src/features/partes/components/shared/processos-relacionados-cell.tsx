'use client';

/**
 * Componente de celula para exibir processos relacionados a uma entidade
 * Usado nas tabelas de clientes, terceiros e representantes
 */

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { ProcessoRelacionado } from '../../types';
import { CopyButton } from './copy-button';

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
      <div className="min-h-10 flex items-center justify-center text-muted-foreground text-sm">
        -
      </div>
    );
  }

  // Mostrar apenas os primeiros N processos diretamente
  const processosExibidos = processos.slice(0, maxExibidos);
  const processosRestantes = processos.slice(maxExibidos);

  return (
    <div className="min-h-10 flex flex-col gap-1 py-1">
      {processosExibidos.map((processo) => (
        <ProcessoItem key={processo.processo_id} processo={processo} />
      ))}

      {processosRestantes.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              +{processosRestantes.length} mais
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-2" align="start">
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Todos os processos ({processos.length})
              </p>
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
 * Item individual de processo com link clicável no número
 */
function ProcessoItem({ processo }: { processo: ProcessoRelacionado }) {
  const numeroFormatado = formatarNumeroProcesso(processo.numero_processo);

  return (
    <div className="flex items-center gap-1">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href={`/acervo/${processo.processo_id}`}
              className="inline-flex items-center text-xs h-6 px-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {numeroFormatado}
            </Link>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <p className="text-xs">{processo.numero_processo}</p>
            {processo.tipo_parte && (
              <p className="text-xs text-muted-foreground">
                {processo.tipo_parte} ({processo.polo})
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <CopyButton text={processo.numero_processo} label="Copiar número do processo" />
    </div>
  );
}
