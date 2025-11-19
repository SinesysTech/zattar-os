'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AcordoCondenacaoForm } from '../../components/acordo-condenacao-form';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyContent } from '@/components/ui/empty';

interface AcordoCondenacao {
  id: number;
  processoId: number;
  tipo: 'acordo' | 'condenacao' | 'custas_processuais';
  direcao: 'recebimento' | 'pagamento';
  valorTotal: number;
  numeroParcelas: number;
  dataVencimentoPrimeiraParcela: string;
  formaDistribuicao?: string | null;
  percentualEscritorio?: number;
  honorariosSucumbenciaisTotal?: number;
}

interface EditarAcordoCondenacaoPageProps {
  params: Promise<{ id: string }>;
}

export default function EditarAcordoCondenacaoPage({
  params,
}: EditarAcordoCondenacaoPageProps) {
  const router = useRouter();
  const [acordo, setAcordo] = useState<AcordoCondenacao | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acordoId, setAcordoId] = useState<number | null>(null);

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

  const handleSuccess = () => {
    // Redirecionar para detalhes do acordo após salvar
    router.push(`/acordos-condenacoes/${acordoId}`);
  };

  const handleCancel = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Loader2 className="h-6 w-6 animate-spin" />
            </EmptyMedia>
            <EmptyTitle>Carregando dados...</EmptyTitle>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  if (error || !acordo) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <Empty className="border-destructive">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </EmptyMedia>
            <EmptyTitle className="text-destructive">
              {error || 'Acordo não encontrado'}
            </EmptyTitle>
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
    <div className="container mx-auto py-8 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/acordos-condenacoes/${acordoId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Editar Acordo/Condenação
          </h1>
          <p className="text-muted-foreground">
            Atualize as informações do acordo/condenação
          </p>
        </div>
      </div>

      {/* Formulário */}
      <div className="rounded-lg border bg-card p-6">
        <AcordoCondenacaoForm
          acordoId={acordoId || undefined}
          initialData={{
            tipo: acordo.tipo,
            direcao: acordo.direcao,
            valorTotal: acordo.valorTotal,
            dataVencimentoPrimeiraParcela: acordo.dataVencimentoPrimeiraParcela,
            numeroParcelas: acordo.numeroParcelas,
            formaDistribuicao: acordo.formaDistribuicao,
            percentualEscritorio: acordo.percentualEscritorio,
            honorariosSucumbenciaisTotal: acordo.honorariosSucumbenciaisTotal,
          }}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
