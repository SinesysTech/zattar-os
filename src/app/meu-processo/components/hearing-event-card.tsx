'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, AudioLines } from 'lucide-react';

import { AudienciaSinesys } from '../types/sinesys';

type ExtendedAudiencia = AudienciaSinesys & {
  type?: 'audiencia';
};

interface HearingEventCardProps {
  audiencia: ExtendedAudiencia;
}

export const HearingEventCard: React.FC<HearingEventCardProps> = ({ audiencia }) => {
  // Função para obter a cor do badge baseado no status
  const getBadgeStyle = (status: string): string => {
    switch (status) {
      case 'AGENDADA':
      case 'REDESIGNADA':
        return 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200';
      case 'REALIZADA':
        return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200';
      case 'CANCELADA':
      case 'SUSPENSA':
      case 'NAO_REALIZADA':
        return 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    // Sinesys returns YYYY-MM-DD
    if (!dateString) return 'Data n/a';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  const formatTime = (timeString: string) => {
    // Sinesys returns HH:MM or HH:MM:SS or range
    return timeString || 'Hora n/a';
  };

  const statusFormatado = audiencia.status.replace(/_/g, ' ').toLowerCase();

  return (
    <Card className="hover:border-primary/50 transition-colors relative">
      <CardHeader className="pb-2 pr-16">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <AudioLines className="h-4 w-4 text-muted-foreground" />
          {audiencia.tipo || 'Audiência'}
        </CardTitle>

        {/* Partes envolvidas */}
        {(audiencia.partes?.polo_ativo || audiencia.partes?.polo_passivo) && (
          <p className="text-xs text-muted-foreground font-medium">
            {audiencia.partes.polo_ativo || 'NÃO INFORMADO'} × {audiencia.partes.polo_passivo || 'NÃO INFORMADO'}
          </p>
        )}

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>{formatDate(audiencia.data)}</span>
          <Clock className="h-3 w-3 ml-1" />
          <span>{formatTime(audiencia.horario)}</span>
        </div>
      </CardHeader>

      {/* Badge de status no canto inferior direito */}
      {audiencia.status && (
        <div className="absolute bottom-4 right-4">
          <Badge
            variant="outline"
            className={`text-xs capitalize ${getBadgeStyle(audiencia.status)}`}
          >
            {statusFormatado}
          </Badge>
        </div>
      )}

      <CardContent className="space-y-2">
        {audiencia.numero_processo && (
          <p className="text-xs">
            <span className="font-medium">Processo:</span>{' '}
            <span className="font-mono text-blue-600">{audiencia.numero_processo}</span>
          </p>
        )}

        {audiencia.vara && (
          <p className="text-xs">
            <span className="font-medium">Órgão:</span>{' '}
            {audiencia.vara}
          </p>
        )}

        {audiencia.local?.url_virtual && (
          <p className="text-xs">
            <a
              href={audiencia.local.url_virtual}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Link da audiência virtual
            </a>
          </p>
        )}

        {audiencia.local?.endereco && (
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">Local:</span> {audiencia.local.endereco}
            {audiencia.local.sala && ` - Sala ${audiencia.local.sala}`}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
