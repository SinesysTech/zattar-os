'use client';

// Componente Dialog para exibir detalhes de expediente(s)

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
import type { PendenteManifestacao } from '@/backend/types/pendentes/types';

/**
 * Formata data ISO para formato brasileiro
 */
const formatarData = (dataISO: string | null): string => {
  if (!dataISO) return '-';
  try {
    const data = new Date(dataISO);
    return data.toLocaleDateString('pt-BR');
  } catch {
    return '-';
  }
};

/**
 * Retorna variante do badge de status
 */
const getStatusVariant = (baixadoEm: string | null): 'default' | 'secondary' => {
  return baixadoEm ? 'secondary' : 'default';
};

/**
 * Retorna texto do status
 */
const getStatusTexto = (baixadoEm: string | null): string => {
  return baixadoEm ? 'Baixado' : 'Pendente';
};

interface ExpedienteDetalhesDialogProps {
  expediente: PendenteManifestacao | null;
  expedientes?: PendenteManifestacao[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titulo?: string;
}

export function ExpedienteDetalhesDialog({
  expediente,
  expedientes,
  open,
  onOpenChange,
  titulo,
}: ExpedienteDetalhesDialogProps) {
  // Se temos múltiplos expedientes, mostra lista
  const exibirLista = expedientes && expedientes.length > 0;
  const expedienteUnico = !exibirLista && expediente;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{titulo || (exibirLista ? 'Expedientes do Dia' : 'Detalhes do Expediente')}</DialogTitle>
          <DialogDescription>
            {exibirLista
              ? `${expedientes.length} expediente${expedientes.length > 1 ? 's' : ''} para este dia`
              : 'Informações completas do expediente'
            }
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          {exibirLista ? (
            <div className="space-y-4">
              {expedientes.map((exp) => (
                <div key={exp.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-lg">
                      {exp.classe_judicial} {exp.numero_processo}
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={getStatusVariant(exp.baixado_em)}>
                        {getStatusTexto(exp.baixado_em)}
                      </Badge>
                      <Badge variant={exp.prazo_vencido ? 'destructive' : 'default'}>
                        {exp.prazo_vencido ? 'Vencido' : 'No Prazo'}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-muted-foreground">Data de Ciência</div>
                      <div className="font-medium">{formatarData(exp.data_ciencia_parte)}</div>
                    </div>

                    <div>
                      <div className="text-muted-foreground">Prazo Legal</div>
                      <div className="font-medium">{formatarData(exp.data_prazo_legal_parte)}</div>
                    </div>

                    <div className="col-span-2">
                      <div className="text-muted-foreground">Órgão Julgador</div>
                      <div>{exp.descricao_orgao_julgador || '-'}</div>
                    </div>

                    <div>
                      <div className="text-muted-foreground">Parte Autora</div>
                      <div className="truncate">{exp.nome_parte_autora || '-'}</div>
                    </div>

                    <div>
                      <div className="text-muted-foreground">Parte Ré</div>
                      <div className="truncate">{exp.nome_parte_re || '-'}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : expedienteUnico ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Status</div>
                  <div className="flex gap-2 mt-1">
                    <Badge variant={getStatusVariant(expedienteUnico.baixado_em)}>
                      {getStatusTexto(expedienteUnico.baixado_em)}
                    </Badge>
                    <Badge variant={expedienteUnico.prazo_vencido ? 'destructive' : 'default'}>
                      {expedienteUnico.prazo_vencido ? 'Vencido' : 'No Prazo'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 space-y-3">
                <div>
                  <div className="text-sm text-muted-foreground">Número do Processo</div>
                  <div className="font-medium">
                    {expedienteUnico.classe_judicial && `${expedienteUnico.classe_judicial} `}
                    {expedienteUnico.numero_processo}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Data de Ciência</div>
                    <div className="font-medium">{formatarData(expedienteUnico.data_ciencia_parte)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Prazo Legal</div>
                    <div className="font-medium">{formatarData(expedienteUnico.data_prazo_legal_parte)}</div>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-muted-foreground">Órgão Julgador</div>
                  <div>{expedienteUnico.descricao_orgao_julgador || '-'}</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Parte Autora</div>
                    <div className="font-medium">{expedienteUnico.nome_parte_autora || '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Parte Ré</div>
                    <div className="font-medium">{expedienteUnico.nome_parte_re || '-'}</div>
                  </div>
                </div>

                {expedienteUnico.baixado_em && (
                  <div>
                    <div className="text-sm text-muted-foreground">Data de Baixa</div>
                    <div>{formatarData(expedienteUnico.baixado_em)}</div>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
