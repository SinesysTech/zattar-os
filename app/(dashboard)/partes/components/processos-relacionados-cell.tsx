'use client';

/**
 * Componente de célula para exibir processos relacionados a uma entidade
 * Usado nas tabelas de clientes, terceiros e representantes
 */

import * as React from 'react';
import Link from 'next/link';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import type { ProcessoRelacionado } from '@/backend/types/partes/processo-relacionado-types';

interface ProcessosRelacionadosCellProps {
  processos: ProcessoRelacionado[];
  maxExibidos?: number;
}

/**
 * Formata o número do processo para exibição
 * Mantém o número completo para melhor legibilidade
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
 * Item individual de processo com link
 */
function ProcessoItem({ processo }: { processo: ProcessoRelacionado }) {
  const numeroFormatado = formatarNumeroProcesso(processo.numero_processo);
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1 group">
            <Badge 
              variant="outline" 
              className="text-xs font-mono h-6 px-1.5 shrink-0"
            >
              {numeroFormatado}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              asChild
            >
              <Link href={`/acervo/${processo.processo_id}`}>
                <Eye className="h-3.5 w-3.5" />
                <span className="sr-only">Ver processo {processo.numero_processo}</span>
              </Link>
            </Button>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="font-mono text-xs">{processo.numero_processo}</p>
          {processo.tipo_parte && (
            <p className="text-xs text-muted-foreground">
              {processo.tipo_parte} ({processo.polo})
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

