'use client';

// Componente Sheet para visualização de cliente

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
  formatarCnpj,
  formatarTelefone,
  formatarEnderecoCompleto,
  formatarData,
  formatarNome,
  formatarTipoPessoa,
} from '@/lib/utils/format-clientes';
import type { Cliente } from '@/backend/clientes/services/persistence/cliente-persistence.service';

interface ClienteViewSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cliente: Cliente | null;
}

export function ClienteViewSheet({
  open,
  onOpenChange,
  cliente,
}: ClienteViewSheetProps) {
  if (!cliente) return null;

  const isPessoaFisica = cliente.tipoPessoa === 'pf';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto p-6">
        <SheetHeader className="pb-5">
          <SheetTitle className="text-xl font-semibold flex items-center gap-2">
            {formatarNome(cliente.nome)}
            <Badge variant={cliente.ativo ? 'default' : 'secondary'}>
              {cliente.ativo ? 'Ativo' : 'Inativo'}
            </Badge>
            <Badge variant="outline">
              {formatarTipoPessoa(cliente.tipoPessoa)}
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
                  {isPessoaFisica ? 'Nome Completo' : 'Razão Social'}
                </div>
                <div className="text-base">{formatarNome(cliente.nome)}</div>
              </div>
              {cliente.nomeFantasia && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    {isPessoaFisica ? 'Nome Social' : 'Nome Fantasia'}
                  </div>
                  <div className="text-base">{cliente.nomeFantasia}</div>
                </div>
              )}
              {isPessoaFisica ? (
                <>
                  {cliente.cpf && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">
                        CPF
                      </div>
                      <div className="text-base">{formatarCpf(cliente.cpf)}</div>
                    </div>
                  )}
                  {cliente.rg && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">
                        RG
                      </div>
                      <div className="text-base">{cliente.rg}</div>
                    </div>
                  )}
                  {cliente.dataNascimento && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">
                        Data de Nascimento
                      </div>
                      <div className="text-base">
                        {formatarData(cliente.dataNascimento)}
                      </div>
                    </div>
                  )}
                  {cliente.genero && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">
                        Gênero
                      </div>
                      <div className="text-base capitalize">
                        {cliente.genero.replace('_', ' ')}
                      </div>
                    </div>
                  )}
                  {cliente.estadoCivil && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">
                        Estado Civil
                      </div>
                      <div className="text-base capitalize">
                        {cliente.estadoCivil.replace('_', ' ')}
                      </div>
                    </div>
                  )}
                  {cliente.nacionalidade && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">
                        Nacionalidade
                      </div>
                      <div className="text-base">{cliente.nacionalidade}</div>
                    </div>
                  )}
                  {cliente.naturalidade && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">
                        Naturalidade
                      </div>
                      <div className="text-base">{cliente.naturalidade}</div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {cliente.cnpj && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">
                        CNPJ
                      </div>
                      <div className="text-base">
                        {formatarCnpj(cliente.cnpj)}
                      </div>
                    </div>
                  )}
                  {cliente.inscricaoEstadual && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">
                        Inscrição Estadual
                      </div>
                      <div className="text-base">
                        {cliente.inscricaoEstadual}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <Separator />

          {/* Contato */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contato</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cliente.email && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    E-mail
                  </div>
                  <div className="text-base">{cliente.email}</div>
                </div>
              )}
              {cliente.telefonePrimario && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    Telefone Primário
                  </div>
                  <div className="text-base">
                    {formatarTelefone(cliente.telefonePrimario)}
                  </div>
                </div>
              )}
              {cliente.telefoneSecundario && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    Telefone Secundário
                  </div>
                  <div className="text-base">
                    {formatarTelefone(cliente.telefoneSecundario)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Endereço */}
          {cliente.endereco && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Endereço</h3>
                <div>
                  <div className="text-base">
                    {formatarEnderecoCompleto(cliente.endereco)}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Observações */}
          {cliente.observacoes && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Observações</h3>
                <div>
                  <div className="text-base whitespace-pre-wrap">
                    {cliente.observacoes}
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
                  {formatarData(cliente.createdAt)}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Última Atualização
                </div>
                <div className="text-base">
                  {formatarData(cliente.updatedAt)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

