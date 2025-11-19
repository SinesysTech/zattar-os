'use client';

// Componente Dialog para exibir detalhes de audiência(s)

import * as React from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Pencil, Plus } from 'lucide-react';
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

/**
 * Detecta qual plataforma de videoconferência baseado na URL
 */
type PlataformaVideo = 'zoom' | 'meet' | 'webex' | null;

const detectarPlataforma = (url: string | null): PlataformaVideo => {
  if (!url) return null;
  const urlLower = url.toLowerCase();
  if (urlLower.includes('zoom')) return 'zoom';
  if (urlLower.includes('meet')) return 'meet';
  if (urlLower.includes('webex')) return 'webex';
  return null;
};

/**
 * Retorna o caminho da logo para a plataforma
 */
const getLogoPlataforma = (plataforma: PlataformaVideo): string | null => {
  const logos: Record<string, string> = {
    zoom: '/Zoom_Logo.png',
    meet: '/meet_logo.png',
    webex: '/webex_logo.png',
  };
  return plataforma ? logos[plataforma] : null;
};

/**
 * Componente para exibir e editar URL da audiência virtual no dialog
 */
function UrlVirtualDialogSection({ audiencia, onSuccess }: { audiencia: Audiencia; onSuccess?: () => void }) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [url, setUrl] = React.useState(audiencia.url_audiencia_virtual || '');

  React.useEffect(() => {
    setUrl(audiencia.url_audiencia_virtual || '');
  }, [audiencia.url_audiencia_virtual]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const urlToSave = url.trim() || null;

      const response = await fetch(`/api/audiencias/${audiencia.id}/url-virtual`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ urlAudienciaVirtual: urlToSave }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || 'Erro ao atualizar URL');
      }

      setIsEditing(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Erro ao atualizar URL:', error);
      if (onSuccess) onSuccess();
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setUrl(audiencia.url_audiencia_virtual || '');
    setIsEditing(false);
  };

  const handleCopyUrl = async () => {
    if (!audiencia.url_audiencia_virtual) return;
    try {
      await navigator.clipboard.writeText(audiencia.url_audiencia_virtual);
    } catch (error) {
      console.error('Erro ao copiar URL:', error);
    }
  };

  if (isEditing) {
    return (
      <div>
        <div className="text-sm text-muted-foreground mb-2">URL da Audiência Virtual</div>
        <div className="flex items-center gap-2">
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            disabled={isLoading}
            className="h-9"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') handleCancel();
            }}
          />
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isLoading}
          >
            Salvar
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancelar
          </Button>
        </div>
      </div>
    );
  }

  const plataforma = detectarPlataforma(audiencia.url_audiencia_virtual);
  const logoPath = getLogoPlataforma(plataforma);

  if (!audiencia.url_audiencia_virtual) {
    return (
      <div>
        <div className="text-sm text-muted-foreground mb-2">URL da Audiência Virtual</div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsEditing(true)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Adicionar URL
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="text-sm text-muted-foreground mb-2">URL da Audiência Virtual</div>
      <div className="flex items-center gap-2">
        {logoPath ? (
          <a
            href={audiencia.url_audiencia_virtual}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Acessar audiência virtual via ${plataforma}`}
            className="hover:opacity-70 transition-opacity flex items-center"
          >
            <Image
              src={logoPath}
              alt={plataforma || 'Plataforma de vídeo'}
              width={100}
              height={40}
              className="object-contain"
            />
          </a>
        ) : (
          <a
            href={audiencia.url_audiencia_virtual}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Acessar audiência virtual"
            className="text-sm text-blue-600 hover:underline break-all"
          >
            {audiencia.url_audiencia_virtual}
          </a>
        )}
        <div className="flex gap-1 ml-auto">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopyUrl}
            className="h-8 w-8 p-0"
            title="Copiar URL"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsEditing(true)}
            className="h-8 w-8 p-0"
            title="Editar URL"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

interface AudienciaDetalhesDialogProps {
  audiencia: Audiencia | null;
  audiencias?: Audiencia[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titulo?: string;
  onRefresh?: () => void;
}

export function AudienciaDetalhesDialog({
  audiencia,
  audiencias,
  open,
  onOpenChange,
  titulo,
  onRefresh,
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

                  {aud.tipo_is_virtual && (
                    <div className="pt-3 border-t">
                      <UrlVirtualDialogSection audiencia={aud} onSuccess={onRefresh} />
                    </div>
                  )}
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
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Parte Ré</div>
                    <div className="font-medium">{audienciaUnica.polo_passivo_nome || '-'}</div>
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

                {audienciaUnica.tipo_is_virtual && (
                  <UrlVirtualDialogSection audiencia={audienciaUnica} onSuccess={onRefresh} />
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
