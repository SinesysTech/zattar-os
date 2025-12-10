'use client';

// Componente Dialog para visualizar detalhes completos de um expediente

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ExternalLink, Calendar, FileText, Users, Building2, Scale, AlertCircle } from 'lucide-react';
import { Expediente, GrauTribunal } from '@/core/expedientes/domain';
import type { Usuario } from '@/backend/usuarios/services/persistence/usuario-persistence.service';

interface TipoExpediente {
  id: number;
  tipoExpediente: string;
}

interface ExpedienteVisualizarDialogProps {
  expediente: Expediente;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usuarios?: Usuario[];
  tiposExpedientes?: TipoExpediente[];
}

export function ExpedienteVisualizarDialog({
  expediente,
  open,
  onOpenChange,
  usuarios = [],
  tiposExpedientes = [],
}: ExpedienteVisualizarDialogProps) {
  const responsavel = usuarios.find(u => u.id === expediente.responsavel_id);
  const tipoExpediente = tiposExpedientes.find(t => t.id === expediente.tipo_expediente_id);

  const handleAbrirPagina = () => {
    // Por enquanto, apenas fecha o diálogo
    // A página será criada posteriormente
    onOpenChange(false);
    // TODO: Navegar para /expedientes/[id] quando a página for criada
    // router.push(`/expedientes/${expediente.id}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
                              <DialogTitle className="text-xl">
                                {expediente.classeJudicial} {expediente.numeroProcesso}
                              </DialogTitle>              <DialogDescription className="mt-1">
                Detalhes completos do expediente
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant={expediente.baixadoEm ? 'secondary' : 'default'}>
                {expediente.baixadoEm ? 'Baixado' : 'Pendente'}
              </Badge>
              {expediente.prazoVencido && (
                <Badge tone="danger" variant="solid">Prazo Vencido</Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-180px)] pr-4">
          <div className="space-y-6">
            {/* Informações do Processo */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Scale className="h-4 w-4" />
                Informações do Processo
              </div>
              <div className="grid grid-cols-2 gap-4 pl-6">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Número do Processo</div>
                  <div className="font-medium">{expediente.numero_processo}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Classe Judicial</div>
                  <div className="font-medium">{expediente.classe_judicial || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">TRT</div>
                  <Badge variant="outline">{expediente.trt}</Badge>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Grau</div>
                  <Badge variant="outline">{formatarGrau(expediente.grau)}</Badge>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Status do Processo</div>
                  <div className="font-medium">{expediente.codigoStatusProcesso || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Prioridade</div>
                  <div className="font-medium">{expediente.prioridadeProcessual || 0}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Segredo de Justiça</div>
                  <Badge variant={expediente.segredoJustica ? 'destructive' : 'secondary'}>
                    {expediente.segredoJustica ? 'Sim' : 'Não'}
                  </Badge>
                </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Juízo Digital</div>
                    <Badge tone={expediente.juizoDigital ? 'success' : 'neutral'} variant={expediente.juizoDigital ? 'soft' : 'outline'}>
                      {expediente.juizoDigital ? 'Sim' : 'Não'}
                    </Badge>
                  </div>
              </div>
            </div>

            <Separator />

            {/* Partes Envolvidas */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Users className="h-4 w-4" />
                Partes Envolvidas
              </div>
              <div className="grid grid-cols-2 gap-4 pl-6">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Parte Autora</div>
                  <div className="font-medium">{expediente.nomeParteAutora || '-'}</div>
                  {expediente.qtdeParteAutora > 1 && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {expediente.qtdeParteAutora} parte(s)
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Parte Ré</div>
                  <div className="font-medium">{expediente.nomeParteRe || '-'}</div>
                  {expediente.qtde_parte_re > 1 && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {expediente.qtde_parte_re} parte(s)
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Órgão Julgador */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Building2 className="h-4 w-4" />
                Órgão Julgador
              </div>
              <div className="grid grid-cols-2 gap-4 pl-6">
                <div className="col-span-2">
                  <div className="text-xs text-muted-foreground mb-1">Descrição</div>
                  <div className="font-medium">{expediente.descricao_orgao_julgador || '-'}</div>
                </div>
                {expediente.sigla_orgao_julgador && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Sigla</div>
                    <Badge variant="outline">{expediente.sigla_orgao_julgador}</Badge>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Datas e Prazos */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Datas e Prazos
              </div>
              <div className="grid grid-cols-2 gap-4 pl-6">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Data de Autuação</div>
                  <div className="font-medium">{formatarData(expediente.data_autuacao)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Data de Ciência</div>
                  <div className="font-medium">{formatarData(expediente.data_ciencia_parte)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Prazo Legal</div>
                  <div className={`font-medium ${expediente.prazo_vencido ? 'text-destructive' : ''}`}>
                    {formatarData(expediente.data_prazo_legal_parte)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Criação do Expediente</div>
                  <div className="font-medium">{formatarData(expediente.data_criacao_expediente)}</div>
                </div>
                {expediente.data_arquivamento && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Data de Arquivamento</div>
                    <div className="font-medium">{formatarData(expediente.data_arquivamento)}</div>
                  </div>
                )}
                {expediente.baixado_em && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Data de Baixa</div>
                    <div className="font-medium">{formatarDataHora(expediente.baixado_em)}</div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Tipo e Descrição */}
            {(tipoExpediente || expediente.descricao_arquivos) && (
              <>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    Tipo e Descrição
                  </div>
                  <div className="grid grid-cols-1 gap-4 pl-6">
                    {tipoExpediente && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Tipo de Expediente</div>
                        <Badge
                          variant="outline"
                          className={getTipoExpedienteColorClass(tipoExpediente.id)}
                        >
                          {tipoExpediente.tipo_expediente}
                        </Badge>
                      </div>
                    )}
                    {expediente.descricao_arquivos && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Descrição / Arquivos</div>
                        <div className="text-sm">{expediente.descricao_arquivos}</div>
                      </div>
                    )}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Baixa do Expediente */}
            {expediente.baixado_em && (
              <>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                    <AlertCircle className="h-4 w-4" />
                    Informações de Baixa
                  </div>
                  <div className="grid grid-cols-1 gap-4 pl-6">
                    {expediente.protocolo_id && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Protocolo ID</div>
                        <div className="font-medium font-mono">{expediente.protocolo_id}</div>
                      </div>
                    )}
                    {expediente.justificativa_baixa && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Justificativa</div>
                        <div className="text-sm">{expediente.justificativa_baixa}</div>
                      </div>
                    )}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Responsável */}
            {responsavel && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <Users className="h-4 w-4" />
                  Responsável
                </div>
                <div className="pl-6">
                  <div className="text-xs text-muted-foreground mb-1">Usuário Responsável</div>
                  <div className="font-medium">{responsavel.nomeExibicao || responsavel.nomeCompleto}</div>
                </div>
              </div>
            )}

            {/* Informações Técnicas */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <FileText className="h-4 w-4" />
                Informações Técnicas
              </div>
              <div className="grid grid-cols-2 gap-4 pl-6">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">ID PJE</div>
                  <div className="font-medium font-mono">{expediente.id_pje}</div>
                </div>
                {expediente.id_documento && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">ID Documento</div>
                    <div className="font-medium font-mono">{expediente.id_documento}</div>
                  </div>
                )}
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Criado em</div>
                  <div className="font-medium">{formatarDataHora(expediente.created_at)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Atualizado em</div>
                  <div className="font-medium">{formatarDataHora(expediente.updated_at)}</div>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button onClick={handleAbrirPagina}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Abrir Expediente
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

