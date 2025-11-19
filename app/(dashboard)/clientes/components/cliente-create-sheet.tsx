'use client';

// Componente Sheet para criação de novo cliente

import * as React from 'react';
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import type { ClienteDados, GeneroCliente, EstadoCivil } from '@/backend/clientes/services/persistence/cliente-persistence.service';

interface ClienteCreateSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ClienteCreateSheet({
  open,
  onOpenChange,
  onSuccess,
}: ClienteCreateSheetProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = React.useState<Partial<ClienteDados>>({
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
      if (!formData.tipoPessoa || !formData.nome) {
        throw new Error('Preencha todos os campos obrigatórios');
      }

      // Validações específicas por tipo
      if (formData.tipoPessoa === 'pf' && !formData.cpf) {
        throw new Error('CPF é obrigatório para pessoa física');
      }

      if (formData.tipoPessoa === 'pj' && !formData.cnpj) {
        throw new Error('CNPJ é obrigatório para pessoa jurídica');
      }

      const response = await fetch('/api/clientes', {
        method: 'POST',
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
        err instanceof Error ? err.message : 'Erro ao criar cliente';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const isPessoaFisica = formData.tipoPessoa === 'pf';
  const isPessoaJuridica = formData.tipoPessoa === 'pj';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto p-6">
        <form onSubmit={handleSubmit}>
          <SheetHeader className="pb-5">
            <SheetTitle className="text-xl font-semibold flex items-center gap-2">
              Novo Cliente
              {formData.tipoPessoa && (
                <Badge variant="outline">
                  {isPessoaFisica ? 'Pessoa Física' : 'Pessoa Jurídica'}
                </Badge>
              )}
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-6">
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Seleção de Tipo de Pessoa */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Tipo de Pessoa *</h3>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-2 cursor-pointer p-4 border rounded-md hover:bg-accent">
                  <input
                    type="radio"
                    name="tipoPessoa"
                    value="pf"
                    checked={formData.tipoPessoa === 'pf'}
                    onChange={(e) => setFormData({ ...formData, tipoPessoa: 'pf' as const })}
                    className="h-4 w-4"
                    required
                  />
                  <span className="text-sm font-medium">Pessoa Física</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer p-4 border rounded-md hover:bg-accent">
                  <input
                    type="radio"
                    name="tipoPessoa"
                    value="pj"
                    checked={formData.tipoPessoa === 'pj'}
                    onChange={(e) => setFormData({ ...formData, tipoPessoa: 'pj' as const })}
                    className="h-4 w-4"
                    required
                  />
                  <span className="text-sm font-medium">Pessoa Jurídica</span>
                </label>
              </div>
            </div>

            {/* Informações Básicas */}
            {formData.tipoPessoa && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Informações Básicas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="nome">
                      {isPessoaFisica ? 'Nome Completo' : 'Razão Social'} *
                    </Label>
                    <Input
                      id="nome"
                      value={formData.nome || ''}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="nomeFantasia">
                      {isPessoaFisica ? 'Nome Social' : 'Nome Fantasia'}
                    </Label>
                    <Input
                      id="nomeFantasia"
                      value={formData.nomeFantasia || ''}
                      onChange={(e) => setFormData({ ...formData, nomeFantasia: e.target.value })}
                      disabled={isLoading}
                    />
                  </div>
                  {isPessoaFisica ? (
                    <>
                      <div>
                        <Label htmlFor="cpf">
                          CPF *
                        </Label>
                        <Input
                          id="cpf"
                          value={formData.cpf || ''}
                          onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                          placeholder="000.000.000-00"
                          required
                          disabled={isLoading}
                        />
                      </div>
                      <div>
                        <Label htmlFor="rg">RG</Label>
                        <Input
                          id="rg"
                          value={formData.rg || ''}
                          onChange={(e) => setFormData({ ...formData, rg: e.target.value })}
                          disabled={isLoading}
                        />
                      </div>
                      <div>
                        <Label htmlFor="dataNascimento">Data de Nascimento</Label>
                        <Input
                          id="dataNascimento"
                          type="date"
                          value={formData.dataNascimento || ''}
                          onChange={(e) => setFormData({ ...formData, dataNascimento: e.target.value })}
                          disabled={isLoading}
                        />
                      </div>
                      <div>
                        <Label htmlFor="genero">Gênero</Label>
                        <select
                          id="genero"
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                          value={formData.genero || ''}
                          onChange={(e) => setFormData({ ...formData, genero: e.target.value as GeneroCliente | undefined })}
                          disabled={isLoading}
                        >
                          <option value="">Selecione...</option>
                          <option value="masculino">Masculino</option>
                          <option value="feminino">Feminino</option>
                          <option value="outro">Outro</option>
                          <option value="prefiro_nao_informar">Prefiro não informar</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="estadoCivil">Estado Civil</Label>
                        <select
                          id="estadoCivil"
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                          value={formData.estadoCivil || ''}
                          onChange={(e) => setFormData({ ...formData, estadoCivil: e.target.value as EstadoCivil | undefined })}
                          disabled={isLoading}
                        >
                          <option value="">Selecione...</option>
                          <option value="solteiro">Solteiro</option>
                          <option value="casado">Casado</option>
                          <option value="divorciado">Divorciado</option>
                          <option value="viuvo">Viúvo</option>
                          <option value="uniao_estavel">União Estável</option>
                          <option value="outro">Outro</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="nacionalidade">Nacionalidade</Label>
                        <Input
                          id="nacionalidade"
                          value={formData.nacionalidade || ''}
                          onChange={(e) => setFormData({ ...formData, nacionalidade: e.target.value })}
                          disabled={isLoading}
                        />
                      </div>
                      <div>
                        <Label htmlFor="naturalidade">Naturalidade</Label>
                        <Input
                          id="naturalidade"
                          value={formData.naturalidade || ''}
                          onChange={(e) => setFormData({ ...formData, naturalidade: e.target.value })}
                          placeholder="Cidade/Estado"
                          disabled={isLoading}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <Label htmlFor="cnpj">
                          CNPJ *
                        </Label>
                        <Input
                          id="cnpj"
                          value={formData.cnpj || ''}
                          onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                          placeholder="00.000.000/0000-00"
                          required
                          disabled={isLoading}
                        />
                      </div>
                      <div>
                        <Label htmlFor="inscricaoEstadual">Inscrição Estadual</Label>
                        <Input
                          id="inscricaoEstadual"
                          value={formData.inscricaoEstadual || ''}
                          onChange={(e) => setFormData({ ...formData, inscricaoEstadual: e.target.value })}
                          disabled={isLoading}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Contato */}
            {formData.tipoPessoa && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Contato</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <Label htmlFor="telefonePrimario">Telefone Primário</Label>
                    <Input
                      id="telefonePrimario"
                      value={formData.telefonePrimario || ''}
                      onChange={(e) => setFormData({ ...formData, telefonePrimario: e.target.value })}
                      placeholder="(00) 00000-0000"
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <Label htmlFor="telefoneSecundario">Telefone Secundário</Label>
                    <Input
                      id="telefoneSecundario"
                      value={formData.telefoneSecundario || ''}
                      onChange={(e) => setFormData({ ...formData, telefoneSecundario: e.target.value })}
                      placeholder="(00) 00000-0000"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Endereço */}
            {formData.tipoPessoa && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Endereço</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="logradouro">Logradouro</Label>
                    <Input
                      id="logradouro"
                      value={formData.endereco?.logradouro || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        endereco: { ...formData.endereco, logradouro: e.target.value },
                      })}
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <Label htmlFor="numero">Número</Label>
                    <Input
                      id="numero"
                      value={formData.endereco?.numero || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        endereco: { ...formData.endereco, numero: e.target.value },
                      })}
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <Label htmlFor="complemento">Complemento</Label>
                    <Input
                      id="complemento"
                      value={formData.endereco?.complemento || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        endereco: { ...formData.endereco, complemento: e.target.value },
                      })}
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <Label htmlFor="bairro">Bairro</Label>
                    <Input
                      id="bairro"
                      value={formData.endereco?.bairro || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        endereco: { ...formData.endereco, bairro: e.target.value },
                      })}
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cidade">Cidade</Label>
                    <Input
                      id="cidade"
                      value={formData.endereco?.cidade || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        endereco: { ...formData.endereco, cidade: e.target.value },
                      })}
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <Label htmlFor="estado">Estado</Label>
                    <Input
                      id="estado"
                      value={formData.endereco?.estado || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        endereco: { ...formData.endereco, estado: e.target.value },
                      })}
                      maxLength={2}
                      placeholder="UF"
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cep">CEP</Label>
                    <Input
                      id="cep"
                      value={formData.endereco?.cep || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        endereco: { ...formData.endereco, cep: e.target.value },
                      })}
                      placeholder="00000-000"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Observações */}
            {formData.tipoPessoa && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Observações</h3>
                <div>
                  <Label htmlFor="observacoes">Observações Gerais</Label>
                  <textarea
                    id="observacoes"
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.observacoes || ''}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    rows={4}
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            {/* Status */}
            {formData.tipoPessoa && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Status</h3>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="ativo"
                    checked={formData.ativo ?? true}
                    onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                    disabled={isLoading}
                  />
                  <Label htmlFor="ativo" className="cursor-pointer">
                    Cliente ativo
                  </Label>
                </div>
              </div>
            )}
          </div>

          <SheetFooter className="pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !formData.tipoPessoa}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Cliente
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

