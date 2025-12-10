"use client"

import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { FormFieldType } from '@/types/assinatura-digital/form-schema.types';
import { Type, Hash, Calendar, ChevronDown, Search, CheckSquare, List, FileText, Phone, MapPin, CreditCard, Building, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FieldDefinition {
  type: FormFieldType;
  label: string;
  icon: typeof Type;
  description: string;
  badge?: string;
}

interface CategoryDefinition {
  id: string;
  label: string;
  icon: typeof Type;
  fields: FieldDefinition[];
}

const FIELD_CATEGORIES: CategoryDefinition[] = [
  {
    id: 'texto',
    label: 'Texto',
    icon: Type,
    fields: [
      { type: FormFieldType.TEXT, label: 'Texto', icon: Type, description: 'Campo de texto simples' },
      { type: FormFieldType.EMAIL, label: 'Email', icon: Mail, description: 'Campo de email com validação' },
      { type: FormFieldType.TEXTAREA, label: 'Área de Texto', icon: FileText, description: 'Campo de texto longo' },
    ]
  },
  {
    id: 'numeros',
    label: 'Números',
    icon: Hash,
    fields: [
      { type: FormFieldType.NUMBER, label: 'Número', icon: Hash, description: 'Campo numérico' },
    ]
  },
  {
    id: 'datas',
    label: 'Datas',
    icon: Calendar,
    fields: [
      { type: FormFieldType.DATE, label: 'Data', icon: Calendar, description: 'Campo de data (dd/mm/aaaa)' },
    ]
  },
  {
    id: 'selecao',
    label: 'Seleção',
    icon: List,
    fields: [
      { type: FormFieldType.SELECT, label: 'Select', icon: List, description: 'Lista suspensa de opções' },
      { type: FormFieldType.RADIO, label: 'Radio', icon: CheckSquare, description: 'Opções exclusivas' },
      { type: FormFieldType.CHECKBOX, label: 'Checkbox', icon: CheckSquare, description: 'Opção sim/não' },
    ]
  },
  {
    id: 'formatados',
    label: 'Formatados BR',
    icon: CreditCard,
    fields: [
      { type: FormFieldType.CPF, label: 'CPF', icon: CreditCard, description: 'CPF com máscara e validação', badge: 'BR' },
      { type: FormFieldType.CNPJ, label: 'CNPJ', icon: Building, description: 'CNPJ com máscara e validação', badge: 'BR' },
      { type: FormFieldType.PHONE, label: 'Telefone', icon: Phone, description: 'Telefone BR com máscara', badge: 'BR' },
      { type: FormFieldType.CEP, label: 'CEP', icon: MapPin, description: 'CEP com busca automática', badge: 'BR' },
    ]
  },
];

interface DraggableFieldItemProps {
  field: FieldDefinition;
}

function DraggableFieldItem({ field }: DraggableFieldItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${field.type}`,
    data: { type: field.type, label: field.label }
  });

  const Icon = field.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className={cn(
              "cursor-grab active:cursor-grabbing border-2 border-dashed transition-all hover:border-primary hover:shadow-md",
              isDragging && "opacity-50 border-primary"
            )}
          >
            <CardContent className="p-3 flex items-center gap-2">
              <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-sm font-medium truncate flex-1">{field.label}</span>
              {field.badge && (
                <Badge variant="secondary" className="text-xs shrink-0">
                  {field.badge}
                </Badge>
              )}
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p className="text-xs">{field.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default function FieldPalette() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(FIELD_CATEGORIES.map(cat => cat.id))
  );

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const filteredCategories = FIELD_CATEGORIES.map(category => ({
    ...category,
    fields: category.fields.filter(field =>
      field.label.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.fields.length > 0);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Campos Disponíveis</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-3 overflow-hidden">
        <div className="relative shrink-0">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar campos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 h-9"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-3">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Nenhum campo encontrado</p>
            </div>
          ) : (
            filteredCategories.map(category => {
              const CategoryIcon = category.icon;
              const isExpanded = expandedCategories.has(category.id);

              return (
                <Collapsible
                  key={category.id}
                  open={isExpanded}
                  onOpenChange={() => toggleCategory(category.id)}
                >
                  <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 rounded-md hover:bg-muted/50 transition-colors">
                    <CategoryIcon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium flex-1 text-left">{category.label}</span>
                    <ChevronDown
                      className={cn(
                        "w-4 h-4 text-muted-foreground transition-transform",
                        isExpanded && "transform rotate-180"
                      )}
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-2 space-y-2">
                    {category.fields.map(field => (
                      <DraggableFieldItem key={field.type} field={field} />
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}