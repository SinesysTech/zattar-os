'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useObrigacoes } from "@/features/financeiro/hooks/use-obrigacoes";
import { formatDate, formatCurrency } from "@/lib/formatters";
import type { ParcelaObrigacao } from "@/features/financeiro/domain/obrigacoes";

// ============================================================================
// Helper Functions
// ============================================================================

function getStatusLabel(status: ParcelaObrigacao['status']): string {
  const labels: Record<ParcelaObrigacao['status'], string> = {
    pendente: 'Pendente',
    recebida: 'Recebida',
    paga: 'Paga',
    atrasada: 'Atrasada',
    cancelada: 'Cancelada',
  };
  return labels[status] || status;
}

function getStatusVariant(status: ParcelaObrigacao['status']): "default" | "destructive" | "outline" | "secondary" {
  if (status === 'pendente' || status === 'atrasada') return 'destructive';
  if (status === 'recebida' || status === 'paga') return 'default';
  return 'outline';
}

function getTipoLabel(parcela: ParcelaObrigacao): string {
  // Se tiver lançamento com descrição, usar ela
  if (parcela.lancamento?.descricao) {
    return parcela.lancamento.descricao;
  }
  
  // Caso contrário, criar descrição baseada na parcela
  return `Parcela ${parcela.numeroParcela} - Acordo #${parcela.acordoId}`;
}

function getTipoBadge(parcela: ParcelaObrigacao): string {
  // Se tiver lançamento, usar tipo do lançamento
  if (parcela.lancamento) {
    return parcela.lancamento.tipo === 'receita' ? 'Receita' : 'Despesa';
  }
  
  // Caso contrário, usar "Parcela"
  return 'Parcela';
}

// ============================================================================
// Component
// ============================================================================

export function ObrigacoesRecentesCard() {
  const { obrigacoes, isLoading, error } = useObrigacoes({
    limite: 5,
    pagina: 1,
  });

  // Ordenar por data de vencimento (mais próximas primeiro)
  const obrigacoesOrdenadas = obrigacoes
    .slice()
    .sort((a, b) => {
      const dataA = new Date(a.dataVencimento).getTime();
      const dataB = new Date(b.dataVencimento).getTime();
      return dataA - dataB;
    })
    .slice(0, 5);

  if (isLoading) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Obrigações Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Erro ao carregar obrigações: {error}</p>
        </CardContent>
      </Card>
    );
  }

  if (obrigacoesOrdenadas.length === 0) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Obrigações Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Nenhuma obrigação encontrada.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Obrigações Recentes</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/financeiro/obrigacoes">
            Ver todas
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {obrigacoesOrdenadas.map((ob) => (
              <TableRow key={ob.id}>
                <TableCell className="font-medium">{getTipoLabel(ob)}</TableCell>
                <TableCell>
                  <Badge variant="outline">{getTipoBadge(ob)}</Badge>
                </TableCell>
                <TableCell>{formatCurrency(ob.valor)}</TableCell>
                <TableCell>{formatDate(ob.dataVencimento)}</TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(ob.status)}>
                    {getStatusLabel(ob.status)}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
