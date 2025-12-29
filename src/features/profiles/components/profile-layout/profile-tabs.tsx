import { ClientOnlyTabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/client-only-tabs";
import { AppBadge } from "@/components/ui/app-badge";
import { TabConfig, ProfileData } from "../../configs/types";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ProfileTabsProps {
  tabs: TabConfig[];
  children: (tabId: string) => ReactNode;
  data: ProfileData;
  defaultTab?: string;
  className?: string;
}

const getNestedValue = (obj: Record<string, unknown>, path: string): unknown => {
  return path.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
};

export function ProfileTabs({ tabs, children, data, defaultTab, className }: ProfileTabsProps) {
  const firstTab = tabs[0]?.id;

  return (
    <ClientOnlyTabs
      defaultValue={defaultTab || firstTab}
      className={cn("w-full", className)}
    >
      <div className="border-b mb-6 overflow-x-auto">
        <TabsList className="h-auto w-full justify-start gap-2 bg-transparent p-0">
          {tabs.map((tab) => {
            const badgeValue = tab.badgeField ? getNestedValue(data, tab.badgeField) : null;

            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-primary hover:text-foreground text-muted-foreground relative h-12 rounded-none border-b-2 border-transparent bg-transparent px-4 pb-3 pt-3 font-medium shadow-none transition-none data-[state=active]:text-primary"
              >
                {tab.label}
                {badgeValue !== null && badgeValue !== undefined && badgeValue !== '' && (
                  <AppBadge variant="secondary" className="ml-2 h-5 rounded-full px-1.5 text-xs font-normal">
                    {String(badgeValue)}
                  </AppBadge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </div>

      {tabs.map((tab) => (
        <TabsContent key={tab.id} value={tab.id} className="mt-0 space-y-6">
          {children(tab.id)}
        </TabsContent>
      ))}
    </ClientOnlyTabs>
  );
}
