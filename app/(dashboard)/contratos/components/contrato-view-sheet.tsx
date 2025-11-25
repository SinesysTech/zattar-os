'use client';

// Componente Sheet para visualização de contrato

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  formatarAreaDireito,
  formatarTipoContrato,
  formatarTipoCobranca,
  formatarStatusContrato,
  formatarPoloProcessual,
  formatarData,
  getStatusBadgeStyle,
  getTipoContratoBadgeStyle,
} from '@/app/_lib/utils/format-contratos';
import type { Contrato } from '@/backend/contratos/services/persistence/contrato-persistence.service';

interface ContratoViewSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contrato: Contrato | null;
}

export function ContratoViewSheet({
  open,
  onOpenChange,
  contrato,
}: ContratoViewSheetProps) {
  if (!contrato) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-full sm:max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Contrato #{contrato.id}
            <Badge {...getStatusBadgeStyle(contrato.status)}>
              {formatarStatusContrato(contrato.status)}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Visualização completa dos dados do contrato
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Informações Básicas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Área de Direito
                </div>
                <Badge variant="outline">
                  {formatarAreaDireito(contrato.areaDireito)}
                </Badge>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Tipo de Contrato
                </div>
                  <Badge {...getTipoContratoBadgeStyle(contrato.tipoContrato)}>
                    {formatarTipoContrato(contrato.tipoContrato)}
                  </Badge>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Tipo de Cobrança
                </div>
                <div className="text-base">{formatarTipoCobranca(contrato.tipoCobranca)}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Status
                </div>
                  <Badge {...getStatusBadgeStyle(contrato.status)}>
                    {formatarStatusContrato(contrato.status)}
                  </Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Partes */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Partes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Cliente (ID)
                </div>
                <div className="text-base">{contrato.clienteId}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Polo do Cliente
                </div>
                <Badge variant="outline">
                  {formatarPoloProcessual(contrato.poloCliente)}
                </Badge>
              </div>
              {contrato.parteContrariaId && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    Parte Contrária (ID)
                  </div>
                  <div className="text-base">{contrato.parteContrariaId}</div>
                </div>
              )}
            </div>

            {contrato.parteAutora && contrato.parteAutora.length > 0 && (
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-2">
                  Parte Autora ({contrato.qtdeParteAutora})
                </div>
                <div className="space-y-2">
                  {contrato.parteAutora.map((parte, index) => (
                    <div key={index} className="text-sm border rounded p-2">
                      <span className="font-medium">{parte.nome}</span>
                      <span className="text-muted-foreground ml-2">
                        ({parte.tipo === 'cliente' ? 'Cliente' : 'Parte Contrária'})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {contrato.parteRe && contrato.parteRe.length > 0 && (
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-2">
                  Parte Ré ({contrato.qtdeParteRe})
                </div>
                <div className="space-y-2">
                  {contrato.parteRe.map((parte, index) => (
                    <div key={index} className="text-sm border rounded p-2">
                      <span className="font-medium">{parte.nome}</span>
                      <span className="text-muted-foreground ml-2">
                        ({parte.tipo === 'cliente' ? 'Cliente' : 'Parte Contrária'})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Datas */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Datas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Data de Contratação
                </div>
                <div className="text-base">{formatarData(contrato.dataContratacao)}</div>
              </div>
              {contrato.dataAssinatura && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    Data de Assinatura
                  </div>
                  <div className="text-base">{formatarData(contrato.dataAssinatura)}</div>
                </div>
              )}
              {contrato.dataDistribuicao && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    Data de Distribuição
                  </div>
                  <div className="text-base">{formatarData(contrato.dataDistribuicao)}</div>
                </div>
              )}
              {contrato.dataDesistencia && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    Data de Desistência
                  </div>
                  <div className="text-base">{formatarData(contrato.dataDesistencia)}</div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Informações Adicionais */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Informações Adicionais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {contrato.responsavelId && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    Responsável (ID)
                  </div>
                  <div className="text-base">{contrato.responsavelId}</div>
                </div>
              )}
              {contrato.createdBy && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    Criado por (ID)
                  </div>
                  <div className="text-base">{contrato.createdBy}</div>
                </div>
              )}
            </div>

            {contrato.observacoes && (
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Observações
                </div>
                <div className="text-base whitespace-pre-wrap border rounded p-3 bg-muted/50">
                  {contrato.observacoes}
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Metadados */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Metadados</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Criado em
                </div>
                <div className="text-base">{formatarData(contrato.createdAt)}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Atualizado em
                </div>
                <div className="text-base">{formatarData(contrato.updatedAt)}</div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
