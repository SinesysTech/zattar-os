/**
 * Componente de Visualização de Captura (Client Component)
 *
 * Exibe detalhes completos de uma captura com loading/error states.
 * Integra com sistema de recovery para análise de gaps e re-processamento.
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Trash2, AlertCircle, Loader2, Database, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import { ClientOnlyTabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/client-only-tabs';
import { RecoverySection } from './components/recovery-section';
import type { CapturaLog, TipoCaptura, StatusCaptura } from '@/backend/types/captura/capturas-log-types';

interface CapturaVisualizacaoProps {
  id: number;
}

const formatarDataHora = (dataISO: string | null): string => {
  if (!dataISO) return '-';
  try {
    const data = new Date(dataISO);
    return data.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return '-';
  }
};

const formatarTipoCaptura = (tipo: TipoCaptura): string => {
  const tipos: Record<TipoCaptura, string> = {
    acervo_geral: 'Acervo Geral',
    arquivados: 'Arquivados',
    audiencias: 'Audiências',
    pendentes: 'Pendentes',
    partes: 'Partes',
    combinada: 'Combinada',
  };
  return tipos[tipo] || tipo;
};

const StatusBadge = ({ status }: { status: StatusCaptura }) => {
  const statusConfig: Record<StatusCaptura, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
    pending: {
      label: 'Pendente',
      variant: 'secondary',
      className: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800'
    },
    in_progress: {
      label: 'Em Progresso',
      variant: 'secondary',
      className: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
    },
    completed: {
      label: 'Concluída',
      variant: 'secondary',
      className: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800'
    },
    failed: {
      label: 'Falhou',
      variant: 'destructive',
      className: 'bg-red-600 text-white border-red-600 dark:bg-red-700 dark:border-red-700'
    },
  };

  const config = statusConfig[status] || {
    label: status,
    variant: 'outline' as const,
    className: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
  };

  return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>;
};

/**
 * Conteúdo da aba Informações (dados do PostgreSQL)
 */
const InformacoesTab = ({ captura }: { captura: CapturaLog }) => (
  <div className="space-y-6">
    {/* Informações Básicas */}
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Informações Básicas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">ID</p>
            <p className="text-sm font-mono">#{captura.id}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Tipo de Captura</p>
            <p className="text-sm">{formatarTipoCaptura(captura.tipo_captura)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Status</p>
            <StatusBadge status={captura.status} />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Advogado ID</p>
            <p className="text-sm">{captura.advogado_id ? `#${captura.advogado_id}` : '-'}</p>
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Credenciais */}
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Credenciais Utilizadas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {captura.credencial_ids.map((id) => (
            <Badge key={id} variant="outline">
              Credencial #{id}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>

    {/* Datas */}
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Datas e Horários</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Iniciado Em</p>
            <p className="text-sm">{formatarDataHora(captura.iniciado_em)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Concluído Em</p>
            <p className="text-sm">{formatarDataHora(captura.concluido_em)}</p>
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Resultado */}
    {captura.resultado && (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Resultado</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-muted p-4 rounded-md overflow-x-auto max-h-[500px]">
            {JSON.stringify(captura.resultado, null, 2)}
          </pre>
        </CardContent>
      </Card>
    )}

    {/* Erro */}
    {captura.erro && (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-sm text-destructive">Erro</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{captura.erro}</p>
        </CardContent>
      </Card>
    )}
  </div>
);

export function CapturaVisualizacao({ id }: CapturaVisualizacaoProps) {
  const router = useRouter();
  const [captura, setCaptura] = useState<CapturaLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState('informacoes');

  useEffect(() => {
    // AbortController para cancelar requisições anteriores
    const abortController = new AbortController();

    const fetchCaptura = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/captura/historico/${id}`, {
          signal: abortController.signal,
        });
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Erro ao buscar captura');
        }

        // Verificar se a requisição foi abortada antes de atualizar o estado
        if (!abortController.signal.aborted) {
          setCaptura(result.data);
        }
      } catch (err) {
        // Ignorar erros de abort (AbortError)
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        // Só atualizar erro se a requisição não foi abortada
        if (!abortController.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Erro desconhecido');
        }
      } finally {
        // Só atualizar loading se a requisição não foi abortada
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchCaptura();

    // Cleanup: cancelar requisição quando o id mudar ou componente desmontar
    return () => {
      abortController.abort();
    };
  }, [id]);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/captura/historico/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao deletar captura');
      }

      // Redirecionar para listagem após sucesso
      router.push('/captura');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar');
      setIsDeleting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full py-8 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/captura')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        </div>
        <Card className="p-12">
          <div className="flex items-center justify-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-base font-medium">Carregando detalhes da captura...</p>
          </div>
        </Card>
      </div>
    );
  }

  // Error state
  if (error || !captura) {
    return (
      <div className="w-full py-8 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/captura')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Captura</h1>
        </div>
        <Card className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro ao carregar captura</AlertTitle>
            <AlertDescription>
              {error || 'Captura não encontrada ou você não tem permissão para acessá-la.'}
            </AlertDescription>
          </Alert>
          <div className="mt-6">
            <Button onClick={() => router.push('/captura')} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar para Histórico
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full py-8 space-y-6">
      {/* Header com breadcrumb */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/captura')}
            title="Voltar para Histórico"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <p className="text-sm text-muted-foreground">
              Captura • Histórico • #{captura.id}
            </p>
            <h1 className="text-2xl font-bold">Detalhes da Captura #{captura.id}</h1>
          </div>
        </div>

        {/* Botão deletar */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" disabled={isDeleting}>
              <Trash2 className="h-4 w-4 mr-2" />
              Deletar
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja deletar esta captura? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Deletar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Tabs de navegação */}
      <ClientOnlyTabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="informacoes" className="gap-2">
            <Database className="h-4 w-4" />
            Informações
          </TabsTrigger>
          <TabsTrigger value="recovery" className="gap-2">
            <Search className="h-4 w-4" />
            Logs MongoDB
          </TabsTrigger>
        </TabsList>

        <TabsContent value="informacoes">
          <InformacoesTab captura={captura} />
        </TabsContent>

        <TabsContent value="recovery">
          <RecoverySection capturaLogId={id} />
        </TabsContent>
      </ClientOnlyTabs>
    </div>
  );
}
