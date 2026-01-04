import type { Metadata } from "next";
import CustomDateRangePicker from "@/components/shared/custom-date-range-picker";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { DashboardHeaderActions } from "@/features/dashboard";
import {
  LeadBySourceCardWrapper,
  SalesPipeline,
  RecentContractsCardWrapper,
  TotalCustomersCard,
  TotalDeals,
  TotalContractsCard,
} from "./components";
import { parseCrmDateFilterFromSearchParams } from "./crm-date-filter";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Contratos",
    description:
      "Visão geral e acompanhamento de contratos (pipeline, distribuição por status, clientes por estado e contratos recentes).",
  };
}

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const dateFilter = parseCrmDateFilterFromSearchParams(params);

  return (
    <div className="space-y-4">
      <DashboardHeaderActions>
        <div className="flex items-center gap-4">
          <CustomDateRangePicker />
          <Button
            size="icon"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            aria-label="Baixar"
            title="Baixar"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </DashboardHeaderActions>
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <TotalCustomersCard dateFilter={dateFilter} />
          <TotalDeals dateFilter={dateFilter} />
          <TotalContractsCard dateFilter={dateFilter} />
        </div>
        <div className="grid gap-4 xl:grid-cols-3">
          <LeadBySourceCardWrapper dateFilter={dateFilter} />
          <SalesPipeline dateFilter={dateFilter} />
        </div>
        <RecentContractsCardWrapper dateFilter={dateFilter} />
      </div>
    </div>
  );
}
