'use client';

import { useState, useEffect } from 'react';
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
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Save, Search, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { Usuario, Endereco } from '@/backend/usuarios/services/persistence/usuario-persistence.service';
import { useCargosAtivos } from '@/app/_lib/hooks/use-cargos';
import { buscarEnderecoPorCep, limparCep } from '@/app/_lib/utils/viacep';
import { Typography } from '@/components/ui/typography';

interface UsuarioEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usuario: Usuario;
  onSuccess?: () => void;
}

export function UsuarioEditDialog({
  open,
  onOpenChange,
  usuario,
  onSuccess,
}: UsuarioEditDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isBuscandoCep, setIsBuscandoCep] = useState(false);
  const [formData, setFormData] = useState({
    nomeCompleto: '',
    nomeExibicao: '',
    cpf: '',
    rg: '',
    dataNascimento: '',
    genero: '',
    oab: '',
    ufOab: '',
    cargoId: null as number | null,
    emailPessoal: '',
    emailCorporativo: '',
    telefone: '',
    ramal: '',
    endereco: {
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
      cep: '',
    } as Endereco,
    ativo: true,
  });

  // Buscar lista de cargos
  const { cargos, isLoading: isLoadingCargos } = useCargosAtivos();

  // Preencher formulário quando usuário mudar
  useEffect(() => {
    if (usuario) {
      setFormData({
        nomeCompleto: usuario.nomeCompleto || '',
        nomeExibicao: usuario.nomeExibicao || '',
        cpf: usuario.cpf || '',
        rg: usuario.rg || '',
        dataNascimento: usuario.dataNascimento || '',
        genero: usuario.genero || '',
        oab: usuario.oab || '',
        ufOab: usuario.ufOab || '',
        cargoId: usuario.cargo?.id || null,
        emailPessoal: usuario.emailPessoal || '',
        emailCorporativo: usuario.emailCorporativo || '',
        telefone: usuario.telefone || '',
        ramal: usuario.ramal || '',
        endereco: {
          logradouro: usuario.endereco?.logradouro || '',
          numero: usuario.endereco?.numero || '',
          complemento: usuario.endereco?.complemento || '',
          bairro: usuario.endereco?.bairro || '',
          cidade: usuario.endereco?.cidade || '',
          estado: usuario.endereco?.estado || '',
          cep: usuario.endereco?.cep || '',
        },
        ativo: usuario.ativo,
      });
    }
  }, [usuario]);

  // Função para buscar endereço por CEP
  const handleBuscarCep = async () => {
    if (!formData.endereco.cep) {
      toast.error('Digite um CEP primeiro');
      return;
    }

    const cep = limparCep(formData.endereco.cep);

    if (cep.length !== 8) {
      toast.error('CEP deve conter 8 dígitos');
      return;
    }

    setIsBuscandoCep(true);

    try {
      const endereco = await buscarEnderecoPorCep(cep);

      if (!endereco) {
        toast.error('CEP não encontrado');
        return;
      }

      // Preencher campos do endereço
      setFormData({
        ...formData,
        endereco: {
          ...formData.endereco,
          cep: endereco.cep,
          logradouro: endereco.logradouro,
          bairro: endereco.bairro,
          cidade: endereco.cidade,
          estado: endereco.estado,
          complemento: endereco.complemento || formData.endereco.complemento,
        },
      });

      toast.success('Endereço encontrado!');
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Erro ao buscar CEP. Tente novamente.'
      );
    } finally {
      setIsBuscandoCep(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch(`/api/usuarios/${usuario.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          cargoId: formData.cargoId || null,
          // Remover campos vazios do endereço
          endereco: Object.values(formData.endereco).some((v) => v)
            ? formData.endereco
            : null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao atualizar usuário');
      }

      const result = await response.json();

      // Detectar desativação e mostrar feedback detalhado
      if (result.itensDesatribuidos) {
        const { total, processos, audiencias, pendentes, expedientes_manuais, contratos } =
          result.itensDesatribuidos;

        if (total > 0) {
          const itens = [];
          if (processos > 0) itens.push(`${processos} processo(s)`);
          if (audiencias > 0) itens.push(`${audiencias} audiência(s)`);
          if (pendentes > 0) itens.push(`${pendentes} pendente(s)`);
          if (expedientes_manuais > 0) itens.push(`${expedientes_manuais} expediente(s)`);
          if (contratos > 0) itens.push(`${contratos} contrato(s)`);

          toast.success(
            `Usuário desativado e desatribuído de ${total} ${total === 1 ? 'item' : 'itens'}`,
            {
              description: itens.join(', '),
              duration: 6000,
            }
          );
        } else {
          toast.success('Usuário desativado com sucesso!');
        }
      } else {
        toast.success('Usuário atualizado com sucesso!');
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Erro ao atualizar usuário. Tente novamente.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Atualize as informações do usuário no sistema.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Nome Completo e Nome de Exibição */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="nomeCompleto">
                  Nome Completo <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nomeCompleto"
                  value={formData.nomeCompleto}
                  onChange={(e) =>
                    setFormData({ ...formData, nomeCompleto: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="nomeExibicao">
                  Nome de Exibição <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nomeExibicao"
                  value={formData.nomeExibicao}
                  onChange={(e) =>
                    setFormData({ ...formData, nomeExibicao: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            {/* Data de Nascimento e Gênero */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="dataNascimento">Data de Nascimento</Label>
                <Input
                  id="dataNascimento"
                  type="date"
                  value={formData.dataNascimento}
                  onChange={(e) =>
                    setFormData({ ...formData, dataNascimento: e.target.value })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="genero">Gênero</Label>
                <Select
                  value={formData.genero}
                  onValueChange={(value) =>
                    setFormData({ ...formData, genero: value })
                  }
                >
                  <SelectTrigger id="genero">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="feminino">Feminino</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                    <SelectItem value="prefiro_nao_informar">
                      Prefiro não informar
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* CPF e RG */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  value={formData.cpf}
                  onChange={(e) =>
                    setFormData({ ...formData, cpf: e.target.value })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="rg">RG</Label>
                <Input
                  id="rg"
                  value={formData.rg}
                  onChange={(e) =>
                    setFormData({ ...formData, rg: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Telefone e Ramal */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) =>
                    setFormData({ ...formData, telefone: e.target.value })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="ramal">Ramal</Label>
                <Input
                  id="ramal"
                  value={formData.ramal}
                  onChange={(e) =>
                    setFormData({ ...formData, ramal: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Email Corporativo e Email Pessoal */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="emailCorporativo">
                  E-mail Corporativo <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="emailCorporativo"
                  type="email"
                  value={formData.emailCorporativo}
                  onChange={(e) =>
                    setFormData({ ...formData, emailCorporativo: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="emailPessoal">E-mail Pessoal</Label>
                <Input
                  id="emailPessoal"
                  type="email"
                  value={formData.emailPessoal}
                  onChange={(e) =>
                    setFormData({ ...formData, emailPessoal: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Cargo, OAB e UF OAB */}
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="cargo">Cargo</Label>
                <Select
                  value={formData.cargoId?.toString() || 'none'}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      cargoId: value === 'none' ? null : parseInt(value, 10),
                    })
                  }
                  disabled={isLoadingCargos}
                >
                  <SelectTrigger id="cargo">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {cargos.map((cargo) => (
                      <SelectItem key={cargo.id} value={cargo.id.toString()}>
                        {cargo.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="oab">OAB</Label>
                <Input
                  id="oab"
                  value={formData.oab}
                  onChange={(e) =>
                    setFormData({ ...formData, oab: e.target.value })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="ufOab">UF OAB</Label>
                <Input
                  id="ufOab"
                  value={formData.ufOab}
                  maxLength={2}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      ufOab: e.target.value.toUpperCase(),
                    })
                  }
                />
              </div>
            </div>

            {/* Endereço */}
            <div className="border-t pt-4 mt-2">
              <Typography.Small className="font-medium mb-3 block">Endereço</Typography.Small>

              <div className="grid gap-4">
                {/* CEP */}
                <div className="grid gap-2">
                  <Label htmlFor="cep">CEP</Label>
                  <div className="flex gap-2">
                    <Input
                      id="cep"
                      value={formData.endereco.cep}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          endereco: { ...formData.endereco, cep: e.target.value },
                        })
                      }
                      placeholder="00000-000"
                      maxLength={9}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleBuscarCep}
                      disabled={isBuscandoCep}
                      title="Buscar CEP"
                    >
                      {isBuscandoCep ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Logradouro, Número e Complemento */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="logradouro">Logradouro</Label>
                    <Input
                      id="logradouro"
                      value={formData.endereco.logradouro}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          endereco: {
                            ...formData.endereco,
                            logradouro: e.target.value,
                          },
                        })
                      }
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="numero">Número</Label>
                    <Input
                      id="numero"
                      value={formData.endereco.numero}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          endereco: { ...formData.endereco, numero: e.target.value },
                        })
                      }
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="complemento">Complemento</Label>
                    <Input
                      id="complemento"
                      value={formData.endereco.complemento}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          endereco: {
                            ...formData.endereco,
                            complemento: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                </div>

                {/* Bairro, Cidade e Estado */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="bairro">Bairro</Label>
                    <Input
                      id="bairro"
                      value={formData.endereco.bairro}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          endereco: { ...formData.endereco, bairro: e.target.value },
                        })
                      }
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="cidade">Cidade</Label>
                    <Input
                      id="cidade"
                      value={formData.endereco.cidade}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          endereco: { ...formData.endereco, cidade: e.target.value },
                        })
                      }
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="estado">UF</Label>
                    <Input
                      id="estado"
                      maxLength={2}
                      value={formData.endereco.estado}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          endereco: {
                            ...formData.endereco,
                            estado: e.target.value.toUpperCase(),
                          },
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Status do Usuário */}
            <div className="border-t pt-4 mt-2">
              <Typography.Small className="font-medium mb-3 block">Status do Usuário</Typography.Small>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="ativo"
                    checked={formData.ativo}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, ativo: !!checked })
                    }
                  />
                  <Label htmlFor="ativo" className="cursor-pointer font-normal">
                    Usuário ativo
                  </Label>
                </div>

                {/* Warning quando desativar */}
                {!formData.ativo && usuario.ativo && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Atenção:</strong> Desativar este usuário irá desatribuí-lo
                      automaticamente de todos os processos, audiências, pendentes,
                      expedientes e contratos atribuídos a ele. Você receberá um relatório
                      detalhado dos itens desatribuídos.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Info quando reativar */}
                {formData.ativo && !usuario.ativo && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Este usuário será reativado e poderá acessar o sistema normalmente.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
