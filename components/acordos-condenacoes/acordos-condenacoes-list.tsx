'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Eye, Search } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface AcordoCondenacao {
  id: number;
  processoId: number;
  tipo: 'acordo' | 'condenacao' | 'custas_processuais';
  direcao: 'recebimento' | 'pagamento';
  valorTotal: number;
  numeroParcelas: number;
  status: 'pendente' | 'pago_parcial' | 'pago_total' | 'atrasado';
  dataVencimentoPrimeiraParcela: string;
  formaDistribuicao?: string | null;
  createdAt: string;
}

interface ListagemResultado {
  itens: AcordoCondenacao[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

export function AcordosCondenacoesList() {
  const router = useRouter();
  const [dados, setDados] = useState<ListagemResultado>({
    itens: [],
    total: 0,
    pagina: 1,
    limite: 50,
    totalPaginas: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [filtros, setFiltros] = useState({
    tipo: '',
    direcao: '',
    status: '',
    processoId: '',
  });

  useEffect(() => {
    loadData();
  }, [filtros]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filtros.tipo) params.append('tipo', filtros.tipo);
      if (filtros.direcao) params.append('direcao', filtros.direcao);
      if (filtros.status) params.append('status', filtros.status);
      if (filtros.processoId) params.append('processoId', filtros.processoId);

      const url = `/api/acordos-condenacoes${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      const result = await response.json();

      if (response.ok && result.success) {
        setDados(result.data);
      } else {
        setError(result.error || 'Erro ao carregar dados');
      }
    } catch (err) {
      setError('Erro ao comunicar com o servidor');
      console.error('Erro ao carregar acordos:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getTipoBadge = (tipo: AcordoCondenacao['tipo']) => {
    const configs = {
      acordo: { label: 'Acordo', variant: 'default' as const },
      condenacao: { label: 'Condenação', variant: 'secondary' as const },
      custas_processuais: { label: 'Custas', variant: 'outline' as const },
    };
    const config = configs[tipo];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getDirecaoBadge = (direcao: AcordoCondenacao['direcao']) => {
    const configs = {
      recebimento: { label: 'Recebimento', variant: 'default' as const },
      pagamento: { label: 'Pagamento', variant: 'secondary' as const },
    };
    const config = configs[direcao];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusBadge = (status: AcordoCondenacao['status']) => {
    const configs = {
      pendente: { label: 'Pendente', variant: 'secondary' as const },
      pago_parcial: { label: 'Pago Parcial', variant: 'default' as const },
      pago_total: { label: 'Pago Total', variant: 'default' as const },
      atrasado: { label: 'Atrasado', variant: 'destructive' as const },
    };
    const config = configs[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Carregando acordos e condenações...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-destructive p-8 text-center">
        <p className="text-destructive font-medium">{error}</p>
        <Button
          variant="outline"
          onClick={loadData}
          className="mt-4"
        >
          Tentar Novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="rounded-lg border bg-card p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Tipo</label>
            <Select
              value={filtros.tipo}
              onValueChange={(value) =>
                setFiltros((prev) => ({ ...prev, tipo: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="acordo">Acordo</SelectItem>
                <SelectItem value="condenacao">Condenação</SelectItem>
                <SelectItem value="custas_processuais">Custas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Direção</label>
            <Select
              value={filtros.direcao}
              onValueChange={(value) =>
                setFiltros((prev) => ({ ...prev, direcao: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas</SelectItem>
                <SelectItem value="recebimento">Recebimento</SelectItem>
                <SelectItem value="pagamento">Pagamento</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Status</label>
            <Select
              value={filtros.status}
              onValueChange={(value) =>
                setFiltros((prev) => ({ ...prev, status: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="pago_parcial">Pago Parcial</SelectItem>
                <SelectItem value="pago_total">Pago Total</SelectItem>
                <SelectItem value="atrasado">Atrasado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Processo ID</label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar processo"
                value={filtros.processoId}
                onChange={(e) =>
                  setFiltros((prev) => ({ ...prev, processoId: e.target.value }))
                }
                className="pl-8"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabela */}
      {dados.itens.length === 0 ? (
        <div className="rounded-md border p-8 text-center text-muted-foreground">
          <p>Nenhum acordo ou condenação encontrado</p>
          <p className="text-sm mt-2">
            Use os filtros acima ou cadastre um novo registro
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Processo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Direção</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Parcelas</TableHead>
                  <TableHead>Primeira Parcela</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dados.itens.map((acordo) => (
                  <TableRow
                    key={acordo.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/acordos-condenacoes/${acordo.id}`)}
                  >
                    <TableCell className="font-medium">
                      {acordo.processoId}
                    </TableCell>
                    <TableCell>{getTipoBadge(acordo.tipo)}</TableCell>
                    <TableCell>{getDirecaoBadge(acordo.direcao)}</TableCell>
                    <TableCell>{formatCurrency(acordo.valorTotal)}</TableCell>
                    <TableCell>{acordo.numeroParcelas}x</TableCell>
                    <TableCell>
                      {formatDate(acordo.dataVencimentoPrimeiraParcela)}
                    </TableCell>
                    <TableCell>{getStatusBadge(acordo.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/acordos-condenacoes/${acordo.id}`);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver Detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Paginação Info */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>
              Mostrando {dados.itens.length} de {dados.total} registros
            </p>
            <p>
              Página {dados.pagina} de {dados.totalPaginas}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
