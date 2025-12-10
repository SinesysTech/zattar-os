'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { AprovarFolhaDialog } from '../components/aprovar-folha-dialog';
import { PagarFolhaDialog } from '../components/pagar-folha-dialog';
import {
  MESES_LABELS,
  STATUS_FOLHA_LABELS,
  STATUS_FOLHA_CORES,
} from '@/backend/types/financeiro/salarios.types';
import { useFolhaPagamento, cancelarFolha } from '@/core/app/_lib/hooks/use-folhas-pagamento';
import { toast } from 'sonner';

interface PageProps {
  params: Promise<{ id: string }>;
}

const formatCurrency = (valor: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor ?? 0);

export default function FolhaDetalhePage({ params }: PageProps) {
  const router = useRouter();
  const [dialogAprovar, setDialogAprovar] = React.useState(false);
  const [dialogPagar, setDialogPagar] = React.useState(false);
  const [folhaId, setFolhaId] = React.useState<number | null>(null);

  React.useEffect(() => {
    params.then((p) => setFolhaId(Number(p.id)));
  }, [params]);

  const { folha, isLoading, error, refetch } = useFolhaPagamento(folhaId);

  const cores = folha ? STATUS_FOLHA_CORES[folha.status] : undefined;

  const handleCancelar = async () => {
    if (!folhaId) return;
    if (!window.confirm('Deseja cancelar esta folha?')) return;

    const result = await cancelarFolha(folhaId, 'Cancelada via tela de detalhes');
    if (!result.success) {
      toast.error(result.error || 'Erro ao cancelar folha');
      return;
    }
    toast.success('Folha cancelada');
    refetch();
  };

  const handleAposAcao = () => {
    refetch();
  };

  if (isLoading || folhaId === null) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !folha) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center text-destructive">
        {error || 'Folha não encontrada'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            Folha {MESES_LABELS[folha.mesReferencia]}/{folha.anoReferencia}
          </h1>
          <p className="text-muted-foreground">
            Gerada em {new Date(folha.dataGeracao).toLocaleString('pt-BR')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            className={`${cores?.bg} ${cores?.text} border ${cores?.border}`}
            variant="outline"
          >
            {STATUS_FOLHA_LABELS[folha.status]}
          </Badge>
          {folha.status === 'rascunho' && (
            <Button onClick={() => setDialogAprovar(true)}>Aprovar</Button>
          )}
          {folha.status === 'aprovada' && (
            <Button onClick={() => setDialogPagar(true)}>Pagar</Button>
          )}
          {folha.status !== 'paga' && (
            <Button variant="outline" onClick={handleCancelar}>
              Cancelar
            </Button>
          )}
          <Button variant="ghost" onClick={() => router.push('/rh/folhas-pagamento')}>
            Voltar
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumo</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">Funcionários</p>
            <p className="text-xl font-semibold">{folha.totalFuncionarios}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Valor Total</p>
            <p className="text-xl font-semibold text-green-700">
              {formatCurrency(folha.valorTotal ?? 0)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Data de Pagamento</p>
            <p className="text-xl font-semibold">
              {folha.dataPagamento
                ? new Date(folha.dataPagamento).toLocaleDateString('pt-BR')
                : '-'}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Itens da Folha</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Funcionário</TableHead>
                <TableHead>Salário</TableHead>
                <TableHead>Valor Bruto</TableHead>
                <TableHead>Lançamento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {folha.itens.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.usuario?.nomeExibicao ?? item.usuarioId}</TableCell>
                  <TableCell>
                    {item.salario
                      ? formatCurrency(item.salario.salarioBruto)
                      : formatCurrency(item.valorBruto)}
                  </TableCell>
                  <TableCell>{formatCurrency(item.valorBruto)}</TableCell>
                  <TableCell>
                    {item.lancamentoFinanceiroId ? (
                      <a
                        className="text-primary underline"
                        href={`/financeiro/lancamentos/${item.lancamentoFinanceiroId}`}
                      >
                        #{item.lancamentoFinanceiroId}
                      </a>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AprovarFolhaDialog
        open={dialogAprovar}
        onOpenChange={setDialogAprovar}
        folhaId={folha.id}
        onSuccess={handleAposAcao}
      />

      <PagarFolhaDialog
        open={dialogPagar}
        onOpenChange={setDialogPagar}
        folhaId={folha.id}
        onSuccess={handleAposAcao}
      />
    </div>
  );
}
