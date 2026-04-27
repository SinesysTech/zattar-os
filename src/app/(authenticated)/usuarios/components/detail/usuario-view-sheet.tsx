
'use client';

import { cn } from '@/lib/utils';
import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import { Separator } from '@/components/ui/separator';
import { Typography } from '@/components/ui/typography';
import {
  formatarCpf,
  formatarTelefone,
  formatarOab,
  formatarNomeExibicao,
  formatarData,
  formatarEnderecoCompleto,
  formatarGenero,
} from '../../utils';
import type { Usuario } from '../../domain';

interface UsuarioViewSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usuario: Usuario | null;
}

export function UsuarioViewSheet({
  open,
  onOpenChange,
  usuario,
}: UsuarioViewSheetProps) {
  if (!usuario) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(/* design-system-escape: p-6 → migrar para <Inset variant="dialog"> */ "max-h-[90vh] w-[min(92vw,25rem)] sm:w-[min(92vw,33.75rem)] overflow-y-auto p-6")}>
        <DialogHeader className={cn(/* design-system-escape: pb-5 padding direcional sem Inset equiv. */ "pb-5")}>
          <DialogTitle className={cn(/* design-system-escape: text-xl → migrar para <Heading level="...">; font-semibold → className de <Text>/<Heading>; gap-2 → migrar para <Inline gap="tight"> */ "text-xl font-semibold flex items-center gap-2")}>
            {formatarNomeExibicao(usuario.nomeExibicao)}
            <Badge variant={usuario.ativo ? 'success' : 'outline'}>
              {usuario.ativo ? 'Ativo' : 'Inativo'}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Visualização detalhada das informações do usuário.
          </DialogDescription>
        </DialogHeader>

        <div className={cn(/* design-system-escape: space-y-6 → migrar para <Stack gap="loose"> */ "space-y-6")}>
          <div className={cn(/* design-system-escape: space-y-4 → migrar para <Stack gap="default"> */ "space-y-4")}>
            <Typography.H4>Informações Básicas</Typography.H4>
            <div className={cn(/* design-system-escape: gap-4 → migrar para <Inline gap="default"> */ "grid grid-cols-1 md:grid-cols-2 gap-4")}>
              <div>
                <Typography.Muted className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "font-medium mb-1")}>
                  Nome Completo
                </Typography.Muted>
                <div className={cn(/* design-system-escape: text-base → migrar para <Text variant="body"> */ "text-base")}>{usuario.nomeCompleto}</div>
              </div>
              <div>
                <Typography.Muted className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "font-medium mb-1")}>
                  Nome de Exibição
                </Typography.Muted>
                <div className={cn(/* design-system-escape: text-base → migrar para <Text variant="body"> */ "text-base")}>{usuario.nomeExibicao}</div>
              </div>
              {usuario.cpf && (
                <div>
                  <Typography.Muted className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "font-medium mb-1")}>
                    CPF
                  </Typography.Muted>
                  <div className={cn(/* design-system-escape: text-base → migrar para <Text variant="body"> */ "text-base")}>{formatarCpf(usuario.cpf)}</div>
                </div>
              )}
              {usuario.rg && (
                <div>
                  <Typography.Muted className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "font-medium mb-1")}>
                    RG
                  </Typography.Muted>
                  <div className={cn(/* design-system-escape: text-base → migrar para <Text variant="body"> */ "text-base")}>{usuario.rg}</div>
                </div>
              )}
              {usuario.dataNascimento && (
                <div>
                  <Typography.Muted className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "font-medium mb-1")}>
                    Data de Nascimento
                  </Typography.Muted>
                  <div className={cn(/* design-system-escape: text-base → migrar para <Text variant="body"> */ "text-base")}>
                    {formatarData(usuario.dataNascimento)}
                  </div>
                </div>
              )}
              {usuario.genero && (
                <div>
                  <Typography.Muted className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "font-medium mb-1")}>
                    Gênero
                  </Typography.Muted>
                  <div className={cn(/* design-system-escape: text-base → migrar para <Text variant="body"> */ "text-base")}>
                    {formatarGenero(usuario.genero)}
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {(usuario.oab || usuario.ufOab) && (
            <>
              <div className={cn(/* design-system-escape: space-y-4 → migrar para <Stack gap="default"> */ "space-y-4")}>
                <Typography.H4>Informações Profissionais</Typography.H4>
                <div className={cn(/* design-system-escape: gap-4 → migrar para <Inline gap="default"> */ "grid grid-cols-1 md:grid-cols-2 gap-4")}>
                  {usuario.oab && (
                    <div>
                      <Typography.Muted className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "font-medium mb-1")}>
                        OAB
                      </Typography.Muted>
                      <div className={cn(/* design-system-escape: text-base → migrar para <Text variant="body"> */ "text-base")}>
                        {formatarOab(usuario.oab, usuario.ufOab)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <Separator />
            </>
          )}

          <div className={cn(/* design-system-escape: space-y-4 → migrar para <Stack gap="default"> */ "space-y-4")}>
            <Typography.H4>Contato</Typography.H4>
            <div className={cn(/* design-system-escape: gap-4 → migrar para <Inline gap="default"> */ "grid grid-cols-1 md:grid-cols-2 gap-4")}>
              {usuario.emailCorporativo && (
                <div>
                  <Typography.Muted className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "font-medium mb-1")}>
                    E-mail Corporativo
                  </Typography.Muted>
                  <div className={cn(/* design-system-escape: text-base → migrar para <Text variant="body"> */ "text-base")}>{usuario.emailCorporativo}</div>
                </div>
              )}
              {usuario.emailPessoal && (
                <div>
                  <Typography.Muted className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "font-medium mb-1")}>
                    E-mail Pessoal
                  </Typography.Muted>
                  <div className={cn(/* design-system-escape: text-base → migrar para <Text variant="body"> */ "text-base")}>{usuario.emailPessoal}</div>
                </div>
              )}
              {usuario.telefone && (
                <div>
                  <Typography.Muted className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "font-medium mb-1")}>
                    Telefone
                  </Typography.Muted>
                  <div className={cn(/* design-system-escape: text-base → migrar para <Text variant="body"> */ "text-base")}>
                    {formatarTelefone(usuario.telefone)}
                    {usuario.ramal && ` (Ramal: ${usuario.ramal})`}
                  </div>
                </div>
              )}
            </div>
          </div>

          {usuario.endereco && (
            <>
              <Separator />
              <div className={cn(/* design-system-escape: space-y-4 → migrar para <Stack gap="default"> */ "space-y-4")}>
                <Typography.H4>Endereço</Typography.H4>
                <div>
                  <div className={cn(/* design-system-escape: text-base → migrar para <Text variant="body"> */ "text-base")}>
                    {formatarEnderecoCompleto(usuario.endereco)}
                  </div>
                </div>
              </div>
            </>
          )}

          <Separator />
          <div className={cn(/* design-system-escape: space-y-4 → migrar para <Stack gap="default"> */ "space-y-4")}>
            <Typography.H4>Informações do Sistema</Typography.H4>
            <div className={cn(/* design-system-escape: gap-4 → migrar para <Inline gap="default"> */ "grid grid-cols-1 md:grid-cols-2 gap-4")}>
              <div>
                <Typography.Muted className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "font-medium mb-1")}>
                  Data de Criação
                </Typography.Muted>
                <div className={cn(/* design-system-escape: text-base → migrar para <Text variant="body"> */ "text-base")}>
                  {formatarData(usuario.createdAt)}
                </div>
              </div>
              <div>
                <Typography.Muted className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "font-medium mb-1")}>
                  Última Atualização
                </Typography.Muted>
                <div className={cn(/* design-system-escape: text-base → migrar para <Text variant="body"> */ "text-base")}>
                  {formatarData(usuario.updatedAt)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
