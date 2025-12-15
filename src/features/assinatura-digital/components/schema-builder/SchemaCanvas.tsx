"use client"

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DynamicFormSchema, FormSectionSchema, FormFieldSchema, FormFieldType } from '@/features/assinatura-digital';
import { Edit, Trash2, Copy, GripVertical, Plus, AlertCircle, CheckCircle, Info, Type, Hash, Calendar, List, FileText, Phone, MapPin, CreditCard, Building, Mail, CheckSquare, Search, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SchemaCanvasProps {
  schema: DynamicFormSchema;
  selectedFieldId: string | null;
  selectedSectionId: string | null;
  onFieldSelect: (fieldId: string) => void;
  onSectionSelect: (sectionId: string) => void;
  onFieldDelete: (fieldId: string) => void;
  onFieldDuplicate: (fieldId: string) => void;
  onSectionAdd: () => void;
  onSectionEdit: (sectionId: string) => void;
  onSectionDelete: (sectionId: string) => void;
}

export const getFieldIcon = (type: FormFieldType) => {
  switch (type) {
    case FormFieldType.TEXT: return Type;
    case FormFieldType.EMAIL: return Mail;
    case FormFieldType.TEXTAREA: return FileText;
    case FormFieldType.NUMBER: return Hash;
    case FormFieldType.DATE: return Calendar;
    case FormFieldType.SELECT: return List;
    case FormFieldType.RADIO: return CheckCircle;
    case FormFieldType.CHECKBOX: return CheckSquare;
    case FormFieldType.CPF: return CreditCard;
    case FormFieldType.CNPJ: return Building;
    case FormFieldType.PHONE: return Phone;
    case FormFieldType.CEP: return MapPin;
    case FormFieldType.CLIENT_SEARCH: return Search;
    case FormFieldType.PARTE_CONTRARIA_SEARCH: return Users;
    default: return Info;
  }
};

interface SortableFieldItemProps {
  field: FormFieldSchema;
  sectionId: string;
  isSelected: boolean;
  onSelect: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

function SortableFieldItem({ field, sectionId, isSelected, onSelect, onDuplicate, onDelete }: SortableFieldItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
    data: { type: 'field', sectionId, fieldId: field.id }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "group transition-all",
        isSelected && "border-2 border-primary shadow-md",
        isDragging && "opacity-50"
      )}
    >
      <CardContent className="p-3 flex items-center gap-3">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-primary transition-colors"
        >
          <GripVertical className="w-4 h-4" />
        </div>

        {React.createElement(getFieldIcon(field.type), { className: "w-4 h-4 text-muted-foreground shrink-0" })}

        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{field.label}</div>
          <div className="flex gap-1 mt-1 flex-wrap">
            {field.validation?.required && (
              <Badge variant="destructive" className="text-xs">
                Obrigatório
              </Badge>
            )}
            {field.conditional && (
              <Badge variant="outline" className="text-xs">
                Condicional
              </Badge>
            )}
            {field.options && field.options.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {field.options.length} opções
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={onSelect}
                  aria-label="Editar campo"
                >
                  <Edit className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Editar</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={onDuplicate}
                  aria-label="Duplicar campo"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Duplicar</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={onDelete}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  aria-label="Deletar campo"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Deletar</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
}

interface DroppableSectionCardProps {
  section: FormSectionSchema;
  fields: FormFieldSchema[];
  selectedFieldId: string | null;
  selectedSectionId: string | null;
  onFieldSelect: (fieldId: string) => void;
  onSectionSelect: (sectionId: string) => void;
  onFieldDelete: (fieldId: string) => void;
  onFieldDuplicate: (fieldId: string) => void;
  onSectionEdit: () => void;
  onSectionDelete: () => void;
}

function DroppableSectionCard({
  section,
  fields,
  selectedFieldId,
  selectedSectionId,
  onFieldSelect,
  onSectionSelect,
  onFieldDelete,
  onFieldDuplicate,
  onSectionEdit,
  onSectionDelete
}: DroppableSectionCardProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: section.id,
    data: { type: 'section', sectionId: section.id }
  });

  const isSelected = selectedSectionId === section.id;

  return (
    <Card
      ref={setNodeRef}
      className={cn(
        "transition-all cursor-pointer",
        isOver && "border-2 border-dashed border-primary bg-primary/5",
        isSelected && "border-2 border-primary shadow-md"
      )}
      onClick={() => onSectionSelect(section.id)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base">{section.title}</CardTitle>
            {section.description && (
              <CardDescription className="mt-1">{section.description}</CardDescription>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={onSectionEdit}
                    aria-label="Editar seção"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Editar Seção</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={onSectionDelete}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    aria-label="Deletar seção"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Deletar Seção</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {fields.length === 0 ? (
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Nenhum campo nesta seção</p>
            <p className="text-xs text-muted-foreground mt-1">
              Arraste campos da paleta para adicionar
            </p>
          </div>
        ) : (
          <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
            {fields.map(field => (
              <SortableFieldItem
                key={field.id}
                field={field}
                sectionId={section.id}
                isSelected={selectedFieldId === field.id}
                onSelect={() => onFieldSelect(field.id)}
                onDuplicate={() => onFieldDuplicate(field.id)}
                onDelete={() => onFieldDelete(field.id)}
              />
            ))}
          </SortableContext>
        )}
      </CardContent>
    </Card>
  );
}

export default function SchemaCanvas({
  schema,
  selectedFieldId,
  selectedSectionId,
  onFieldSelect,
  onSectionSelect,
  onFieldDelete,
  onFieldDuplicate,
  onSectionAdd,
  onSectionEdit,
  onSectionDelete
}: SchemaCanvasProps) {
  return (
    <div className="space-y-4">
      {schema.sections.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
            <AlertCircle className="h-12 w-12 text-muted-foreground" />
            <div className="text-center space-y-2">
              <p className="text-sm font-medium">Nenhuma seção criada</p>
              <p className="text-xs text-muted-foreground">
                Clique em &quot;Adicionar Seção&quot; para começar
              </p>
            </div>
            <Button onClick={onSectionAdd} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Seção
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {schema.sections.map(section => (
            <DroppableSectionCard
              key={section.id}
              section={section}
              fields={section.fields}
              selectedFieldId={selectedFieldId}
              selectedSectionId={selectedSectionId}
              onFieldSelect={onFieldSelect}
              onSectionSelect={onSectionSelect}
              onFieldDelete={onFieldDelete}
              onFieldDuplicate={onFieldDuplicate}
              onSectionEdit={() => onSectionEdit(section.id)}
              onSectionDelete={() => onSectionDelete(section.id)}
            />
          ))}

          <Button onClick={onSectionAdd} variant="outline" className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Seção
          </Button>
        </>
      )}
    </div>
  );
}
