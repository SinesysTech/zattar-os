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
import { ButtonGroup } from '@/components/ui/button-group';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Eye, Search, X, Loader2, AlertCircle, FileX } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from '@/components/ui/empty';

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
  acordos: AcordoCondenacao[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

export function AcordosCondenacoesList() {
  const router = useRouter();
  const [dados, setDados] = useState<ListagemResultado>({
    acordos: [],
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

  const limparFiltros = () => {
    setFiltros({
      tipo: '',
      direcao: '',
      status: '',
      processoId: '',
    });
  };

  const hasFiltrosAtivos = filtros.tipo || filtros.direcao || filtros.status || filtros.processoId;

  if (isLoading) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Loader2 className="h-6 w-6 animate-spin" />
          </EmptyMedia>
          <EmptyTitle>Carregando acordos e condenações...</EmptyTitle>
        </EmptyHeader>
      </Empty>
    );
  }

  if (error) {
    return (
      <Empty className="border-destructive">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </EmptyMedia>
          <EmptyTitle className="text-destructive">{error}</EmptyTitle>
        </EmptyHeader>
        <EmptyContent>
          <Button
            variant="outline"
            onClick={loadData}
          >
            Tentar Novamente
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">Filtros</h3>
          {hasFiltrosAtivos && (
            <Button
              variant="ghost"
              size="sm"
              onClick={limparFiltros}
            >
              <X className="h-4 w-4 mr-1" />
              Limpar Filtros
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Filtros</label>
            <ButtonGroup>
              <Select
                value={filtros.tipo || undefined}
                onValueChange={(value) =>
                  setFiltros((prev) => ({ ...prev, tipo: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="acordo">Acordo</SelectItem>
                  <SelectItem value="condenacao">Condenação</SelectItem>
                  <SelectItem value="custas_processuais">Custas</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filtros.direcao || undefined}
                onValueChange={(value) =>
                  setFiltros((prev) => ({ ...prev, direcao: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Direção" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recebimento">Recebimento</SelectItem>
                  <SelectItem value="pagamento">Pagamento</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filtros.status || undefined}
                onValueChange={(value) =>
                  setFiltros((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="pago_parcial">Pago Parcial</SelectItem>
                  <SelectItem value="pago_total">Pago Total</SelectItem>
                  <SelectItem value="atrasado">Atrasado</SelectItem>
                </SelectContent>
              </Select>
            </ButtonGroup>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Busca</label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground z-10" />
              <Input
                type="text"
                placeholder="Buscar por processo"
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
      {dados.acordos.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileX className="h-6 w-6" />
            </EmptyMedia>
            <EmptyTitle>Nenhum acordo ou condenação encontrado</EmptyTitle>
            <EmptyDescription>
              Use os filtros acima ou cadastre um novo registro
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
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
                {dados.acordos.map((acordo) => (
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
              Mostrando {dados.acordos.length} de {dados.total} registros
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
