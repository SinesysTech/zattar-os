import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './collapsible';
import { ChevronDown, ChevronUp, Scale } from 'lucide-react';
import { ProcessoSinesys } from '../../types/sinesys';
import React from 'react';
import { ProcessoTimeline } from './processo-timeline';

interface ProcessoCardProps {
  processo: ProcessoSinesys;
}

// Utilitários de formatação
const formatarValorMonetario = (valor: number | undefined): string => {
  if (valor === undefined || valor === null) return 'Não informado';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
};

const formatarTribunal = (tribunal: string): string => {
  if (!tribunal) return 'Não informado';
  const tribunalFormatado = tribunal.replace(/TRT(\d)/, 'TRT $1');
  return (tribunalFormatado);
};

export const ProcessoCard: React.FC<ProcessoCardProps> = ({ processo }) => {
  const [isTimelineExpanded, setIsTimelineExpanded] = React.useState(false);

  const toggleTimeline = () => {
    setIsTimelineExpanded(!isTimelineExpanded);
  };

  const getStatusLine = () => {
    if (processo.timeline_status === 'EM_ANDAMENTO') return 'Em andamento';
    if (processo.timeline_status === 'CONCLUIDO') return 'Concluído';
    if (processo.timeline_status === 'PENDENTE') return 'Pendente';
    if (processo.timeline_status === 'ERRO' || processo.timeline_status === 'DESATUALIZADO') return 'Atualização pendente';
    return 'Status desconhecido';
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-1 mb-0">
        <CardTitle className="text-lg mb-0 leading-tight">
          {processo.partes?.polo_ativo || 'NÃO INFORMADO'} x {processo.partes?.polo_passivo || 'NÃO INFORMADO'}
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
        {processo.vara && (
          <p>
            <span className="font-semibold">Vara/Órgão:</span>{' '}
            {processo.vara}
          </p>
        )}
        {processo.valor_causa !== undefined && (
          <p>
            <span className="font-semibold">Valor da Causa:</span>{' '}
            {formatarValorMonetario(processo.valor_causa)}
          </p>
        )}
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
