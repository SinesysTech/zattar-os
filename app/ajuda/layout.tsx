import { DocsHeader } from '@/components/docs/docs-header';
import { DocsSidebar } from '@/components/docs/docs-sidebar';

export const metadata = {
  title: 'Documentação - Sinesys',
  description: 'Central de ajuda e documentação do Sinesys',
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <DocsHeader />
      <div className="flex">
        <DocsSidebar />
        <main className="flex-1 overflow-auto">
          <div className="container max-w-4xl py-8 px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
