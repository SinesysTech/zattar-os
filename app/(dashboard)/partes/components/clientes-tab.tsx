'use client';

/**
 * Tab de Clientes
 * Lista e gerencia clientes do escritório
 */

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users } from 'lucide-react';

export function ClientesTab() {
  return (
    <div className="flex flex-col gap-4">
      {/* Placeholder para ações */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Gerenciamento de clientes
          </span>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Cliente
        </Button>
      </div>

      {/* Placeholder para conteúdo */}
      <Card>
        <CardHeader>
          <CardTitle>Clientes</CardTitle>
          <CardDescription>
            Lista de clientes cadastrados no sistema com 60 campos alinhados ao PJE-TRT
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground/50" />
            <div className="space-y-2">
              <p className="text-sm font-medium">Estrutura de clientes pronta</p>
              <p className="text-sm text-muted-foreground">
                60 campos | Discriminated unions PF/PJ | Tipos snake_case
              </p>
            </div>
            <div className="text-xs text-muted-foreground">
              API: GET/POST /api/clientes | GET/PATCH /api/clientes/[id]
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
