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

// Calculate profile completion based on filled fields
function calculateProfileCompletion(sections: SidebarSection[], data: ProfileData): number {
  let totalFields = 0;
  let filledFields = 0;

  sections.forEach((section) => {
    section.fields.forEach((field) => {
      totalFields++;
      const value = getNestedValue(data, field.valuePath);
      if (value !== null && value !== undefined && value !== '') {
        filledFields++;
      }
    });
  });

  return totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;
}

export function ProfileSidebar({ sections, data, showProgress = false }: ProfileSidebarProps) {
  const profileCompletion = calculateProfileCompletion(sections, data);

  // Helper to check if a section has any visible fields
  const sectionHasVisibleFields = (section: SidebarSection): boolean => {
    return section.fields.some((field) => {
      const value = getNestedValue(data, field.valuePath);
      return value !== null && value !== undefined && value !== '';
    });
  };

  return (
    <div className="space-y-4">
      {/* Progress Card */}
      {showProgress && (
        <Card>
          <CardHeader>
            <CardTitle>Complete seu perfil</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Progress value={profileCompletion} className="flex-1" />
              <span className="text-muted-foreground text-xs">{profileCompletion}%</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile Sections */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold">Perfil</h3>
            </div>

            <div className="space-y-4 lg:space-y-8">
              {sections.map((section, idx) => {
                // Skip rendering section if all fields are empty
                if (!sectionHasVisibleFields(section)) {
                  return null;
                }

                return (
                  <div key={idx}>
                    <p className="text-muted-foreground mb-3 text-xs font-medium uppercase">
                      {section.title}
                    </p>
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
                          <div key={fIdx} className="flex items-center gap-3 text-sm">
                            {Icon && <Icon className="text-muted-foreground h-4 w-4 shrink-0" />}
                            <span className="wrap-break-word">{String(displayValue)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
