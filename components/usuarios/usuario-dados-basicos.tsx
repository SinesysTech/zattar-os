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
import { User, Mail, Phone, FileText, Shield } from 'lucide-react';

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
        {/* Nome */}
        <div>
          <div className="text-sm font-medium text-muted-foreground mb-1">
            Nome
          </div>
          <div className="text-base">
            {formatarNomeExibicao(usuario.nomeExibicao)}
          </div>
        </div>

        <Separator />

        {/* Email Corporativo */}
        <div>
          <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1.5">
            <Mail className="h-4 w-4" />
            E-mail Corporativo
          </div>
          <div className="text-base">{usuario.emailCorporativo}</div>
        </div>

        {/* Email Pessoal */}
        {usuario.emailPessoal && (
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1.5">
              <Mail className="h-4 w-4" />
              E-mail Pessoal
            </div>
            <div className="text-base">{usuario.emailPessoal}</div>
          </div>
        )}

        <Separator />

        {/* CPF e Telefone lado a lado */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1.5">
              <FileText className="h-4 w-4" />
              CPF
            </div>
            <div className="text-base">{formatarCpf(usuario.cpf)}</div>
          </div>

          {usuario.telefone && (
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1.5">
                <Phone className="h-4 w-4" />
                Telefone
              </div>
              <div className="text-base">{formatarTelefone(usuario.telefone)}</div>
            </div>
          )}
        </div>

        {/* OAB */}
        {usuario.oab && (
          <>
            <Separator />
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">
                OAB
              </div>
              <div className="text-base">
                {formatarOab(usuario.oab, usuario.ufOab)}
              </div>
            </div>
          </>
        )}

        {/* Cargo */}
        {usuario.cargo && (
          <>
            <Separator />
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">
                Cargo
              </div>
              <div className="text-base font-medium">{usuario.cargo.nome}</div>
              {usuario.cargo.descricao && (
                <div className="text-sm text-muted-foreground mt-1">
                  {usuario.cargo.descricao}
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
