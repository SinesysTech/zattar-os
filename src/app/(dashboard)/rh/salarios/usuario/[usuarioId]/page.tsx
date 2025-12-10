'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSalariosDoUsuario } from '@/core/app/_lib/hooks/use-salarios';
import { calcularDuracaoVigencia } from '@/backend/types/financeiro/salarios.types';

interface PageProps {
  params: Promise<{ usuarioId: string }>;
}

const formatCurrency = (valor: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

export default function HistoricoSalarioPage({ params }: PageProps) {
  const [usuarioId, setUsuarioId] = React.useState<number | null>(null);

  React.useEffect(() => {
    params.then((p) => setUsuarioId(Number(p.usuarioId)));
  }, [params]);

  const { salarios, isLoading, error, refetch } = useSalariosDoUsuario({
    usuarioId: usuarioId ?? undefined,
    vigente: false,
  });

  if (usuarioId === null || isLoading) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">
        Carregando histórico salarial...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-destructive">
        {error}
      </div>
    );
  }

  const usuarioNome = salarios[0]?.usuario?.nomeExibicao ?? `Usuário ${usuarioId}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Histórico Salarial - {usuarioNome}</h1>
          <p className="text-muted-foreground">
            Acompanhe todas as alterações de salário deste funcionário.
          </p>
        </div>
        <button
          className="text-sm text-primary underline"
          type="button"
          onClick={() => refetch()}
        >
          Atualizar
        </button>
      </div>

      <div className="space-y-4">
        {salarios.map((salario) => {
          const vigente = !salario.dataFimVigencia;
          const duracao = calcularDuracaoVigencia(
            salario.dataInicioVigencia,
            salario.dataFimVigencia
          );
          return (
            <Card key={salario.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{formatCurrency(salario.salarioBruto)}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Vigência: {new Date(salario.dataInicioVigencia).toLocaleDateString('pt-BR')} {' '}
                    {salario.dataFimVigencia
                      ? `até ${new Date(salario.dataFimVigencia).toLocaleDateString('pt-BR')}`
                      : '(atual)'}
                  </p>
                </div>
                <Badge variant={vigente ? 'default' : 'secondary'}>
                  {vigente ? 'Vigente' : 'Encerrado'} · {duracao.texto}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Cargo: {salario.cargo?.nome ?? 'Não informado'}
                </p>
                {salario.observacoes && (
                  <p className="text-sm text-muted-foreground">Observações: {salario.observacoes}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
