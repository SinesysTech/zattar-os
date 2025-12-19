"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useMemo } from "react";
import {
  Tabs02Responsive,
  TabsList02Responsive,
  TabsTrigger02Responsive,
  TabsContent02Responsive,
} from "@/components/shadcn-studio/tabs/tabs-02-responsive";
import { Skeleton } from "@/components/ui/skeleton";
import { PenTool, FileText, FolderOpen } from "lucide-react";
import { AssinaturaFluxoForm } from "./assinatura-fluxo-form";

type TabValue = "assinatura" | "templates" | "formularios";

interface AssinaturaDigitalTabsContentProps {
  templatesContent?: React.ReactNode;
  formulariosContent?: React.ReactNode;
  defaultTab?: TabValue;
}

function TabSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export function AssinaturaDigitalTabsContent({
  templatesContent,
  formulariosContent,
  defaultTab = "assinatura",
}: AssinaturaDigitalTabsContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentTab = useMemo(() => {
    const tab = searchParams.get("tab");
    if (tab === "templates" || tab === "formularios" || tab === "assinatura") {
      return tab;
    }
    return defaultTab;
  }, [searchParams, defaultTab]);

  const handleTabChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", value);
      router.push(`/assinatura-digital?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  return (
    <Tabs02Responsive
      value={currentTab}
      onValueChange={handleTabChange}
      className="w-full"
    >
      <TabsList02Responsive>
        <TabsTrigger02Responsive value="assinatura" className="gap-2">
          <PenTool className="h-4 w-4" />
          Fluxo de Assinatura
        </TabsTrigger02Responsive>
        <TabsTrigger02Responsive value="templates" className="gap-2">
          <FileText className="h-4 w-4" />
          Templates
        </TabsTrigger02Responsive>
        <TabsTrigger02Responsive value="formularios" className="gap-2">
          <FolderOpen className="h-4 w-4" />
          Formularios
        </TabsTrigger02Responsive>
      </TabsList02Responsive>

      <TabsContent02Responsive value="assinatura" className="mt-6">
        <Suspense fallback={<TabSkeleton />}>
          <AssinaturaFluxoForm />
        </Suspense>
      </TabsContent02Responsive>

      <TabsContent02Responsive value="templates" className="mt-6">
        <Suspense fallback={<TabSkeleton />}>
          {templatesContent || (
            <div className="text-sm text-muted-foreground">
              Carregando templates...
            </div>
          )}
        </Suspense>
      </TabsContent02Responsive>

      <TabsContent02Responsive value="formularios" className="mt-6">
        <Suspense fallback={<TabSkeleton />}>
          {formulariosContent || (
            <div className="text-sm text-muted-foreground">
              Carregando formularios...
            </div>
          )}
        </Suspense>
      </TabsContent02Responsive>
    </Tabs02Responsive>
  );
}
