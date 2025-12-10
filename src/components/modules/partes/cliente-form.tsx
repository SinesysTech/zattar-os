'use client';

/**
 * ClienteForm - Formulário de Cliente com Server Actions
 *
 * Componente de formulário que utiliza Server Actions para criar/editar clientes.
 * Implementa validação client-side e integração com useActionState (React 19).
 */

import * as React from 'react';
import { useActionState } from 'react';
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
import InputCEP, { type InputCepAddress } from '@/components/assinatura-digital/inputs/input-cep';
import InputTelefone from '@/components/assinatura-digital/inputs/input-telefone';
import { actionCriarCliente, actionAtualizarCliente, type ActionResult } from '@/core/app/actions/partes';
import type { Cliente } from '@/types/domain/partes';

// =============================================================================
// TIPOS E CONSTANTES
// =============================================================================

interface ClienteFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  cliente?: Cliente; // Se fornecido, modo edição
  mode?: 'create' | 'edit';
}

const TOTAL_STEPS = 5;

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

const ESTADOS_BR = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const ESTADOS_CIVIS = [
  { value: 'solteiro', label: 'Solteiro(a)' },
  { value: 'casado', label: 'Casado(a)' },
  { value: 'divorciado', label: 'Divorciado(a)' },
  { value: 'viuvo', label: 'Viúvo(a)' },
  { value: 'uniao_estavel', label: 'União Estável' },
  { value: 'separado', label: 'Separado(a)' },
];

const GENEROS = [
  { value: 'masculino', label: 'Masculino' },
  { value: 'feminino', label: 'Feminino' },
  { value: 'outro', label: 'Outro' },
  { value: 'nao_informado', label: 'Prefiro não informar' },
];

// =============================================================================
// FORMATAÇÃO (apenas UI/masking)
// =============================================================================

