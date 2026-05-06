'use client';

import { cn } from '@/lib/utils';
import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormDatePicker } from '@/components/ui/form-date-picker';
import { Label } from '@/components/ui/label';
import { Heading } from '@/components/ui/typography';
import { actionAtualizarPerfil } from '../actions/perfil-actions';
import type { Usuario, UsuarioDados, GeneroUsuario, Endereco } from '@/app/(authenticated)/usuarios';

import { LoadingSpinner } from "@/components/ui/loading-state"
interface PerfilEditSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usuario: Usuario | null;
  onSuccess: () => void;
}

export function PerfilEditSheet({
  open,
  onOpenChange,
  usuario,
  onSuccess,
}: PerfilEditSheetProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Form state
  const [formData, setFormData] = React.useState<Partial<UsuarioDados>>({});

  React.useEffect(() => {
    if (usuario) {
      setFormData({
        nomeCompleto: usuario.nomeCompleto,
        nomeExibicao: usuario.nomeExibicao,
        cpf: usuario.cpf,
        rg: usuario.rg || undefined,
        dataNascimento: usuario.dataNascimento
          ? usuario.dataNascimento.split('T')[0]
          : undefined,
        genero: usuario.genero || undefined,
        oab: usuario.oab || undefined,
        ufOab: usuario.ufOab || undefined,
        emailPessoal: usuario.emailPessoal || undefined,
        emailCorporativo: usuario.emailCorporativo,
        telefone: usuario.telefone || undefined,
        ramal: usuario.ramal || undefined,
        endereco: usuario.endereco || undefined,
      });
      setError(null);
    }
  }, [usuario]);

  const handleEnderecoChange = (campo: keyof Endereco, valor: string) => {
    setFormData({
      ...formData,
      endereco: {
        ...formData.endereco,
        [campo]: valor,
      },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await actionAtualizarPerfil(formData);

      if (!result.success) {
        throw new Error(result.error || 'Erro ao atualizar perfil');
      }

      onSuccess();
      onOpenChange(false);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erro ao atualizar perfil';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!usuario) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("max-h-[90vh] w-100 sm:w-135 overflow-y-auto inset-dialog")}>
        <form onSubmit={handleSubmit}>
          <DialogHeader className={cn("pb-5")}>
            <DialogTitle className="text-section-title">Editar Perfil</DialogTitle>
            <DialogDescription>
              Atualize suas informações pessoais e de contato.
            </DialogDescription>
          </DialogHeader>

          <div className={cn("stack-loose")}>
            {error && (
              <div className={cn(/* design-system-escape: p-3 → usar <Inset> */ "rounded-md bg-destructive/15 p-3 text-body-sm text-destructive")}>
                {error}
              </div>
            )}

            {/* Informações Básicas */}
            <div className={cn("stack-default")}>
              <Heading level="subsection">Informações Básicas</Heading>
              <div className={cn("grid grid-cols-1 md:grid-cols-2 inline-default")}>
                <div>
                  <Label htmlFor="nomeCompleto">Nome Completo *</Label>
                  <Input
                    id="nomeCompleto"
                    value={formData.nomeCompleto || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, nomeCompleto: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="nomeExibicao">Nome de Exibição *</Label>
                  <Input
                    id="nomeExibicao"
                    value={formData.nomeExibicao || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, nomeExibicao: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="cpf">CPF *</Label>
                  <Input
                    id="cpf"
                    value={formData.cpf || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, cpf: e.target.value })
                    }
                    placeholder="000.000.000-00"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="rg">RG</Label>
                  <Input
                    id="rg"
                    value={formData.rg || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, rg: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="dataNascimento">Data de Nascimento</Label>
                  <FormDatePicker
                    id="dataNascimento"
                    value={formData.dataNascimento || undefined}
                    onChange={(v) => setFormData({ ...formData, dataNascimento: v })}
                  />
                </div>
                <div>
                  <Label htmlFor="genero">Gênero</Label>
                  <select
                    id="genero"
                    title="Selecione o gênero"
                    className={cn("flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-body-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring")}
                    value={formData.genero || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, genero: e.target.value as GeneroUsuario })
                    }
                  >
                    <option value="">Selecione</option>
                    <option value="masculino">Masculino</option>
                    <option value="feminino">Feminino</option>
                    <option value="outro">Outro</option>
                    <option value="prefiro_nao_informar">Prefiro não informar</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Informações Profissionais */}
            <div className={cn("stack-default")}>
              <Heading level="subsection">Informações Profissionais</Heading>
              <div className={cn("grid grid-cols-1 md:grid-cols-2 inline-default")}>
                <div>
                  <Label htmlFor="oab">OAB</Label>
                  <Input
                    id="oab"
                    value={formData.oab || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, oab: e.target.value })
                    }
                    placeholder="123456"
                  />
                </div>
                <div>
                  <Label htmlFor="ufOab">UF OAB</Label>
                  <Input
                    id="ufOab"
                    value={formData.ufOab || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, ufOab: e.target.value.toUpperCase() })
                    }
                    placeholder="SP"
                    maxLength={2}
                  />
                </div>
              </div>
            </div>

            {/* Contato */}
            <div className={cn("stack-default")}>
              <Heading level="subsection">Contato</Heading>
              <div className={cn("grid grid-cols-1 md:grid-cols-2 inline-default")}>
                <div>
                  <Label htmlFor="emailCorporativo">E-mail Corporativo *</Label>
                  <Input
                    id="emailCorporativo"
                    type="email"
                    value={formData.emailCorporativo || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, emailCorporativo: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="emailPessoal">E-mail Pessoal</Label>
                  <Input
                    id="emailPessoal"
                    type="email"
                    value={formData.emailPessoal || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, emailPessoal: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, telefone: e.target.value })
                    }
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div>
                  <Label htmlFor="ramal">Ramal</Label>
                  <Input
                    id="ramal"
                    value={formData.ramal || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, ramal: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Endereço */}
            <div className={cn("stack-default")}>
              <Heading level="subsection">Endereço</Heading>
              <div className={cn("grid grid-cols-1 md:grid-cols-2 inline-default")}>
                <div className="md:col-span-2">
                  <Label htmlFor="logradouro">Logradouro</Label>
                  <Input
                    id="logradouro"
                    value={formData.endereco?.logradouro || ''}
                    onChange={(e) => handleEnderecoChange('logradouro', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="numero">Número</Label>
                  <Input
                    id="numero"
                    value={formData.endereco?.numero || ''}
                    onChange={(e) => handleEnderecoChange('numero', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="complemento">Complemento</Label>
                  <Input
                    id="complemento"
                    value={formData.endereco?.complemento || ''}
                    onChange={(e) => handleEnderecoChange('complemento', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="bairro">Bairro</Label>
                  <Input
                    id="bairro"
                    value={formData.endereco?.bairro || ''}
                    onChange={(e) => handleEnderecoChange('bairro', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    value={formData.endereco?.cidade || ''}
                    onChange={(e) => handleEnderecoChange('cidade', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="estado">Estado</Label>
                  <Input
                    id="estado"
                    value={formData.endereco?.estado || ''}
                    onChange={(e) => handleEnderecoChange('estado', e.target.value.toUpperCase())}
                    maxLength={2}
                  />
                </div>
                <div>
                  <Label htmlFor="cep">CEP</Label>
                  <Input
                    id="cep"
                    value={formData.endereco?.cep || ''}
                    onChange={(e) => handleEnderecoChange('cep', e.target.value)}
                    placeholder="00000-000"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <LoadingSpinner className="mr-2" />}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
