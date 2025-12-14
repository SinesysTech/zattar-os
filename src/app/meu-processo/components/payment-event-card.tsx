'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, DollarSign } from 'lucide-react';
import { AcordoCondenacaoSinesys } from '../types/sinesys';

interface PaymentEventCardProps {
  pagamento: AcordoCondenacaoSinesys;
  numeroProcesso?: string;
  partesNomes?: string;
}

export const PaymentEventCard: React.FC<PaymentEventCardProps> = ({
  pagamento,
  numeroProcesso,
  partesNomes
}) => {
  // Função para formatar valores monetários
  const formatarValorMonetario = (valor: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(valor);
  };

  // Função para formatar data
  const formatarData = (dataString: string): string => {
    if (!dataString) return 'Não informado';
    // Sinesys returns YYYY-MM-DD
    const [year, month, day] = dataString.split('-');
    return `${day}/${month}/${year}`;
  };

  // Função para obter estilo do badge baseado no status
  const getBadgeStyle = (): string => {
    switch (pagamento.status) {
      case 'pago_total':
      case 'pago_parcial':
        return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200';
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200';
      case 'atrasado':
        return 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200';
    }
  };

  const getBadgeText = (): string => {
    if (pagamento.status === 'pago_total') return 'Pago Total';
    if (pagamento.status === 'pago_parcial') return 'Pago Parcial';
    return pagamento.status.charAt(0).toUpperCase() + pagamento.status.slice(1);
  };

  return (
    <Card className="hover:border-primary/50 transition-colors relative">
      <CardHeader className="pb-2 pr-16">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          Acordo/Condenação
        </CardTitle>

        {/* Partes envolvidas */}
        <p className="text-xs text-muted-foreground font-medium">
          {partesNomes || 'Partes não informadas'}
        </p>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>Vcto: {formatarData(pagamento.dataVencimentoPrimeiraParcela)}</span>
        </div>
      </CardHeader>

      {/* Badge de status no canto inferior direito */}
      <div className="absolute bottom-4 right-4">
        <Badge
          variant="outline"
          className={`text-xs ${getBadgeStyle()}`}
        >
          {getBadgeText()}
        </Badge>
      </div>

      <CardContent className="space-y-2">
        {numeroProcesso && (
          <p className="text-xs">
            <span className="font-medium">Processo:</span>{' '}
            <span className="font-mono text-blue-600">{numeroProcesso}</span>
          </p>
        )}

        <p className="text-xs flex items-center gap-1">
          <span className="font-medium">Valor Total:</span>{' '}
          <span className="font-semibold text-green-600">
            {formatarValorMonetario(pagamento.valorTotal)}
          </span>
        </p>

        {/* Exibir parcelas se disponível */}
        {pagamento.numeroParcelas && (
          <p className="text-xs text-muted-foreground">
            {pagamento.numeroParcelas} parcela(s)
          </p>
        )}
      </CardContent>
    </Card>
  );
};
