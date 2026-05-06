'use client';

import { cn } from '@/lib/utils';
import * as React from 'react';
import { usePerfil } from '../hooks/use-perfil';
import { PerfilEditSheet } from './perfil-edit-sheet';
import { AlterarSenhaDialog } from './alterar-senha-dialog';
import { AvatarEditDialog } from '@/app/(authenticated)/usuarios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heading } from '@/components/ui/typography';
import { Edit, Mail, Phone, MapPin, Briefcase, User, Calendar, KeyRound, Camera } from 'lucide-react';
import { FORMAT } from '@/lib/design-system';
import {
  formatarCpf,
  formatarOab,
  formatarData,
  formatarEnderecoCompleto,
  formatarGenero,
  getAvatarUrl,
} from '@/app/(authenticated)/usuarios';

function getInitials(name: string): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function PerfilView() {
  const { usuario, isLoading, error, refetch } = usePerfil();
  const [editSheetOpen, setEditSheetOpen] = React.useState(false);
  const [alterarSenhaDialogOpen, setAlterarSenhaDialogOpen] = React.useState(false);
  const [avatarDialogOpen, setAvatarDialogOpen] = React.useState(false);

  const handleEditSuccess = () => {
    refetch();
  };

  const handleAlterarSenhaSuccess = () => {
    // Senha alterada com sucesso
    // Não precisa refetch pois não afeta dados exibidos
  };

  if (error) {
    return (
      <div className="flex min-h-100 items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className={cn(/* design-system-escape: pt-6 padding direcional sem Inset equiv. */ "pt-6")}>
            <div className="text-center">
              <p className={cn("text-body-sm text-destructive")}>{error}</p>
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
      <div className={cn("stack-loose")}>
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

  const avatarUrl = getAvatarUrl(usuario.avatarUrl);

  return (
    <div className={cn("stack-loose")}>
      {/* Header com Avatar */}
      <div className={cn("flex items-start justify-between inline-loose")}>
        <div className={cn("flex items-center inline-loose")}>
          {/* Avatar */}
          <div
            className="relative group cursor-pointer"
            onClick={() => setAvatarDialogOpen(true)}
          >
            <Avatar size="3xl" className="border-2 border-muted">
              <AvatarImage src={avatarUrl || undefined} alt={usuario.nomeExibicao} />
              <AvatarFallback className={cn(/* design-system-escape: text-2xl → migrar para <Heading level="...">; font-medium → className de <Text>/<Heading> */ "text-2xl font-medium")}>
                {getInitials(usuario.nomeExibicao)}
              </AvatarFallback>
            </Avatar>
            {/* Overlay de hover */}
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="h-6 w-6 text-white" />
            </div>
          </div>

          {/* Informações */}
          <div>
            <Heading level="page" className={cn("flex items-center inline-medium")}>
              {usuario.nomeExibicao}
              <Badge variant={usuario.ativo ? 'success' : 'outline'}>
                {usuario.ativo ? 'Ativo' : 'Inativo'}
              </Badge>
            </Heading>
            <p className="text-muted-foreground mt-1">
              Visualize e edite suas informações pessoais
            </p>
          </div>
        </div>

        <div className={cn("flex inline-tight")}>
          <Button variant="outline" onClick={() => setAlterarSenhaDialogOpen(true)}>
            <KeyRound className="mr-2 h-4 w-4" />
            Alterar Senha
          </Button>
          <Button onClick={() => setEditSheetOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Editar Perfil
          </Button>
        </div>
      </div>

      {/* Cards de Informação */}
      <div className={cn("grid inline-loose md:grid-cols-2")}>
        {/* Informações Pessoais */}
        <Card>
          <CardHeader>
            <CardTitle className={cn("flex items-center inline-tight")}>
              <User className="h-5 w-5" />
              Informações Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent className={cn("stack-default")}>
            <div>
              <div className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "text-body-sm font-medium text-muted-foreground mb-1")}>
                Nome Completo
              </div>
              <div className={cn("text-body")}>{usuario.nomeCompleto}</div>
            </div>
            {usuario.cpf && (
              <div>
                <div className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "text-body-sm font-medium text-muted-foreground mb-1")}>
                  CPF
                </div>
                <div className={cn("text-body")}>{formatarCpf(usuario.cpf)}</div>
              </div>
            )}
            {usuario.rg && (
              <div>
                <div className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "text-body-sm font-medium text-muted-foreground mb-1")}>
                  RG
                </div>
                <div className={cn("text-body")}>{usuario.rg}</div>
              </div>
            )}
            {usuario.dataNascimento && (
              <div>
                <div className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "text-body-sm font-medium text-muted-foreground mb-1 flex items-center inline-micro")}>
                  <Calendar className="h-4 w-4" />
                  Data de Nascimento
                </div>
                <div className={cn("text-body")}>
                  {formatarData(usuario.dataNascimento)}
                </div>
              </div>
            )}
            {usuario.genero && (
              <div>
                <div className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "text-body-sm font-medium text-muted-foreground mb-1")}>
                  Gênero
                </div>
                <div className={cn("text-body")}>{formatarGenero(usuario.genero)}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contato */}
        <Card>
          <CardHeader>
            <CardTitle className={cn("flex items-center inline-tight")}>
              <Mail className="h-5 w-5" />
              Contato
            </CardTitle>
          </CardHeader>
          <CardContent className={cn("stack-default")}>
            {usuario.emailCorporativo && (
              <div>
                <div className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "text-body-sm font-medium text-muted-foreground mb-1")}>
                  E-mail Corporativo
                </div>
                <div className={cn("text-body break-all")}>{usuario.emailCorporativo}</div>
              </div>
            )}
            {usuario.emailPessoal && (
              <div>
                <div className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "text-body-sm font-medium text-muted-foreground mb-1")}>
                  E-mail Pessoal
                </div>
                <div className={cn("text-body break-all")}>{usuario.emailPessoal}</div>
              </div>
            )}
            {usuario.telefone && (
              <div>
                <div className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "text-body-sm font-medium text-muted-foreground mb-1 flex items-center inline-micro")}>
                  <Phone className="h-4 w-4" />
                  Telefone
                </div>
                <div className={cn("text-body")}>
                  {FORMAT.phone(usuario.telefone)}
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
              <CardTitle className={cn("flex items-center inline-tight")}>
                <Briefcase className="h-5 w-5" />
                Informações Profissionais
              </CardTitle>
            </CardHeader>
            <CardContent className={cn("stack-default")}>
              {usuario.oab && (
                <div>
                  <div className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "text-body-sm font-medium text-muted-foreground mb-1")}>
                    OAB
                  </div>
                  <div className={cn("text-body")}>
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
              <CardTitle className={cn("flex items-center inline-tight")}>
                <MapPin className="h-5 w-5" />
                Endereço
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={cn("text-body")}>
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
          <div className={cn("grid grid-cols-1 md:grid-cols-2 inline-default")}>
            <div>
              <div className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "text-body-sm font-medium text-muted-foreground mb-1")}>
                Data de Criação
              </div>
              <div className={cn("text-body")}>{formatarData(usuario.createdAt)}</div>
            </div>
            <div>
              <div className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "text-body-sm font-medium text-muted-foreground mb-1")}>
                Última Atualização
              </div>
              <div className={cn("text-body")}>{formatarData(usuario.updatedAt)}</div>
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

      {/* Alterar Senha Dialog */}
      <AlterarSenhaDialog
        open={alterarSenhaDialogOpen}
        onOpenChange={setAlterarSenhaDialogOpen}
        onSuccess={handleAlterarSenhaSuccess}
      />

      {/* Avatar Edit Dialog */}
      <AvatarEditDialog
        open={avatarDialogOpen}
        onOpenChange={setAvatarDialogOpen}
        usuarioId={usuario.id}
        avatarUrl={avatarUrl}
        nomeExibicao={usuario.nomeExibicao}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}
