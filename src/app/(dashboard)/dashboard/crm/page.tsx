import type { Metadata } from "next";
import CustomDateRangePicker from "@/components/shared/custom-date-range-picker";
import { Button } from "@/components/ui/button";
import {
  LeadBySourceCardWrapper,
  SalesPipeline,
  LeadsCard,
  TotalCustomersCard,
  TotalDeals,
  RecentTasks
} from "./components";
import { parseCrmDateFilterFromSearchParams } from "./crm-date-filter";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "CRM Admin Dashboard",
    description:
      "CRM admin dashboard template offers a streamlined and interactive interface for managing customer relationships, tracking sales, and analyzing performance metrics. Built with shadcn/ui, Tailwind CSS, Next.js.",
  };
}

export default function Page({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const dateFilter = parseCrmDateFilterFromSearchParams(searchParams);

  return (
    <div className="space-y-4">
      <div className="flex w-full items-center justify-end gap-2">
        <CustomDateRangePicker />
        <Button variant="outline">Baixar</Button>
      </div>
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <TotalCustomersCard dateFilter={dateFilter} />
          <TotalDeals dateFilter={dateFilter} />
        </div>
        <div className="grid gap-4 xl:grid-cols-3">
          <LeadBySourceCardWrapper dateFilter={dateFilter} />
          <RecentTasks />
          <SalesPipeline dateFilter={dateFilter} />
        </div>
        <LeadsCard />
      </div>
    </div>
  );
}
