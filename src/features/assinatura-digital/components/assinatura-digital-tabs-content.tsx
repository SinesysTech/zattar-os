"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useMemo } from "react";
import { AnimatedIconTabs } from "@/components/ui/animated-icon-tabs";
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

  const TABS_UI = useMemo(
    () => [
      { value: "assinatura", label: "Fluxo de Assinatura", icon: <PenTool /> },
      { value: "templates", label: "Templates", icon: <FileText /> },
      { value: "formularios", label: "Formularios", icon: <FolderOpen /> },
    ],
    []
  );

  const renderContent = () => {
    switch (currentTab as TabValue) {
      case "assinatura":
        return <AssinaturaFluxoForm />;
      case "templates":
        return (
          templatesContent || (
            <div className="text-sm text-muted-foreground">
              Carregando templates...
            </div>
          )
        );
      case "formularios":
        return (
          formulariosContent || (
            <div className="text-sm text-muted-foreground">
              Carregando formularios...
            </div>
          )
        );
      default:
        return <AssinaturaFluxoForm />;
    }
  };

  return (
    <div className="flex flex-col min-h-0">
      <AnimatedIconTabs
        tabs={TABS_UI}
        value={currentTab}
        onValueChange={handleTabChange}
        className="w-full"
        listClassName="flex-wrap"
      />

      <div className="mt-6 flex-1 min-h-0">
        <Suspense fallback={<TabSkeleton />}>{renderContent()}</Suspense>
      </div>
    </div>
  );
}
