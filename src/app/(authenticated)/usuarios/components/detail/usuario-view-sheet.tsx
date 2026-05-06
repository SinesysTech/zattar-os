'use client';

import { FORMAT } from '@/lib/design-system';

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
import { Heading } from '@/components/ui/typography';
import {
  formatarCpf,

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
      <DialogContent className={cn("max-h-[90vh] w-[min(92vw,25rem)] sm:w-[min(92vw,33.75rem)] overflow-y-auto inset-dialog")}>
        <DialogHeader className={cn(/* design-system-escape: pb-5 padding direcional sem Inset equiv. */ "pb-5")}>
          <DialogTitle className={cn("text-section-title flex items-center gap-2")}>
            {formatarNomeExibicao(usuario.nomeExibicao)}
            <Badge variant={usuario.ativo ? 'success' : 'outline'}>
              {usuario.ativo ? 'Ativo' : 'Inativo'}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Visualização detalhada das informações do usuário.
          </DialogDescription>
        </DialogHeader>

        <div className={cn("stack-loose")}>
          <div className={cn("stack-default")}>
            <Heading level="subsection">Informações Básicas</Heading>
            <div className={cn("grid grid-cols-1 md:grid-cols-2 inline-default")}>
              <div>
                <p className="text-sm text-muted-foreground font-medium mb-1">
                  Nome Completo
                </p>
                <div className={cn("text-body")}>{usuario.nomeCompleto}</div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium mb-1">
                  Nome de Exibição
                </p>
                <div className={cn("text-body")}>{usuario.nomeExibicao}</div>
              </div>
              {usuario.cpf && (
                <div>
                  <p className="text-sm text-muted-foreground font-medium mb-1">
                    CPF
                  </p>
                  <div className={cn("text-body")}>{formatarCpf(usuario.cpf)}</div>
                </div>
              )}
              {usuario.rg && (
                <div>
                  <p className="text-sm text-muted-foreground font-medium mb-1">
                    RG
                  </p>
                  <div className={cn("text-body")}>{usuario.rg}</div>
                </div>
              )}
              {usuario.dataNascimento && (
                <div>
                  <p className="text-sm text-muted-foreground font-medium mb-1">
                    Data de Nascimento
                  </p>
                  <div className={cn("text-body")}>
                    {formatarData(usuario.dataNascimento)}
                  </div>
                </div>
              )}
              {usuario.genero && (
                <div>
                  <p className="text-sm text-muted-foreground font-medium mb-1">
                    Gênero
                  </p>
                  <div className={cn("text-body")}>
                    {formatarGenero(usuario.genero)}
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {(usuario.oab || usuario.ufOab) && (
            <>
              <div className={cn("stack-default")}>
                <Heading level="subsection">Informações Profissionais</Heading>
                <div className={cn("grid grid-cols-1 md:grid-cols-2 inline-default")}>
                  {usuario.oab && (
                    <div>
                      <p className="text-sm text-muted-foreground font-medium mb-1">
                        OAB
                      </p>
                      <div className={cn("text-body")}>
                        {formatarOab(usuario.oab, usuario.ufOab)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <Separator />
            </>
          )}

          <div className={cn("stack-default")}>
            <Heading level="subsection">Contato</Heading>
            <div className={cn("grid grid-cols-1 md:grid-cols-2 inline-default")}>
              {usuario.emailCorporativo && (
                <div>
                  <p className="text-sm text-muted-foreground font-medium mb-1">
                    E-mail Corporativo
                  </p>
                  <div className={cn("text-body")}>{usuario.emailCorporativo}</div>
                </div>
              )}
              {usuario.emailPessoal && (
                <div>
                  <p className="text-sm text-muted-foreground font-medium mb-1">
                    E-mail Pessoal
                  </p>
                  <div className={cn("text-body")}>{usuario.emailPessoal}</div>
                </div>
              )}
              {usuario.telefone && (
                <div>
                  <p className="text-sm text-muted-foreground font-medium mb-1">
                    Telefone
                  </p>
                  <div className={cn("text-body")}>
                    {FORMAT.phone(usuario.telefone)}
                    {usuario.ramal && ` (Ramal: ${usuario.ramal})`}
                  </div>
                </div>
              )}
            </div>
          </div>

          {usuario.endereco && (
            <>
              <Separator />
              <div className={cn("stack-default")}>
                <Heading level="subsection">Endereço</Heading>
                <div>
                  <div className={cn("text-body")}>
                    {formatarEnderecoCompleto(usuario.endereco)}
                  </div>
                </div>
              </div>
            </>
          )}

          <Separator />
          <div className={cn("stack-default")}>
            <Heading level="subsection">Informações do Sistema</Heading>
            <div className={cn("grid grid-cols-1 md:grid-cols-2 inline-default")}>
              <div>
                <p className="text-sm text-muted-foreground font-medium mb-1">
                  Data de Criação
                </p>
                <div className={cn("text-body")}>
                  {formatarData(usuario.createdAt)}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium mb-1">
                  Última Atualização
                </p>
                <div className={cn("text-body")}>
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
