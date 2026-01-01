import type { Metadata } from "next";
import CustomDateRangePicker from "@/components/shared/custom-date-range-picker";
import { Button } from "@/components/ui/button";
import {
  LeadBySourceCardWrapper,
  SalesPipeline,
  LeadsCard,
  TargetCard,
  TotalCustomersCard,
  TotalDeals,
  TotalRevenueCard,
  RecentTasks
} from "./components";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "CRM Admin Dashboard",
    description:
      "CRM admin dashboard template offers a streamlined and interactive interface for managing customer relationships, tracking sales, and analyzing performance metrics. Built with shadcn/ui, Tailwind CSS, Next.js.",
  };
}

export default function Page() {
  return (
    <div className="space-y-4">
      <div className="flex flex-row items-center justify-between">
        <div className="flex items-center space-x-2">
          <CustomDateRangePicker />
          <Button>Download</Button>
        </div>
      </div>
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <TotalCustomersCard />
          <TotalDeals />
          <TotalRevenueCard />
        </div>
        <div className="grid gap-4 xl:grid-cols-3">
          <LeadBySourceCardWrapper />
          <RecentTasks />
          <SalesPipeline />
        </div>
        <LeadsCard />
      </div>
    </div>
  );
}
