/**
 * Componente de Detalhes do Usuário (Client Component)
 *
 * Exibe dados completos do usuário e matriz de permissões.
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, AlertCircle, Loader2, Save, User, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

interface Usuario {
  id: number;
  nome: string;
  email: string;
  cpf: string | null;
  telefone: string | null;
  numero_oab: string | null;
  uf_oab: string | null;
  is_super_admin: boolean;
  ativo: boolean;
  cargo_id: number | null;
  cargo?: {
    nome: string;
    descricao: string | null;
  } | null;
}

interface Permissao {
  recurso: string;
  operacao: string;
  permitido: boolean;
}

interface PermissoesData {
  usuario_id: number;
  is_super_admin: boolean;
  permissoes: Permissao[];
}

interface UsuarioDetalhesProps {
  id: number;
}

// Recursos e suas operações disponíveis
const RECURSOS_CONFIG: Record<string, string[]> = {
  advogados: ['listar', 'visualizar', 'criar', 'editar', 'deletar'],
  credenciais: ['listar', 'visualizar', 'criar', 'editar', 'deletar'],
  acervo: ['listar', 'visualizar', 'criar', 'editar', 'deletar', 'atribuir_responsavel'],
  audiencias: ['listar', 'visualizar', 'criar', 'editar', 'deletar', 'atribuir_responsavel'],
  pendentes: ['listar', 'visualizar', 'criar', 'editar', 'deletar', 'baixar'],
  expedientes: ['listar', 'visualizar', 'criar', 'editar', 'deletar', 'baixar'],
  clientes: ['listar', 'visualizar', 'criar', 'editar', 'deletar'],
  contratos: ['listar', 'visualizar', 'criar', 'editar', 'deletar'],
  processos: ['listar', 'visualizar', 'criar', 'editar', 'deletar'],
  captura: ['executar', 'visualizar_historico', 'deletar_historico'],
  agendamentos: ['listar', 'visualizar', 'criar', 'editar', 'deletar', 'executar'],
  usuarios: ['listar', 'visualizar', 'criar', 'editar', 'deletar', 'gerenciar_permissoes'],
  cargos: ['listar', 'visualizar', 'criar', 'editar', 'deletar', 'atribuir'],
};

const RECURSO_LABELS: Record<string, string> = {
  advogados: 'Advogados',
  credenciais: 'Credenciais',
  acervo: 'Acervo',
  audiencias: 'Audiências',
  pendentes: 'Pendentes',
  expedientes: 'Expedientes',
  clientes: 'Clientes',
  contratos: 'Contratos',
  processos: 'Processos',
  captura: 'Captura',
  agendamentos: 'Agendamentos',
  usuarios: 'Usuários',
  cargos: 'Cargos',
};

const OPERACAO_LABELS: Record<string, string> = {
  listar: 'Listar',
  visualizar: 'Visualizar',
  criar: 'Criar',
  editar: 'Editar',
  deletar: 'Deletar',
  atribuir_responsavel: 'Atribuir',
  baixar: 'Baixar',
  executar: 'Executar',
  visualizar_historico: 'Ver Histórico',
  deletar_historico: 'Del. Histórico',
  gerenciar_permissoes: 'Ger. Permissões',
  atribuir: 'Atribuir',
};

export function UsuarioDetalhes({ id }: UsuarioDetalhesProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [permissoesData, setPermissoesData] = useState<PermissoesData | null>(null);
  const [permissoesMap, setPermissoesMap] = useState<Map<string, boolean>>(new Map());
  const [permissoesOriginais, setPermissoesOriginais] = useState<Map<string, boolean>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsuario();
  }, [id]);

  const fetchUsuario = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Buscar dados do usuário
      const usuarioResponse = await fetch(`/api/usuarios/${id}`);
      const usuarioResult = await usuarioResponse.json();

      if (!usuarioResponse.ok) {
        throw new Error(usuarioResult.error || 'Erro ao buscar usuário');
      }

      setUsuario(usuarioResult.data);

      // Buscar permissões
      const permissoesResponse = await fetch(`/api/permissoes/usuarios/${id}`);
      const permissoesResult = await permissoesResponse.json();

      if (!permissoesResponse.ok) {
        throw new Error(permissoesResult.error || 'Erro ao buscar permissões');
      }

      const permData = permissoesResult.data as PermissoesData;
      setPermissoesData(permData);

      // Criar mapa de permissões
      const map = new Map<string, boolean>();
      permData.permissoes.forEach((p) => {
        const key = `${p.recurso}.${p.operacao}`;
        map.set(key, p.permitido);
      });
      setPermissoesMap(map);
      setPermissoesOriginais(new Map(map));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePermissao = (recurso: string, operacao: string) => {
    if (permissoesData?.is_super_admin) {
      toast({
        title: 'Super Admin',
        description: 'Super Admins têm todas as permissões implicitamente.',
        variant: 'default',
      });
      return;
    }

    const key = `${recurso}.${operacao}`;
    const novoMapa = new Map(permissoesMap);
    novoMapa.set(key, !permissoesMap.get(key));
    setPermissoesMap(novoMapa);
  };

  const salvarPermissoes = async () => {
    if (!usuario) return;

    try {
      setIsSaving(true);

      // Construir array de permissões
      const permissoes: Array<{ recurso: string; operacao: string; permitido: boolean }> = [];

      Object.entries(RECURSOS_CONFIG).forEach(([recurso, operacoes]) => {
        operacoes.forEach((operacao) => {
          const key = `${recurso}.${operacao}`;
          permissoes.push({
            recurso,
            operacao,
            permitido: permissoesMap.get(key) || false,
          });
        });
      });

      const response = await fetch(`/api/permissoes/usuarios/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissoes }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao salvar permissões');
      }

      toast({
        title: 'Sucesso',
        description: 'Permissões atualizadas com sucesso',
      });

      // Atualizar permissões originais
      setPermissoesOriginais(new Map(permissoesMap));

      // Recarregar dados
      await fetchUsuario();
    } catch (err) {
      toast({
        title: 'Erro',
        description: err instanceof Error ? err.message : 'Erro ao salvar',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = () => {
    if (permissoesMap.size !== permissoesOriginais.size) return true;

    for (const [key, value] of permissoesMap.entries()) {
      if (permissoesOriginais.get(key) !== value) return true;
    }

    return false;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container max-w-6xl py-8 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/usuarios')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        </div>
        <Card className="p-12">
          <div className="flex items-center justify-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-base font-medium">Carregando dados do usuário...</p>
          </div>
        </Card>
      </div>
    );
  }

  // Error state
  if (error || !usuario) {
    return (
      <div className="container max-w-6xl py-8 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/usuarios')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Usuário</h1>
        </div>
        <Card className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro ao carregar usuário</AlertTitle>
            <AlertDescription>
              {error || 'Usuário não encontrado ou você não tem permissão para acessá-lo.'}
            </AlertDescription>
          </Alert>
          <div className="mt-6">
            <Button onClick={() => router.push('/usuarios')} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar para Usuários
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-8 space-y-6">
      {/* Header com breadcrumb */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/usuarios')}
          title="Voltar para Usuários"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">
            Usuários → {usuario.nome}
          </p>
          <h1 className="text-2xl font-bold">{usuario.nome}</h1>
        </div>
        {usuario.is_super_admin && (
          <Badge tone="danger" variant="solid" className="gap-1">
            <Shield className="h-3 w-3" />
            Super Admin
          </Badge>
        )}
        <Badge tone={usuario.ativo ? 'success' : 'neutral'} variant="soft">
          {usuario.ativo ? 'Ativo' : 'Inativo'}
        </Badge>
      </div>

      {/* Dados do Usuário */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" />
            Dados do Usuário
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">E-mail</p>
              <p className="text-sm">{usuario.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">CPF</p>
              <p className="text-sm">{usuario.cpf || '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Telefone</p>
              <p className="text-sm">{usuario.telefone || '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">OAB</p>
              <p className="text-sm">
                {usuario.numero_oab && usuario.uf_oab
                  ? `${usuario.numero_oab} / ${usuario.uf_oab}`
                  : '-'}
              </p>
            </div>
            {usuario.cargo && (
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-muted-foreground">Cargo</p>
                <p className="text-sm font-semibold">{usuario.cargo.nome}</p>
                {usuario.cargo.descricao && (
                  <p className="text-xs text-muted-foreground">{usuario.cargo.descricao}</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Matriz de Permissões */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4" />
              Matriz de Permissões
            </CardTitle>
            {hasChanges() && (
              <Button
                onClick={salvarPermissoes}
                disabled={isSaving}
                size="sm"
                className="gap-2"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Salvar Alterações
              </Button>
            )}
          </div>
          {usuario.is_super_admin && (
            <Alert className="mt-4">
              <Shield className="h-4 w-4" />
              <AlertTitle>Super Administrador</AlertTitle>
              <AlertDescription>
                Este usuário possui todas as permissões implicitamente. As permissões exibidas abaixo são apenas indicativas.
              </AlertDescription>
            </Alert>
          )}
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium text-sm">Recurso</th>
                  {Object.entries(RECURSOS_CONFIG).reduce<string[]>((acc, [_, operacoes]) => {
                    operacoes.forEach((op) => {
                      if (!acc.includes(op)) acc.push(op);
                    });
                    return acc;
                  }, []).map((operacao) => (
                    <th key={operacao} className="text-center p-2 font-medium text-xs">
                      {OPERACAO_LABELS[operacao] || operacao}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(RECURSOS_CONFIG).map(([recurso, operacoes]) => (
                  <tr key={recurso} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-medium text-sm">
                      {RECURSO_LABELS[recurso] || recurso}
                    </td>
                    {Object.entries(RECURSOS_CONFIG).reduce<string[]>((acc, [_, ops]) => {
                      ops.forEach((op) => {
                        if (!acc.includes(op)) acc.push(op);
                      });
                      return acc;
                    }, []).map((operacao) => {
                      const temOperacao = operacoes.includes(operacao);
                      const key = `${recurso}.${operacao}`;
                      const checked = permissoesMap.get(key) || false;

                      if (!temOperacao) {
                        return <td key={operacao} className="p-2 text-center">-</td>;
                      }

                      return (
                        <td key={operacao} className="p-2 text-center">
                          <div className="flex items-center justify-center">
                            <Checkbox
                              checked={checked}
                              onCheckedChange={() => togglePermissao(recurso, operacao)}
                              disabled={usuario.is_super_admin}
                            />
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
