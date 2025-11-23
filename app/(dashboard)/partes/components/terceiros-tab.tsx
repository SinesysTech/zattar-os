'use client';

/**
 * Tab de Terceiros
 * Lista e gerencia terceiros vinculados aos processos (peritos, MP, assistentes, etc.)
 */

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, UserCog } from 'lucide-react';

export function TerceirosTab() {
  return (
    <div className="flex flex-col gap-4">
      {/* Placeholder para ações */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserCog className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Gerenciamento de terceiros
          </span>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Terceiro
        </Button>
      </div>

      {/* Placeholder para conteúdo */}
      <Card>
        <CardHeader>
          <CardTitle>Terceiros</CardTitle>
          <CardDescription>
            Lista de terceiros vinculados aos processos com 78 campos alinhados ao PJE-TRT
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
            <UserCog className="h-12 w-12 text-muted-foreground/50" />
            <div className="space-y-2">
              <p className="text-sm font-medium">Estrutura de terceiros pronta</p>
              <p className="text-sm text-muted-foreground">
                78 campos | Vinculados a processos | Tipos: Perito, MP, Assistente, etc.
              </p>
            </div>

            {/* Lista de tipos de terceiros */}
            <div className="flex flex-wrap gap-2 justify-center max-w-2xl">
              <Badge variant="outline">Perito</Badge>
              <Badge variant="outline">Ministério Público</Badge>
              <Badge variant="outline">Assistente</Badge>
              <Badge variant="outline">Testemunha</Badge>
              <Badge variant="outline">Custos Legis</Badge>
              <Badge variant="outline">Amicus Curiae</Badge>
              <Badge variant="outline">Outro</Badge>
            </div>

            <div className="text-xs text-muted-foreground">
              API: GET/POST /api/terceiros | GET/PATCH/DELETE /api/terceiros/[id]
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
