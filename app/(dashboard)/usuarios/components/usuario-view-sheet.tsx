'use client';

// Componente Sheet para visualização de usuário

import * as React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  formatarCpf,
  formatarTelefone,
  formatarOab,
  formatarNomeExibicao,
  formatarData,
  formatarEnderecoCompleto,
  formatarGenero,
} from '@/lib/utils/format-usuarios';
import type { Usuario } from '@/backend/usuarios/services/persistence/usuario-persistence.service';

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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto p-6">
        <SheetHeader className="pb-5">
          <SheetTitle className="text-xl font-semibold flex items-center gap-2">
            {formatarNomeExibicao(usuario.nomeExibicao)}
            <Badge variant={usuario.ativo ? 'default' : 'secondary'}>
              {usuario.ativo ? 'Ativo' : 'Inativo'}
            </Badge>
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Informações Básicas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Nome Completo
                </div>
                <div className="text-base">{usuario.nomeCompleto}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Nome de Exibição
                </div>
                <div className="text-base">{usuario.nomeExibicao}</div>
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
                  <div className="text-sm font-medium text-muted-foreground mb-1">
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
                  <div className="text-base">
                    {formatarGenero(usuario.genero)}
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Informações Profissionais */}
          {(usuario.oab || usuario.ufOab) && (
            <>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Informações Profissionais</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Contato */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contato</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {usuario.emailCorporativo && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    E-mail Corporativo
                  </div>
                  <div className="text-base">{usuario.emailCorporativo}</div>
                </div>
              )}
              {usuario.emailPessoal && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    E-mail Pessoal
                  </div>
                  <div className="text-base">{usuario.emailPessoal}</div>
                </div>
              )}
              {usuario.telefone && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    Telefone
                  </div>
                  <div className="text-base">
                    {formatarTelefone(usuario.telefone)}
                    {usuario.ramal && ` (Ramal: ${usuario.ramal})`}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Endereço */}
          {usuario.endereco && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Endereço</h3>
                <div>
                  <div className="text-base">
                    {formatarEnderecoCompleto(usuario.endereco)}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Informações do Sistema */}
          <Separator />
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Informações do Sistema</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Data de Criação
                </div>
                <div className="text-base">
                  {formatarData(usuario.createdAt)}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Última Atualização
                </div>
                <div className="text-base">
                  {formatarData(usuario.updatedAt)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

