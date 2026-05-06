'use client';

import { cn } from '@/lib/utils';
import { PageShell } from '@/components/shared/page-shell';
import { DocsSidebar } from './components/docs-sidebar';

export default function AjudaLayout({ children }: { children: React.ReactNode }) {
  return (
    <PageShell className={cn(/* design-system-escape: -m-6 sem equivalente DS; space-y-0! sem token DS */ "-m-6 -mt-6 space-y-0!")}>
      <div className="flex min-h-0 flex-1 mt-0!">
        <DocsSidebar />
        <div className={cn("flex-1 overflow-y-auto inset-dialog")}>
          {children}
        </div>
      </div>
    </PageShell>
  );
}
