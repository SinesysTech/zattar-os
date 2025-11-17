'use client';

// Página de perfil do usuário

import * as React from 'react';
import { usePerfil } from '@/lib/hooks/use-perfil';
import { PerfilEditSheet } from '@/components/perfil/perfil-edit-sheet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Edit, Mail, Phone, MapPin, Briefcase, User, Calendar } from 'lucide-react';
import {
  formatarCpf,
  formatarTelefone,
  formatarOab,
  formatarData,
  formatarEnderecoCompleto,
  formatarGenero,
} from '@/lib/utils/format-usuarios';

export default function PerfilPage() {
  const { usuario, isLoading, error, refetch } = usePerfil();
  const [editSheetOpen, setEditSheetOpen] = React.useState(false);

  const handleEditSuccess = () => {
    refetch();
  };

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-destructive">{error}</p>
              <Button
                onClick={() => refetch()}
                variant="outline"
                className="mt-4"
              >
                Tentar Novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!usuario) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            {usuario.nomeExibicao}
            <Badge variant={usuario.ativo ? 'default' : 'secondary'}>
              {usuario.ativo ? 'Ativo' : 'Inativo'}
            </Badge>
          </h1>
          <p className="text-muted-foreground mt-1">
            Visualize e edite suas informações pessoais
          </p>
        </div>
        <Button onClick={() => setEditSheetOpen(true)}>
          <Edit className="mr-2 h-4 w-4" />
          Editar Perfil
        </Button>
      </div>

      {/* Cards de Informação */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Informações Pessoais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informações Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">
                Nome Completo
              </div>
              <div className="text-base">{usuario.nomeCompleto}</div>
            </div>
            {usuario.cpf && (
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  CPF
                </div>
                <div className="text-base">{formatarCpf(usuario.cpf)}</div>
              </div>
            )}
            {usuario.rg && (
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  RG
                </div>
                <div className="text-base">{usuario.rg}</div>
              </div>
            )}
            {usuario.dataNascimento && (
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Data de Nascimento
                </div>
                <div className="text-base">
                  {formatarData(usuario.dataNascimento)}
                </div>
              </div>
            )}
            {usuario.genero && (
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Gênero
                </div>
                <div className="text-base">{formatarGenero(usuario.genero)}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contato */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Contato
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {usuario.emailCorporativo && (
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  E-mail Corporativo
                </div>
                <div className="text-base break-all">{usuario.emailCorporativo}</div>
              </div>
            )}
            {usuario.emailPessoal && (
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  E-mail Pessoal
                </div>
                <div className="text-base break-all">{usuario.emailPessoal}</div>
              </div>
            )}
            {usuario.telefone && (
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  Telefone
                </div>
                <div className="text-base">
                  {formatarTelefone(usuario.telefone)}
                  {usuario.ramal && ` (Ramal: ${usuario.ramal})`}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informações Profissionais */}
        {(usuario.oab || usuario.ufOab) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Informações Profissionais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {usuario.oab && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    OAB
                  </div>
                  <div className="text-base">
                    {formatarOab(usuario.oab, usuario.ufOab)}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Endereço */}
        {usuario.endereco && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Endereço
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-base">
                {formatarEnderecoCompleto(usuario.endereco)}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Informações do Sistema */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">
                Data de Criação
              </div>
              <div className="text-base">{formatarData(usuario.createdAt)}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">
                Última Atualização
              </div>
              <div className="text-base">{formatarData(usuario.updatedAt)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Sheet */}
      <PerfilEditSheet
        open={editSheetOpen}
        onOpenChange={setEditSheetOpen}
        usuario={usuario}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}
