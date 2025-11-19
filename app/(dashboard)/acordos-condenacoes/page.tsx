import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { AcordosCondenacoesList } from './components/acordos-condenacoes-list';

export default function AcordosCondecoesPage() {
  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button asChild>
          <Link href="/acordos-condenacoes/novo">
            <Plus className="mr-2 h-4 w-4" />
            Novo Acordo/Condenação
          </Link>
        </Button>
      </div>

      {/* Lista */}
      <AcordosCondenacoesList />
    </div>
  );
}
