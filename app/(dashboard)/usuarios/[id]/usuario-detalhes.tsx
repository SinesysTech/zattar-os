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
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
// import { useToast } from '@/hooks/use-toast'; // TODO: Implementar hook de toast

// Importar tipos do backend
import type { GeneroUsuario, Endereco } from '@/backend/usuarios/services/persistence/usuario-persistence.service';

interface Usuario {
  id: number;
  authUserId: string | null;
  nomeCompleto: string;
  nomeExibicao: string;
  cpf: string;
  rg: string | null;
  dataNascimento: string | null;
  genero: GeneroUsuario | null;
  oab: string | null;
  ufOab: string | null;
  emailPessoal: string | null;
  emailCorporativo: string;
  telefone: string | null;
  ramal: string | null;
  endereco: Endereco | null;
  cargoId: number | null;
  cargo?: {
    id: number;
    nome: string;
    descricao: string | null;
  } | null;
  isSuperAdmin: boolean;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
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

// Importar matriz de permissões do backend
import { MATRIZ_PERMISSOES, type Operacao } from '@/backend/types/permissoes/types';

// Usar a matriz oficial do backend
const RECURSOS_CONFIG = MATRIZ_PERMISSOES;

const RECURSO_LABELS: Record<string, string> = {
  advogados: 'Advogados',
  credenciais: 'Credenciais',
  acervo: 'Acervo',
  audiencias: 'Audiências',
  pendentes: 'Pendentes',
  expedientes_manuais: 'Expedientes Manuais',
  usuarios: 'Usuários',
  clientes: 'Clientes',
  partes_contrarias: 'Partes Contrárias',
  terceiros: 'Terceiros',
  representantes: 'Representantes',
  enderecos: 'Endereços',
  contratos: 'Contratos',
  processo_partes: 'Processo Partes',
  acordos_condenacoes: 'Acordos e Condenações',
  parcelas: 'Parcelas',
  agendamentos: 'Agendamentos',
  captura: 'Captura',
  tipos_expedientes: 'Tipos de Expedientes',
  cargos: 'Cargos',
};

const OPERACAO_LABELS: Record<string, string> = {
  listar: 'Listar',
  visualizar: 'Visualizar',
  criar: 'Criar',
  editar: 'Editar',
  deletar: 'Deletar',
  atribuir_responsavel: 'Atribuir Resp.',
  desatribuir_responsavel: 'Desatribuir Resp.',
  transferir_responsavel: 'Transferir Resp.',
  editar_url_virtual: 'Editar URL Virtual',
  baixar_expediente: 'Baixar Expediente',
  reverter_baixa: 'Reverter Baixa',
  editar_tipo_descricao: 'Editar Tipo/Desc.',
  ativar_desativar: 'Ativar/Desativar',
  gerenciar_permissoes: 'Ger. Permissões',
  sincronizar: 'Sincronizar',
  associar_processo: 'Associar Processo',
  desassociar_processo: 'Desassociar Proc.',
  vincular_parte: 'Vincular Parte',
  desvincular_parte: 'Desvincular Parte',
  gerenciar_parcelas: 'Ger. Parcelas',
  receber_pagamento: 'Receber Pagamento',
  pagar: 'Pagar',
  registrar_repasse: 'Registrar Repasse',
  editar_valores: 'Editar Valores',
  marcar_como_recebida: 'Marcar Recebida',
  marcar_como_paga: 'Marcar Paga',
  anexar_comprovante: 'Anexar Comprov.',
  executar: 'Executar',
  executar_acervo_geral: 'Exec. Acervo',
  executar_arquivados: 'Exec. Arquivados',
  executar_audiencias: 'Exec. Audiências',
  executar_pendentes: 'Exec. Pendentes',
  visualizar_historico: 'Ver Histórico',
  gerenciar_credenciais: 'Ger. Credenciais',
};

export function UsuarioDetalhes({ id }: UsuarioDetalhesProps) {
  const router = useRouter();
  // const { toast } = useToast(); // TODO: Implementar hook de toast
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [permissoesData, setPermissoesData] = useState<PermissoesData | null>(null);
  const [permissoesMap, setPermissoesMap] = useState<Map<string, boolean>>(new Map());
  const [permissoesOriginais, setPermissoesOriginais] = useState<Map<string, boolean>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usuarioLogado, setUsuarioLogado] = useState<Usuario | null>(null);
  const [isSuperAdminLocal, setIsSuperAdminLocal] = useState(false);
  const [isSavingSuperAdmin, setIsSavingSuperAdmin] = useState(false);

