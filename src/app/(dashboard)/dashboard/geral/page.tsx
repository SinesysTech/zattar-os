import type { Metadata } from "next";
import CustomDateRangePicker from "@/components/shared/custom-date-range-picker";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { DashboardHeaderActions } from "@/features/dashboard";
import {
  LeadBySourceCard,
  LeadsCard,
  TargetCard,
  TotalCustomersCard,
  TotalDeals,
  TotalRevenueCard,
  RecentTasks,
  ChatWidget,
  Reminders,
  SalesPipeline,
} from "./components";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Dashboard Geral",
    description:
      "Visão geral do sistema com indicadores e painéis principais.",
  };
}

export default function Page() {
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
          <TargetCard />
          <TotalCustomersCard />
          <TotalDeals />
          <TotalRevenueCard />
        </div>
        <div className="grid gap-4 xl:grid-cols-3">
          <LeadBySourceCard />
          <RecentTasks />
          <SalesPipeline />
        </div>
        <LeadsCard />
      </div>
    </div>
  );
}
