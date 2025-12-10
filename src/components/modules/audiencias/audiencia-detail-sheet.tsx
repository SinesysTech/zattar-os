'use client';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useAudiencias } from '@/hooks/use-audiencias'; // Assuming a hook for single audiencia
import { Loader2, ExternalLink, CalendarDays, Clock, MapPin, Users, Info, User, ClipboardList, BookOpen } from 'lucide-react';
import { Audiencia, GRAU_TRIBUNAL_LABELS } from '@/core/audiencias/domain';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AudienciaStatusBadge } from './audiencia-status-badge';
import { AudienciaModalidadeBadge } from './audiencia-modalidade-badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface AudienciaDetailSheetProps {
  audienciaId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AudienciaDetailSheet({ audienciaId, open, onOpenChange }: AudienciaDetailSheetProps) {
  // Assuming a hook to fetch a single audiencia by ID
  const { audiencias, isLoading, error } = useAudiencias({ pagina: 1, limite: 1, busca: audienciaId.toString() });
  const audiencia = audiencias?.[0]; // Get the first audiencia if found

  if (isLoading) {
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

  if (error) {
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

  const dataInicio = new Date(audiencia.dataInicio);
  const dataFim = new Date(audiencia.dataFim);

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
                    <AvatarImage src={`/avatars/${audiencia.responsavelId % 5}.png`} alt="Responsável" /> {/* Placeholder avatar */}
                    <AvatarFallback>{audiencia.responsavelId.toString().slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">Usuário {audiencia.responsavelId}</span> {/* Replace with actual user name */}
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
              <p>Criado em: {format(new Date(audiencia.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
              <p>Atualizado em: {format(new Date(audiencia.updatedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
            </div>

          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-4 flex justify-end gap-2 border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button onClick={() => console.log('Edit Audiencia', audiencia.id)}>
            Editar
          </Button>
          {/* Add more action buttons here, e.g., Mark as Done, Cancel */}
        </div>
      </SheetContent>
    </Sheet>
  );
}
