'use client';

// Componente Dialog para exibir detalhes de audiência(s)

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Audiencia } from '@/backend/types/audiencias/types';

/**
 * Formata data e hora ISO para formato brasileiro
 */
const formatarDataHora = (dataISO: string): string => {
  const data = new Date(dataISO);
  return data.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Formata apenas hora
 */
const formatarHora = (dataISO: string): string => {
  const data = new Date(dataISO);
  return data.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Formata o grau para exibição
 */
const formatarGrau = (grau: 'primeiro_grau' | 'segundo_grau'): string => {
  return grau === 'primeiro_grau' ? '1º Grau' : '2º Grau';
};

/**
 * Formata status da audiência
 */
const formatarStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    M: 'Marcada',
    R: 'Realizada',
    C: 'Cancelada',
  };
  return statusMap[status] || status;
};

/**
 * Retorna variante do badge de status
 */
const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  if (status === 'M') return 'default';
  if (status === 'R') return 'secondary';
  if (status === 'C') return 'destructive';
  return 'outline';
};

interface AudienciaDetalhesDialogProps {
  audiencia: Audiencia | null;
  audiencias?: Audiencia[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titulo?: string;
}

export function AudienciaDetalhesDialog({
  audiencia,
  audiencias,
  open,
  onOpenChange,
  titulo,
}: AudienciaDetalhesDialogProps) {
  // Se temos múltiplas audiências, mostra lista
  const exibirLista = audiencias && audiencias.length > 0;
  const audienciaUnica = !exibirLista && audiencia;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{titulo || (exibirLista ? 'Audiências do Dia' : 'Detalhes da Audiência')}</DialogTitle>
          <DialogDescription>
            {exibirLista
              ? `${audiencias.length} audiência${audiencias.length > 1 ? 's' : ''} agendada${audiencias.length > 1 ? 's' : ''} para este dia`
              : 'Informações completas da audiência'
            }
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          {exibirLista ? (
            <div className="space-y-4">
              {audiencias.map((aud) => (
                <div key={aud.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-lg">
                      {formatarHora(aud.data_inicio)}
                    </div>
                    <Badge variant={getStatusVariant(aud.status)}>
                      {formatarStatus(aud.status)}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-muted-foreground">Processo</div>
                      <div className="font-medium">
                        {aud.classe_judicial && `${aud.classe_judicial} `}
                        {aud.numero_processo}
                      </div>
                    </div>

                    <div>
                      <div className="text-muted-foreground">Tribunal/Grau</div>
                      <div className="flex gap-1">
                        <Badge variant="outline" className="text-xs">{aud.trt}</Badge>
                        <Badge variant="outline" className="text-xs">{formatarGrau(aud.grau)}</Badge>
                      </div>
                    </div>

                    <div className="col-span-2">
                      <div className="text-muted-foreground">Órgão Julgador</div>
                      <div>{aud.orgao_julgador_descricao || '-'}</div>
                    </div>

                    <div>
                      <div className="text-muted-foreground">Parte Autora</div>
                      <div className="truncate">{aud.polo_ativo_nome || '-'}</div>
                    </div>

                    <div>
                      <div className="text-muted-foreground">Parte Ré</div>
                      <div className="truncate">{aud.polo_passivo_nome || '-'}</div>
                    </div>

                    <div>
                      <div className="text-muted-foreground">Tipo</div>
                      <div className="flex items-center gap-1">
                        {aud.tipo_descricao || '-'}
                        {aud.tipo_is_virtual && (
                          <Badge variant="outline" className="text-xs">Virtual</Badge>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="text-muted-foreground">Sala</div>
                      <div>{aud.sala_audiencia_nome || '-'}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : audienciaUnica ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Status</div>
                  <Badge variant={getStatusVariant(audienciaUnica.status)} className="mt-1">
                    {formatarStatus(audienciaUnica.status)}
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Horário</div>
                  <div className="font-semibold text-lg">{formatarHora(audienciaUnica.data_inicio)}</div>
                </div>
              </div>

              <div className="border-t pt-4 space-y-3">
                <div>
                  <div className="text-sm text-muted-foreground">Número do Processo</div>
                  <div className="font-medium">
                    {audienciaUnica.classe_judicial && `${audienciaUnica.classe_judicial} `}
                    {audienciaUnica.numero_processo}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Tribunal</div>
                    <Badge variant="outline" className="mt-1">{audienciaUnica.trt}</Badge>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Grau</div>
                    <Badge variant="outline" className="mt-1">{formatarGrau(audienciaUnica.grau)}</Badge>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-muted-foreground">Órgão Julgador</div>
                  <div>{audienciaUnica.orgao_julgador_descricao || '-'}</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Parte Autora</div>
                    <div className="font-medium">{audienciaUnica.polo_ativo_nome || '-'}</div>
                    {audienciaUnica.polo_ativo_cpf && (
                      <div className="text-xs text-muted-foreground">CPF: {audienciaUnica.polo_ativo_cpf}</div>
                    )}
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Parte Ré</div>
                    <div className="font-medium">{audienciaUnica.polo_passivo_nome || '-'}</div>
                    {audienciaUnica.polo_passivo_cnpj && (
                      <div className="text-xs text-muted-foreground">CNPJ: {audienciaUnica.polo_passivo_cnpj}</div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Tipo de Audiência</div>
                    <div className="flex items-center gap-2 mt-1">
                      {audienciaUnica.tipo_descricao || '-'}
                      {audienciaUnica.tipo_is_virtual && (
                        <Badge variant="outline" className="text-xs">Virtual</Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Sala de Audiência</div>
                    <div className="mt-1">{audienciaUnica.sala_audiencia_nome || '-'}</div>
                  </div>
                </div>

                {audienciaUnica.url_audiencia_virtual && (
                  <div>
                    <div className="text-sm text-muted-foreground">Link da Audiência Virtual</div>
                    <a
                      href={audienciaUnica.url_audiencia_virtual}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm break-all"
                    >
                      {audienciaUnica.url_audiencia_virtual}
                    </a>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Data/Hora Início</div>
                    <div>{formatarDataHora(audienciaUnica.data_inicio)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Data/Hora Fim</div>
                    <div>{formatarDataHora(audienciaUnica.data_fim)}</div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
