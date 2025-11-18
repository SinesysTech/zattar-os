'use client';

import { RepassesPendentesList } from '@/components/acordos-condenacoes/repasses-pendentes-list';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RepassesPage() {
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAnexarDeclaracao = async (parcelaId: number) => {
    // TODO: Implementar dialog para upload de declaração
    console.log('Anexar declaração para parcela:', parcelaId);
    alert('Funcionalidade de anexar declaração será implementada');
  };

  const handleRealizarRepasse = async (parcelaId: number) => {
    // TODO: Implementar dialog para upload de comprovante e confirmação
    console.log('Realizar repasse para parcela:', parcelaId);
    alert('Funcionalidade de realizar repasse será implementada');
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Repasses Pendentes</h1>
        <p className="text-muted-foreground">
          Gerencie repasses aos clientes que precisam ser processados
        </p>
      </div>

      {/* Lista */}
      <RepassesPendentesList
        key={refreshKey}
        onAnexarDeclaracao={handleAnexarDeclaracao}
        onRealizarRepasse={handleRealizarRepasse}
      />
    </div>
  );
}
