'use client';

/**
 * Tab de Partes Contrárias
 * Lista e gerencia partes contrárias dos processos
 */

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, UserX } from 'lucide-react';

export function PartesContrariasTab() {
  return (
    <div className="flex flex-col gap-4">
      {/* Placeholder para ações */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserX className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Gerenciamento de partes contrárias
          </span>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nova Parte Contrária
        </Button>
      </div>

      {/* Placeholder para conteúdo */}
      <Card>
        <CardHeader>
          <CardTitle>Partes Contrárias</CardTitle>
          <CardDescription>
            Lista de partes contrárias cadastradas no sistema com 60 campos alinhados ao PJE-TRT
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
            <UserX className="h-12 w-12 text-muted-foreground/50" />
            <div className="space-y-2">
              <p className="text-sm font-medium">Estrutura de partes contrárias pronta</p>
              <p className="text-sm text-muted-foreground">
                60 campos | Discriminated unions PF/PJ | Tipos snake_case
              </p>
            </div>
            <div className="text-xs text-muted-foreground">
              API: GET/POST /api/partes-contrarias | GET/PATCH /api/partes-contrarias/[id]
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
