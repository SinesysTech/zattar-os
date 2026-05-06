import { FORMAT } from '@/lib/design-system';

import { cn } from '@/lib/utils';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { Usuario } from '../../domain';
import {
  formatarCpf,

  formatarNomeExibicao,
} from '../../utils';
import { formatDate } from '@/lib/formatters';
import { User, Mail, Phone, FileText, Shield, MapPin, Calendar, UserCircle, Briefcase } from 'lucide-react';

interface UsuarioDadosBasicosProps {
  usuario: Usuario;
}

export function UsuarioDadosBasicos({ usuario }: UsuarioDadosBasicosProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className={cn("flex items-center inline-tight")}>
            <User className="h-5 w-5" />
            Dados do Usuário
          </CardTitle>
            <div className={cn("flex items-center inline-tight")}>
              {usuario.isSuperAdmin && (
                <Badge variant="info">
                  <Shield className="h-3 w-3 mr-1" />
                  Super Admin
                </Badge>
              )}
              <Badge variant={usuario.ativo ? 'success' : 'outline'}>
                {usuario.ativo ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
        </div>
      </CardHeader>
      <CardContent className={cn("stack-loose")}>
        <div className={cn("stack-default")}>
          <small className="text-sm font-medium leading-none text-muted-foreground uppercase tracking-wide">
            Identificação
          </small>

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
              <div className={cn("text-body")}>
                {formatarNomeExibicao(usuario.nomeExibicao)}
              </div>
            </div>
          </div>

          <div className={cn("grid grid-cols-2 md:grid-cols-4 inline-default")}>
            {usuario.dataNascimento && (
              <div>
                <p className="text-sm text-muted-foreground font-medium mb-1 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  Nascimento
                </p>
                <div className={cn("text-body")}>
                  {formatDate(usuario.dataNascimento)}
                </div>
              </div>
            )}

            {usuario.genero && (
              <div>
                <p className="text-sm text-muted-foreground font-medium mb-1 flex items-center gap-1.5">
                  <UserCircle className="h-4 w-4" />
                  Gênero
                </p>
                <div className={cn("text-body capitalize")}>
                  {usuario.genero.replace('_', ' ')}
                </div>
              </div>
            )}

            <div>
              <p className="text-sm text-muted-foreground font-medium mb-1 flex items-center gap-1.5">
                <FileText className="h-4 w-4" />
                CPF
              </p>
              <div className={cn("text-body")}>{formatarCpf(usuario.cpf)}</div>
            </div>

            {usuario.rg && (
              <div>
                <p className="text-sm text-muted-foreground font-medium mb-1 flex items-center gap-1.5">
                  <FileText className="h-4 w-4" />
                  RG
                </p>
                <div className={cn("text-body")}>{usuario.rg}</div>
              </div>
            )}
          </div>
        </div>

        <Separator />

        <div className={cn("stack-default")}>
          <small className="text-sm font-medium leading-none text-muted-foreground uppercase tracking-wide">
            Contato
          </small>

          {(usuario.telefone || usuario.ramal) && (
            <div className={cn("grid grid-cols-1 md:grid-cols-2 inline-default")}>
              {usuario.telefone && (
                <div>
                  <p className="text-sm text-muted-foreground font-medium mb-1 flex items-center gap-1.5">
                    <Phone className="h-4 w-4" />
                    Telefone
                  </p>
                  <div className={cn("text-body")}>{FORMAT.phone(usuario.telefone)}</div>
                </div>
              )}

              {usuario.ramal && (
                <div>
                  <p className="text-sm text-muted-foreground font-medium mb-1 flex items-center gap-1.5">
                    <Phone className="h-4 w-4" />
                    Ramal
                  </p>
                  <div className={cn("text-body")}>{usuario.ramal}</div>
                </div>
              )}
            </div>
          )}

          <div className={cn("grid grid-cols-1 md:grid-cols-2 inline-default")}>
            <div>
              <p className="text-sm text-muted-foreground font-medium mb-1 flex items-center gap-1.5">
                <Mail className="h-4 w-4" />
                E-mail Corporativo
              </p>
              <div className={cn("text-body")}>{usuario.emailCorporativo}</div>
            </div>

            {usuario.emailPessoal && (
              <div>
                <p className="text-sm text-muted-foreground font-medium mb-1 flex items-center gap-1.5">
                  <Mail className="h-4 w-4" />
                  E-mail Pessoal
                </p>
                <div className={cn("text-body")}>{usuario.emailPessoal}</div>
              </div>
            )}
          </div>
        </div>

        <Separator />

        <div className={cn("stack-default")}>
          <small className="text-sm font-medium leading-none text-muted-foreground uppercase tracking-wide">
            Informações Profissionais
          </small>

          <div className={cn("grid grid-cols-1 md:grid-cols-3 inline-default")}>
            {usuario.oab && (
              <>
                <div>
                  <p className="text-sm text-muted-foreground font-medium mb-1">
                    OAB
                  </p>
                  <div className={cn("text-body")}>{usuario.oab}</div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium mb-1">
                    UF OAB
                  </p>
                  <div className={cn("text-body")}>{usuario.ufOab}</div>
                </div>
              </>
            )}

            <div className={usuario.oab ? '' : 'md:col-span-3'}>
              <p className="text-sm text-muted-foreground font-medium mb-1 flex items-center gap-1.5">
                <Briefcase className="h-4 w-4" />
                Cargo
              </p>
              {usuario.cargo ? (
                <div>
                  <div className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "text-body font-medium")}>{usuario.cargo.nome}</div>
                  {usuario.cargo.descricao && (
                    <div className={cn("text-body-sm text-muted-foreground mt-0.5")}>
                      {usuario.cargo.descricao}
                    </div>
                  )}
                </div>
              ) : (
                <div className={cn("text-body text-muted-foreground")}>
                  Não informado
                </div>
              )}
            </div>
          </div>
        </div>

        {usuario.endereco && Object.values(usuario.endereco).some((v) => v) && (
          <>
            <Separator />
            <div className={cn("stack-default")}>
              <small className="text-sm font-medium leading-none text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                Endereço
              </small>

              <div className={cn("grid grid-cols-2 md:grid-cols-7 inline-medium")}>
                {usuario.endereco.cep && (
                  <div>
                    <p className="text-sm text-muted-foreground font-medium mb-1">
                      CEP
                    </p>
                    <div className={cn("text-body")}>{usuario.endereco.cep}</div>
                  </div>
                )}

                {usuario.endereco.logradouro && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-muted-foreground font-medium mb-1">
                      Logradouro
                    </p>
                    <div className={cn("text-body")}>{usuario.endereco.logradouro}</div>
                  </div>
                )}

                {usuario.endereco.numero && (
                  <div>
                    <p className="text-sm text-muted-foreground font-medium mb-1">
                      Número
                    </p>
                    <div className={cn("text-body")}>{usuario.endereco.numero}</div>
                  </div>
                )}

                {usuario.endereco.complemento && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-muted-foreground font-medium mb-1">
                      Complemento
                    </p>
                    <div className={cn("text-body")}>{usuario.endereco.complemento}</div>
                  </div>
                )}

                {usuario.endereco.bairro && (
                  <div>
                    <p className="text-sm text-muted-foreground font-medium mb-1">
                      Bairro
                    </p>
                    <div className={cn("text-body")}>{usuario.endereco.bairro}</div>
                  </div>
                )}

                {usuario.endereco.cidade && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-muted-foreground font-medium mb-1">
                      Cidade
                    </p>
                    <div className={cn("text-body")}>{usuario.endereco.cidade}</div>
                  </div>
                )}

                {usuario.endereco.estado && (
                  <div>
                    <p className="text-sm text-muted-foreground font-medium mb-1">
                      UF
                    </p>
                    <div className={cn("text-body")}>{usuario.endereco.estado}</div>
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
