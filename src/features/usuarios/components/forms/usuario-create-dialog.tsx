
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormDatePicker } from '@/components/ui/form-date-picker';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { actionCriarUsuario } from '../../actions/usuarios-actions';
import type { UsuarioDados, GeneroUsuario } from '../../types';
import { DialogFormShell } from '@/components/shared/dialog-form-shell';

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
  // Nota: senha é obrigatória na criação pela interface
  const [formData, setFormData] = React.useState<
    Partial<UsuarioDados & { senha?: string }>
  >({
    ativo: true,
  });

  const formRef = React.useRef<HTMLFormElement>(null);

  React.useEffect(() => {
    if (!open) {
      setFormData({ ativo: true });
      setError(null);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    setError(null);

    try {
      if (
        !formData.nomeCompleto ||
        !formData.nomeExibicao ||
        !formData.cpf ||
        !formData.emailCorporativo ||
        !formData.senha
      ) {
        throw new Error('Preencha todos os campos obrigatórios');
      }

      // Casting para passar os dados requeridos, omitindo authUserId que vem do action se necessário
      const payload = {
         nomeCompleto: formData.nomeCompleto,
         nomeExibicao: formData.nomeExibicao,
         cpf: formData.cpf,
         emailCorporativo: formData.emailCorporativo,
         senha: formData.senha,
         rg: formData.rg,
         dataNascimento: formData.dataNascimento,
         genero: formData.genero,
         oab: formData.oab,
         ufOab: formData.ufOab,
         emailPessoal: formData.emailPessoal,
         telefone: formData.telefone,
         ramal: formData.ramal,
         ativo: formData.ativo,
      };

      const result = await actionCriarUsuario(payload);

      if (!result.sucesso) {
        throw new Error(result.erro || 'Erro ao criar usuário');
      }

      toast.success('Usuário criado com sucesso!');
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
    <DialogFormShell
      open={open}
      onOpenChange={onOpenChange}
      title="Novo Usuário"
      description="Preencha os dados para criar um novo usuário no sistema"
      maxWidth="2xl"
      footer={
        <>
            <Button
              type="submit"
              onClick={() => formRef.current?.requestSubmit()}
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Usuário
            </Button>
        </>
      }
    >
        <form ref={formRef} onSubmit={handleSubmit}>
          <div className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dataNascimento">Data de Nascimento</Label>
                <FormDatePicker
                  id="dataNascimento"
                  value={formData.dataNascimento || undefined}
                  onChange={(v) => handleChange('dataNascimento', v)}
                  className="w-full"
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </form>
    </DialogFormShell>
  );
}
