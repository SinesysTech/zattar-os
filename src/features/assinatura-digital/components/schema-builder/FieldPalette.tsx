"use client"

import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { FormFieldType } from '../../types/domain';
import { getFieldIcon } from './SchemaCanvas';
import { ChevronDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ENTITY_FIELD_CATEGORIES, type EntityFieldDefinition } from './entity-fields-mapping';

interface FieldDefinition {
  type: FormFieldType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  badge?: string;
  fieldName: string;
  pessoaTipo?: 'pf' | 'pj' | 'ambos';
}

interface DraggableFieldItemProps {
  field: FieldDefinition;
}

// CategoryDefinition interface removed - not used in current implementation

function DraggableFieldItem({ field }: DraggableFieldItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${field.type}-${field.fieldName}`,
    data: { 
      type: field.type, 
      label: field.label,
      fieldName: field.fieldName,
      entityField: true
    }
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
              "cursor-grab active:cursor-grabbing border-2 border-dashed transition-all hover:border-primary hover:shadow-md p-0 gap-0",
              isDragging && "opacity-50 border-primary"
            )}
          >
            <CardContent className="p-2.5 flex items-center gap-2 px-3">
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
    new Set(ENTITY_FIELD_CATEGORIES.map(cat => cat.id))
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

  // Converter EntityFieldDefinition para FieldDefinition
  const convertEntityFields = (entityFields: EntityFieldDefinition[]): FieldDefinition[] => {
    return entityFields.map(field => ({
      type: field.type,
      label: field.label,
      icon: getFieldIcon(field.type),
      description: field.description,
      badge: field.badge,
      fieldName: field.fieldName,
      pessoaTipo: field.pessoaTipo,
    }));
  };

  const filteredCategories = ENTITY_FIELD_CATEGORIES.map(category => ({
    ...category,
    fields: convertEntityFields(
      category.fields.filter(field =>
        field.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        field.fieldName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        field.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
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
                      <DraggableFieldItem key={`${category.id}-${field.fieldName}`} field={field} />
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