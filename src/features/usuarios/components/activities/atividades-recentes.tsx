'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Clock } from 'lucide-react';

interface AtividadesRecentesProps {
  usuarioId: number;
}

/**
 * Componente placeholder para atividades recentes
 * TODO: Integrar com sistema de auditoria quando estiver disponível
 */
export function AtividadesRecentes({ usuarioId: _usuarioId }: AtividadesRecentesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Atividades Recentes
        </CardTitle>
        <CardDescription>
          Últimas ações realizadas pelo usuário no sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Clock className="h-6 w-6" />
            </EmptyMedia>
            <EmptyTitle>Sistema de auditoria em desenvolvimento</EmptyTitle>
          </EmptyHeader>
        </Empty>
      </CardContent>
    </Card>
  );
}