  useEffect(() => {
    fetchUsuario();
    fetchUsuarioLogado();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setIsSuperAdminLocal(usuarioResult.data.isSuperAdmin);

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

  const fetchUsuarioLogado = async () => {
    try {
      // Buscar dados do usuário logado através do endpoint /api/perfil
      const response = await fetch('/api/perfil');
      if (response.ok) {
        const result = await response.json();
        setUsuarioLogado(result.data);
      }
    } catch (err) {
      console.error('Erro ao buscar usuário logado:', err);
    }
  };

  const salvarSuperAdmin = async (novoValor: boolean) => {
    if (!usuario || !usuarioLogado) return;

    // Validação: usuário não pode remover seu próprio status
    if (usuario.id === usuarioLogado.id && !novoValor) {
      alert('Você não pode remover seu próprio status de Super Admin');
      return;
    }

    try {
      setIsSavingSuperAdmin(true);

      const response = await fetch(`/api/usuarios/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isSuperAdmin: novoValor }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao alterar status de Super Admin');
      }

      // Atualizar estado local
      setIsSuperAdminLocal(novoValor);
      setUsuario({ ...usuario, isSuperAdmin: novoValor });

      // Recarregar permissões se o status mudou
      await fetchUsuario();

      console.log(`Status de Super Admin alterado para: ${novoValor}`);
    } catch (err) {
      console.error('Erro ao salvar Super Admin:', err);
      alert(err instanceof Error ? err.message : 'Erro ao salvar');
      // Reverter mudança local
      setIsSuperAdminLocal(usuario.isSuperAdmin);
    } finally {
      setIsSavingSuperAdmin(false);
    }
  };

  const togglePermissao = (recurso: string, operacao: string) => {
    if (permissoesData?.is_super_admin) {
      // TODO: Implementar toast
      // toast({
      //   title: 'Super Admin',
      //   description: 'Super Admins têm todas as permissões implicitamente.',
      //   variant: 'default',
      // });
      console.log('Super Admin: Super Admins têm todas as permissões implicitamente.');
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

      // TODO: Implementar toast
      // toast({
      //   title: 'Sucesso',
      //   description: 'Permissões atualizadas com sucesso',
      // });
      console.log('Sucesso: Permissões atualizadas com sucesso');

      // Atualizar permissões originais
      setPermissoesOriginais(new Map(permissoesMap));

      // Recarregar dados
      await fetchUsuario();
    } catch (err) {
      // TODO: Implementar toast
      // toast({
      //   title: 'Erro',
      //   description: err instanceof Error ? err.message : 'Erro ao salvar',
      //   variant: 'destructive',
      // });
      console.error('Erro ao salvar permissões:', err);
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
      <div className="container mx-auto px-4 py-8 space-y-6 max-w-[1600px]">
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
      <div className="container mx-auto px-4 py-8 space-y-6 max-w-[1600px]">
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

  // Funções de formatação
  const formatarCPF = (cpf: string | null) => {
    if (!cpf) return '-';
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatarTelefone = (telefone: string | null) => {
    if (!telefone) return '-';
    const cleaned = telefone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (cleaned.length === 10) {
      return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return telefone;
  };

  const formatarData = (data: string | null) => {
    if (!data) return '-';
    try {
      return new Date(data).toLocaleDateString('pt-BR');
    } catch {
      return '-';
    }
  };

  const formatarGenero = (genero: GeneroUsuario | null) => {
    if (!genero) return '-';
    const generos: Record<GeneroUsuario, string> = {
      masculino: 'Masculino',
      feminino: 'Feminino',
      outro: 'Outro',
      prefiro_nao_informar: 'Prefiro não informar',
    };
    return generos[genero] || '-';
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6 max-w-[1600px]">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => router.push('/usuarios')}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-muted hover:bg-muted/80 transition-colors"
          title="Voltar para Usuários"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        {usuario.isSuperAdmin && (
          <Badge tone="danger" variant="solid" className="gap-1">
            <Shield className="h-3 w-3" />
            Super Admin
          </Badge>
        )}
      </div>

      {/* Dados do Usuário */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4" />
              Dados do Usuário
            </CardTitle>
            <Badge tone={usuario.ativo ? 'success' : 'neutral'} variant="soft">
              {usuario.ativo ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nome Completo</p>
              <p className="text-sm">{usuario.nomeCompleto}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nome de Exibição</p>
              <p className="text-sm">{usuario.nomeExibicao}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">E-mail Corporativo</p>
              <p className="text-sm">{usuario.emailCorporativo}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">E-mail Pessoal</p>
              <p className="text-sm">{usuario.emailPessoal || '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">CPF</p>
              <p className="text-sm">{formatarCPF(usuario.cpf)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">RG</p>
              <p className="text-sm">{usuario.rg || '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Data de Nascimento</p>
              <p className="text-sm">{formatarData(usuario.dataNascimento)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Gênero</p>
              <p className="text-sm">{formatarGenero(usuario.genero)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Telefone</p>
              <p className="text-sm">{formatarTelefone(usuario.telefone)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Ramal</p>
              <p className="text-sm">{usuario.ramal || '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">OAB</p>
              <p className="text-sm">
                {usuario.oab && usuario.ufOab ? `${usuario.oab} / ${usuario.ufOab}` : '-'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Cargo</p>
              <p className="text-sm">{usuario.cargo ? usuario.cargo.nome : '-'}</p>
              {usuario.cargo?.descricao && (
                <p className="text-xs text-muted-foreground mt-0.5">{usuario.cargo.descricao}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configurações de Segurança - Visível apenas para Super Admins */}
      {usuarioLogado?.isSuperAdmin && (
        <>
          <Separator />
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="h-4 w-4" />
                Configurações de Segurança
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <div className="text-sm font-medium">Super Administrador</div>
                  <div className="text-sm text-muted-foreground">
                    Super Admins possuem acesso total ao sistema e bypassam todas as permissões.
                  </div>
                  {usuario.id === usuarioLogado.id && (
                    <div className="text-xs text-amber-600 dark:text-amber-500 mt-2">
                      ⚠️ Você não pode remover seu próprio status de Super Admin
                    </div>
                  )}
                </div>
                <Switch
                  checked={isSuperAdminLocal}
                  onCheckedChange={salvarSuperAdmin}
                  disabled={isSavingSuperAdmin || usuario.id === usuarioLogado.id}
                  aria-label="Marcar como Super Administrador"
                />
              </div>
            </CardContent>
          </Card>
        </>
      )}

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
          {usuario.isSuperAdmin && (
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
                  {Object.entries(RECURSOS_CONFIG).reduce<Operacao[]>((acc, [, operacoes]) => {
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
                    {Object.entries(RECURSOS_CONFIG).reduce<Operacao[]>((acc, [, ops]) => {
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
                              disabled={usuario.isSuperAdmin}
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
