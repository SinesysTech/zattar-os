import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ContratoSinesys } from '../../types/sinesys';

interface ContratoCardProps {
  contrato: ContratoSinesys;
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

  const getNomesPartes = () => {
    const partes = contrato.partes ?? [];
    const autoras = partes
      .filter((p: { papelContratual: string; nome: string }) => p.papelContratual === 'autora')
      .map((p: { papelContratual: string; nome: string }) => p.nome)
      .filter(Boolean);
    const re = partes
      .filter((p: { papelContratual: string; nome: string }) => p.papelContratual === 're')
      .map((p: { papelContratual: string; nome: string }) => p.nome)
      .filter(Boolean);

    const clienteNome = (contrato.papelClienteNoContrato === 'autora' ? autoras : re).join(', ') || 'NÃO INFORMADO';
    const parteContrariaNome = (contrato.papelClienteNoContrato === 'autora' ? re : autoras).join(', ') || 'NÃO INFORMADO';

    return { clienteNome, parteContrariaNome };
  };

  const { clienteNome, parteContrariaNome } = getNomesPartes();
  const titulo = `${clienteNome.toUpperCase()} x ${parteContrariaNome.toUpperCase()}`;

  // Formatar labels
  const tipoContrato = contrato.tipoContrato ? contrato.tipoContrato.replace('_', ' ').toUpperCase() : 'N/A';
  const statusFormatado = contrato.status ? contrato.status.replace('_', ' ').toLowerCase() : 'N/A';

  return (
    <Card className="w-full h-full">
      <CardHeader>
        <CardTitle className="text-lg">{titulo}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p>
          <span className="font-semibold">Número:</span> {contrato.numero || 'N/A'}
        </p>
        <p>
          <span className="font-semibold">Tipo:</span> {tipoContrato}
        </p>
        <p>
          <span className="font-semibold">Cadastrado em:</span> {formatarData(contrato.cadastradoEm)}
        </p>
        <div className="flex items-center gap-2 pt-2">
          <span className="font-semibold">Status:</span>
          <Badge className={getBadgeClassName(contrato.status)}>{statusFormatado}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
