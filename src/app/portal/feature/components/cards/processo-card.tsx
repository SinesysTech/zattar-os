'use client';

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './collapsible';
import { ChevronDown, ChevronUp, Scale } from 'lucide-react';
import { ProcessoPortal } from '../../types';
import React from 'react';
import { ProcessoTimeline } from './processo-timeline';

interface ProcessoCardProps {
  processo: ProcessoPortal;
  clienteNome?: string;
}

// Utilitários de formatação
const formatarTribunal = (tribunal: string): string => {
  if (!tribunal) return 'Não informado';
  const tribunalFormatado = tribunal.replace(/TRT(\d)/, 'TRT $1');
  return (tribunalFormatado);
};

export const ProcessoCard: React.FC<ProcessoCardProps> = ({ processo, clienteNome }) => {
  const [isTimelineExpanded, setIsTimelineExpanded] = React.useState(false);

  const toggleTimeline = () => {
    setIsTimelineExpanded(!isTimelineExpanded);
  };

  const getStatusLine = () => {
    if (processo.timeline_status === 'disponivel') return 'Atualizado'; // 'disponivel' is likely mapped to updated
    if (processo.timeline_status === 'sincronizando') return 'Atualizando...';
    if (processo.timeline_status === 'erro') return 'Erro na atualização';
    if (processo.timeline_status === 'indisponivel') return 'Pendente';
    return processo.timeline_status || 'Status desconhecido';
  };

  // Determine Title: Cliente x Parte Contraria
  // We don't have explicit polo_ativo/passivo names in `ProcessoPortal` (ProcessoRespostaIA).
  // We have `papel_cliente` and `parte_contraria`.
  // If papel_cliente is AUTOR (or similar), title is Me x ParteContraria.
  // If REU, title is ParteContraria x Me.
  const isAutor = processo.papel_cliente?.toUpperCase().includes('AUTOR') || processo.papel_cliente?.toUpperCase().includes('RECLAMANTE');
  
  const nomeCliente = clienteNome || 'Cliente';
  const nomeAdverso = processo.parte_contraria || 'NÃO INFORMADO';

  const titulo = isAutor 
    ? `${nomeCliente} x ${nomeAdverso}`
    : `${nomeAdverso} x ${nomeCliente}`;

  // Access specific instance data (first degree usually, or whatever is available)
  const instancia = processo.instancias.primeiro_grau;
  const vara = instancia?.vara;
  // Note: ProcessoRespostaIA instances don't seem to carry valor_causa directly? Check types.
  // `InstanciaProcessoIA` has `vara`, `data_inicio`. No valor_causa?
  // `ProcessoRespostaIA` has `valor_causa` in legacy? No.
  // `InstanciaInfo` in domain has `valor_causa`.
  // `ProcessoRespostaIA` uses `InstanciaProcessoIA`.
  // I must check if `InstanciaProcessoIA` has `valor_causa`.
  // In `domain.ts` read earlier:
  // export interface InstanciaProcessoIA { vara: string | undefined; data_inicio: string; proxima_audiencia: string | null; }
  // So NO valor_causa.
  // I will omit valor_causa if unavailable or use 'Não informado'.

  return (
    <Card className="mb-4">
      <CardHeader className="pb-1 mb-0">
        <CardTitle className="text-lg mb-0 leading-tight">
          {titulo}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-1 space-y-2 text-sm pb-3">
        {processo.numero && (
          <p className="mt-0">
            <span className="font-semibold">Número do Processo:</span>{' '}
            {processo.numero}
          </p>
        )}
        <p>
          <span className="font-semibold">Tribunal:</span>{' '}
          {formatarTribunal(processo.tribunal)}
        </p>
        
        <p>
            <span className="font-semibold">Vara/Órgão:</span>{' '}
            {vara || 'Não informado'}
        </p>
        
        {/* Valor da causa removed as not present in View Model */}
        
        <p>
          <span className="font-semibold">Status:</span> {getStatusLine()}
        </p>
      </CardContent>
      <CardFooter className="pt-0">
        <div className="w-full space-y-2">
          <Collapsible className="w-full" open={isTimelineExpanded} onOpenChange={toggleTimeline}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between font-medium p-3 h-auto">
                <div className="flex items-center gap-3 text-left">
                  <Scale className="h-4 w-4" />
                  <div className="flex flex-col">
                    <span className="font-semibold">Movimentações</span>
                    <span className="text-xs text-muted-foreground font-normal">
                      {processo.timeline?.length || 0} registros
                    </span>
                  </div>
                </div>
                {isTimelineExpanded ? (
                  <ChevronUp className="h-4 w-4 transition-transform duration-200" />
                ) : (
                  <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <div className="bg-muted/30 rounded-lg p-3">
                <ProcessoTimeline
                  items={processo.timeline}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </CardFooter>
    </Card>
  );
};
