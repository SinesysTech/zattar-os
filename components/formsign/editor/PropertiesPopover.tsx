'use client';

import { Check, ChevronsUpDown, Edit, Info, Move, Palette, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

import type { TemplateCampo, TipoVariavel } from '@/types/formsign';

interface EditorField extends TemplateCampo {
  isSelected: boolean;
  isDragging: boolean;
  justAdded?: boolean;
}

const AVAILABLE_VARIABLES: Array<{ value: TipoVariavel; label: string; category: string }> = [
  { value: 'cliente.nome_completo', label: 'Nome Completo', category: 'Cliente' },
  { value: 'cliente.cpf', label: 'CPF', category: 'Cliente' },
  { value: 'cliente.email', label: 'Email', category: 'Cliente' },
  { value: 'cliente.telefone', label: 'Telefone', category: 'Cliente' },
  { value: 'cliente.data_nascimento', label: 'Data de Nascimento', category: 'Cliente' },
  { value: 'cliente.endereco_completo', label: 'Endereço Completo', category: 'Cliente' },
  { value: 'cliente.endereco_cidade', label: 'Cidade', category: 'Cliente' },
  { value: 'cliente.endereco_uf', label: 'UF', category: 'Cliente' },
  { value: 'cliente.endereco_cep', label: 'CEP', category: 'Cliente' },
  { value: 'acao.data_inicio', label: 'Data de Início', category: 'Ação' },
  { value: 'acao.plataforma_nome', label: 'Aplicativo', category: 'Ação (Apps)' },
  { value: 'acao.modalidade_nome', label: 'Modalidade', category: 'Ação (Apps)' },
  { value: 'acao.nome_empresa_pessoa', label: 'Nome da Empresa', category: 'Ação (Trabalhista)' },
  { value: 'acao.cpf_cnpj_empresa_pessoa', label: 'CNPJ da Empresa', category: 'Ação (Trabalhista)' },
  { value: 'sistema.numero_contrato', label: 'Número do Contrato', category: 'Sistema' },
  { value: 'sistema.protocolo', label: 'Protocolo', category: 'Sistema' },
  { value: 'sistema.data_geracao', label: 'Data de Geração (extenso)', category: 'Sistema' },
  { value: 'sistema.timestamp', label: 'Carimbo de Data/Hora', category: 'Sistema' },
  { value: 'sistema.ip_cliente', label: 'IP do Cliente', category: 'Sistema' },
  { value: 'sistema.user_agent', label: 'User-Agent do Cliente', category: 'Sistema' },
  { value: 'assinatura.assinatura_base64', label: 'Assinatura', category: 'Assinatura' },
  { value: 'assinatura.foto_base64', label: 'Foto do Cliente', category: 'Assinatura' },
  { value: 'assinatura.latitude', label: 'Latitude GPS', category: 'Assinatura' },
  { value: 'assinatura.longitude', label: 'Longitude GPS', category: 'Assinatura' },
];

const FIELD_TYPE_LABEL: Record<TemplateCampo['tipo'], string> = {
  texto: 'Texto',
  cpf: 'CPF',
  cnpj: 'CNPJ',
  data: 'Data',
  telefone: 'Telefone',
  endereco: 'Endereço',
  assinatura: 'Assinatura',
  foto: 'Foto',
  sistema: 'Sistema',
  segmento: 'Segmento',
  texto_composto: 'Texto Composto',
};

interface PropertiesPopoverProps {
  trigger: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedField: EditorField | null;
  fieldsLength: number;
  onUpdateField: (updates: Partial<EditorField>) => void;
  onDeleteField: (fieldId: string) => void;
  onEditRichText?: (fieldId: string) => void;
}

export default function PropertiesPopover({
  trigger,
  open,
  onOpenChange,
  selectedField,
  fieldsLength,
  onUpdateField,
  onDeleteField,
  onEditRichText,
}: PropertiesPopoverProps) {
  if (!selectedField) return trigger;

  const selectedVariableLabel =
    AVAILABLE_VARIABLES.find((item) => item.value === selectedField.variavel)?.label ??
    selectedField.variavel;

  const selectedFieldTypeLabel = FIELD_TYPE_LABEL[selectedField.tipo] ?? 'Campo';

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        side="right"
        sideOffset={12}
        className="w-80 max-h-[80vh] overflow-auto p-4"
      >
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Propriedades do Campo</h3>
            {selectedFieldTypeLabel && (
              <Badge variant="outline" className="text-xs">
                {selectedFieldTypeLabel}
              </Badge>
            )}
          </div>

          {/* Informações Gerais */}
          <Collapsible defaultOpen>
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md px-2 py-2 text-sm font-medium hover:bg-muted/50">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4" aria-hidden="true" />
                <span>Informações gerais</span>
              </div>
              <ChevronsUpDown className="h-4 w-4" aria-hidden="true" />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 px-2 py-2">
              {/* Variável selector (ocultar para texto_composto) */}
              {selectedField.tipo !== 'texto_composto' && (
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Variável</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="h-8 w-full justify-between text-sm font-normal"
                        aria-label="Selecionar variável vinculada ao campo"
                      >
                        <span className="truncate">{selectedVariableLabel}</span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                      <Command>
                        <CommandInput placeholder="Buscar variável..." />
                        <CommandList>
                          <CommandEmpty>Nenhuma variável encontrada.</CommandEmpty>
                          {Object.entries(
                            AVAILABLE_VARIABLES.reduce(
                              (acc, item) => {
                                if (!acc[item.category]) acc[item.category] = [];
                                acc[item.category].push(item);
                                return acc;
                              },
                              {} as Record<string, typeof AVAILABLE_VARIABLES>,
                            ),
                          ).map(([category, items]) => (
                            <CommandGroup key={category} heading={category}>
                              {items.map((item) => (
                                <CommandItem
                                  key={item.value}
                                  value={item.label}
                                  onSelect={() => {
                                    // Atualiza tanto a variável quanto o nome do campo com o label da variável
                                    onUpdateField({
                                      variavel: item.value,
                                      nome: item.label
                                    });
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      'mr-2 h-4 w-4',
                                      selectedField.variavel === item.value
                                        ? 'opacity-100'
                                        : 'opacity-0',
                                    )}
                                  />
                                  {item.label}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          ))}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <p className="text-[11px] text-muted-foreground">
                    O nome do campo será automaticamente definido como o nome da variável
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <Label className="text-xs font-medium">Ordem de Exibição</Label>
                <Input
                  type="number"
                  min="1"
                  value={selectedField.ordem ?? fieldsLength}
                  onChange={(event) =>
                    onUpdateField({ ordem: parseInt(event.target.value, 10) || 1 })
                  }
                  className="h-8 text-sm"
                  placeholder="1, 2, 3..."
                />
                <p className="text-[11px] text-muted-foreground">
                  Define a ordem em que o campo aparece no PDF
                </p>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Posicionamento */}
          <Collapsible defaultOpen>
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md px-2 py-2 text-sm font-medium hover:bg-muted/50">
              <div className="flex items-center gap-2">
                <Move className="h-4 w-4" aria-hidden="true" />
                <span>Posicionamento</span>
              </div>
              <ChevronsUpDown className="h-4 w-4" aria-hidden="true" />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 px-2 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Posição X</Label>
                  <Input
                    type="number"
                    value={selectedField.posicao.x}
                    onChange={(event) =>
                      onUpdateField({
                        posicao: {
                          ...selectedField.posicao,
                          x: parseInt(event.target.value, 10) || 0,
                        },
                      })
                    }
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Posição Y</Label>
                  <Input
                    type="number"
                    value={selectedField.posicao.y}
                    onChange={(event) =>
                      onUpdateField({
                        posicao: {
                          ...selectedField.posicao,
                          y: parseInt(event.target.value, 10) || 0,
                        },
                      })
                    }
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Largura</Label>
                  <Input
                    type="number"
                    value={selectedField.posicao.width}
                    onChange={(event) =>
                      onUpdateField({
                        posicao: {
                          ...selectedField.posicao,
                          width: parseInt(event.target.value, 10) || 0,
                        },
                      })
                    }
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Altura</Label>
                  <Input
                    type="number"
                    value={selectedField.posicao.height}
                    onChange={(event) =>
                      onUpdateField({
                        posicao: {
                          ...selectedField.posicao,
                          height: parseInt(event.target.value, 10) || 0,
                        },
                      })
                    }
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Estilo (para campos de texto e texto_composto) */}
          {(selectedField.tipo === 'texto' || selectedField.tipo === 'texto_composto') && (
            <Collapsible>
              <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md px-2 py-2 text-sm font-medium hover:bg-muted/50">
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4" aria-hidden="true" />
                  <span>Estilo</span>
                </div>
                <ChevronsUpDown className="h-4 w-4" aria-hidden="true" />
              </CollapsibleTrigger>
              <CollapsibleContent className="px-2 pt-2">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Tamanho da fonte</Label>
                  <Input
                    type="number"
                    value={selectedField.estilo?.tamanho_fonte ?? 12}
                    onChange={(event) =>
                      onUpdateField({
                        estilo: {
                          ...(selectedField.estilo ?? {}),
                          tamanho_fonte: parseInt(event.target.value, 10) || 12,
                        },
                      })
                    }
                    className="h-8 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="font-family-select" className="text-xs font-medium">
                    Família da fonte
                  </Label>
                  <select
                    id="font-family-select"
                    value={selectedField.estilo?.fonte ?? 'Helvetica'}
                    onChange={(event) =>
                      onUpdateField({
                        estilo: {
                          ...(selectedField.estilo ?? {}),
                          fonte: event.target.value,
                        },
                      })
                    }
                    className="w-full h-8 text-sm rounded-md border border-input bg-background px-3 py-1"
                    aria-label="Selecionar família da fonte"
                  >
                    <option value="Helvetica">Helvetica</option>
                    <option value="Open Sans">Open Sans</option>
                    <option value="Times-Roman">Times New Roman</option>
                    <option value="Courier">Courier</option>
                  </select>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Botão Editar Texto Composto */}
          {selectedField.tipo === 'texto_composto' && onEditRichText && (
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2"
              onClick={() => {
                onEditRichText(selectedField.id);
                onOpenChange(false); // Fecha o popover de propriedades
              }}
            >
              <Edit className="h-4 w-4" />
              Editar Texto Composto
            </Button>
          )}

          {/* Botão Deletar */}
          <Button
            variant="destructive"
            size="sm"
            className="w-full gap-2"
            onClick={() => onDeleteField(selectedField.id)}
          >
            <Trash2 className="h-4 w-4" />
            Deletar campo
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}