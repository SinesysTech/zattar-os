'use client';

/**
 * Dialog de Edição de Cliente
 * Com tabs para organizar campos: Identificação, Contato, Endereço
 * Responsivo e sem scroll vertical em desktop
 */

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ClientOnlyTabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/client-only-tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormDatePicker } from '@/components/ui/form-date-picker';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, User, Phone, MapPin, X, Plus } from 'lucide-react';
import { toast } from 'sonner';
import InputCEP, { type InputCepAddress } from '@/components/assinatura-digital/inputs/input-cep';
import InputTelefone from '@/components/assinatura-digital/inputs/input-telefone';
import type { Cliente, ClientePessoaFisica, ClientePessoaJuridica } from '@/types/domain/partes';

interface ClienteEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cliente: ClienteComEndereco;
  onSuccess?: () => void;
}

type ClienteEndereco = {
  id?: number;
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  municipio?: string | null;
  estado_sigla?: string | null;
};

type ClienteComEndereco = Cliente & { endereco?: ClienteEndereco | null };

// Estados brasileiros
const ESTADOS_BR = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

// Estados civis
const ESTADOS_CIVIS = [
  { value: 'solteiro', label: 'Solteiro(a)' },
  { value: 'casado', label: 'Casado(a)' },
  { value: 'divorciado', label: 'Divorciado(a)' },
  { value: 'viuvo', label: 'Viúvo(a)' },
  { value: 'uniao_estavel', label: 'União Estável' },
  { value: 'separado', label: 'Separado(a)' },
];

// Gêneros
const GENEROS = [
  { value: 'masculino', label: 'Masculino' },
  { value: 'feminino', label: 'Feminino' },
  { value: 'outro', label: 'Outro' },
  { value: 'nao_informado', label: 'Prefiro não informar' },
];

