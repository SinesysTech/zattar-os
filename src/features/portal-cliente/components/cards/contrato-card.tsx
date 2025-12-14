import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ContratoPortal } from '../../types';

interface ContratoCardProps {
  contrato: ContratoPortal;
  index: number;
}

export function ContratoCard({ contrato, index }: ContratoCardProps) {
  // Função para determinar a cor customizada do badge
  const getBadgeClassName = (status?: string | null) => {
    if (!status) return '';

    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'distribuido':
        return 'bg-green-500 hover:bg-green-600 text-white';
      case 'em_contratacao':
        return 'bg-red-500 hover:bg-red-600 text-white';
      case 'contratado':
        return 'bg-blue-500 hover:bg-blue-600 text-white';
      case 'desistencia':
        return 'bg-black hover:bg-gray-800 text-white';
      default:
        return 'bg-gray-500 hover:bg-gray-600 text-white';
    }
  };

  const formatarData = (data: string | null | undefined) => {
    if (!data) return 'N/A';
    try {
      return new Date(data).toLocaleDateString('pt-BR');
    } catch {
      return data;
    }
  };

  const getParteContraria = () => {
    // Se cliente é autor, parte contraria é réu
    if (contrato.poloCliente === 'autor') {
      return contrato.parteRe?.map(p => p.nome).join(', ') || 'NÃO INFORMADO';
    }
    return contrato.parteAutora?.map(p => p.nome).join(', ') || 'NÃO INFORMADO';
  };

  const getClienteNome = () => {
    if (contrato.poloCliente === 'autor') {
      return contrato.parteAutora?.map(p => p.nome).join(', ') || 'NÃO INFORMADO';
    }
    return contrato.parteRe?.map(p => p.nome).join(', ') || 'NÃO INFORMADO';
  };

  const titulo = `${getClienteNome().toUpperCase()} x ${getParteContraria().toUpperCase()}`;

  // Formatar labels
  const areaDireito = contrato.areaDireito ? contrato.areaDireito.charAt(0).toUpperCase() + contrato.areaDireito.slice(1) : 'N/A';
  const tipoContrato = contrato.tipoContrato ? contrato.tipoContrato.replace('_', ' ').toUpperCase() : 'N/A';

  return (
    <Card key={contrato.id || `contrato-${index}`} className="w-full h-full relative">
      <CardHeader className="pb-1 mb-0">
        <CardTitle className="text-lg mb-0 leading-tight">
          {titulo}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-1 space-y-2 text-sm pb-3">
        <p className="leading-normal">
          <span className="font-semibold">Área:</span> {areaDireito}
        </p>
        <p className="leading-normal">
          <span className="font-semibold">Tipo:</span> {tipoContrato}
        </p>
        <p className="leading-normal">
          <span className="font-semibold">Data Contratação:</span> {formatarData(contrato.dataContratacao)}
        </p>
        {contrato.dataAssinatura && (
          <p className="leading-normal">
            <span className="font-semibold">Data Assinatura:</span> {formatarData(contrato.dataAssinatura)}
          </p>
        )}
        {contrato.dataDistribuicao && (
          <p className="leading-normal">
            <span className="font-semibold">Data Distribuição:</span> {formatarData(contrato.dataDistribuicao)}
          </p>
        )}
      </CardContent>
      {contrato.status && (
        <div className="absolute bottom-4 right-4">
          <Badge
            className={`${getBadgeClassName(contrato.status)}`}
          >
            {contrato.status.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>
      )}
    </Card>
  );
}
