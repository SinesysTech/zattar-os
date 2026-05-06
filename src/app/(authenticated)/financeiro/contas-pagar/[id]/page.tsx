'use client';

/**
 * Página de Detalhes de Conta a Pagar
 */

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  cancelarConta,
  ContaPagarFormDialog,
  type AnexoLancamento,
  type ContaPagarComDetalhes,
  OrigemLancamentoSection,
  PagarContaDialog,
  type StatusContaPagar,
  useContaPagar,
  useContasBancarias,
} from '@/app/(authenticated)/financeiro';
import { Button } from '@/components/ui/button';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  CreditCard,
  XCircle,
  Pencil,
  Repeat,
  Calendar,
  DollarSign,
  Building2,
  FileText,
  Clock,
  AlertTriangle,
  Paperclip,
  ExternalLink,
  FileImage,
  File,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Text } from '@/components/ui/typography';

// ============================================================================
// Constantes
// ============================================================================

const STATUS_LABELS: Record<StatusContaPagar, string> = {
  pendente: 'Pendente',
  confirmado: 'Pago',
  pago: 'Pago',
  recebido: 'Recebido',
  cancelado: 'Cancelado',
  estornado: 'Estornado',
};

const formatarValor = (valor: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
};

const formatarData = (data: string | null): string => {
  if (!data) return '-';
  return format(new Date(data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
};

const formatarDataHora = (data: string | null): string => {
  if (!data) return '-';
  return format(new Date(data), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
};

// ============================================================================
// Componente de Item de Detalhe
// ============================================================================

function DetalheItem({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-start inline-medium', className)}>
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className={cn("stack-micro")}>
        <p className={cn("text-body-sm text-muted-foreground")}>{label}</p>
        <div className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "font-medium")}>{value}</div>
      </div>
    </div>
  );
}

// ============================================================================
// Componente Principal
// ============================================================================

export default function ContaPagarDetalhesPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id ? parseInt(params.id as string, 10) : 0;

  // Estados
  const [pagarDialogOpen, setPagarDialogOpen] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [cancelarDialogOpen, setCancelarDialogOpen] = React.useState(false);

  // Buscar dados
  const { conta, isLoading, error, refetch } = useContaPagar(id);
  const contaPagar = conta as ContaPagarComDetalhes | null;

  // Contas bancárias para os selects
  const { contasBancarias } = useContasBancarias();
  const contasBancariasForDialog = React.useMemo(
    () =>
      contasBancarias.map((c) => ({
        id: c.id,
        nome: c.nome,
        banco: c.banco ?? undefined,
      })),
    [contasBancarias]
  );

  const handleVoltar = () => {
    router.push('/financeiro/contas-pagar');
  };

  const handleConfirmCancelar = React.useCallback(async () => {
    try {
      // `cancelarConta` lança exception quando falha; em caso de sucesso retorna `success: true`.
      await cancelarConta(id);
      toast.success('Conta cancelada com sucesso');
      setCancelarDialogOpen(false);
      refetch();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao cancelar conta';
      toast.error(message);
    }
  }, [id, refetch]);

  // Verificar se conta está vencida
  const isVencida = React.useMemo(() => {
    if (!contaPagar || contaPagar.status !== 'pendente' || !contaPagar.dataVencimento) {
      return false;
    }
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    return new Date(contaPagar.dataVencimento) < hoje;
  }, [contaPagar]);

  // Loading state
  if (isLoading) {
    return (
      <div className={cn("stack-loose")}>
        <div className={cn("flex items-center inline-default")}>
          <Skeleton className="h-10 w-10" />
          <div className={cn("stack-tight")}>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <div className={cn("grid inline-loose md:grid-cols-2")}>
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn("stack-default")}>
        <Button variant="ghost" onClick={handleVoltar}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <div className={cn("rounded-md bg-destructive/15 inset-card-compact text-body-sm text-destructive")}>
          <p className={cn(/* design-system-escape: font-semibold → className de <Text>/<Heading> */ "font-semibold")}>Erro ao carregar conta:</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // Not found state
  if (!contaPagar) {
    return (
      <div className={cn("stack-default")}>
        <Button variant="ghost" onClick={handleVoltar}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <div className={cn(/* design-system-escape: p-8 → usar <Inset> */ "rounded-md bg-muted p-8 text-center")}>
          <p className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "text-body-lg font-medium")}>Conta não encontrada</p>
          <p className={cn("text-body-sm text-muted-foreground")}>
            A conta solicitada não existe ou foi removida.
          </p>
        </div>
      </div>
    );
  }

  const statusLabel = STATUS_LABELS[contaPagar.status];
  const isPendente = contaPagar.status === 'pendente';

  return (
    <div className={cn("stack-loose")}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className={cn("flex items-center inline-default")}>
          <Button variant="ghost" size="icon" aria-label="Voltar" onClick={handleVoltar}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <SemanticBadge category="payment_status" value={contaPagar.status}>
            {statusLabel}
          </SemanticBadge>
          {contaPagar.recorrente && (
            <Badge variant="outline">
              <Repeat className="mr-1 h-3 w-3" />
              Recorrente
            </Badge>
          )}
        </div>

        {/* Actions */}
        {isPendente && (
          <div className={cn("flex items-center inline-tight")}>
            <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Button>
            <Button variant="outline" onClick={() => setCancelarDialogOpen(true)}>
              <XCircle className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button onClick={() => setPagarDialogOpen(true)}>
              <CreditCard className="mr-2 h-4 w-4" />
              Pagar
            </Button>
          </div>
        )}
      </div>

      {/* Alert Vencida */}
      {isVencida && (
        <div className={cn("flex items-center inline-medium rounded-lg border border-destructive/50 bg-destructive/10 inset-card-compact")}>
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <div>
            <p className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "font-medium text-destructive")}>Conta Vencida</p>
            <p className={cn("text-body-sm text-destructive/80")}>
              Esta conta venceu em {formatarData(contaPagar.dataVencimento)}. Realize o pagamento o
              mais rápido possível.
            </p>
          </div>
        </div>
      )}

      {/* Origem do Lançamento (se aplicável) */}
      <OrigemLancamentoSection
        dadosAdicionais={contaPagar.dadosAdicionais}
        className="mb-6"
      />

      {/* Cards de detalhes */}
      <div className={cn("grid inline-loose md:grid-cols-2")}>
        {/* Informações Financeiras */}
        <Card>
          <CardHeader>
            <CardTitle className={cn("flex items-center inline-tight")}>
              <DollarSign className="h-5 w-5" />
              Informações Financeiras
            </CardTitle>
          </CardHeader>
          <CardContent className={cn("stack-default")}>
            <DetalheItem
              icon={DollarSign}
              label="Valor"
              value={
                <Text variant="kpi-value">
                  {formatarValor(contaPagar.valor)}
                </Text>
              }
            />
            <DetalheItem
              icon={Calendar}
              label="Data de Vencimento"
              value={
                <span className={cn(isVencida && 'text-destructive')}>
                  {formatarData(contaPagar.dataVencimento)}
                </span>
              }
            />
            {contaPagar.dataEfetivacao && (
              <DetalheItem
                icon={Calendar}
                label="Data de Pagamento"
                value={formatarData(contaPagar.dataEfetivacao)}
              />
            )}
            {contaPagar.formaPagamento && (
              <DetalheItem
                icon={CreditCard}
                label="Forma de Pagamento"
                value={contaPagar.formaPagamento}
              />
            )}
            {contaPagar.categoria && (
              <DetalheItem
                icon={FileText}
                label="Categoria"
                value={
                  <Badge variant="outline" className="capitalize">
                    {contaPagar.categoria.replace(/_/g, ' ')}
                  </Badge>
                }
              />
            )}
          </CardContent>
        </Card>

        {/* Informações de Vinculação */}
        <Card>
          <CardHeader>
            <CardTitle className={cn("flex items-center inline-tight")}>
              <Building2 className="h-5 w-5" />
              Vinculações
            </CardTitle>
          </CardHeader>
          <CardContent className={cn("stack-default")}>
            {contaPagar.fornecedor ? (
              <DetalheItem
                icon={Building2}
                label="Fornecedor"
                value={
                  <div>
                    <p className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "font-medium")}>
                      {contaPagar.fornecedor.nomeFantasia || contaPagar.fornecedor.razaoSocial}
                    </p>
                    {contaPagar.fornecedor.cnpj && (
                      <p className={cn("text-body-sm text-muted-foreground")}>
                        CNPJ: {contaPagar.fornecedor.cnpj}
                      </p>
                    )}
                  </div>
                }
              />
            ) : (
              <p className={cn("text-body-sm text-muted-foreground")}>Nenhum fornecedor vinculado</p>
            )}
            {contaPagar.contaContabil && (
              <DetalheItem
                icon={FileText}
                label="Conta Contábil"
                value={`${contaPagar.contaContabil.codigo} - ${contaPagar.contaContabil.nome}`}
              />
            )}
            {contaPagar.centroCusto && (
              <DetalheItem
                icon={Building2}
                label="Centro de Custo"
                value={`${contaPagar.centroCusto.codigo} - ${contaPagar.centroCusto.nome}`}
              />
            )}
            {contaPagar.contaBancaria && (
              <DetalheItem
                icon={CreditCard}
                label="Conta Bancária"
                value={contaPagar.contaBancaria.nome}
              />
            )}
            {contaPagar.documento && (
              <DetalheItem
                icon={FileText}
                label="Nº do Documento"
                value={contaPagar.documento}
              />
            )}
          </CardContent>
        </Card>

        {/* Observações */}
        {contaPagar.observacoes && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className={cn("flex items-center inline-tight")}>
                <FileText className="h-5 w-5" />
                Observações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={cn("whitespace-pre-wrap text-body-sm")}>{contaPagar.observacoes}</p>
            </CardContent>
          </Card>
        )}

        {/* Anexos */}
        {contaPagar.anexos && contaPagar.anexos.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className={cn("flex items-center inline-tight")}>
                <Paperclip className="h-5 w-5" />
                Anexos
              </CardTitle>
              <CardDescription>
                {contaPagar.anexos.length} arquivo{contaPagar.anexos.length !== 1 ? 's' : ''} anexado{contaPagar.anexos.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className={cn("grid inline-medium sm:grid-cols-2 lg:grid-cols-3")}>
                {contaPagar.anexos.map((anexo: AnexoLancamento, index: number) => {
                  const isImage = anexo.tipo?.startsWith('image/');
                  const isPdf = anexo.tipo === 'application/pdf';
                  const FileIcon = isImage ? FileImage : isPdf ? FileText : File;

                  return (
                    <a
                      key={index}
                      href={anexo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(/* design-system-escape: p-3 → usar <Inset> */ "flex items-center inline-medium rounded-lg border p-3 transition-colors hover:bg-muted/50")}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <FileIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "truncate text-body-sm font-medium")}>{anexo.nome}</p>
                        <Text variant="caption">
                          {anexo.tamanho
                            ? `${(anexo.tamanho / 1024).toFixed(1)} KB`
                            : 'Tamanho desconhecido'}
                        </Text>
                      </div>
                      <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </a>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Informações de Auditoria */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className={cn("flex items-center inline-tight")}>
              <Clock className="h-5 w-5" />
              Auditoria
            </CardTitle>
            <CardDescription>Informações de criação e atualização</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={cn("grid inline-default sm:grid-cols-3")}>
              <DetalheItem
                icon={Calendar}
                label="Data de Lançamento"
                value={formatarData(contaPagar.dataLancamento)}
              />
              <DetalheItem
                icon={Clock}
                label="Criado em"
                value={formatarDataHora(contaPagar.createdAt)}
              />
              <DetalheItem
                icon={Clock}
                label="Atualizado em"
                value={formatarDataHora(contaPagar.updatedAt)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <PagarContaDialog
        open={pagarDialogOpen}
        onOpenChange={setPagarDialogOpen}
        conta={contaPagar}
        contasBancarias={contasBancariasForDialog}
        onSuccess={refetch}
      />

      <ContaPagarFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        conta={contaPagar}
        contasBancarias={contasBancariasForDialog}
        onSuccess={refetch}
      />

      <AlertDialog open={cancelarDialogOpen} onOpenChange={setCancelarDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Conta a Pagar</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar esta conta?
              <span className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "block mt-2 font-medium text-foreground")}>
                {contaPagar.descricao} - {formatarValor(contaPagar.valor)}
              </span>
              <span className="block mt-2 text-warning">
                A conta será marcada como cancelada mas permanecerá no histórico.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCancelar}>
              Cancelar Conta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
