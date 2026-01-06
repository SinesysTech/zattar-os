import React from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AcordoCondenacaoSinesys } from "../../types/sinesys";

// Função utilitária para formatar valores monetários
const formatarValorMonetario = (valor: string | number | undefined | null): string => {
  if (valor === undefined || valor === null) return 'R$ 0,00';
  const numero = typeof valor === 'string'
    ? parseFloat(valor.replace(/[^\d.,]/g, '').replace(',', '.'))
    : valor;
  if (isNaN(numero)) return 'Valor inválido';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numero);
};

// Função utilitária para formatar datas
const formatarData = (data: string | null | undefined): string => {
  if (!data) return 'N/A';
  try {
    return new Date(data).toLocaleDateString('pt-BR');
  } catch {
    return data;
  }
};

interface PagamentoCardProps {
  item: AcordoCondenacaoSinesys;
  onClick?: () => void;
  actions?: React.ReactNode;
}

export const PagamentoCard: React.FC<PagamentoCardProps> = ({ item, onClick, actions }) => {
  const numeroProcesso = item.numero_processo || 'Não informado';
  const partesDisplay = null; // Placeholder - adapt based on your data structure

  // Função para determinar a variante do badge
  const getStatusBadgeVariant = (): "default" | "secondary" | "destructive" | "outline" => {
    if (!item.status) return 'secondary';
    const statusLower = item.status.toLowerCase();
    switch (statusLower) {
      case 'pago':
      case 'quitado':
      case 'concluído':
        return 'default'; // green
      case 'em_andamento':
      case 'parcial':
        return 'outline'; // blue
      case 'vencido':
      case 'atrasado':
        return 'destructive'; // red
      default:
        return 'secondary'; // gray
    }
  };

  // Determina o texto do badge
  const getStatusBadgeText = () => {
    return item.status ? item.status.replace('_', ' ').toUpperCase() : 'N/A';
  };

  return (
    <Card className="w-full h-full relative">
      <CardHeader className="pb-1 mb-0">
        <CardTitle className="text-lg mb-0 leading-tight">
          {partesDisplay || `Processo #${item.processoId || item.numero_processo || 'N/A'}`}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-1 space-y-2 text-sm pb-3">
        <p>
          <span className="font-semibold">Número do processo:</span>{' '}
          {numeroProcesso || 'Não informado'}
        </p>
        <p>
          <span className="font-semibold">Tipo:</span>{' '}
          {item.tipo.toUpperCase()}
        </p>
        <p>
          <span className="font-semibold">Direção:</span>{' '}
          {item.direcao?.toUpperCase() || 'N/A'}
        </p>
        <p>
          <span className="font-semibold">Valor Total:</span>{' '}
          {formatarValorMonetario(item.valorTotal || item.valor_total)}
        </p>
        <p>
          <span className="font-semibold">Honorários Sucumbenciais:</span>{' '}
          {formatarValorMonetario(item.honorariosSucumbenciaisTotal)}
        </p>

        <p>
          <span className="font-semibold">Parcelas:</span>{' '}
          {item.parcelasPagas || 0} / {item.numeroParcelas || 0}
        </p>
        <p>
          <span className="font-semibold">Primeiro Vencimento:</span>{' '}
          {formatarData(item.dataVencimentoPrimeiraParcela || undefined)}
        </p>
      </CardContent>
      <div className="absolute bottom-4 right-4">
        <Badge
          variant={getStatusBadgeVariant()}
          className="capitalize"
        >
          {getStatusBadgeText()}
        </Badge>
      </div>
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
