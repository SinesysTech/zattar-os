'use client';

// Componente Sheet para edição de usuário

import * as React from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import type {
  Usuario,
  UsuarioDados,
  GeneroUsuario,
} from '@/backend/usuarios/services/persistence/usuario-persistence.service';

interface UsuarioEditSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usuario: Usuario | null;
  onSuccess: () => void;
}

export function UsuarioEditSheet({
  open,
  onOpenChange,
  usuario,
  onSuccess,
}: UsuarioEditSheetProps) {
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
        ativo: usuario.ativo,
        endereco: usuario.endereco || undefined,
      });
      setError(null);
    }
  }, [usuario]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/usuarios/${usuario.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: 'Erro desconhecido',
        }));
        throw new Error(
          errorData.error || `Erro ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error('Resposta da API indicou falha');
      }

      onSuccess();
      onOpenChange(false);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erro ao atualizar usuário';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!usuario) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <SheetHeader>
            <SheetTitle>Editar Usuário</SheetTitle>
            <SheetDescription>
              Atualize as informações do usuário
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Informações Básicas */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Informações Básicas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <Input
                    id="dataNascimento"
                    type="date"
                    value={formData.dataNascimento || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        dataNascimento: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="genero">Gênero</Label>
                  <select
                    id="genero"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.genero || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        genero: e.target.value as GeneroUsuario | undefined,
                      })
                    }
                  >
                    <option value="">Selecione...</option>
                    <option value="masculino">Masculino</option>
                    <option value="feminino">Feminino</option>
                    <option value="outro">Outro</option>
                    <option value="prefiro_nao_informar">
                      Prefiro não informar
                    </option>
                  </select>
                </div>
              </div>
            </div>

            {/* Informações Profissionais */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                Informações Profissionais
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="oab">Número da OAB</Label>
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
                  <Label htmlFor="ufOab">UF da OAB</Label>
                  <Input
                    id="ufOab"
                    value={formData.ufOab || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        ufOab: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="SP"
                    maxLength={2}
                  />
                </div>
              </div>
            </div>

            {/* Contato */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Contato</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="emailCorporativo">E-mail Corporativo *</Label>
                  <Input
                    id="emailCorporativo"
                    type="email"
                    value={formData.emailCorporativo || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        emailCorporativo: e.target.value,
                      })
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
                      setFormData({
                        ...formData,
                        emailPessoal: e.target.value,
                      })
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

            {/* Status */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Status</h3>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="ativo"
                  checked={formData.ativo ?? true}
                  onChange={(e) =>
                    setFormData({ ...formData, ativo: e.target.checked })
                  }
                  className="h-4 w-4"
                />
                <Label htmlFor="ativo" className="cursor-pointer">
                  Usuário ativo
                </Label>
              </div>
            </div>
          </div>

          <SheetFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

