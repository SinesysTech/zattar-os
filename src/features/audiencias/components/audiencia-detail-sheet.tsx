'use client';

import * as React from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Loader2, ExternalLink, CalendarDays, Clock, MapPin, User, ClipboardList, BookOpen } from 'lucide-react';
import { GRAU_TRIBUNAL_LABELS, type Audiencia } from '../domain';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AudienciaStatusBadge } from './audiencia-status-badge';
import { AudienciaModalidadeBadge } from './audiencia-modalidade-badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { actionBuscarAudienciaPorId } from '../actions';
import { useUsuarios } from '@/features/usuarios';

// Support both: passing audienciaId (will fetch) or audiencia object (will use directly)
export interface AudienciaDetailSheetProps {
  audienciaId?: number;
  audiencia?: Audiencia;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AudienciaDetailSheet({ audienciaId, audiencia: audienciaProp, open, onOpenChange }: AudienciaDetailSheetProps) {
  // State for fetched audiencia
  const [fetchedAudiencia, setFetchedAudiencia] = React.useState<Audiencia | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);



  // Fetch users to get responsible user name
  const { usuarios } = useUsuarios();

  // Only fetch if audienciaId is provided and audienciaProp is not
  const shouldFetch = !!audienciaId && !audienciaProp;

  React.useEffect(() => {
    if (!shouldFetch || !open) {
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    actionBuscarAudienciaPorId(audienciaId!)
      .then((result) => {
        if (cancelled) return;
        if (result.success && result.data) {
          setFetchedAudiencia(result.data);
        } else if (!result.success) {
          setError(result.error || 'Erro ao buscar audiência');
        } else {
          setError('Audiência não encontrada');
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [audienciaId, shouldFetch, open]);

  // Use prop if provided, otherwise use fetched data
  const audiencia = audienciaProp || fetchedAudiencia;

  // Get responsible user name
  const getResponsavelNome = React.useCallback((responsavelId: number | null | undefined) => {
    if (!responsavelId) return null;
    const usuario = usuarios.find(u => u.id === responsavelId);
    return usuario?.nomeExibicao || usuario?.nomeCompleto || `Usuário ${responsavelId}`;
  }, [usuarios]);

  if (shouldFetch && isLoading) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Carregando Detalhes da Audiência</SheetTitle>
            <SheetDescription>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando...
            </SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    );
  }

  if (shouldFetch && error) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Erro</SheetTitle>
            <SheetDescription>
              Não foi possível carregar os detalhes da audiência: {error}
            </SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    );
  }

  if (!audiencia) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Audiência Não Encontrada</SheetTitle>
            <SheetDescription>
              Os detalhes desta audiência não puderam ser carregados.
            </SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    );
  }

  const dataInicio = parseISO(audiencia.dataInicio);
  const dataFim = parseISO(audiencia.dataFim);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col">
        <SheetHeader>
          <SheetTitle>Detalhes da Audiência</SheetTitle>
          <SheetDescription>
            Informações detalhadas sobre a audiência {audiencia.numeroProcesso}.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto pr-4 -mr-4"> {/* Custom scrollable area */}
          <div className="space-y-6 py-4">
            {/* Header Section */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <h3 className="text-xl font-bold">{audiencia.tipoDescricao || 'Audiência'}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays className="h-4 w-4" />
                  <span>{format(dataInicio, 'dd/MM/yyyy', { locale: ptBR })}</span>
                  <Clock className="h-4 w-4" />
                  <span>{format(dataInicio, 'HH:mm', { locale: ptBR })} - {format(dataFim, 'HH:mm', { locale: ptBR })}</span>
                </div>
              </div>
              <AudienciaStatusBadge status={audiencia.status} className="text-lg px-3 py-1" />
            </div>

            {/* Processo Section */}
            <div className="space-y-2">
              <h4 className="flex items-center text-lg font-semibold"><ClipboardList className="mr-2 h-5 w-5" />Processo</h4>
              <p className="ml-7 text-sm">
                <span className="font-medium">{audiencia.numeroProcesso}</span>
                <span className="text-muted-foreground"> - {audiencia.trt} ({GRAU_TRIBUNAL_LABELS[audiencia.grau]})</span>
              </p>
              <p className="ml-7 text-sm">
                <span className="font-medium">{audiencia.poloAtivoNome}</span> vs{' '}
                <span className="font-medium">{audiencia.poloPassivoNome}</span>
              </p>
            </div>

            {/* Local/Link Section */}
            <div className="space-y-2">
              <h4 className="flex items-center text-lg font-semibold"><MapPin className="mr-2 h-5 w-5" />Local / Link</h4>
              <div className="ml-7 flex items-center gap-2">
                <AudienciaModalidadeBadge modalidade={audiencia.modalidade} />
                {audiencia.urlAudienciaVirtual && (
                  <Button variant="link" size="sm" asChild className="p-0 h-auto">
                    <a href={audiencia.urlAudienciaVirtual} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-1 h-4 w-4" /> Entrar na Sala
                    </a>
                  </Button>
                )}
              </div>
              {audiencia.enderecoPresencial && (
                <p className="ml-7 text-sm text-muted-foreground">
                  {audiencia.enderecoPresencial.logradouro}, {audiencia.enderecoPresencial.numero}
                  {audiencia.enderecoPresencial.complemento && ` - ${audiencia.enderecoPresencial.complemento}`}
                  , {audiencia.enderecoPresencial.bairro}, {audiencia.enderecoPresencial.cidade} - {audiencia.enderecoPresencial.uf}
                  , CEP: {audiencia.enderecoPresencial.cep}
                </p>
              )}
            </div>

            {/* Responsável Section */}
            {audiencia.responsavelId && (
              <div className="space-y-2">
                <h4 className="flex items-center text-lg font-semibold"><User className="mr-2 h-5 w-5" />Responsável</h4>
                <div className="ml-7 flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={`/avatars/${audiencia.responsavelId % 5}.png`} alt="Responsável" />
                    <AvatarFallback>
                      {(getResponsavelNome(audiencia.responsavelId) || '').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{getResponsavelNome(audiencia.responsavelId)}</span>
                </div>
              </div>
            )}

            {/* Observações Section */}
            {audiencia.observacoes && (
              <div className="space-y-2">
                <h4 className="flex items-center text-lg font-semibold"><BookOpen className="mr-2 h-5 w-5" />Observações</h4>
                <p className="ml-7 text-sm text-muted-foreground">{audiencia.observacoes}</p>
              </div>
            )}

            {/* Audit Info */}
            <div className="space-y-2 text-xs text-muted-foreground">
              <p>Criado em: {format(parseISO(audiencia.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
              <p>Atualizado em: {format(parseISO(audiencia.updatedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
            </div>

          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-4 flex justify-end gap-2 border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
