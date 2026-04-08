'use client';

import { PageShell } from '@/components/shared/page-shell';
import { DocsSidebar } from './components/docs-sidebar';

export default function AjudaLayout({ children }: { children: React.ReactNode }) {
  return (
    <PageShell className="-m-6 -mt-6 !space-y-0">
      <div className="flex min-h-0 flex-1 !mt-0">
        <DocsSidebar />
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </PageShell>
  );
}
