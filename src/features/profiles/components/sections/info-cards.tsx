import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FileText } from "lucide-react";

interface InfoCardsProps {
  cards: {
    title?: string;
    fields?: {
      label: string;
      valuePath: string;
      type?: 'text' | 'date' | 'boolean' | 'currency' | 'document';
      format?: (value: any) => string;
    }[];
  }[];
  data: any;
}

// Simple utility to get nested value
const getNestedValue = (obj: any, path: string) => {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
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
                   displayValue = format(new Date(value), "dd/MM/yyyy", { locale: ptBR });
                 } catch (e) {
                   displayValue = value;
                 }
              } else if (field.type === 'boolean') {
                 displayValue = value ? 'Sim' : 'Não';
              }

              return (
                <div key={fIdx} className="grid gap-1">
                  <span className="text-muted-foreground text-sm font-medium">{field.label}</span>
                  <span className="text-sm font-medium">{displayValue}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
