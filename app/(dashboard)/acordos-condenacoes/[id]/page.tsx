'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Edit, Trash2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ParcelasTable } from '../components/parcelas-table';
import { EditParcelaDialog } from '../components/edit-parcela-dialog';
import Link from 'next/link';
import { formatCurrency, formatDate } from '@/app/_lib/utils/utils';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyContent } from '@/components/ui/empty';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface Parcela {
  id: number;
  numeroParcela: number;
  dataVencimento: string;
  valor: number;
  status: string;
  dataPagamento?: string | null;
}

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
  percentualCliente?: number | null;
  percentualEscritorio?: number;
  honorariosSucumbenciaisTotal?: number;
  createdAt: string;
  updatedAt: string;
  parcelas?: Parcela[];
}

interface AcordoDetalhesPageProps {
  params: Promise<{ id: string }>;
}

export default function AcordoDetalhesPage({ params }: AcordoDetalhesPageProps) {
  const router = useRouter();
  const [acordo, setAcordo] = useState<AcordoCondenacao | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [acordoId, setAcordoId] = useState<number | null>(null);
  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    parcela: Parcela | null;
  }>({
    open: false,
    parcela: null,
  });

  useEffect(() => {
    async function resolveParams() {
      const resolvedParams = await params;
      const id = parseInt(resolvedParams.id, 10);
      setAcordoId(id);
    }
    resolveParams();
  }, [params]);

  useEffect(() => {
    if (acordoId !== null) {
      loadAcordo();
    }
  }, [acordoId]);

  const loadAcordo = async () => {
    if (acordoId === null) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/acordos-condenacoes/${acordoId}`);
      const result = await response.json();

      if (response.ok && result.success) {
        setAcordo(result.data);
      } else {
        setError(result.error || 'Erro ao carregar dados');
      }
    } catch (err) {
      setError('Erro ao comunicar com o servidor');
      console.error('Erro ao carregar acordo:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (acordoId === null) return;

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/acordos-condenacoes/${acordoId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success('Acordo/Condenação deletado com sucesso');
        router.push('/acordos-condenacoes');
      } else {
        toast.error(result.error || 'Erro ao deletar');
      }
    } catch (err) {
      toast.error('Erro ao comunicar com o servidor');
      console.error('Erro ao deletar:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditParcela = (parcela: Parcela) => {
    setEditDialog({ open: true, parcela });
  };

  const handleEditSuccess = () => {
    loadAcordo();
    setEditDialog({ open: false, parcela: null });
  };

  const getTipoLabel = (tipo: AcordoCondenacao['tipo']) => {
    const labels = {
      acordo: 'Acordo',
      condenacao: 'Condenação',
      custas_processuais: 'Custas Processuais',
    };
    return labels[tipo];
  };

  const getDirecaoLabel = (direcao: AcordoCondenacao['direcao']) => {
    const labels = {
      recebimento: 'Recebimento',
      pagamento: 'Pagamento',
    };
    return labels[direcao];
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
      <div className="container mx-auto py-8">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Loader2 className="h-6 w-6 animate-spin" />
            </EmptyMedia>
            <EmptyTitle>Carregando detalhes...</EmptyTitle>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  if (error || !acordo) {
    return (
      <div className="container mx-auto py-8">
        <Empty className="border-destructive">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </EmptyMedia>
            <EmptyTitle className="text-destructive">{error || 'Acordo não encontrado'}</EmptyTitle>
          </EmptyHeader>
          <EmptyContent>
            <Button
              variant="outline"
              onClick={() => router.push('/acordos-condenacoes')}
            >
              Voltar para Lista
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/acordos-condenacoes">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {getTipoLabel(acordo.tipo)}
              </h1>
              {getStatusBadge(acordo.status)}
            </div>
            <p className="text-muted-foreground">
              Processo #{acordo.processoId}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/acordos-condenacoes/${acordoId}/editar`}>
              <Edit className="h-4 w-4 mr-1" />
              Editar
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={isDeleting}>
                <Trash2 className="h-4 w-4 mr-1" />
                Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir este acordo/condenação? Esta ação não
                  pode ser desfeita e todas as parcelas serão removidas.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  Confirmar Exclusão
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Detalhes do Acordo */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">Detalhes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Tipo</p>
            <p className="font-medium">{getTipoLabel(acordo.tipo)}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-1">Direção</p>
            <p className="font-medium">{getDirecaoLabel(acordo.direcao)}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-1">Valor Total</p>
            <p className="font-medium text-lg">{formatCurrency(acordo.valorTotal)}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-1">Número de Parcelas</p>
            <p className="font-medium">{acordo.numeroParcelas}x</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-1">Primeira Parcela</p>
            <p className="font-medium">
              {formatDate(acordo.dataVencimentoPrimeiraParcela)}
            </p>
          </div>

          {acordo.formaDistribuicao && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Forma de Distribuição</p>
              <p className="font-medium capitalize">{acordo.formaDistribuicao}</p>
            </div>
          )}

          {acordo.percentualEscritorio !== undefined && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Percentual Escritório
              </p>
              <p className="font-medium">{acordo.percentualEscritorio}%</p>
            </div>
          )}

          {acordo.percentualCliente !== undefined && acordo.percentualCliente !== null && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Percentual Cliente</p>
              <p className="font-medium">{acordo.percentualCliente}%</p>
            </div>
          )}

          {acordo.honorariosSucumbenciaisTotal !== undefined &&
            acordo.honorariosSucumbenciaisTotal > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Honorários Sucumbenciais
                </p>
                <p className="font-medium">
                  {formatCurrency(acordo.honorariosSucumbenciaisTotal)}
                </p>
              </div>
            )}

          <div>
            <p className="text-sm text-muted-foreground mb-1">Criado em</p>
            <p className="font-medium">{formatDate(acordo.createdAt)}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-1">Atualizado em</p>
            <p className="font-medium">{formatDate(acordo.updatedAt)}</p>
          </div>
        </div>
      </div>

      {/* Parcelas */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">Parcelas</h2>
        <ParcelasTable
          parcelas={acordo.parcelas || []}
          direcao={acordo.direcao}
          onParcelaUpdated={loadAcordo}
          acordoCondenacaoId={acordo.id}
          onEdit={handleEditParcela}
        />
      </div>

      {/* Edit Parcela Dialog */}
      {editDialog.parcela && acordoId && (
        <EditParcelaDialog
          open={editDialog.open}
          onOpenChange={(open) =>
            setEditDialog((prev) => ({ ...prev, open }))
          }
          parcela={editDialog.parcela}
          acordoCondenacaoId={acordoId}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}
