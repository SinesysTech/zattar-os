'use client';

import { cn } from '@/lib/utils';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import { Separator } from '@/components/ui/separator';
import { useTransacaoDetalhes, useSugestoesConciliacao, conciliarManual, desconciliar } from '@/app/(authenticated)/financeiro';
import { toast } from 'sonner';
import { Text } from '@/components/ui/typography';

export default function TransacaoDetalhePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params.id);

  const { transacao, isLoading, refetch } = useTransacaoDetalhes(id);
  const { sugestoes } = useSugestoesConciliacao(id);

  const handleConciliar = async (lancamentoId: number | null) => {
    try {
      await conciliarManual({ transacaoImportadaId: id, lancamentoFinanceiroId: lancamentoId });
      toast.success(lancamentoId ? 'Conciliado com sucesso' : 'Marcado como ignorado');
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao conciliar');
    }
  };

  const handleDesconciliar = async () => {
    try {
      await desconciliar(id);
      toast.success('Transação desconciliada');
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao desconciliar');
    }
  };

  if (isLoading || !transacao) {
    return <div className={cn(/* design-system-escape: p-4 → migrar para <Inset variant="card-compact"> */ "p-4 text-body-sm text-muted-foreground")}>Carregando...</div>;
  }

  const status = transacao.conciliacao?.status || 'pendente';
  const tipoConciliacao = transacao.conciliacao?.tipoConciliacao || '-';
  const score = transacao.conciliacao?.scoreSimilaridade;

  return (
    <div className={cn(/* design-system-escape: space-y-4 → migrar para <Stack gap="default"> */ "space-y-4")}>
      <div className="flex items-center justify-between">
        <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ "flex items-center gap-3")}>
          <Button variant="ghost" onClick={() => router.push('/financeiro/conciliacao-bancaria')}>
            Voltar
          </Button>
          <Badge>{status}</Badge>
        </div>
        <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex gap-2")}>
          {status === 'conciliado' ? (
            <Button variant="outline" onClick={handleDesconciliar}>
              Desconciliar
            </Button>
          ) : (
            <Button onClick={() => handleConciliar(null)}>Marcar como Ignorado</Button>
          )}
        </div>
      </div>

      <div className={cn(/* design-system-escape: gap-4 → migrar para <Inline gap="default"> */ "grid gap-4 md:grid-cols-2")}>
        <Card className={cn(/* design-system-escape: p-4 → migrar para <Inset variant="card-compact">; space-y-2 → migrar para <Stack gap="tight"> */ "p-4 space-y-2")}>
          <p className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "text-body-sm font-medium")}>Dados da transação</p>
          <Separator />
          <p className={cn(/* design-system-escape: text-lg → migrar para <Text variant="body-lg">; font-semibold → className de <Text>/<Heading> */ "text-lg font-semibold")}>{transacao.descricao}</p>
          <p className={cn("text-body-sm text-muted-foreground")}>Valor: {transacao.valor}</p>
          <p className={cn("text-body-sm text-muted-foreground")}>Data: {transacao.dataTransacao}</p>
          <p className={cn("text-body-sm text-muted-foreground")}>Documento: {transacao.documento || '-'}</p>
        </Card>

        <Card className={cn(/* design-system-escape: p-4 → migrar para <Inset variant="card-compact">; space-y-2 → migrar para <Stack gap="tight"> */ "p-4 space-y-2")}>
          <p className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "text-body-sm font-medium")}>Conciliação</p>
          <Separator />
          <p className={cn("text-body-sm text-muted-foreground")}>Status: {status}</p>
          <p className={cn("text-body-sm text-muted-foreground")}>Tipo: {tipoConciliacao}</p>
          {score !== null && score !== undefined && (
            <p className={cn("text-body-sm text-muted-foreground")}>
              Score: {score}
            </p>
          )}
          {transacao.conciliacao?.observacoes && (
            <p className={cn("text-body-sm text-muted-foreground")}>{transacao.conciliacao.observacoes}</p>
          )}
          {transacao.lancamentoVinculado && (
            <div className={cn(/* design-system-escape: p-3 → usar <Inset> */ "rounded-md border p-3")}>
              <Text variant="caption" className="uppercase">Lançamento vinculado</Text>
              <p className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "text-body-sm font-medium")}>{transacao.lancamentoVinculado.descricao}</p>
            </div>
          )}
        </Card>
      </div>

      {status === 'pendente' && (
        <Card className={cn(/* design-system-escape: p-4 → migrar para <Inset variant="card-compact">; space-y-3 sem token DS */ "p-4 space-y-3")}>
          <div className="flex items-center justify-between">
            <p className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "text-body-sm font-medium")}>Sugestões de conciliação</p>
          </div>
          <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ "grid gap-3 md:grid-cols-2")}>
            {sugestoes?.map((s) => (
              <div key={s.lancamentoId} className={cn(/* design-system-escape: p-3 → usar <Inset>; space-y-2 → migrar para <Stack gap="tight"> */ "rounded-md border p-3 space-y-2")}>
                <div className="flex items-center justify-between">
                  <p className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "text-body-sm font-medium")}>{s.lancamento.descricao}</p>
                  <Badge>{Math.round(s.score)}%</Badge>
                </div>
                <Text variant="caption">
                  Valor {s.lancamento.valor} - Data {s.lancamento.dataLancamento}
                </Text>
                <Text variant="caption" className="flex gap-2 flex-wrap">
                  {s.diferencas?.map((d) => (
                    <Badge key={d} variant="outline">
                      {d}
                    </Badge>
                  ))}
                </Text>
                <Button size="sm" onClick={() => handleConciliar(s.lancamentoId)}>
                  Conciliar
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
