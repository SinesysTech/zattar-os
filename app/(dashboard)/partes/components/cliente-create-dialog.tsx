'use client';

/**
 * Dialog de Criação de Cliente (Wizard Multi-Step)
 *
 * Steps:
 * 1. Tipo de Pessoa (PF/PJ)
 * 2. Identificação (Nome, CPF/CNPJ, etc.)
 * 3. Contato (Emails, Telefones)
 * 4. Endereço (CEP, Logradouro, etc.)
 * 5. Informações Adicionais (Observações, Status)
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { cn } from '@/lib/utils';
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  User,
  Building2,
  X,
  Plus,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import InputCEP, { type InputCepAddress } from '@/components/formsign/inputs/input-cep';
import InputTelefone from '@/components/formsign/inputs/input-telefone';

interface ClienteCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

// Total de steps do wizard
const TOTAL_STEPS = 5;

// Títulos e descrições de cada step
const STEP_INFO = {
  1: {
    title: 'Tipo de Pessoa',
    description: 'Selecione se o cliente é pessoa física ou jurídica',
  },
  2: {
    title: 'Identificação',
    description: 'Informe os dados de identificação do cliente',
  },
  3: {
    title: 'Contato',
    description: 'Informe os dados de contato do cliente',
  },
  4: {
    title: 'Endereço',
    description: 'Informe o endereço do cliente',
  },
  5: {
    title: 'Informações Adicionais',
    description: 'Revise e adicione observações se necessário',
  },
};

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

// Validação de CPF
function validarCPF(cpf: string): boolean {
  const cpfLimpo = cpf.replace(/\D/g, '');
  if (cpfLimpo.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpfLimpo)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpfLimpo.charAt(i)) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpfLimpo.charAt(9))) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpfLimpo.charAt(i)) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpfLimpo.charAt(10))) return false;

  return true;
}

// Validação de CNPJ
function validarCNPJ(cnpj: string): boolean {
  const cnpjLimpo = cnpj.replace(/\D/g, '');
  if (cnpjLimpo.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cnpjLimpo)) return false;

  let tamanho = cnpjLimpo.length - 2;
  let numeros = cnpjLimpo.substring(0, tamanho);
  const digitos = cnpjLimpo.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(0))) return false;

  tamanho = tamanho + 1;
  numeros = cnpjLimpo.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(1))) return false;

  return true;
}

// Máscara de CPF
function formatarCPF(value: string): string {
  const numeros = value.replace(/\D/g, '').slice(0, 11);
  return numeros
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

// Máscara de CNPJ
function formatarCNPJ(value: string): string {
  const numeros = value.replace(/\D/g, '').slice(0, 14);
  return numeros
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

// Estado inicial do formulário
const INITIAL_FORM_STATE = {
  // Step 1
  tipo_pessoa: null as 'pf' | 'pj' | null,
  // Step 2 - Identificação
  nome: '',
  nome_social_fantasia: '',
  cpf: '',
  cnpj: '',
  rg: '',
  data_nascimento: '',
  data_abertura: '',
  genero: '',
  estado_civil: '',
  nacionalidade: '',
  nome_genitora: '',
  inscricao_estadual: '',
  // Step 3 - Contato
  emails: [] as string[],
  ddd_celular: '',
  numero_celular: '',
  ddd_residencial: '',
  numero_residencial: '',
  ddd_comercial: '',
  numero_comercial: '',
  // Step 4 - Endereço
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  municipio: '',
  estado_sigla: '',
  // Step 5 - Informações Adicionais
  observacoes: '',
  ativo: true,
};

export function ClienteCreateDialog({
  open,
  onOpenChange,
  onSuccess,
}: ClienteCreateDialogProps) {
  const [currentStep, setCurrentStep] = React.useState(1);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formData, setFormData] = React.useState(INITIAL_FORM_STATE);
  const [novoEmail, setNovoEmail] = React.useState('');
  const [stepErrors, setStepErrors] = React.useState<string[]>([]);

  // Reset ao fechar
  React.useEffect(() => {
    if (!open) {
      setCurrentStep(1);
      setFormData(INITIAL_FORM_STATE);
      setNovoEmail('');
      setStepErrors([]);
    }
  }, [open]);

  const isPF = formData.tipo_pessoa === 'pf';
  const isPJ = formData.tipo_pessoa === 'pj';

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

  // Validação por step
  const validateStep = (step: number): string[] => {
    const errors: string[] = [];

    switch (step) {
      case 1:
        if (!formData.tipo_pessoa) {
          errors.push('Selecione o tipo de pessoa');
        }
        break;

      case 2:
        if (!formData.nome.trim()) {
          errors.push('Nome é obrigatório');
        }
        if (isPF) {
          if (!formData.cpf.trim()) {
            errors.push('CPF é obrigatório');
          } else if (!validarCPF(formData.cpf)) {
            errors.push('CPF inválido');
          }
        }
        if (isPJ) {
          if (!formData.cnpj.trim()) {
            errors.push('CNPJ é obrigatório');
          } else if (!validarCNPJ(formData.cnpj)) {
            errors.push('CNPJ inválido');
          }
        }
        break;

      case 3:
        // Contato é opcional, mas validar formato de email se houver
        if (novoEmail && !novoEmail.includes('@')) {
          errors.push('E-mail em edição possui formato inválido');
        }
        break;

      case 4:
        // Endereço é opcional
        break;

      case 5:
        // Informações adicionais é opcional
        break;
    }

    return errors;
  };

  // Navegar para próximo step
  const handleNext = () => {
    const errors = validateStep(currentStep);
    if (errors.length > 0) {
      setStepErrors(errors);
      toast.error(errors.join('\n'));
      return;
    }
    setStepErrors([]);
    setCurrentStep(prev => Math.min(prev + 1, TOTAL_STEPS));
  };

  // Navegar para step anterior
  const handlePrevious = () => {
    setStepErrors([]);
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Submit do formulário
  const handleSubmit = async () => {
    const errors = validateStep(currentStep);
    if (errors.length > 0) {
      setStepErrors(errors);
      toast.error(errors.join('\n'));
      return;
    }

    setIsSubmitting(true);
    setStepErrors([]);

    try {
      // Preparar payload
      const payload: Record<string, unknown> = {
        tipo_pessoa: formData.tipo_pessoa,
        nome: formData.nome.trim(),
        nome_social_fantasia: formData.nome_social_fantasia.trim() || null,
        emails: formData.emails.length > 0 ? formData.emails : null,
        ddd_celular: formData.ddd_celular || null,
        numero_celular: formData.numero_celular || null,
        ddd_residencial: formData.ddd_residencial || null,
        numero_residencial: formData.numero_residencial || null,
        ddd_comercial: formData.ddd_comercial || null,
        numero_comercial: formData.numero_comercial || null,
        observacoes: formData.observacoes.trim() || null,
        ativo: formData.ativo,
      };

      // Campos específicos PF
      if (isPF) {
        payload.cpf = formData.cpf.replace(/\D/g, '');
        payload.rg = formData.rg.trim() || null;
        payload.data_nascimento = formData.data_nascimento || null;
        payload.genero = formData.genero || null;
        payload.estado_civil = formData.estado_civil || null;
        payload.nacionalidade = formData.nacionalidade.trim() || null;
        payload.nome_genitora = formData.nome_genitora.trim() || null;
      }

      // Campos específicos PJ
      if (isPJ) {
        payload.cnpj = formData.cnpj.replace(/\D/g, '');
        payload.inscricao_estadual = formData.inscricao_estadual.trim() || null;
        payload.data_abertura = formData.data_abertura || null;
      }

      const response = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao criar cliente');
      }

      toast.success('Cliente criado com sucesso!');
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Erro ao criar cliente. Tente novamente.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Renderizar Step 1 - Tipo de Pessoa
  const renderStep1 = () => (
    <div className="grid gap-6 py-4">
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => setFormData(prev => ({ ...prev, tipo_pessoa: 'pf' }))}
          className={cn(
            'flex flex-col items-center justify-center gap-3 p-6 rounded-lg border-2 transition-all hover:border-primary/50',
            isPF
              ? 'border-primary bg-primary/5'
              : 'border-border bg-background hover:bg-muted/50'
          )}
        >
          <div className={cn(
            'flex h-16 w-16 items-center justify-center rounded-full',
            isPF ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          )}>
            <User className="h-8 w-8" />
          </div>
          <div className="text-center">
            <p className={cn('font-semibold', isPF && 'text-primary')}>
              Pessoa Física
            </p>
            <p className="text-sm text-muted-foreground">
              CPF, RG, data de nascimento
            </p>
          </div>
          {isPF && (
            <div className="flex items-center gap-1 text-primary text-sm">
              <Check className="h-4 w-4" />
              Selecionado
            </div>
          )}
        </button>

        <button
          type="button"
          onClick={() => setFormData(prev => ({ ...prev, tipo_pessoa: 'pj' }))}
          className={cn(
            'flex flex-col items-center justify-center gap-3 p-6 rounded-lg border-2 transition-all hover:border-primary/50',
            isPJ
              ? 'border-primary bg-primary/5'
              : 'border-border bg-background hover:bg-muted/50'
          )}
        >
          <div className={cn(
            'flex h-16 w-16 items-center justify-center rounded-full',
            isPJ ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          )}>
            <Building2 className="h-8 w-8" />
          </div>
          <div className="text-center">
            <p className={cn('font-semibold', isPJ && 'text-primary')}>
              Pessoa Jurídica
            </p>
            <p className="text-sm text-muted-foreground">
              CNPJ, razão social, nome fantasia
            </p>
          </div>
          {isPJ && (
            <div className="flex items-center gap-1 text-primary text-sm">
              <Check className="h-4 w-4" />
              Selecionado
            </div>
          )}
        </button>
      </div>
    </div>
  );

  // Renderizar Step 2 - Identificação
  const renderStep2 = () => (
    <div className="grid gap-4 py-4">
      {/* Nome */}
      <div className="grid gap-2">
        <Label htmlFor="nome">
          {isPF ? 'Nome Completo' : 'Razão Social'} <span className="text-destructive">*</span>
        </Label>
        <Input
          id="nome"
          value={formData.nome}
          onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
          placeholder={isPF ? 'Ex: João da Silva' : 'Ex: Empresa LTDA'}
          autoFocus
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
          onChange={(e) => setFormData(prev => ({ ...prev, nome_social_fantasia: e.target.value }))}
          placeholder={isPF ? 'Nome social (opcional)' : 'Nome fantasia (opcional)'}
        />
      </div>

      {/* CPF (PF) */}
      {isPF && (
        <>
          <div className="grid gap-2">
            <Label htmlFor="cpf">
              CPF <span className="text-destructive">*</span>
            </Label>
            <Input
              id="cpf"
              value={formData.cpf}
              onChange={(e) => setFormData(prev => ({ ...prev, cpf: formatarCPF(e.target.value) }))}
              placeholder="000.000.000-00"
              maxLength={14}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="rg">RG</Label>
              <Input
                id="rg"
                value={formData.rg}
                onChange={(e) => setFormData(prev => ({ ...prev, rg: e.target.value }))}
                placeholder="Número do RG"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="data_nascimento">Data de Nascimento</Label>
              <Input
                id="data_nascimento"
                type="date"
                value={formData.data_nascimento}
                onChange={(e) => setFormData(prev => ({ ...prev, data_nascimento: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="genero">Gênero</Label>
              <Select
                value={formData.genero}
                onValueChange={(value) => setFormData(prev => ({ ...prev, genero: value }))}
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
                onValueChange={(value) => setFormData(prev => ({ ...prev, estado_civil: value }))}
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
                onChange={(e) => setFormData(prev => ({ ...prev, nacionalidade: e.target.value }))}
                placeholder="Ex: Brasileira"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="nome_genitora">Nome da Mãe</Label>
              <Input
                id="nome_genitora"
                value={formData.nome_genitora}
                onChange={(e) => setFormData(prev => ({ ...prev, nome_genitora: e.target.value }))}
                placeholder="Nome completo da mãe"
              />
            </div>
          </div>
        </>
      )}

      {/* CNPJ (PJ) */}
      {isPJ && (
        <>
          <div className="grid gap-2">
            <Label htmlFor="cnpj">
              CNPJ <span className="text-destructive">*</span>
            </Label>
            <Input
              id="cnpj"
              value={formData.cnpj}
              onChange={(e) => setFormData(prev => ({ ...prev, cnpj: formatarCNPJ(e.target.value) }))}
              placeholder="00.000.000/0000-00"
              maxLength={18}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="inscricao_estadual">Inscrição Estadual</Label>
              <Input
                id="inscricao_estadual"
                value={formData.inscricao_estadual}
                onChange={(e) => setFormData(prev => ({ ...prev, inscricao_estadual: e.target.value }))}
                placeholder="Número da IE"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="data_abertura">Data de Abertura</Label>
              <Input
                id="data_abertura"
                type="date"
                value={formData.data_abertura}
                onChange={(e) => setFormData(prev => ({ ...prev, data_abertura: e.target.value }))}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );

  // Renderizar Step 3 - Contato
  const renderStep3 = () => (
    <div className="grid gap-4 py-4">
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
            setFormData(prev => ({
              ...prev,
              ddd_celular: ddd,
              numero_celular: numero,
            }));
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
            setFormData(prev => ({
              ...prev,
              ddd_residencial: ddd,
              numero_residencial: numero,
            }));
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
            setFormData(prev => ({
              ...prev,
              ddd_comercial: ddd,
              numero_comercial: numero,
            }));
          }}
          placeholder="(00) 0000-0000"
        />
      </div>
    </div>
  );

  // Renderizar Step 4 - Endereço
  const renderStep4 = () => (
    <div className="grid gap-4 py-4">
      {/* CEP */}
      <div className="grid gap-2">
        <Label>CEP</Label>
        <InputCEP
          value={formData.cep}
          onChange={(e) => setFormData(prev => ({ ...prev, cep: e.target.value }))}
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
          onChange={(e) => setFormData(prev => ({ ...prev, logradouro: e.target.value }))}
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
            onChange={(e) => setFormData(prev => ({ ...prev, numero: e.target.value }))}
            placeholder="Nº"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="complemento">Complemento</Label>
          <Input
            id="complemento"
            value={formData.complemento}
            onChange={(e) => setFormData(prev => ({ ...prev, complemento: e.target.value }))}
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
          onChange={(e) => setFormData(prev => ({ ...prev, bairro: e.target.value }))}
          placeholder="Nome do bairro"
        />
      </div>

      {/* Cidade e Estado */}
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="municipio">Cidade</Label>
          <Input
            id="municipio"
            value={formData.municipio}
            onChange={(e) => setFormData(prev => ({ ...prev, municipio: e.target.value }))}
            placeholder="Nome da cidade"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="estado_sigla">Estado</Label>
          <Select
            value={formData.estado_sigla}
            onValueChange={(value) => setFormData(prev => ({ ...prev, estado_sigla: value }))}
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
  );

  // Renderizar Step 5 - Informações Adicionais
  const renderStep5 = () => (
    <div className="grid gap-4 py-4">
      {/* Observações */}
      <div className="grid gap-2">
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea
          id="observacoes"
          value={formData.observacoes}
          onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
          placeholder="Observações adicionais sobre o cliente..."
          rows={4}
        />
      </div>

      {/* Status */}
      <div className="flex items-center space-x-2 pt-2">
        <Checkbox
          id="ativo"
          checked={formData.ativo}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ativo: !!checked }))}
        />
        <Label htmlFor="ativo" className="cursor-pointer font-normal">
          Cliente ativo
        </Label>
      </div>

      {/* Resumo */}
      <div className="mt-4 p-4 rounded-lg bg-muted/50 border">
        <h4 className="font-medium mb-2">Resumo do cadastro</h4>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <dt className="text-muted-foreground">Tipo:</dt>
          <dd className="font-medium">{isPF ? 'Pessoa Física' : 'Pessoa Jurídica'}</dd>

          <dt className="text-muted-foreground">Nome:</dt>
          <dd className="font-medium truncate">{formData.nome || '-'}</dd>

          <dt className="text-muted-foreground">{isPF ? 'CPF:' : 'CNPJ:'}</dt>
          <dd className="font-medium">{isPF ? formData.cpf : formData.cnpj || '-'}</dd>

          <dt className="text-muted-foreground">E-mails:</dt>
          <dd className="font-medium">{formData.emails.length || '0'}</dd>

          <dt className="text-muted-foreground">Cidade:</dt>
          <dd className="font-medium">{formData.municipio || '-'}</dd>
        </dl>
      </div>
    </div>
  );

  // Renderizar step atual
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      case 5:
        return renderStep5();
      default:
        return null;
    }
  };

  const stepInfo = STEP_INFO[currentStep as keyof typeof STEP_INFO];
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === TOTAL_STEPS;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <div className="flex items-center justify-between mb-1">
            <DialogTitle>{stepInfo.title}</DialogTitle>
            <span className="text-sm text-muted-foreground">
              {currentStep} de {TOTAL_STEPS}
            </span>
          </div>
          <DialogDescription>{stepInfo.description}</DialogDescription>

          {/* Progress bar */}
          <div className="w-full bg-muted rounded-full h-2 mt-4">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }}
            />
          </div>
        </DialogHeader>

        <div className="px-6 max-h-[60vh] overflow-y-auto">
          {renderCurrentStep()}
        </div>

        <DialogFooter className="px-6 py-4 border-t shrink-0">
          <div className="flex justify-between w-full gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={isFirstStep || isSubmitting}
              className={cn(isFirstStep && 'invisible')}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Voltar
            </Button>

            {isLastStep ? (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Criar Cliente
                  </>
                )}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleNext}
                disabled={isSubmitting}
              >
                Continuar
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
