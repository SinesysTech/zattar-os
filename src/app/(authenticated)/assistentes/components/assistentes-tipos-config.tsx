'use client';

import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Check, X, Settings} from 'lucide-react';
import {
  listarAssistentesTiposAction,
  criarAssistenteTipoAction,
  deletarAssistenteTipoAction,
  ativarAssistenteTipoAction,
} from '../actions';
import type { AssistenteTipoComRelacoes } from '../domain';

import { LoadingSpinner } from "@/components/ui/loading-state"
import { Text } from '@/components/ui/typography';
interface AssistentesTiposConfigProps {
  assistentes: Array<{ id: string; nome: string; tipo: string }>;
  tiposExpedientes: Array<{ id: string; nome: string }>;
}

export function AssistentesTiposConfig({
  assistentes,
  tiposExpedientes,
}: AssistentesTiposConfigProps) {
  const [relacoes, setRelacoes] = useState<AssistenteTipoComRelacoes[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Formulário
  const [assistenteId, setAssistenteId] = useState<string>('');
  const [tipoExpedienteId, setTipoExpedienteId] = useState<string>('');

  useEffect(() => {
    carregarRelacoes();
  }, []);

  const carregarRelacoes = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await listarAssistentesTiposAction({});

      if (result.success && result.data) {
        setRelacoes(result.data.data);
      } else if (!result.success) {
        setError(result.message);
      }
    } catch (err) {
      setError('Erro ao carregar configurações');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCriar = async () => {
    if (!assistenteId || !tipoExpedienteId) {
      setError('Selecione um assistente e um tipo de expediente');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const result = await criarAssistenteTipoAction({
        assistente_id: Number(assistenteId),
        tipo_expediente_id: Number(tipoExpedienteId),
      });

      if (result.success && result.data) {
        setSuccess('Configuração criada com sucesso!');
        setAssistenteId('');
        setTipoExpedienteId('');
        await carregarRelacoes();
      } else if (!result.success) {
        setError(result.message);
      }
    } catch (err) {
      setError('Erro ao criar configuração');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeletar = async (id: number) => {
    if (!confirm('Deseja realmente deletar esta configuração?')) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const result = await deletarAssistenteTipoAction({ id });

      if (result.success) {
        setSuccess('Configuração deletada com sucesso!');
        await carregarRelacoes();
      } else if (!result.success) {
        setError(result.message);
      }
    } catch (err) {
      setError('Erro ao deletar configuração');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAtivo = async (id: number, ativo: boolean) => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const result = await ativarAssistenteTipoAction({ id });

      if (result.success && result.data) {
        setSuccess(`Configuração ${ativo ? 'ativada' : 'desativada'} com sucesso!`);
        await carregarRelacoes();
      } else if (!result.success) {
        setError(result.message);
      }
    } catch (err) {
      setError('Erro ao atualizar configuração');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const assistentesFiltrados = assistentes.filter(
    (a) => !relacoes.some((r) => r.assistente_id === Number(a.id))
  );

  const tiposExpedientesFiltrados = tiposExpedientes.filter(
    (t) => !relacoes.some((r) => r.tipo_expediente_id === Number(t.id) && r.ativo)
  );

  if (loading) {
    return (
      <Card>
        <CardContent className={cn(/* design-system-escape: p-12 → usar <Inset> */ "flex items-center justify-center p-12")}>
          <LoadingSpinner className="size-8 text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("stack-loose")}>
      {/* Mensagens */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert>
          <AlertDescription className="text-success">{success}</AlertDescription>
        </Alert>
      )}

      {/* Formulário de Criação */}
      <Card>
        <CardHeader>
          <CardTitle className={cn("flex items-center inline-tight")}>
            <Settings className="h-5 w-5" />
            Nova Configuração
          </CardTitle>
          <CardDescription>
            Configure qual assistente será usado para gerar automaticamente peças de um
            tipo de expediente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className={cn("grid inline-default md:grid-cols-3")}>
            <div className={cn("stack-tight")}>
              <label className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "text-body-sm font-medium")}>Assistente</label>
              <Select value={assistenteId} onValueChange={setAssistenteId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o assistente" />
                </SelectTrigger>
                <SelectContent>
                  {assistentesFiltrados.map((assistente) => (
                    <SelectItem key={assistente.id} value={String(assistente.id)}>
                      <span className={cn("flex items-center inline-tight")}>
                        {assistente.nome}
                        <Text variant="caption">({assistente.tipo})</Text>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className={cn("stack-tight")}>
              <label className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "text-body-sm font-medium")}>Tipo de Expediente</label>
              <Select value={tipoExpedienteId} onValueChange={setTipoExpedienteId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {tiposExpedientesFiltrados.map((tipo) => (
                    <SelectItem key={tipo.id} value={tipo.id}>
                      {tipo.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={handleCriar}
                disabled={saving || !assistenteId || !tipoExpedienteId}
                className="w-full"
              >
                {saving ? (
                  <>
                    <LoadingSpinner className="mr-2" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Configuração
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Configurações */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações Existentes</CardTitle>
          <CardDescription>
            {relacoes.length === 0
              ? 'Nenhuma configuração criada ainda'
              : `${relacoes.length} configuração(ões)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {relacoes.length === 0 ? (
            <div className={cn(/* design-system-escape: py-8 padding direcional sem Inset equiv. */ "text-center py-8 text-muted-foreground")}>
              <p>Nenhuma configuração encontrada.</p>
              <p className={cn("text-body-sm mt-2")}>
                Crie uma configuração para habilitar a geração automática de peças.
              </p>
            </div>
          ) : (
            <div className={cn(/* design-system-escape: space-y-3 sem token DS */ "space-y-3")}>
              {relacoes.map((relacao) => (
                <div
                  key={relacao.id}
                  className={cn("flex items-center justify-between inset-card-compact border rounded-lg")}
                >
                  <div className={cn(/* design-system-escape: space-y-1 sem token DS */ "flex-1 space-y-1")}>
                    <div className={cn("flex items-center inline-tight")}>
                      <span className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "font-medium")}>{relacao.assistente_nome}</span>
                      {relacao.ativo ? (
                        <SemanticBadge category="status" value="success">
                          <Check className="h-3 w-3 mr-1" />
                          Ativo
                        </SemanticBadge>
                      ) : (
                        <SemanticBadge category="status" value="inactive">
                          <X className="h-3 w-3 mr-1" />
                          Inativo
                        </SemanticBadge>
                      )}
                    </div>
                    <p className={cn("text-body-sm text-muted-foreground")}>
                      Tipo de Expediente: <strong>{relacao.tipo_expediente_nome}</strong>
                    </p>
                    <Text variant="caption">
                      Criado em {new Date(relacao.created_at).toLocaleDateString('pt-BR')}
                    </Text>
                  </div>

                  <div className={cn("flex items-center inline-tight")}>
                    <Button
                      variant={relacao.ativo ? 'outline' : 'default'}
                      size="sm"
                      onClick={() => handleToggleAtivo(relacao.id, !relacao.ativo)}
                      disabled={saving}
                    >
                      {relacao.ativo ? 'Desativar' : 'Ativar'}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeletar(relacao.id)}
                      disabled={saving}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
