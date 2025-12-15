import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FileText } from "lucide-react";
import { ProfileData } from "../../configs/types";

interface InfoCardsProps {
  cards: {
    title?: string;
    fields?: {
      label: string;
      valuePath: string;
      type?: 'text' | 'date' | 'boolean' | 'currency' | 'document';
      format?: (value: unknown) => string;
    }[];
  }[];
  data: ProfileData;
}

// Simple utility to get nested value
const getNestedValue = (obj: Record<string, unknown>, path: string): unknown => {
  return path.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
};

export function InfoCards({ cards, data }: InfoCardsProps) {
  if (!cards || cards.length === 0) return null;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {cards.map((card, idx) => (
        <Card key={idx}>
          {card.title && (
             <CardHeader className="pb-3">
               <CardTitle className="text-base">{card.title}</CardTitle>
             </CardHeader>
          )}
          <CardContent className="grid gap-4">
            {card.fields?.map((field, fIdx) => {
              const value = getNestedValue(data, field.valuePath);
              
              if (value === null || value === undefined || value === '') return null;

              let displayValue = value;
              
              if (field.format) {
                displayValue = field.format(value);
              } else if (field.type === 'date') {
                 try {
                   displayValue = format(new Date(value as string | number | Date), "dd/MM/yyyy", { locale: ptBR });
                 } catch (e) {
                   displayValue = String(value);
                 }
              } else if (field.type === 'boolean') {
                 displayValue = value ? 'Sim' : 'Não';
              }

              return (
                <div key={fIdx} className="grid gap-1">
                  <span className="text-muted-foreground text-sm font-medium">{field.label}</span>
                  <span className="text-sm font-medium">{String(displayValue)}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