function formatarCPF(value: string): string {
  const numeros = value.replace(/\D/g, '').slice(0, 11);
  return numeros
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function formatarCNPJ(value: string): string {
  const numeros = value.replace(/\D/g, '').slice(0, 14);
  return numeros
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

// =============================================================================
// ESTADO INICIAL
// =============================================================================

const INITIAL_FORM_STATE = {
  tipo_pessoa: null as 'pf' | 'pj' | null,
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
  emails: [] as string[],
  ddd_celular: '',
  numero_celular: '',
  ddd_residencial: '',
  numero_residencial: '',
  ddd_comercial: '',
  numero_comercial: '',
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  municipio: '',
  estado_sigla: '',
  observacoes: '',
  ativo: true,
};

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function ClienteFormDialog({
  open,
  onOpenChange,
  onSuccess,
  cliente,
  mode = 'create',
}: ClienteFormDialogProps) {
  const isEditMode = mode === 'edit' && cliente;
  const [currentStep, setCurrentStep] = React.useState(isEditMode ? 2 : 1);
  const [formData, setFormData] = React.useState(INITIAL_FORM_STATE);
  const [novoEmail, setNovoEmail] = React.useState('');
  const [stepErrors, setStepErrors] = React.useState<string[]>([]);
  const formRef = React.useRef<HTMLFormElement>(null);

  // Server Action com useActionState
  const initialState: ActionResult | null = null;

  const boundAction = React.useCallback(
    async (prevState: ActionResult | null, formData: FormData) => {
      if (isEditMode) {
        return actionAtualizarCliente(cliente.id, prevState, formData);
      }
      return actionCriarCliente(prevState, formData);
    },
    [isEditMode, cliente?.id]
  );

  const [state, formAction, isPending] = useActionState(boundAction, initialState);

  // Efeito para tratar resultado da action
  React.useEffect(() => {
    if (state) {
      if (state.success) {
        toast.success(state.message);
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(state.message);
        if (state.errors) {
          const errorMessages = Object.entries(state.errors)
            .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
            .slice(0, 3);
          setStepErrors(errorMessages);
        }
      }
    }
  }, [state, onOpenChange, onSuccess]);

  // Reset ao fechar ou inicializar com dados do cliente
  React.useEffect(() => {
    if (!open) {
      setCurrentStep(isEditMode ? 2 : 1);
      setFormData(INITIAL_FORM_STATE);
      setNovoEmail('');
      setStepErrors([]);
    } else if (isEditMode && cliente) {
      // Preencher com dados do cliente para edição
      setFormData({
        tipo_pessoa: cliente.tipo_pessoa,
        nome: cliente.nome,
        nome_social_fantasia: cliente.nome_social_fantasia || '',
        cpf: cliente.tipo_pessoa === 'pf' ? formatarCPF(cliente.cpf || '') : '',
        cnpj: cliente.tipo_pessoa === 'pj' ? formatarCNPJ(cliente.cnpj || '') : '',
        rg: cliente.tipo_pessoa === 'pf' && 'rg' in cliente ? (cliente.rg || '') : '',
        data_nascimento: cliente.tipo_pessoa === 'pf' && 'data_nascimento' in cliente ? (cliente.data_nascimento || '') : '',
        data_abertura: cliente.tipo_pessoa === 'pj' && 'data_abertura' in cliente ? (cliente.data_abertura || '') : '',
        genero: cliente.tipo_pessoa === 'pf' && 'genero' in cliente ? (cliente.genero || '') : '',
        estado_civil: cliente.tipo_pessoa === 'pf' && 'estado_civil' in cliente ? (cliente.estado_civil || '') : '',
        nacionalidade: cliente.tipo_pessoa === 'pf' && 'nacionalidade' in cliente ? (cliente.nacionalidade || '') : '',
        nome_genitora: cliente.tipo_pessoa === 'pf' && 'nome_genitora' in cliente ? (cliente.nome_genitora || '') : '',
        inscricao_estadual: cliente.tipo_pessoa === 'pj' && 'inscricao_estadual' in cliente ? (cliente.inscricao_estadual || '') : '',
        emails: cliente.emails || [],
        ddd_celular: cliente.ddd_celular || '',
        numero_celular: cliente.numero_celular || '',
        ddd_residencial: cliente.ddd_residencial || '',
        numero_residencial: cliente.numero_residencial || '',
        ddd_comercial: cliente.ddd_comercial || '',
        numero_comercial: cliente.numero_comercial || '',
        cep: '',
        logradouro: '',
        numero: '',
        complemento: '',
        bairro: '',
        municipio: '',
        estado_sigla: '',
        observacoes: cliente.observacoes || '',
        ativo: cliente.ativo,
      });
    }
  }, [open, isEditMode, cliente]);

  const isPF = formData.tipo_pessoa === 'pf';
  const isPJ = formData.tipo_pessoa === 'pj';

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

  const handleAddEmail = () => {
    if (novoEmail && novoEmail.includes('@')) {
      setFormData(prev => ({
        ...prev,
        emails: [...prev.emails, novoEmail],
      }));
      setNovoEmail('');
    }
  };

  const handleRemoveEmail = (index: number) => {
    setFormData(prev => ({
      ...prev,
      emails: prev.emails.filter((_, i) => i !== index),
    }));
  };

  const handleAddressFound = (address: InputCepAddress) => {
    setFormData(prev => ({
      ...prev,
      logradouro: address.logradouro || prev.logradouro,
      bairro: address.bairro || prev.bairro,
      municipio: address.localidade || prev.municipio,
      estado_sigla: address.uf || prev.estado_sigla,
    }));
  };

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
          const cpfLimpo = formData.cpf.replace(/\D/g, '');
          if (!cpfLimpo) {
            errors.push('CPF é obrigatório');
          } else if (cpfLimpo.length !== 11 || !/^\d{11}$/.test(cpfLimpo)) {
            errors.push('CPF deve ter 11 dígitos');
          }
        }
        if (isPJ) {
          const cnpjLimpo = formData.cnpj.replace(/\D/g, '');
          if (!cnpjLimpo) {
            errors.push('CNPJ é obrigatório');
          } else if (cnpjLimpo.length !== 14 || !/^\d{14}$/.test(cnpjLimpo)) {
            errors.push('CNPJ deve ter 14 dígitos');
          }
        }
        break;

      case 3:
        if (novoEmail && !novoEmail.includes('@')) {
          errors.push('E-mail em edição possui formato inválido');
        }
        break;
    }

    return errors;
  };

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

  const handlePrevious = () => {
    setStepErrors([]);
    setCurrentStep(prev => Math.max(prev - 1, isEditMode ? 2 : 1));
  };

  const handleSubmit = () => {
    const errors = validateStep(currentStep);
    if (errors.length > 0) {
      setStepErrors(errors);
      toast.error(errors.join('\n'));
      return;
    }

    // Submeter o form
    formRef.current?.requestSubmit();
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
      <div className="grid gap-2">
        <Label htmlFor="nome">
          {isPF ? 'Nome Completo' : 'Razão Social'} <span className="text-destructive">*</span>
        </Label>
        <Input
          id="nome"
          name="nome"
          value={formData.nome}
          onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
          placeholder={isPF ? 'Ex: João da Silva' : 'Ex: Empresa LTDA'}
          autoFocus
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="nome_social_fantasia">
          {isPF ? 'Nome Social' : 'Nome Fantasia'}
        </Label>
        <Input
          id="nome_social_fantasia"
          name="nome_social_fantasia"
          value={formData.nome_social_fantasia}
          onChange={(e) => setFormData(prev => ({ ...prev, nome_social_fantasia: e.target.value }))}
          placeholder={isPF ? 'Nome social (opcional)' : 'Nome fantasia (opcional)'}
        />
      </div>

      {isPF && (
        <>
          <div className="grid gap-2">
            <Label htmlFor="cpf">
              CPF <span className="text-destructive">*</span>
            </Label>
            <Input
              id="cpf"
              name="cpf"
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
                name="rg"
                value={formData.rg}
                onChange={(e) => setFormData(prev => ({ ...prev, rg: e.target.value }))}
                placeholder="Número do RG"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="data_nascimento">Data de Nascimento</Label>
              <FormDatePicker
                id="data_nascimento"
                value={formData.data_nascimento || undefined}
                onChange={(v) => setFormData(prev => ({ ...prev, data_nascimento: v || '' }))}
              />
              <input type="hidden" name="data_nascimento" value={formData.data_nascimento} />
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
              <input type="hidden" name="genero" value={formData.genero} />
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
              <input type="hidden" name="estado_civil" value={formData.estado_civil} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="nacionalidade">Nacionalidade</Label>
              <Input
                id="nacionalidade"
                name="nacionalidade"
                value={formData.nacionalidade}
                onChange={(e) => setFormData(prev => ({ ...prev, nacionalidade: e.target.value }))}
                placeholder="Ex: Brasileira"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="nome_genitora">Nome da Mãe</Label>
              <Input
                id="nome_genitora"
                name="nome_genitora"
                value={formData.nome_genitora}
                onChange={(e) => setFormData(prev => ({ ...prev, nome_genitora: e.target.value }))}
                placeholder="Nome completo da mãe"
              />
            </div>
          </div>
        </>
      )}

      {isPJ && (
        <>
          <div className="grid gap-2">
            <Label htmlFor="cnpj">
              CNPJ <span className="text-destructive">*</span>
            </Label>
            <Input
              id="cnpj"
              name="cnpj"
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
                name="inscricao_estadual"
                value={formData.inscricao_estadual}
                onChange={(e) => setFormData(prev => ({ ...prev, inscricao_estadual: e.target.value }))}
                placeholder="Número da IE"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="data_abertura">Data de Abertura</Label>
              <FormDatePicker
                id="data_abertura"
                value={formData.data_abertura || undefined}
                onChange={(v) => setFormData(prev => ({ ...prev, data_abertura: v || '' }))}
              />
              <input type="hidden" name="data_abertura" value={formData.data_abertura} />
            </div>
          </div>
        </>
      )}
    </div>
  );

  // Renderizar Step 3 - Contato
  const renderStep3 = () => (
    <div className="grid gap-4 py-4">
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
      <div className="grid gap-2">
        <Label>CEP</Label>
        <InputCEP
          value={formData.cep}
          onChange={(e) => setFormData(prev => ({ ...prev, cep: e.target.value }))}
          onAddressFound={handleAddressFound}
          placeholder="00000-000"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="logradouro">Logradouro</Label>
        <Input
          id="logradouro"
          value={formData.logradouro}
          onChange={(e) => setFormData(prev => ({ ...prev, logradouro: e.target.value }))}
          placeholder="Rua, Avenida, etc."
        />
      </div>

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

      <div className="grid gap-2">
        <Label htmlFor="bairro">Bairro</Label>
        <Input
          id="bairro"
          value={formData.bairro}
          onChange={(e) => setFormData(prev => ({ ...prev, bairro: e.target.value }))}
          placeholder="Nome do bairro"
        />
      </div>

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
      <div className="grid gap-2">
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea
          id="observacoes"
          name="observacoes"
          value={formData.observacoes}
          onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
          placeholder="Observações adicionais sobre o cliente..."
          rows={4}
        />
      </div>

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
  const isFirstStep = currentStep === (isEditMode ? 2 : 1);
  const isLastStep = currentStep === TOTAL_STEPS;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <div className="flex items-center justify-between mb-1">
            <DialogTitle>
              {isEditMode ? 'Editar Cliente' : stepInfo.title}
            </DialogTitle>
            <span className="text-sm text-muted-foreground">
              {isEditMode ? `${currentStep - 1} de ${TOTAL_STEPS - 1}` : `${currentStep} de ${TOTAL_STEPS}`}
            </span>
          </div>
          <DialogDescription>{stepInfo.description}</DialogDescription>

          <div className="w-full bg-muted rounded-full h-2 mt-4">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{
                width: isEditMode
                  ? `${((currentStep - 1) / (TOTAL_STEPS - 1)) * 100}%`
                  : `${(currentStep / TOTAL_STEPS) * 100}%`
              }}
            />
          </div>
        </DialogHeader>

        <form ref={formRef} action={formAction}>
          {/* Hidden fields para todos os dados do form */}
          <input type="hidden" name="tipo_pessoa" value={formData.tipo_pessoa || ''} />
          <input type="hidden" name="ativo" value={formData.ativo ? 'true' : 'false'} />
          <input type="hidden" name="emails" value={JSON.stringify(formData.emails)} />
          <input type="hidden" name="ddd_celular" value={formData.ddd_celular} />
          <input type="hidden" name="numero_celular" value={formData.numero_celular} />
          <input type="hidden" name="ddd_residencial" value={formData.ddd_residencial} />
          <input type="hidden" name="numero_residencial" value={formData.numero_residencial} />
          <input type="hidden" name="ddd_comercial" value={formData.ddd_comercial} />
          <input type="hidden" name="numero_comercial" value={formData.numero_comercial} />

          <div className="px-6 max-h-[60vh] overflow-y-auto">
            {renderCurrentStep()}
          </div>
        </form>

        <DialogFooter className="px-6 py-4 border-t shrink-0">
          <div className="flex justify-between w-full gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={isFirstStep || isPending}
              className={cn(isFirstStep && 'invisible')}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Voltar
            </Button>

            {isLastStep ? (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isEditMode ? 'Salvando...' : 'Criando...'}
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    {isEditMode ? 'Salvar Alterações' : 'Criar Cliente'}
                  </>
                )}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleNext}
                disabled={isPending}
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

export { ClienteFormDialog as ClienteForm };
