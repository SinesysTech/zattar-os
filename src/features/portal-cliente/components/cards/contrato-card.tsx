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
    // Busca partes com tipo 'parte_contraria'
    const partesContrarias = contrato.partes?.filter(p => p.tipoEntidade === 'parte_contraria');
    if (partesContrarias && partesContrarias.length > 0) {
      return partesContrarias.map(p => p.nomeSnapshot || 'NÃO INFORMADO').join(', ');
    }
    return 'NÃO INFORMADO';
  };

  const getClienteNome = () => {
    // Busca parte com tipo 'cliente'
    const cliente = contrato.partes?.find(p => p.tipoEntidade === 'cliente');
    return cliente?.nomeSnapshot || 'NÃO INFORMADO';
  };

  const titulo = `${getClienteNome().toUpperCase()} x ${getParteContraria().toUpperCase()}`;

  // Formatar labels
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
          <span className="font-semibold">Tipo:</span> {tipoContrato}
        </p>
        <p className="leading-normal">
          <span className="font-semibold">Data Contratação:</span> {formatarData(contrato.cadastradoEm)}
        </p>
        {/** Campos desativados pois dependem de implementação futura no backend */}
        {/*
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
        */}
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
