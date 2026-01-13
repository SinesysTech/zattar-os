import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SidebarSection, ProfileData } from "../../configs/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ProfileSidebarProps {
  sections: SidebarSection[];
  data: ProfileData;
  showProgress?: boolean;
}

const getNestedValue = (obj: Record<string, unknown>, path: string): unknown => {
  return path.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
};

export function ProfileSidebar({ sections, data, showProgress = false }: ProfileSidebarProps) {
  // Mock progress calculation
  const progress = 75;

  // Helper to check if a section has any visible fields
  const sectionHasVisibleFields = (section: SidebarSection): boolean => {
    return section.fields.some((field) => {
      const value = getNestedValue(data, field.valuePath);
      return value !== null && value !== undefined && value !== '';
    });
  };

  return (
    <div className="space-y-6">
      {showProgress && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Perfil Completo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Progress value={progress} className="flex-1 h-2" />
              <span className="text-muted-foreground text-xs font-medium">{progress}%</span>
            </div>
          </CardContent>
        </Card>
      )}

      {sections.map((section, idx) => {
        // Skip rendering section if all fields are empty
        if (!sectionHasVisibleFields(section)) {
          return null;
        }

        return (
          <div key={idx} className="space-y-3">
             <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{section.title}</h3>
             <div className="space-y-3">
               {section.fields.map((field, fIdx) => {
                 const value = getNestedValue(data, field.valuePath);
                 if (value === null || value === undefined || value === '') return null;

                 const Icon = field.icon;
                 let displayValue = value;

                 if (field.type === 'date') {
                   try {
                     displayValue = format(new Date(value as string | number | Date), "dd/MM/yyyy", { locale: ptBR });
                   } catch {
                     displayValue = String(value);
                   }
                 }

                 return (
                   <div key={fIdx} className="flex items-start gap-3 text-sm group">
                     {Icon && <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0 group-hover:text-primary transition-colors" />}
                     <div className="min-w-0 flex-1 wrap-break-word">
                       {field.label && <span className="sr-only">{field.label}: </span>}
                       <span>{String(displayValue)}</span>
                     </div>
                   </div>
                 );
               })}
             </div>
          </div>
        );
      })}
    </div>
  );
}
