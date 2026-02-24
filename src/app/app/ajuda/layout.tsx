'use client';

import { DocsSidebar } from './components/docs-sidebar';

export default function AjudaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 -m-6 -mt-6">
      <DocsSidebar />
      <main className="flex-1 overflow-y-auto p-6">
        {children}
      </main>
    </div>
  );
}
