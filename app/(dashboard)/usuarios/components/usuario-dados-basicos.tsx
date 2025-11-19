/**
 * Componente para exibir dados básicos do usuário
 */

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { Usuario } from '@/backend/usuarios/services/persistence/usuario-persistence.service';
import {
  formatarCpf,
  formatarTelefone,
  formatarOab,
  formatarNomeExibicao,
} from '@/lib/utils/format-usuarios';
import { User, Mail, Phone, FileText, Shield, MapPin, Calendar, UserCircle, Briefcase } from 'lucide-react';

interface UsuarioDadosBasicosProps {
  usuario: Usuario;
}

export function UsuarioDadosBasicos({ usuario }: UsuarioDadosBasicosProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Dados do Usuário
          </CardTitle>
          <div className="flex items-center gap-2">
            {usuario.isSuperAdmin && (
              <Badge variant="default" className="bg-purple-600">
                <Shield className="h-3 w-3 mr-1" />
                Super Admin
              </Badge>
            )}
            <Badge variant={usuario.ativo ? 'default' : 'secondary'}>
              {usuario.ativo ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* SEÇÃO 1: IDENTIFICAÇÃO */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Identificação
          </h3>

          {/* Linha 1: Nome Completo | Nome de Exibição */}
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
              <div className="text-base">
                {formatarNomeExibicao(usuario.nomeExibicao)}
              </div>
            </div>
          </div>

          {/* Linha 2: Data Nascimento | Gênero | CPF | RG */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {usuario.dataNascimento && (
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  Nascimento
                </div>
                <div className="text-base">
                  {new Date(usuario.dataNascimento).toLocaleDateString('pt-BR')}
                </div>
              </div>
            )}

            {usuario.genero && (
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1.5">
                  <UserCircle className="h-4 w-4" />
                  Gênero
                </div>
                <div className="text-base capitalize">
                  {usuario.genero.replace('_', ' ')}
                </div>
              </div>
            )}

            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1.5">
                <FileText className="h-4 w-4" />
                CPF
              </div>
              <div className="text-base">{formatarCpf(usuario.cpf)}</div>
            </div>

            {usuario.rg && (
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1.5">
                  <FileText className="h-4 w-4" />
                  RG
                </div>
                <div className="text-base">{usuario.rg}</div>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* SEÇÃO 2: CONTATO */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Contato
          </h3>

          {/* Linha 1: Telefone | Ramal */}
          {(usuario.telefone || usuario.ramal) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {usuario.telefone && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1.5">
                    <Phone className="h-4 w-4" />
                    Telefone
                  </div>
                  <div className="text-base">{formatarTelefone(usuario.telefone)}</div>
                </div>
              )}

              {usuario.ramal && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1.5">
                    <Phone className="h-4 w-4" />
                    Ramal
                  </div>
                  <div className="text-base">{usuario.ramal}</div>
                </div>
              )}
            </div>
          )}

          {/* Linha 2: Email Corporativo | Email Pessoal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1.5">
                <Mail className="h-4 w-4" />
                E-mail Corporativo
              </div>
              <div className="text-base">{usuario.emailCorporativo}</div>
            </div>

            {usuario.emailPessoal && (
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1.5">
                  <Mail className="h-4 w-4" />
                  E-mail Pessoal
                </div>
                <div className="text-base">{usuario.emailPessoal}</div>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* SEÇÃO 3: INFORMAÇÕES PROFISSIONAIS */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Informações Profissionais
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {usuario.oab && (
              <>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    OAB
                  </div>
                  <div className="text-base">{usuario.oab}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    UF OAB
                  </div>
                  <div className="text-base">{usuario.ufOab}</div>
                </div>
              </>
            )}

            <div className={usuario.oab ? '' : 'md:col-span-3'}>
              <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1.5">
                <Briefcase className="h-4 w-4" />
                Cargo
              </div>
              {usuario.cargo ? (
                <div>
                  <div className="text-base font-medium">{usuario.cargo.nome}</div>
                  {usuario.cargo.descricao && (
                    <div className="text-sm text-muted-foreground mt-0.5">
                      {usuario.cargo.descricao}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-base text-muted-foreground">
                  Não informado
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SEÇÃO 4: ENDEREÇO */}
        {usuario.endereco && Object.values(usuario.endereco).some((v) => v) && (
          <>
            <Separator />
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                Endereço
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
                {usuario.endereco.cep && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      CEP
                    </div>
                    <div className="text-base">{usuario.endereco.cep}</div>
                  </div>
                )}

                {usuario.endereco.logradouro && (
                  <div className="md:col-span-2">
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      Logradouro
                    </div>
                    <div className="text-base">{usuario.endereco.logradouro}</div>
                  </div>
                )}

                {usuario.endereco.numero && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      Número
                    </div>
                    <div className="text-base">{usuario.endereco.numero}</div>
                  </div>
                )}

                {usuario.endereco.complemento && (
                  <div className="md:col-span-2">
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      Complemento
                    </div>
                    <div className="text-base">{usuario.endereco.complemento}</div>
                  </div>
                )}

                {usuario.endereco.bairro && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      Bairro
                    </div>
                    <div className="text-base">{usuario.endereco.bairro}</div>
                  </div>
                )}

                {usuario.endereco.cidade && (
                  <div className="md:col-span-2">
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      Cidade
                    </div>
                    <div className="text-base">{usuario.endereco.cidade}</div>
                  </div>
                )}

                {usuario.endereco.estado && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      UF
                    </div>
                    <div className="text-base">{usuario.endereco.estado}</div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