export function ClienteEditDialog({
  open,
  onOpenChange,
  cliente,
  onSuccess,
}: ClienteEditDialogProps) {
  const [isSaving, setIsSaving] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('identificacao');
  const isPF = cliente.tipo_pessoa === 'pf';

  // Form state
  const [formData, setFormData] = React.useState({
    // Identificação
    nome: '',
    nome_social_fantasia: '',
    cpf: '',
    cnpj: '',
    rg: '',
    data_nascimento: '',
    data_abertura: '',
    genero: '',
    sexo: '',
    estado_civil: '',
    nacionalidade: '',
    nome_genitora: '',
    inscricao_estadual: '',
    // Contato
    emails: [] as string[],
    ddd_celular: '',
    numero_celular: '',
    ddd_residencial: '',
    numero_residencial: '',
    ddd_comercial: '',
    numero_comercial: '',
    // Endereço
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    municipio: '',
    estado_sigla: '',
    // Outros
    observacoes: '',
    ativo: true,
  });

  // Email input temporário
  const [novoEmail, setNovoEmail] = React.useState('');

  // Preencher formulário quando cliente mudar
  React.useEffect(() => {
    if (cliente) {
      const endereco = cliente.endereco ?? null;
      const clientePF = cliente.tipo_pessoa === 'pf' ? (cliente as ClientePessoaFisica) : null;
      const clientePJ = cliente.tipo_pessoa === 'pj' ? (cliente as ClientePessoaJuridica) : null;
      setFormData({
        nome: cliente.nome || '',
        nome_social_fantasia: cliente.nome_social_fantasia || '',
        cpf: clientePF?.cpf || '',
        cnpj: clientePJ?.cnpj || '',
        rg: clientePF?.rg || '',
        data_nascimento: clientePF?.data_nascimento || '',
        data_abertura: clientePJ?.data_abertura || '',
        genero: clientePF?.genero || '',
        sexo: clientePF?.sexo || '',
        estado_civil: clientePF?.estado_civil || '',
        nacionalidade: clientePF?.nacionalidade || '',
        nome_genitora: clientePF?.nome_genitora || '',
        inscricao_estadual: clientePJ?.inscricao_estadual || '',
        emails: cliente.emails || [],
        ddd_celular: cliente.ddd_celular || '',
        numero_celular: cliente.numero_celular || '',
        ddd_residencial: cliente.ddd_residencial || '',
        numero_residencial: cliente.numero_residencial || '',
        ddd_comercial: cliente.ddd_comercial || '',
        numero_comercial: cliente.numero_comercial || '',
        cep: endereco?.cep || '',
        logradouro: endereco?.logradouro || '',
        numero: endereco?.numero || '',
        complemento: endereco?.complemento || '',
        bairro: endereco?.bairro || '',
        municipio: endereco?.municipio || '',
        estado_sigla: endereco?.estado_sigla || '',
        observacoes: cliente.observacoes || '',
        ativo: cliente.ativo,
      });
    }
  }, [cliente, isPF]);

  // Handler para adicionar email
  const handleAddEmail = () => {
    if (novoEmail && novoEmail.includes('@')) {
      setFormData(prev => ({
        ...prev,
        emails: [...prev.emails, novoEmail],
      }));
      setNovoEmail('');
    }
  };

  // Handler para remover email
  const handleRemoveEmail = (index: number) => {
    setFormData(prev => ({
      ...prev,
      emails: prev.emails.filter((_, i) => i !== index),
    }));
  };

  // Handler para endereço encontrado via CEP
  const handleAddressFound = (address: InputCepAddress) => {
    setFormData(prev => ({
      ...prev,
      logradouro: address.logradouro || prev.logradouro,
      bairro: address.bairro || prev.bairro,
      municipio: address.localidade || prev.municipio,
      estado_sigla: address.uf || prev.estado_sigla,
    }));
  };

  // Formatar telefone para DDD + Número separados
  const formatTelefoneToFields = (telefone: string) => {
    const numeros = telefone.replace(/\D/g, '');
    if (numeros.length >= 10) {
      return {
        ddd: numeros.substring(0, 2),
        numero: numeros.substring(2),
      };
    }
    return { ddd: '', numero: '' };
  };

  // Verificar se há dados de endereço preenchidos
  const hasEnderecoData = () => {
    return !!(
      formData.cep?.trim() ||
      formData.logradouro?.trim() ||
      formData.numero?.trim() ||
      formData.bairro?.trim() ||
      formData.municipio?.trim() ||
      formData.estado_sigla
    );
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // Preparar dados para API
      const dadosAtualizacao: Record<string, unknown> = {
        nome: formData.nome,
        nome_social_fantasia: formData.nome_social_fantasia || null,
        emails: formData.emails.length > 0 ? formData.emails : null,
        ddd_celular: formData.ddd_celular || null,
        numero_celular: formData.numero_celular || null,
        ddd_residencial: formData.ddd_residencial || null,
        numero_residencial: formData.numero_residencial || null,
        ddd_comercial: formData.ddd_comercial || null,
        numero_comercial: formData.numero_comercial || null,
        observacoes: formData.observacoes || null,
        ativo: formData.ativo,
      };

      // Campos específicos PF
      if (isPF) {
        dadosAtualizacao.rg = formData.rg || null;
        dadosAtualizacao.data_nascimento = formData.data_nascimento || null;
        dadosAtualizacao.genero = formData.genero || null;
        dadosAtualizacao.sexo = formData.sexo || null;
        dadosAtualizacao.estado_civil = formData.estado_civil || null;
        dadosAtualizacao.nacionalidade = formData.nacionalidade || null;
        dadosAtualizacao.nome_genitora = formData.nome_genitora || null;
      } else {
        // Campos específicos PJ
        dadosAtualizacao.inscricao_estadual = formData.inscricao_estadual || null;
        dadosAtualizacao.data_abertura = formData.data_abertura || null;
      }

      // Tratar endereço: criar ou atualizar
      if (hasEnderecoData()) {
        const enderecoPayload = {
          entidade_tipo: 'cliente',
          entidade_id: cliente.id,
          cep: formData.cep?.replace(/\D/g, '') || null,
          logradouro: formData.logradouro?.trim() || null,
          numero: formData.numero?.trim() || null,
          complemento: formData.complemento?.trim() || null,
          bairro: formData.bairro?.trim() || null,
          municipio: formData.municipio?.trim() || null,
          estado_sigla: formData.estado_sigla || null,
        };

        const enderecoExistente = cliente.endereco;

        if (enderecoExistente?.id) {
          // Atualizar endereço existente
          const enderecoResponse = await fetch(`/api/enderecos/${enderecoExistente.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(enderecoPayload),
          });

          if (!enderecoResponse.ok) {
            console.warn('Não foi possível atualizar o endereço');
          }
        } else {
          // Criar novo endereço
          const enderecoResponse = await fetch('/api/enderecos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(enderecoPayload),
          });

          if (enderecoResponse.ok) {
            const enderecoData = await enderecoResponse.json();
            const enderecoId = enderecoData.data?.id;

            // Vincular ao cliente
            if (enderecoId) {
              dadosAtualizacao.endereco_id = enderecoId;
            }
          } else {
            console.warn('Não foi possível criar o endereço');
          }
        }
      }

      const response = await fetch(`/api/clientes/${cliente.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosAtualizacao),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao atualizar cliente');
      }

      toast.success('Cliente atualizado com sucesso!');
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Erro ao atualizar cliente. Tente novamente.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[85vh]">
          <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
            <DialogTitle className="flex items-center gap-2">
              Editar Cliente
              <Badge variant={isPF ? 'default' : 'secondary'}>
                {isPF ? 'Pessoa Física' : 'Pessoa Jurídica'}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              Atualize as informações do cliente {cliente.nome}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            <ClientOnlyTabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="h-full flex flex-col"
            >
              <TabsList className="mx-6 mt-4 w-fit shrink-0">
                <TabsTrigger value="identificacao" className="gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Identificação</span>
                  <span className="sm:hidden">ID</span>
                </TabsTrigger>
                <TabsTrigger value="contato" className="gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Contato</span>
                  <span className="sm:hidden">Tel</span>
                </TabsTrigger>
                <TabsTrigger value="endereco" className="gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Endereço</span>
                  <span className="sm:hidden">End</span>
                </TabsTrigger>
              </TabsList>

              {/* Tab Identificação */}
              <TabsContent
                value="identificacao"
                className="flex-1 overflow-y-auto px-6 py-4 data-[state=inactive]:hidden"
              >
                <div className="grid gap-4">
                  {/* Nome */}
                  <div className="grid gap-2">
                    <Label htmlFor="nome">
                      Nome {isPF ? 'Completo' : 'Empresarial'} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      required
                    />
                  </div>

                  {/* Nome Social/Fantasia */}
                  <div className="grid gap-2">
                    <Label htmlFor="nome_social_fantasia">
                      {isPF ? 'Nome Social' : 'Nome Fantasia'}
                    </Label>
                    <Input
                      id="nome_social_fantasia"
                      value={formData.nome_social_fantasia}
                      onChange={(e) => setFormData({ ...formData, nome_social_fantasia: e.target.value })}
                    />
                  </div>

                  {/* CPF/CNPJ (readonly) */}
                  <div className="grid gap-2">
                    <Label>{isPF ? 'CPF' : 'CNPJ'}</Label>
                    <Input
                      value={isPF ? formData.cpf : formData.cnpj}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      Documento não pode ser alterado
                    </p>
                  </div>

                  {/* Campos específicos PF */}
                  {isPF && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="rg">RG</Label>
                          <Input
                            id="rg"
                            value={formData.rg}
                            onChange={(e) => setFormData({ ...formData, rg: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="data_nascimento">Data de Nascimento</Label>
                          <FormDatePicker id="data_nascimento" value={formData.data_nascimento || undefined} onChange={(v) => setFormData({ ...formData, data_nascimento: v || '' })} />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="genero">Gênero</Label>
                          <Select
                            value={formData.genero}
                            onValueChange={(value) => setFormData({ ...formData, genero: value })}
                          >
                            <SelectTrigger id="genero">
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                              {GENEROS.map((g) => (
                                <SelectItem key={g.value} value={g.value}>
                                  {g.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="estado_civil">Estado Civil</Label>
                          <Select
                            value={formData.estado_civil}
                            onValueChange={(value) => setFormData({ ...formData, estado_civil: value })}
                          >
                            <SelectTrigger id="estado_civil">
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                              {ESTADOS_CIVIS.map((ec) => (
                                <SelectItem key={ec.value} value={ec.value}>
                                  {ec.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="nacionalidade">Nacionalidade</Label>
                          <Input
                            id="nacionalidade"
                            value={formData.nacionalidade}
                            onChange={(e) => setFormData({ ...formData, nacionalidade: e.target.value })}
                            placeholder="Ex: Brasileira"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="nome_genitora">Nome da Mãe</Label>
                          <Input
                            id="nome_genitora"
                            value={formData.nome_genitora}
                            onChange={(e) => setFormData({ ...formData, nome_genitora: e.target.value })}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Campos específicos PJ */}
                  {!isPF && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="inscricao_estadual">Inscrição Estadual</Label>
                          <Input
                            id="inscricao_estadual"
                            value={formData.inscricao_estadual}
                            onChange={(e) => setFormData({ ...formData, inscricao_estadual: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="data_abertura">Data de Abertura</Label>
                          <FormDatePicker id="data_abertura" value={formData.data_abertura || undefined} onChange={(v) => setFormData({ ...formData, data_abertura: v || '' })} />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Status */}
                  <div className="flex items-center space-x-2 pt-2">
                    <Checkbox
                      id="ativo"
                      checked={formData.ativo}
                      onCheckedChange={(checked) => setFormData({ ...formData, ativo: !!checked })}
                    />
                    <Label htmlFor="ativo" className="cursor-pointer font-normal">
                      Cliente ativo
                    </Label>
                  </div>
                </div>
              </TabsContent>

              {/* Tab Contato */}
              <TabsContent
                value="contato"
                className="flex-1 overflow-y-auto px-6 py-4 data-[state=inactive]:hidden"
              >
                <div className="grid gap-4">
                  {/* E-mails */}
                  <div className="grid gap-2">
                    <Label>E-mails</Label>
                    <div className="flex gap-2">
                      <Input
                        type="email"
                        value={novoEmail}
                        onChange={(e) => setNovoEmail(e.target.value)}
                        placeholder="Digite um e-mail..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddEmail();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={handleAddEmail}
                        disabled={!novoEmail || !novoEmail.includes('@')}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {formData.emails.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.emails.map((email, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="gap-1 pr-1"
                          >
                            {email}
                            <button
                              type="button"
                              onClick={() => handleRemoveEmail(index)}
                              className="ml-1 hover:bg-muted rounded-full p-0.5"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Telefone Celular */}
                  <div className="grid gap-2">
                    <Label>Celular</Label>
                    <InputTelefone
                      mode="cell"
                      value={formData.ddd_celular && formData.numero_celular
                        ? `(${formData.ddd_celular}) ${formData.numero_celular}`
                        : ''
                      }
                      onChange={(e) => {
                        const { ddd, numero } = formatTelefoneToFields(e.target.value);
                        setFormData({
                          ...formData,
                          ddd_celular: ddd,
                          numero_celular: numero,
                        });
                      }}
                      placeholder="(00) 00000-0000"
                    />
                  </div>

                  {/* Telefone Residencial */}
                  <div className="grid gap-2">
                    <Label>Telefone Residencial</Label>
                    <InputTelefone
                      mode="landline"
                      value={formData.ddd_residencial && formData.numero_residencial
                        ? `(${formData.ddd_residencial}) ${formData.numero_residencial}`
                        : ''
                      }
                      onChange={(e) => {
                        const { ddd, numero } = formatTelefoneToFields(e.target.value);
                        setFormData({
                          ...formData,
                          ddd_residencial: ddd,
                          numero_residencial: numero,
                        });
                      }}
                      placeholder="(00) 0000-0000"
                    />
                  </div>

                  {/* Telefone Comercial */}
                  <div className="grid gap-2">
                    <Label>Telefone Comercial</Label>
                    <InputTelefone
                      mode="landline"
                      value={formData.ddd_comercial && formData.numero_comercial
                        ? `(${formData.ddd_comercial}) ${formData.numero_comercial}`
                        : ''
                      }
                      onChange={(e) => {
                        const { ddd, numero } = formatTelefoneToFields(e.target.value);
                        setFormData({
                          ...formData,
                          ddd_comercial: ddd,
                          numero_comercial: numero,
                        });
                      }}
                      placeholder="(00) 0000-0000"
                    />
                  </div>

                  {/* Observações */}
                  <div className="grid gap-2">
                    <Label htmlFor="observacoes">Observações</Label>
                    <Textarea
                      id="observacoes"
                      value={formData.observacoes}
                      onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                      placeholder="Observações sobre o cliente..."
                      rows={3}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Tab Endereço */}
              <TabsContent
                value="endereco"
                className="flex-1 overflow-y-auto px-6 py-4 data-[state=inactive]:hidden"
              >
                <div className="grid gap-4">
                  {/* CEP */}
                  <div className="grid gap-2">
                    <Label>CEP</Label>
                    <InputCEP
                      value={formData.cep}
                      onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                      onAddressFound={handleAddressFound}
                      placeholder="00000-000"
                    />
                  </div>

                  {/* Logradouro */}
                  <div className="grid gap-2">
                    <Label htmlFor="logradouro">Logradouro</Label>
                    <Input
                      id="logradouro"
                      value={formData.logradouro}
                      onChange={(e) => setFormData({ ...formData, logradouro: e.target.value })}
                      placeholder="Rua, Avenida, etc."
                    />
                  </div>

                  {/* Número e Complemento */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="numero">Número</Label>
                      <Input
                        id="numero"
                        value={formData.numero}
                        onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="complemento">Complemento</Label>
                      <Input
                        id="complemento"
                        value={formData.complemento}
                        onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                        placeholder="Apto, Sala, etc."
                      />
                    </div>
                  </div>

                  {/* Bairro */}
                  <div className="grid gap-2">
                    <Label htmlFor="bairro">Bairro</Label>
                    <Input
                      id="bairro"
                      value={formData.bairro}
                      onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                    />
                  </div>

                  {/* Cidade e Estado */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="municipio">Cidade</Label>
                      <Input
                        id="municipio"
                        value={formData.municipio}
                        onChange={(e) => setFormData({ ...formData, municipio: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="estado_sigla">Estado</Label>
                      <Select
                        value={formData.estado_sigla}
                        onValueChange={(value) => setFormData({ ...formData, estado_sigla: value })}
                      >
                        <SelectTrigger id="estado_sigla">
                          <SelectValue placeholder="UF" />
                        </SelectTrigger>
                        <SelectContent>
                          {ESTADOS_BR.map((uf) => (
                            <SelectItem key={uf} value={uf}>
                              {uf}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </ClientOnlyTabs>
          </div>

          <DialogFooter className="px-6 py-4 border-t shrink-0">
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
