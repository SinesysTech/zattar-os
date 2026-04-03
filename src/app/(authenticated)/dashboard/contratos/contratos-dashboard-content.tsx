'use client';

import { useSearchParams } from 'next/navigation';
import CustomDateRangePicker from '@/components/shared/custom-date-range-picker';
import {
  LeadBySourceCardWrapper,
  SalesPipeline,
  RecentContractsCardWrapper,
  TotalCustomersCard,
  TotalDeals,
  TotalContractsCard,
} from './components';
import { parseCrmDateFilterFromSearchParams } from './crm-date-filter';

export default function ContratosDashboardContent() {
  const searchParams = useSearchParams();

  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });
  const dateFilter = parseCrmDateFilterFromSearchParams(params);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <CustomDateRangePicker />
      </div>
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
  );
}
