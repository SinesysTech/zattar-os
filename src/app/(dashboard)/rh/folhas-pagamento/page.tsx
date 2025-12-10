'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { GerarFolhaDialog } from './components/gerar-folha-dialog';
import { useFolhasPagamento } from '@/app/_lib/hooks/use-folhas-pagamento';
import { MESES_LABELS, STATUS_FOLHA_LABELS, STATUS_FOLHA_CORES } from '@/backend/types/financeiro/salarios.types';

const statusOptions = [
  { value: 'rascunho', label: STATUS_FOLHA_LABELS.rascunho },
  { value: 'aprovada', label: STATUS_FOLHA_LABELS.aprovada },
  { value: 'paga', label: STATUS_FOLHA_LABELS.paga },
  { value: 'cancelada', label: STATUS_FOLHA_LABELS.cancelada },
];

export default function FolhasPagamentoPage() {
  const router = useRouter();
  const [dialogAberto, setDialogAberto] = React.useState(false);
  const [pagina, setPagina] = React.useState(1);
  const [mesReferencia, setMesReferencia] = React.useState<number | undefined>(undefined);
  const [anoReferencia, setAnoReferencia] = React.useState<number | undefined>(undefined);
  const [status, setStatus] = React.useState<string | undefined>(undefined);

  const { folhas, paginacao, isLoading, error, refetch } = useFolhasPagamento({
    pagina,
    limite: 20,
    mesReferencia,
    anoReferencia,
    status,
  });

  const handleNovaFolha = React.useCallback(() => setDialogAberto(true), []);

  const handleGerada = React.useCallback(
    (folhaId?: number) => {
      refetch();
      setPagina(1);
      if (folhaId) {
        router.push(`/rh/folhas-pagamento/${folhaId}`);
      }
    },
    [refetch, router]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Folhas de Pagamento</h1>
          <p className="text-muted-foreground">Gerencie as folhas mensais e acompanhe o status.</p>
        </div>
        <Button onClick={handleNovaFolha}>Gerar Nova Folha</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <label className="text-sm text-muted-foreground">Mês</label>
            <Select
              value={mesReferencia?.toString() ?? ''}
              onValueChange={(value) =>
                setMesReferencia(value ? Number(value) : undefined)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                {Object.entries(MESES_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Ano</label>
            <Input
              type="number"
              placeholder="Ano"
              value={anoReferencia ?? ''}
              onChange={(e) =>
                setAnoReferencia(e.target.value ? Number(e.target.value) : undefined)
              }
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Status</label>
            <Select
              value={status ?? ''}
              onValueChange={(value) => setStatus(value || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button variant="ghost" onClick={() => { setMesReferencia(undefined); setAnoReferencia(undefined); setStatus(undefined); setPagina(1); }}>
              Limpar filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Folhas</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
              {error}
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Período</TableHead>
                <TableHead>Data Geração</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Funcionários</TableHead>
                <TableHead>Valor Total</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Carregando...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && folhas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Nenhuma folha encontrada
                  </TableCell>
                </TableRow>
              )}
              {folhas.map((folha) => {
                const cores = STATUS_FOLHA_CORES[folha.status];
                return (
                  <TableRow key={folha.id}>
                    <TableCell>
                      {MESES_LABELS[folha.mesReferencia]}/{folha.anoReferencia}
                    </TableCell>
                    <TableCell>
                      {new Date(folha.dataGeracao).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`${cores.bg} ${cores.text} border ${cores.border}`}
                        variant="outline"
                      >
                        {STATUS_FOLHA_LABELS[folha.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>{folha.totalFuncionarios}</TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(folha.valorTotal ?? 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => router.push(`/rh/folhas-pagamento/${folha.id}`)}>
                        Detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {paginacao && paginacao.totalPaginas > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Página {paginacao.pagina} de {paginacao.totalPaginas}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pagina === 1}
                  onClick={() => setPagina((p) => Math.max(1, p - 1))}
                >
                  Anterior
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pagina === paginacao.totalPaginas}
                  onClick={() => setPagina((p) => Math.min(paginacao.totalPaginas, p + 1))}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <GerarFolhaDialog
        open={dialogAberto}
        onOpenChange={setDialogAberto}
        onSuccess={handleGerada}
      />
    </div>
  );
}
