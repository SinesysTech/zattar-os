import React from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { MapPinned, ExternalLink } from "lucide-react";
import { AudienciaSinesys } from "../../types/sinesys";

interface AudienciaCardProps {
  audiencia: AudienciaSinesys;
  onClick?: () => void;
  actions?: React.ReactNode;
}

export const AudienciaCard: React.FC<AudienciaCardProps> = ({ audiencia, onClick, actions }) => {
  // Combinar data e hora se possível (embora Sinesys tenha campos separados, para validação rápida)
  const dataHoraString = `${audiencia.data}T${audiencia.horario || '00:00:00'}`;
  const isValidDate = !isNaN(new Date(dataHoraString).getTime());

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

  // Função para criar URL do Google Maps
  const createMapsUrl = (address: string): string => {
    const cleanAddress = address.replace(/<[^>]*>/g, '').trim();
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanAddress)}`;
  };

  // Função para abrir o Google Maps
  const handleMapClick = (address: string) => {
    const mapsUrl = createMapsUrl(address);
    window.open(mapsUrl, '_blank', 'noopener,noreferrer');
  };

  const statusFormatado = audiencia.status.replace(/_/g, ' ').toLowerCase();

  return (
    <Card className="w-full h-full relative">
      <CardHeader className="pb-1 mb-0">
        <CardTitle className="text-lg mb-0 leading-tight">
          {audiencia.partes?.polo_ativo || 'NÃO INFORMADO'} x {audiencia.partes?.polo_passivo || 'NÃO INFORMADO'}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-1 space-y-2 text-sm pb-3">
        {audiencia.numero_processo && (
          <p>
            <span className="font-semibold">Número do Processo:</span>{' '}
            {audiencia.numero_processo}
          </p>
        )}

        {audiencia.vara && (
          <p className="leading-normal">
            <span className="font-semibold">Órgão Julgador:</span>{' '}
            {audiencia.vara}
          </p>
        )}

        {audiencia.tipo && (
          <p className="leading-normal">
            <span className="font-semibold">Tipo:</span>{' '}
            {audiencia.tipo}
          </p>
        )}

        <p className="leading-normal">
          <span className="font-semibold">Data e Hora:</span>{' '}
          {isValidDate
            ? `${format(new Date(audiencia.data), 'dd/MM/yyyy')} às ${audiencia.horario || 'Hora não inf.'}`
            : `${audiencia.data} ${audiencia.horario}`}
        </p>

        {audiencia.modalidade && (
          <p className="leading-normal">
            <span className="font-semibold">Modalidade:</span>{' '}
            {audiencia.modalidade.toLowerCase()}
          </p>
        )}

        {/* Local: Link virtual ou endereÃ§o fÃ­sico */}
        {(audiencia.local?.url_virtual || audiencia.local?.endereco) && (
          <p className="flex items-start gap-2 leading-normal">
            <span className="font-semibold">Local:</span>
            <span className="flex-1 flex items-center gap-2">
              {audiencia.local.url_virtual ? (
                <>
                  <a href={audiencia.local.url_virtual} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline truncate block max-w-[200px]">
                    Link da sala virtual
                  </a>
                  <ExternalLink size={14} className="text-gray-400 shrink-0" />
                </>
              ) : audiencia.local.endereco ? (
                <>
                  <span>{audiencia.local.endereco}</span>
                  <button
                    onClick={() => handleMapClick(audiencia.local.endereco!)}
                    className="text-blue-600 hover:text-blue-800 transition-colors p-1 rounded hover:bg-blue-50"
                    title="Abrir no Google Maps"
                    type="button"
                  >
                    <MapPinned size={16} />
                  </button>
                </>
              ) : null}
            </span>
          </p>
        )}

        {audiencia.local?.sala && (
          <p className="leading-normal">
            <span className="font-semibold">Sala:</span>{' '}
            {audiencia.local.sala}
          </p>
        )}

        {audiencia.observacoes && (
          <p className="leading-normal">
            <span className="font-semibold">Detalhes:</span>{' '}
            {audiencia.observacoes}
          </p>
        )}
      </CardContent>
      {audiencia.status && (
        <div className="absolute bottom-4 right-4">
          <Badge
            variant="outline"
            className={`capitalize ${getBadgeStyle(audiencia.status)}`}
          >
            {statusFormatado}
          </Badge>
        </div>
      )}
      <CardFooter className="pt-0 flex gap-2">
        {actions}
        {onClick && (
          <Button size="sm" variant="secondary" onClick={onClick}>
            Ver detalhes
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
