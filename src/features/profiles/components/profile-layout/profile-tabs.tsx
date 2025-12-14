import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { TabConfig } from "../../configs/types";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ProfileTabsProps {
  tabs: TabConfig[];
  children: (tabId: string) => ReactNode;
  data: any;
  defaultTab?: string;
  className?: string;
}

const getNestedValue = (obj: any, path: string) => {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

export function ProfileTabs({ tabs, children, data, defaultTab, className }: ProfileTabsProps) {
  const firstTab = tabs[0]?.id;

  return (
    <Tabs defaultValue={defaultTab || firstTab} className={cn("w-full", className)}>
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
                {badgeValue !== null && badgeValue !== undefined && (
                  <Badge variant="secondary" className="ml-2 h-5 rounded-full px-1.5 text-xs font-normal">
                    {badgeValue}
                  </Badge>
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
    </Tabs>
  );
}
