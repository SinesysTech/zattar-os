'use client';

/**
 * CallDetailSheet — Dialog de detalhes da chamada (Dyte meeting).
 * ============================================================================
 * Migrado de Sheet para Dialog (política do projeto: "Sem Sheet, usar Dialog").
 * ============================================================================
 */

import * as React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { RefreshCw, FileText} from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { GlassPanel } from '@/components/shared/glass-panel';

import {
  ChamadaComParticipantes,
  DyteMeetingDetails,
  StatusChamada,
  TipoChamada,
} from '../domain';
import {
  actionBuscarChamadaPorId,
  actionBuscarDetalhesMeeting,
} from '../actions/chamadas-actions';
import {
  formatarDuracao,
  getStatusBadgeVariant,
  getStatusLabel,
  getTipoChamadaIcon,
} from '../utils';
import { CallTranscriptViewer } from './call-transcript-viewer';

import { LoadingSpinner } from "@/components/ui/loading-state"
interface CallDetailSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  chamadaId: number | null;
}

export function CallDetailSheet({
  isOpen,
  onOpenChange,
  chamadaId,
}: CallDetailSheetProps) {
  const [chamada, setChamada] = React.useState<ChamadaComParticipantes | null>(
    null,
  );
  const [dyteDetails, setDyteDetails] = React.useState<DyteMeetingDetails | null>(
    null,
  );
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSyncing, setIsSyncing] = React.useState(false);

  React.useEffect(() => {
    if (isOpen && chamadaId) {
      loadChamada(chamadaId);
    } else {
      setChamada(null);
      setDyteDetails(null);
    }
  }, [isOpen, chamadaId]);

  const loadChamada = async (id: number) => {
    setIsLoading(true);
    try {
      const result = await actionBuscarChamadaPorId(id);
      if (result.success && result.data) {
        setChamada(result.data);
      }
    } catch (error) {
      console.error('Erro ao carregar chamada:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const syncDyteDetails = async () => {
    if (!chamada?.meetingId) return;

    setIsSyncing(true);
    try {
      const result = await actionBuscarDetalhesMeeting(chamada.meetingId);
      if (result.success && result.data) {
        setDyteDetails(result.data);
      }
    } catch (error) {
      console.error('Erro ao sincronizar com Dyte:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const Icon = chamada ? getTipoChamadaIcon(chamada.tipo as TipoChamada) : null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="glass-dialog max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {Icon && <Icon className="h-5 w-5" />}
            Detalhes da Chamada
          </DialogTitle>
          <DialogDescription>
            {chamada && `ID: ${chamada.id} • Meeting: ${chamada.meetingId}`}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center py-10">
            <LoadingSpinner className="size-8 text-muted-foreground" />
          </div>
        ) : chamada ? (
          <Tabs
            defaultValue="geral"
            className="mt-4 flex-1 flex flex-col min-h-0"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="geral">Geral</TabsTrigger>
              <TabsTrigger value="participantes">Participantes</TabsTrigger>
              <TabsTrigger value="transcricao" className="gap-2">
                <FileText className="w-3 h-3" /> Transcrição
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="geral"
              className="space-y-4 mt-4 flex-1 overflow-auto"
            >
              <GlassPanel depth={1} className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Status</span>
                  <Badge
                    variant={getStatusBadgeVariant(
                      chamada.status as StatusChamada,
                    )}
                  >
                    {getStatusLabel(chamada.status as StatusChamada)}
                  </Badge>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Iniciada em</span>
                  <span className="text-sm text-muted-foreground">
                    {format(
                      new Date(chamada.iniciadaEm),
                      "dd/MM/yyyy 'às' HH:mm",
                      { locale: ptBR },
                    )}
                  </span>
                </div>

                {chamada.finalizadaEm && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Finalizada em</span>
                    <span className="text-sm text-muted-foreground">
                      {format(
                        new Date(chamada.finalizadaEm),
                        "dd/MM/yyyy 'às' HH:mm",
                        { locale: ptBR },
                      )}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Duração</span>
                  <span className="text-sm text-muted-foreground">
                    {chamada.duracaoSegundos
                      ? formatarDuracao(chamada.duracaoSegundos)
                      : '-'}
                  </span>
                </div>

                {chamada.iniciador && (
                  <div className="flex justify-between items-center pt-2 border-t border-border/20">
                    <span className="text-sm font-medium">Iniciado por</span>
                    <div className="flex items-center gap-2">
                      <Avatar size="sm">
                        <AvatarImage src={chamada.iniciador.avatar} />
                        <AvatarFallback>
                          {chamada.iniciador.nomeCompleto.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">
                        {chamada.iniciador.nomeExibicao ||
                          chamada.iniciador.nomeCompleto}
                      </span>
                    </div>
                  </div>
                )}
              </GlassPanel>

              {/* Integração Dyte */}
              <GlassPanel depth={1} className="p-4 space-y-3 bg-muted/30">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">Status no Dyte</h4>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Atualizar"
                    className="h-6 w-6"
                    onClick={syncDyteDetails}
                    disabled={isSyncing}
                  >
                    <RefreshCw
                      className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`}
                    />
                  </Button>
                </div>

                {dyteDetails ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Status API:</span>
                      <Badge variant="outline">{dyteDetails.status}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Participantes ativos:</span>
                      <span>{dyteDetails.participantCount}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Clique no botão de atualizar para buscar dados em tempo real
                    da API do Dyte.
                  </p>
                )}
              </GlassPanel>
            </TabsContent>

            <TabsContent
              value="participantes"
              className="mt-4 flex-1 overflow-hidden"
            >
              <ScrollArea className="h-full pr-4">
                <div className="space-y-2">
                  {chamada.participantes.map((p) => (
                    <GlassPanel
                      key={p.id}
                      depth={1}
                      className="flex items-center justify-between p-3"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>U</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            Usuário #{p.usuarioId}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {p.entrouEm
                              ? `Entrou: ${format(new Date(p.entrouEm), 'HH:mm')}`
                              : 'Não entrou'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        {p.duracaoSegundos ? (
                          <span className="text-xs font-mono">
                            {formatarDuracao(p.duracaoSegundos)}
                          </span>
                        ) : p.entrouEm && !p.saiuEm ? (
                          <Badge variant="success" className="text-[10px]">
                            Online
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            -
                          </span>
                        )}
                      </div>
                    </GlassPanel>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent
              value="transcricao"
              className="mt-4 flex-1 overflow-hidden"
            >
              <CallTranscriptViewer chamada={chamada} />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="py-10 text-center text-muted-foreground">
            Chamada não encontrada.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
