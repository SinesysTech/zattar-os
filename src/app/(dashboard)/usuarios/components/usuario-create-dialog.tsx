'use client';

// Componente Dialog para criação de novo usuário

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
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import type {
  UsuarioDados,
  GeneroUsuario,
} from '@/backend/usuarios/services/persistence/usuario-persistence.service';

interface UsuarioCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function UsuarioCreateDialog({
  open,
  onOpenChange,
  onSuccess,
}: UsuarioCreateDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Form state
  const [formData, setFormData] = React.useState<
    Partial<UsuarioDados & { senha: string }>
  >({
    ativo: true,
  });

  React.useEffect(() => {
    if (!open) {
      // Resetar formulário quando fechar
      setFormData({ ativo: true });
      setError(null);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    setError(null);

    try {
      // Validar campos obrigatórios
      if (
        !formData.nomeCompleto ||
        !formData.nomeExibicao ||
        !formData.cpf ||
        !formData.emailCorporativo ||
        !formData.senha
      ) {
        throw new Error('Preencha todos os campos obrigatórios');
      }

      const response = await fetch('/api/usuarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          senha: formData.senha,
        }),
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
        err instanceof Error ? err.message : 'Erro ao criar usuário';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof UsuarioDados | 'senha', value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Novo Usuário</DialogTitle>
            <DialogDescription>
              Preencha os dados para criar um novo usuário no sistema
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Campos obrigatórios em grid 2 colunas */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nomeCompleto">
                  Nome Completo <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nomeCompleto"
                  value={formData.nomeCompleto || ''}
                  onChange={(e) => handleChange('nomeCompleto', e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nomeExibicao">
                  Nome de Exibição <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nomeExibicao"
                  value={formData.nomeExibicao || ''}
                  onChange={(e) => handleChange('nomeExibicao', e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cpf">
                  CPF <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="cpf"
                  value={formData.cpf || ''}
                  onChange={(e) => handleChange('cpf', e.target.value)}
                  placeholder="000.000.000-00"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rg">RG</Label>
                <Input
                  id="rg"
                  value={formData.rg || ''}
                  onChange={(e) => handleChange('rg', e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emailCorporativo">
                  E-mail Corporativo <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="emailCorporativo"
                  type="email"
                  value={formData.emailCorporativo || ''}
                  onChange={(e) =>
                    handleChange('emailCorporativo', e.target.value)
                  }
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emailPessoal">E-mail Pessoal</Label>
                <Input
                  id="emailPessoal"
                  type="email"
                  value={formData.emailPessoal || ''}
                  onChange={(e) => handleChange('emailPessoal', e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="senha">
                  Senha <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="senha"
                  type="password"
                  value={formData.senha || ''}
                  onChange={(e) => handleChange('senha', e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={formData.telefone || ''}
                  onChange={(e) => handleChange('telefone', e.target.value)}
                  placeholder="(00) 00000-0000"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dataNascimento">Data de Nascimento</Label>
                <FormDatePicker
                  id="dataNascimento"
                  value={formData.dataNascimento || undefined}
                  onChange={(v) => handleChange('dataNascimento', v)}
                  className="max-w-xs"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="genero">Gênero</Label>
                <select
                  id="genero"
                  aria-label="Gênero"
                  value={formData.genero || ''}
                  onChange={(e) =>
                    handleChange('genero', e.target.value as GeneroUsuario)
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isLoading}
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="oab">OAB</Label>
                <Input
                  id="oab"
                  value={formData.oab || ''}
                  onChange={(e) => handleChange('oab', e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ufOab">UF OAB</Label>
                <Input
                  id="ufOab"
                  value={formData.ufOab || ''}
                  onChange={(e) =>
                    handleChange('ufOab', e.target.value.toUpperCase())
                  }
                  maxLength={2}
                  placeholder="Ex: SP"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ramal">Ramal</Label>
              <Input
                id="ramal"
                value={formData.ramal || ''}
                onChange={(e) => handleChange('ramal', e.target.value)}
                disabled={isLoading}
                className="max-w-xs"
              />
            </div>

            {/* Status do usuário */}
            <div className="border-t pt-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="ativo"
                  checked={formData.ativo ?? true}
                  onCheckedChange={(checked) =>
                    handleChange('ativo', !!checked)
                  }
                  disabled={isLoading}
                />
                <Label htmlFor="ativo" className="cursor-pointer">
                  Usuário ativo
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter>
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
              Criar Usuário
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
