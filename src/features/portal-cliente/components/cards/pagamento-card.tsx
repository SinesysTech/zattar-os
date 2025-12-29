import React from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { AppBadge } from "@/components/ui/app-badge";
import { Button } from "@/components/ui/button";
import { PagamentoPortal } from "../../types";

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

// Função para formatar data
const formatarData = (dataString: string | undefined): string => {
  if (!dataString) return 'Não informado';
  try {
    return new Date(dataString).toLocaleDateString('pt-BR');
  } catch {
    return dataString;
  }
};

interface PagamentoCardProps {
  item: PagamentoPortal;
  numeroProcesso?: string; // Enriched
  partesDisplay?: string; // Enriched
  onClick?: () => void;
  actions?: React.ReactNode;
}

export const PagamentoCard: React.FC<PagamentoCardProps> = ({ item, numeroProcesso, partesDisplay, onClick, actions }) => {

  // Determina a cor do badge com base no status
  const getStatusBadgeVariant = () => {
    switch (item.status) {
      case 'pago_total':
      case 'pago_parcial':
        return 'default'; // primary/green-ish usually
      case 'atrasado':
        return 'destructive';
      default:
        return 'secondary'; // gray
    }
  };

  // Determina o texto do badge
  const getStatusBadgeText = () => {
    return item.status.replace('_', ' ').toUpperCase();
  };

  return (
    <Card className="w-full h-full relative">
      <CardHeader className="pb-1 mb-0">
        <CardTitle className="text-lg mb-0 leading-tight">
          {partesDisplay || `Processo #${item.processoId}`}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-1 space-y-2 text-sm pb-3">
        <p>
          <span className="font-semibold">Número do processo:</span>{' '}
          {numeroProcesso || 'Não informado'}
        </p>
        <p>
          <span className="font-semibold">Tipo:</span>{' '}
          {(item.tipo as string)?.toUpperCase() || 'N/A'}
        </p>
        <p>
          <span className="font-semibold">Direção:</span>{' '}
          {(item.direcao as string)?.toUpperCase() || 'N/A'}
        </p>
        <p>
          <span className="font-semibold">Valor Total:</span>{' '}
          {formatarValorMonetario(item.valorTotal)}
        </p>
        <p>
          <span className="font-semibold">Honorários Sucumbenciais:</span>{' '}
          {formatarValorMonetario(item.honorariosSucumbenciaisTotal)}
        </p>

        <p>
          <span className="font-semibold">Parcelas:</span>{' '}
          {item.parcelasPagas} / {item.numeroParcelas}
        </p>
        <p>
          <span className="font-semibold">Primeiro Vencimento:</span>{' '}
          {formatarData(item.dataVencimentoPrimeiraParcela)}
        </p>
      </CardContent>
      <div className="absolute bottom-4 right-4">
        <AppBadge
          variant={getStatusBadgeVariant()}
          className="capitalize"
        >
          {getStatusBadgeText()}
        </AppBadge>
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
